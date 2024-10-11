
  async function addToCart(productId, quantity = 1) {
    try {
      const response = await fetch(`/cart/${productId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
//get the response in json format
      const data = await response.json();

      // Show toast notification based on response
      if (response.ok) {
        showToast(data.message, "green");
      } else {
        showToast(data.message, "red");
      }
    } catch (error) {
      showToast("An unexpected error occurred.", "red");
    }
  }

  function showToast(message, color) {
    Toastify({
      text: message,
      duration: 1000,
      gravity: "bottom", // top or bottom
      position: 'center', // left, center or right
      backgroundColor: color,
    }).showToast();
  }
