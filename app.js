//CO, Keith Y. 
// initializes product
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

// initializes the cart
function createCart() {
    let items = [];
    let couponCode = null;

   //load the saved cart from the local storage
    function load() {
        const saved = JSON.parse(localStorage.getItem('cart'));
        if (saved && typeof saved === 'object') {
            items = (saved.items || []).map(i => createCartItem(
                createProduct(i.product.id, i.product.name, i.product.price, i.product.image),
                i.quantity
            ));
            couponCode = saved.couponCode ? String(saved.couponCode).toLowerCase() : null;
        }
    }

   // saves the cart to the local storage
    function save() {
        const payload = {
            items: items.map(i => ({ product: i.product, quantity: i.quantity })),
            couponCode
        };
        localStorage.setItem('cart', JSON.stringify(payload));
        displayCart();  
    }
    // add item to the cart
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
    // remove item from the cart
    function removeItem(productId) {
        items = items.filter(i => i.product.id !== productId);
        save();
    }
    // update the quantity of the item in the cart
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
    //check coupon
    function applyCoupon(code) {
        if (!code || typeof code !== 'string') {
            couponCode = null;
            save();
            return false;
        }
        // make the save 10 coupon code to lower case to make it not case sensitive
        const normalized = code.trim().toLowerCase();
        if (normalized === 'save10') {
            couponCode = 'save10';
            save();
            return true;
        } else {
            couponCode = null;
            save();
            return false;
        }
    }
    // calculate the total price of the cart include discount
    function calculateTotals() {
        let total = 0;
        items.forEach(item => {
            const price = Number(item.product.price);
            const qty = Number(item.quantity);
            const subtotal = price * qty;

            let discount = 0;
            if (couponCode === 'save10' && subtotal >= 100) {
                const discountCandidate = subtotal * 0.10;
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
    // making the total always formatted to 2 decimal places
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


let products = [];
const cart = createCart();

//mock API to fetch fake products
async function fetchProducts() {
    try {
        const res = await fetch('https://fakestoreapi.com/products');
        const data = await res.json();
        products = data.map(item => createProduct(item.id, item.title, item.price, item.image));
        displayProducts();
    } catch (err) {
        console.error("Failed to fetch products:", err);
    }
}

// display products also included input validation for the quantity 
function displayProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = "";

    products.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-md-3 mb-4';
        col.innerHTML = `
            <div class="card h-100">
                <img src="${product.image}" 
                    class="card-img-top" 
                    alt="${product.name}" 
                    style="height: 200px; object-fit: contain; width: 100%;"
                >
                <div class="card-body d-flex flex-column">
                    <div class="mt-auto">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text mb-2">$${Number(product.price).toFixed(2)}</p>
                        <div class="input-group mb-2">
                            <input 
                                type="number" min="1" value="1" class="form-control qty-input" aria-label="qty"
                                pattern="^[1-9][0-9]*$" 
                                title="Please enter a positive integer"
                            >
                            <button class="btn btn-sm btn-primary btn-add">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const qtyInput = col.querySelector('.qty-input');
        const addBtn = col.querySelector('.btn-add');

        // input validation
        qtyInput.addEventListener('input', () => {
            let val = qtyInput.value;
            val = val.replace(/[^0-9]/g, '');    
            val = val.replace(/^0+/, '');        
            if (val === '') val = '1';            
            qtyInput.value = val;
        });
        
        addBtn.addEventListener('click', () => {
            const qty = Number(qtyInput.value);
            if (!qty || qty < 1 || !Number.isInteger(qty)) {
                alert("Please enter a valid positive integer quantity.");
                qtyInput.focus();
                return;
            }
            cart.addItem(product, qty);
        });

        productList.appendChild(col);
    });
}

// this displays the cart
function displayCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const Total = document.getElementById('total');

    if (!cartItemsDiv || !cartCount || !Total) return;

    cartItemsDiv.innerHTML = "";

    const items = cart.getItems();
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    cartCount.textContent = totalItems;

    Total.textContent = cart.getTotalFormatted();

    if (items.length === 0) {
        cartItemsDiv.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item mb-3 p-2 border rounded';
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${item.product.name}</strong><br>
                    Price: $${Number(item.product.price).toFixed(2)} × ${item.quantity} = 
                    <strong>$${Number(item.subtotal).toFixed(2)}</strong>
                    ${Number(item.discount) > 0 ? `<br><span class="text-success">Discount: -$${Number(item.discount).toFixed(2)}</span>` : ''}
                    <br><strong>Final: $${Number(item.finalSubtotal).toFixed(2)}</strong>
                </div>
                <div class="text-end">
                    <div class="btn-group mb-2" role="group" aria-label="qty controls">
                        <button class="btn btn-sm btn-outline-secondary" data-action="decrease">-</button>
                        <button class="btn btn-sm btn-outline-secondary" data-action="increase">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger d-block mt-1" data-action="remove">Remove</button>
                </div>
            </div>
        `;
        // for the buttons increase and decrease and remove
        div.querySelector('[data-action="decrease"]').addEventListener('click', () => {
            cart.updateQuantity(item.product.id, item.quantity - 1);
        });
        div.querySelector('[data-action="increase"]').addEventListener('click', () => {
            cart.updateQuantity(item.product.id, item.quantity + 1);
        });
        div.querySelector('[data-action="remove"]').addEventListener('click', () => {
            cart.removeItem(item.product.id);
        });

        cartItemsDiv.appendChild(div);
    });
}

// coupon code with the input validation also
const applyBtn = document.getElementById('apply-coupon');
if (applyBtn) {
    applyBtn.addEventListener('click', () => {
        const codeEl = document.getElementById('coupon-code');
        const code = codeEl ? codeEl.value : "";
        const ok = cart.applyCoupon(code);
        if (ok) {
            alert("Coupon applied: SAVE10 (10% off eligible items, CAP $50 per item)");
        } else {
            alert("Invalid coupon.");
        }
    });
}

// initalizing
fetchProducts();
displayCart();
