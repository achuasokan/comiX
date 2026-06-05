import cloudinary from "../../config/cloudinary.js";
import bannerModel from  "../../models/Banner.js"
import fs from "fs"
import { STATUS_CODES } from "../../constants/statusCodes.js"
import { MESSAGES } from "../../constants/messages.js"

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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}

//* //  //  //   //  //          GET   Add Banner PAGE   //  //  //  //  //  //  //

export const getAddBannerPage = async (req,res) => {
  try {
    res.render('admin/addBanner',{title:'Add Banner'})
  }catch (error) {
    console.log("error in get banner page",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
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
      errors.push(MESSAGES.BANNER.INVALID_TITLE_LENGTH)
    }

    // validate Description
    const descriptionsRegex = /^[a-zA-Z][\s\S]{9,49}$/;
    if(!descriptions || !descriptionsRegex.test(descriptions.trim())) {
      errors.push(MESSAGES.BANNER.INVALID_DESCRIPTION_LENGTH)
    }


    if (files.length === 0) {
      errors.push(MESSAGES.BANNER.IMAGE_REQUIRED)
    } else  if (files.length > 3) {
      errors.push(MESSAGES.BANNER.MAX_IMAGES_EXCEEDED)
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      for (let file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(MESSAGES.BANNER.INVALID_IMAGE_TYPE)
        }

        if (file.size > maxSize) {
          errors.push(MESSAGES.BANNER.IMAGE_SIZE_EXCEEDED)
        }
      }
    }

   
    const existingBanner = await bannerModel.findOne({title: bannerTitle})
    if(existingBanner) {
      errors.push(MESSAGES.BANNER.ALREADY_EXISTS)
    }

    if (errors.length > 0) {
      req.flash('error',errors)
      return res.redirect('/admin/addBanner')
    }

    
    const imageUrls = [];
    for (let file of files) {
      const result =  await cloudinary.uploader.upload(file.path, {
        folder: "Banner",
        use_filename: true
      });
      imageUrls.push(result.secure_url)
    }

    
    const newBanner = new bannerModel({
      title: bannerTitle,
      description: descriptions,
      image: imageUrls
    })

    req.flash('success', MESSAGES.BANNER.ADD_SUCCESS)

    await newBanner.save()

    res.redirect('/admin/banner')
  }catch (error) {
    console.log("error while adding a banner",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  } finally {
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
    
    
    const errors = [];

   
    const bannerTitleRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
    if (!bannerTitle || !bannerTitleRegex.test(bannerTitle)) {
      errors.push(MESSAGES.BANNER.INVALID_TITLE_LENGTH)
    }

   
    const descriptionsRegex = /^[a-zA-Z][\s\S]{9,49}$/;
    if (!descriptions || !descriptionsRegex.test(descriptions)) {
      errors.push(MESSAGES.BANNER.INVALID_DESCRIPTION_LENGTH)
    }

    
    const existingBanner = await bannerModel.findOne({
      title: bannerTitle,
      _id: {$ne: id }
    });

    if (existingBanner) {
      errors.push(MESSAGES.BANNER.ALREADY_EXISTS)
    }
    
    let  updatedImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

  
    if(files.length > 3) {
      errors.push(MESSAGES.BANNER.MAX_IMAGES_EXCEEDED)
    } else {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      const maxSize = 10 * 1024 * 1024; // 10 MB
      for (let file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(MESSAGES.BANNER.INVALID_IMAGE_TYPE)
        }

        if (file.size > maxSize) {
          errors.push(MESSAGES.BANNER.IMAGE_SIZE_EXCEEDED);
        }
      }
    }

   
    if (updatedImages.length === 0 && files.length === 0){
      errors.push(MESSAGES.BANNER.IMAGE_REQUIRED)
    }

    if (errors.length > 0) {
      req.flash('error', errors)
      return res.redirect(`/admin/editBanner/${id}`)
    }

    
    const updateBannerData = {
      title: bannerTitle,
      description: descriptions
    };

   

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

    
    const updatedBanner = await bannerModel.findByIdAndUpdate(id, updateBannerData, {new: true});

    res.redirect('/admin/banner')
  } catch (error) {
    console.log("error while adding banner",error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  } finally {

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
      return res.status(STATUS_CODES.NOT_FOUND).send(MESSAGES.BANNER.NOT_FOUND)
    }
    banner.isActive = !banner.isActive;
    await banner.save()
    res.redirect('/admin/banner')
  } catch (error) {
    console.log("error in BlockBanner", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.COMMON.INTERNAL_SERVER_ERROR)
  }
}


