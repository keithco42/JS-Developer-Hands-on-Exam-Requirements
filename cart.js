
function createProduct(id, name, price, image = "") {
    return {
        id,
        name,
        price: Number(price),
        image
    };
}

//initializes the cart items
function createCartItem(product, quantity = 1) {
    return {
        product,
        quantity: Number(quantity),
        subtotal: 0,
        discount: 0,
        finalSubtotal: 0
    };
}
  
  function createCart() {
    let items = [];
    let couponCode = null;
  
    function load() {
      const saved = JSON.parse(localStorage.getItem('cart'));
      if (saved && typeof saved === 'object') {
        items = (saved.items || []).map(i =>
          createCartItem(
            createProduct(i.product.id, i.product.name, i.product.price, i.product.image),
            i.quantity
          )
        );
        couponCode = saved.couponCode ? String(saved.couponCode).toLowerCase() : null;
      }
    }
  
    function save() {
      const payload = { items: items.map(i => ({ product: i.product, quantity: i.quantity })), couponCode };
      localStorage.setItem('cart', JSON.stringify(payload));
      if (typeof displayCart === 'function') displayCart();
    }
  
    function addItem(product, qty = 1) {
      qty = Number(qty) || 1;
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        items.push(createCartItem(product, qty));
      }
      save();
    }
  
    function removeItem(productId) {
      items = items.filter(i => i.product.id !== productId);
      save();
    }
  
    function updateQuantity(productId, qty) {
      qty = Number(qty);
      const item = items.find(i => i.product.id === productId);
      if (!item) return;
      if (qty <= 0) {
        removeItem(productId);
      } else {
        item.quantity = qty;
        save();
      }
    }
  
    function applyCoupon(code) {
      if (!code || typeof code !== 'string') {
        couponCode = null;
        save();
        return false;
      }
      const normalized = code.trim().toLowerCase();
      if (normalized === 'save10') {
        couponCode = 'save10';
        save();
        return true;
      }
      couponCode = null;
      save();
      return false;
    }
  
    function calculateTotals() {
      let total = 0;
      items.forEach(item => {
        const price = Number(item.product.price);
        const qty = Number(item.quantity);
        const subtotal = price * qty;
  
        let discount = 0;
        if (couponCode === 'save10' && subtotal >= 100) {
          const discountCandidate = subtotal * 0.1;
          const cap = 50;
          discount = Math.min(discountCandidate, cap);
        }
  
        const finalSubtotal = subtotal - discount;
  
        item.subtotal = subtotal;
        item.discount = discount;
        item.finalSubtotal = finalSubtotal;
  
        total += finalSubtotal;
      });
      return total;
    }
  
    function getTotalFormatted() {
      return calculateTotals().toFixed(2);
    }
  
    function clearCart() {
      items = [];
      couponCode = null;
      save();
    }
  
    function getItems() {
      return items;
    }
  
    function getCouponCode() {
      return couponCode;
    }
  
    load();
  
    return {
      addItem,
      removeItem,
      updateQuantity,
      applyCoupon,
      calculateTotals,
      getTotalFormatted,
      clearCart,
      getItems,
      getCouponCode
    };
  }
  
  module.exports = { createCart, createProduct, createCartItem };
  