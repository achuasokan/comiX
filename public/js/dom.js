let cropper;
let currentImageElement;
let currentImageIndex = 0;
let imageFiles = []; // Store original image files
let croppedImageFiles = []; // Store cropped images in a separate array

document.getElementById('add-product-form')?.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the form from submitting

  // Ensure all images (original or cropped) are processed before submitting
  processImages().then(() => {
    // After processing images, submit the form
    this.submit();
  }).catch((error) => {
    console.error('Error processing images:', error);
  });
});

function previewImages(event) {
  const files = event.target.files;
  const previewContainer = document.getElementById('imagePreviewContainer');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    imageFiles.push(file); // Add the original file to imageFiles array
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
        imageFiles.splice(i, 1); // Remove the image from the array
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
  currentImageElement = imgElement;
  currentImageIndex = imageIndex;
  cropModal.classList.remove('hidden');

  if (cropper) {
    cropper.destroy();
  }
  cropper = new Cropper(cropImage, {
    aspectRatio: 1,
    viewMode: 2,
  });
}

function closeCropModal() {
  const cropModal = document.getElementById('cropperModal');
  cropModal.classList.add('hidden');
  if (cropper) {
    cropper.destroy();
  }
}

function cropImage() {
  const croppedCanvas = cropper.getCroppedCanvas();
  currentImageElement.src = croppedCanvas.toDataURL();

  const croppedFile = dataURLtoFile(croppedCanvas.toDataURL(), `cropped-image-${currentImageIndex}.png`);
  croppedImageFiles[currentImageIndex] = croppedFile; // Add the cropped image to the array, replace the original

  closeCropModal();
  updateFileInput();
}

function updateFileInput() {
  const dataTransfer = new DataTransfer();
  imageFiles.forEach((file, index) => {
    if (croppedImageFiles[index]) {
      dataTransfer.items.add(croppedImageFiles[index]); // Add cropped image if available
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
