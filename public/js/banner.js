let bannerCropper; 
let bannerCurrentImageElement; 
let bannerCurrentImageIndex = 0; 
let bannerImageFiles = []; 
let bannerCroppedImageFiles = []; 

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bannerImage-form');
  if (form) {
    form.addEventListener('submit', function handleBannerFormSubmit(event) {
      event.preventDefault();   // Prevent the form from submitting

      // Run all validations
      const isValid = validateBannerForm();
      if (isValid) {
        processImages().then(() => {
          this.submit();
        }).catch((error) => {
          console.error('Error processing images:', error);
        });
      } else {
        console.log('Form submission prevented due to validation errors');
      }
    });

    // Attach input event listeners
    document.getElementById('bannerTitle').addEventListener('input', () => {
      validateBannerField('bannerTitle');
    });
    document.getElementById('descriptions').addEventListener('input', () => {
      validateBannerField('descriptions');
    });
  }
});

function validateBannerForm() {
  const fields = ['bannerTitle', 'descriptions'];
  let isValid = true;

  fields.forEach(field => {
    if (!validateBannerField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

function validateBannerField(fieldName) {
  const field = document.getElementById(fieldName);
  const errorElement = document.getElementById(`${fieldName}Error`);
  let isValid = true;

  switch (fieldName) {
    case 'bannerTitle':
      const bannerTitleRegex = /^[a-zA-Z][a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,49}$/;
      isValid = bannerTitleRegex.test(field.value.trim());
      errorElement.textContent = isValid ? '' : 'Banner Title must be between 3 to 50 characters. And include only letters, numbers and special characters.';
      break;
    case 'descriptions':
      const trimmedDescriptions = field.value.trim();
      const descriptionsRegex = /^[a-zA-Z][\s\S]{9,49}$/;
     isValid = descriptionsRegex.test(trimmedDescriptions);
     errorElement.textContent = isValid ? '' : 'Description must be between 10 to 50 characters.'
      break;
  }
  return isValid;
}

function previewImage(event) {
  const files = event.target.files;
  const previewContainer = document.getElementById('imagePreviewContainer');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    bannerImageFiles.push(file); 
    const reader = new FileReader();
    reader.onload = function(e) {
      const imgContainer = document.createElement('div');
      imgContainer.classList.add('relative', 'p-2');

      const img = document.createElement('img');
      img.classList.add('preview-thumbnail', 'w-auto', 'h-96', 'rounded');
      img.src = e.target.result;
      imgContainer.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.classList.add('absolute', 'top-0', 'right-0', 'bg-red-500', 'text-white', 'p-1', 'rounded-full');
      removeBtn.innerHTML = '×';
      removeBtn.onclick = function() {
        imgContainer.remove();
        bannerImageFiles.splice(i, 1); 
        updateFileInput();
      };
      imgContainer.appendChild(removeBtn);

      img.onclick = function() {
        openCropModal(img, i);
      };
      previewContainer.appendChild(imgContainer);
    };
    reader.readAsDataURL(file);
  }
}

function openCropModal(imgElement, imageIndex) {
  const cropModal = document.getElementById('cropperModal');
  const cropImage = document.getElementById('croppingImage');
  cropImage.src = imgElement.src;
  bannerCurrentImageElement = imgElement; 
  bannerCurrentImageIndex = imageIndex; 
  cropModal.classList.remove('hidden');

  if (bannerCropper) {
    bannerCropper.destroy(); 
  }
  bannerCropper = new Cropper(cropImage, {
    aspectRatio: NaN,
    viewMode: 2,
  });
}

function closeCropModals() {
  const cropModal = document.getElementById('cropperModal');
  cropModal.classList.add('hidden');
  if (bannerCropper) {
    bannerCropper.destroy(); 
  }
}

function cropImages() {
  const croppedCanvas = bannerCropper.getCroppedCanvas(); 
  bannerCurrentImageElement.src = croppedCanvas.toDataURL(); 

  const croppedFile = dataURLtoFile(croppedCanvas.toDataURL(), `cropped-image-${bannerCurrentImageIndex}.png`);
  bannerCroppedImageFiles[bannerCurrentImageIndex] = croppedFile; 

  closeCropModals();
  updateFileInputs();
}

// Updating the file input element with new and cropped images
function updateFileInputs() {
  const dataTransfer = new DataTransfer(); // Create a new DataTransfer object 
  bannerImageFiles.forEach((file, index) => { 
    if (bannerCroppedImageFiles[index]) { 
      dataTransfer.items.add(bannerCroppedImageFiles[index]); // Add cropped Image if available
    } else {
      dataTransfer.items.add(file); // Otherwise, add the original image
    }
  });
  document.getElementById('imageInput').files = dataTransfer.files;
}

function processImages() {
  return new Promise((resolve, reject) => {
    try {
      // Perform any additional image processing if needed
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime }); 
}

