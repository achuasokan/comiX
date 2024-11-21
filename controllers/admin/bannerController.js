import cloudinary from "../../config/cloudinary.js";
import bannerModel from  "../../models/Banner.js"
import fs from "fs"

//* //  //  //   //  //          GET   Banner LIST PAGE   //  //  //  //  //  //  //

export const getBannerPage = async (req,res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;
    const bannerList = await bannerModel.find()
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)

    const totalBanners = await bannerModel.countDocuments({})
    const totalPages = Math.ceil(totalBanners / limit)
    const startIndex = skip + 1;

    res.render('admin/bannerList', {
      bannerList,
      currentPage: page,
      totalPages,
      startIndex,
      title: "Banner"
    })

  }catch (error) {
    console.log('Error in getBannerPage',error)
    res.status(500).send("Internal server error while fetching banner page")
  }
}

//* //  //  //   //  //          GET   Add Banner PAGE   //  //  //  //  //  //  //

export const getAddBannerPage = async (req,res) => {
  try {
    res.render('admin/addBanner',{title:'Add Banner'})
  }catch (error) {
    console.log("error in get banner page",error);
    res.status(500).send('Internal server error')
  }
}


//* //  //  //   //  //          Post Add Banner    //  //  //  //  //  //  //

export const postAddBanner = async (req,res) => {
  const files = req.files || [];
  try {
    const {bannerTitle, descriptions } = req.body

    //validation
    const errors = [];

    const bannerTitleRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
    if (!bannerTitle || ! bannerTitleRegex.test(bannerTitle)) {
      errors.push('Banner title must be between 3 and 50 characters')
    }

    // validate Description
    const descriptionsRegex = /^[a-zA-Z][\s\S]{9,49}$/;
    if(!descriptions || !descriptionsRegex.test(descriptions.trim())) {
      errors.push('Description must be between 10 to 50 characters')
    }


    if (files.length === 0) {
      errors.push('Please upload at least one image')
    } else  if (files.length > 3) {
      errors.push("You can upload up to 3 images")
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      for (let file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(`Invalid file type ${file.originalname}. Only jpeg, png, jpg, gif, webp and svg are allowed`)
        }

        if (file.size > maxSize) {
          errors.push(`File ${file.originalname} is too large. Maximum size is 10 MB`)
        }
      }
    }

    //check for existing banner with same title
    const existingBanner = await bannerModel.findOne({title: bannerTitle})
    if(existingBanner) {
      errors.push('A banner is already exists with this title')
    }

    if (errors.length > 0) {
      req.flash('error',errors)
      return res.redirect('/admin/addBanner')
    }

    // Upload each image to Cloudinary
    const imageUrls = [];
    for (let file of files) {
      const result =  await cloudinary.uploader.upload(file.path, {
        folder: "Banner",
        use_filename: true
      });
      imageUrls.push(result.secure_url)
    }

    // create the Banner
    const newBanner = new bannerModel({
      title: bannerTitle,
      description: descriptions,
      image: imageUrls
    })

    req.flash('success','Banner added successfully')

    // save the banner to the database
    await newBanner.save()

    res.redirect('/admin/banner')
  }catch (error) {
    console.log("error while adding a banner",error);
    res.status(500).send('Internal server error')
  } finally {
   // Clean up the local uploaded files after uploading to Cloudinary
    files.forEach(file => {
      if(file.path &&  fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    })
  }
}

//* //  //  //   //  //          Get Edit  Banner Page    //  //  //  //  //  //  //

export const getEditPage = async (req,res) => {
  try {
    const id = req.params.bannerId
    const banner = await bannerModel.findById(id)
    res.render('admin/editBanner',{banner,title:'Edit Banner'})
  } catch (error) {
    console.log("Error in edit page ",error);    
  }
}

//* //  //  //   //  //          Post Edit  Banner    //  //  //  //  //  //  //

export const postEditBanner = async (req,res) => {
  const files = req.files || []
  try {
    const id = req.params.bannerId;
    const { bannerTitle, descriptions, existingImages} = req.body;
    
    // validation
    const errors = [];

    //validate Banner Title
    const bannerTitleRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
    if (!bannerTitle || !bannerTitleRegex.test(bannerTitle)) {
      errors.push('Banner title must be between 3 to 50 characters')
    }

    // validate Description 
    const descriptionsRegex = /^[a-zA-Z][\s\S]{9,49}$/;
    if (!descriptions || !descriptionsRegex.test(descriptions)) {
      errors.push('Description must be between 10 to 50 characters')
    }

    // check for existing banner with same title (excluding the current product)
    const existingBanner = await bannerModel.findOne({
      title: bannerTitle,
      _id: {$ne: id }
    });

    if (existingBanner) {
      errors.push('Another banner already exits with this Banner Title')
    }
    
    let  updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

    // validate Image
    if(files.length > 3) {
      errors.push('You can upload up to 3 images')
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxSize = 10 * 1024 * 1024; // 10 MB
      for (let file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(`Invalid file type ${file.originalname}. Only jpeg, png, jpg, gif, webp, and svg are allowed.`)
        }

        if (file.size > maxSize) {
          errors.push(`File ${file.originalname} is too large. Maximum size is 10 MB.`);
        }
      }
    }

    // validate Image 
    if (updatedImages.length === 0 && files.length === 0){
      errors.push('Please upload at least One Image')
    }

    if (errors.length > 0) {
      req.flash('error', errors)
      return res.redirect(`/admin/editBanner/${id}`)
    }

    // preparing the update edit banner
    const updateBannerData = {
      title: bannerTitle,
      description: descriptions
    };

    // Handle Image updates

    if (files && files.length > 0) {
      for (let file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Banner",
          use_filename: true,
        });
        updatedImages.push(result.secure_url);
      }
    }

    updateBannerData.image = updatedImages;

    // update the Banner
    const updatedBanner = await bannerModel.findByIdAndUpdate(id, updateBannerData, {new: true});

    res.redirect('/admin/banner')
  } catch (error) {
    console.log("error while adding banner",error);
    res.status(500).send("Internal server error")
  } finally {
    // Clean up the local uploaded files
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    });
  }
};

//* //  //  //   //  //          Block/UnBlock Banner    //  //  //  //  //  //  //

export const blockBanner = async(req,res) => {
  try {
    const bannerId = req.params.bannerId
    const banner = await bannerModel.findById(bannerId)
    if (!banner) {
      return res.status(400).send('Discount not found')
    }
    banner.isActive = !banner.isActive;
    await banner.save()
    res.redirect('/admin/banner')
  } catch (error) {
    console.log("error in BlockBanner", error);
    res.status(500).send('Internal server error')
  }
}


