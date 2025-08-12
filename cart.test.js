const { createCart, createProduct } = require('./cart');

describe('Cart factory function', () => {
  let cart;

  beforeEach(() => {
    global.localStorage = {
      _storage: {},
      getItem(key) {
        return this._storage[key] || null;
      },
      setItem(key, value) {
        this._storage[key] = value;
      },
      clear() {
        this._storage = {};
      }
    };

    global.displayCart = jest.fn();

    localStorage.clear();
    cart = createCart();
  });

  test('addItem adds new product', () => {
    const product = createProduct(1, 'Shoes', 100);
    cart.addItem(product, 2);
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  test('addItem increases quantity if product exists', () => {
    const product = createProduct(1, 'Shoes', 100);
    cart.addItem(product, 2);
    cart.addItem(product, 3);
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(5);
  });

  test('removeItem removes product', () => {
    const product1 = createProduct(1, 'Shoes', 100);
    const product2 = createProduct(2, 'Bag', 50);
    cart.addItem(product1, 1);
    cart.addItem(product2, 1);
    cart.removeItem(1);
    const items = cart.getItems();
    expect(items.length).toBe(1);
    expect(items[0].product.id).toBe(2);
  });

  test('updateQuantity changes quantity', () => {
    const product = createProduct(1, 'Shoes', 100);
    cart.addItem(product, 2);
    cart.updateQuantity(1, 5);
    const items = cart.getItems();
    expect(items[0].quantity).toBe(5);
  });

  test('updateQuantity removes item if quantity is zero', () => {
    const product = createProduct(1, 'Shoes', 100);
    cart.addItem(product, 2);
    cart.updateQuantity(1, 0);
    expect(cart.getItems().length).toBe(0);
  });

  test('applyCoupon accepts "save10" and rejects others', () => {
    expect(cart.applyCoupon('save10')).toBe(true);
    expect(cart.getCouponCode()).toBe('save10');

    expect(cart.applyCoupon('SAVE10')).toBe(true); 
    expect(cart.applyCoupon('invalid')).toBe(false);
    expect(cart.getCouponCode()).toBe(null);
  });

  test('calculateTotals applies discount correctly', () => {
    const product = createProduct(1, 'Shoes', 200);
    cart.addItem(product, 1);
    cart.applyCoupon('save10');
    const total = cart.calculateTotals();
    expect(total).toBeCloseTo(200 - 20);
  });

  test('clearCart empties the cart', () => {
    const product = createProduct(1, 'Shoes', 100);
    cart.addItem(product, 2);
    cart.applyCoupon('save10');
    cart.clearCart();
    expect(cart.getItems().length).toBe(0);
    expect(cart.getCouponCode()).toBe(null);
  });
});
