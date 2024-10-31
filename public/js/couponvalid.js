
document.addEventListener('DOMContentLoaded', () => {
  // Form validation
  const form = document.getElementById('coupon-form');

  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();

      const isValid = validateForm();
      if (isValid) {
        this.submit();
      } else {
        console.log('Form submission prevented due to validation errors.');
      }
    });

    // Add event listeners for input fields
    const fields = ['couponCode', 'discountType', 'discountValue', 'minSpend', 'usageLimit', 'startDate', 'expiryDate', 'applicableType'];
    fields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        if (field === 'applicableType') {
          element.addEventListener('change', () => {
            validateField(field);
            toggleProductCategory(); 
          });
        } else {
          element.addEventListener('input', () => validateField(field));
        }
      }
    });
  }

  function toggleProductCategory() {
    const applicableTypeSelect = document.getElementById('applicableType');
    const productSelect = document.getElementById('productSelect');
    const categorySelect = document.getElementById('categorySelect');

    if (applicableTypeSelect) {
      const applicableType = applicableTypeSelect.value;
      console.log('Applicable Type:', applicableType); // Debugging log
      productSelect.style.display = (applicableType === 'product') ? 'block' : 'none';
      categorySelect.style.display = (applicableType === 'category') ? 'block' : 'none';
    }
  }

  function validateForm() {
    const fields = ['couponCode', 'discountType', 'discountValue', 'minSpend', 'usageLimit', 'startDate', 'expiryDate', 'applicableType'];
    let isValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }

  function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}Error`);
    let isValid = true;

    switch(fieldName) {
      case 'couponCode':
        const couponCodeRegex = /^[A-Z][A-Z0-9 ]{4,9}$/;
        isValid = couponCodeRegex.test(field.value.trim());
        errorElement.textContent = isValid ? '' : 'Coupon code must be uppercase letters.';
        break;

     case 'discountType':
      isValid = field.value !== '';
      errorElement.textContent = isValid ? '' : 'Please select a discount type.';
      break;

      case 'discountValue':
        const discountType = document.getElementById('discountType').value;
        const discountValue = parseFloat(field.value);

        if (discountType === 'fixed') {
          isValid = !isNaN(discountValue) && discountValue > 0 && Number.isInteger(discountValue);
          errorElement.textContent = isValid ? '' : 'Discount value for fixed type must be a whole number greater than zero.';
        } else if (discountType === 'percentage') {
          isValid = !isNaN(discountValue) && discountValue >= 1 && discountValue <= 100 && Number.isInteger(discountValue);
          errorElement.textContent = isValid ? '' : 'Discount value for percentage type must be a whole number between 1 and 100.';
        } else {
          errorElement.textContent = 'Please select a discount type.';
          isValid = false;
        }
        break;

      case 'minSpend':
        const minSpend = parseInt(field.value, 10);
        isValid = !isNaN(minSpend) && minSpend > 0;
        errorElement.textContent = isValid ? '' : 'Minimum spend must be a whole number greater than zero.';
        break;

      case 'usageLimit':
        const usageLimit = parseInt(field.value, 10);
        isValid = !isNaN(usageLimit) && usageLimit > 0;
        errorElement.textContent = isValid ? '' : 'Usage limit must be a whole number greater than zero.';
        break;

      case 'startDate':
        const currentDate = new Date();
        const startDate = new Date(field.value);
        isValid = !isNaN(startDate) && startDate >= new Date(currentDate.setHours(0, 0, 0, 0));
        errorElement.textContent = isValid ? '' : 'Start date must be today or a future date.';
        break;

      case 'expiryDate':
        const expiryDate = new Date(field.value);
        const startDateValue = new Date(document.getElementById('startDate').value);
        isValid = !isNaN(expiryDate) && expiryDate >= startDateValue;
        errorElement.textContent = isValid ? '' : 'Expiry date must be the same as or after start date.';
        break;

      case 'applicableType':
        isValid = field.value !== '';
        errorElement.textContent = isValid ? '' : 'Please select an applicable type.';
        break;
        
    }
    return isValid;
  }
});