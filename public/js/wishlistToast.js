document.addEventListener('DOMContentLoaded', function () {


  document.querySelectorAll('.wishlist-form').forEach(form => {
    form.addEventListener('submit', function(event) {
      event.preventDefault();

      const button = form.querySelector('.wishlist-button');
      const Wishlist = button.getAttribute('data-in-wishlist') === 'true';
      const productId = this.action.split('/').pop();

      if (Wishlist) {
        // Handle removal from wishlist
        fetch(`/wishlist/delete/${productId}`, { method: 'DELETE' })
        .then(response => response.json()) 
        .then(data => {
          if (data.message) {
            button.setAttribute('data-in-wishlist', 'false');
            button.querySelector('i').classList.remove('text-red-500');
            button.querySelector('i').classList.add('text-black');
            showToast(data.message, 'green'); 
          }
        })
        .catch(error => {
          console.error('Error removing product from wishlist:', error);
          showToast('An error occurred while removing the product', 'red');
        });
      } else {
        // Handle addition to wishlist
        fetch(this.action, { method: 'POST' })
        .then(response => response.json()) 
        .then(data => {
          if (data.message) {
            button.setAttribute('data-in-wishlist', 'true');
            button.querySelector('i').classList.add('text-red-500');
            button.querySelector('i').classList.remove('text-black');
            showToast(data.message, 'green'); 
          }
        })
        .catch(error => {
          console.error('Error adding product to wishlist:', error);
          showToast('An error occurred while adding the product', 'red'); 
        });
      }
    });
  });
});

function showToast(message, color) {
  Toastify({
    text: message,
    duration: 1000,
    gravity: "bottom",
    position: 'center',
    backgroundColor: color,
  }).showToast();
}