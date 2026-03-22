// assets/js/cart.js

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("cartTableBody");

  // Events (qty + remove) - using event delegation
  if (tbody) {
    tbody.addEventListener("change", (e) => {
      const input = e.target.closest("[data-qty-input]");
      if (!input) return;

      const id = input.getAttribute("data-product-id");
      const size = input.getAttribute("data-size") || "";
      const color = input.getAttribute("data-color") || "";
      const qty = Number(input.value) || 1;

      setCartQty(id, qty, size, color);
      renderCart();
    });

    tbody.addEventListener("click", (e) => {
      const removeBtn = e.target.closest("[data-remove]");
      if (!removeBtn) return;

      e.preventDefault();
      const id = removeBtn.getAttribute("data-product-id");
      const size = removeBtn.getAttribute("data-size") || "";
      const color = removeBtn.getAttribute("data-color") || "";

      removeFromCart(id, size, color);
      renderCart();
    });
  }

  renderCart();
});

// Use global values from cart-utils.js
const CART_SERVER_BASE =
  window.SERVER_BASE || window.ELVO_SERVER || "http://localhost:5000";
const CART_API_BASE =
  window.API_BASE || `${CART_SERVER_BASE}/api/products`;

// Fix image path using same backend base
function imgUrl(path) {
  if (!path) return "assets/img/category-1.jpg";
  return `${CART_SERVER_BASE}/${String(path).replace(/\\/g, "/")}`;
}

async function fetchProduct(id) {
  try {
    const res = await fetch(`${CART_API_BASE}/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function renderCart() {
  const tbody = document.getElementById("cartTableBody");
  const subtotalEl = document.getElementById("cartSubtotal");

  if (!tbody || !subtotalEl) return;

  const cart = readCart();
  tbody.innerHTML = "";

  if (!cart.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 20px;">
          Your cart is empty
        </td>
      </tr>
    `;
    subtotalEl.textContent = "Rs. 0.00";
    return;
  }

  const products = await Promise.all(cart.map((i) => fetchProduct(i.productId)));
  const map = new Map();

  products.forEach((p) => {
    if (p && p._id) map.set(p._id, p);
  });

  let subtotal = 0;

  cart.forEach((item) => {
    const p = map.get(item.productId);

    if (!p) {
      tbody.innerHTML += `
        <tr>
          <td colspan="2">Product not found</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>
            <a href="#" class="table__trash" data-remove data-product-id="${item.productId}" data-size="${item.size || ""}" data-color="${item.color || ""}">
              <i class="fi fi-rs-trash"></i>
            </a>
          </td>
        </tr>
      `;
      return;
    }

    const price = Number(p.price) || 0;
    const qty = Number(item.qty) || 1;
    const lineTotal = price * qty;
    subtotal += lineTotal;

    const firstImage = Array.isArray(p.images) ? p.images[0] : p.image;

    tbody.innerHTML += `
      <tr>
        <td>
          <a href="details.html?id=${p._id}">
            <img src="${imgUrl(firstImage)}" class="table__img" alt="${p.name}">
          </a>
        </td>

        <td>
          <h3 class="table__title">
            <a class="table__title" href="details.html?id=${p._id}">
              ${p.name}
            </a>
          </h3>
          ${
            item.size || item.color
              ? `
                <div style="font-size: 13px; color: #666; margin-top: 6px;">
                  ${item.size ? `<div>Size: ${item.size}</div>` : ""}
                  ${item.color ? `<div>Color: ${item.color}</div>` : ""}
                </div>
              `
              : ""
          }
        </td>

        <td>
          <span class="table__price">Rs. ${price.toFixed(2)}</span>
        </td>

        <td>
          <input
            type="number"
            min="1"
            class="quantity"
            value="${qty}"
            data-qty-input
            data-product-id="${p._id}"
            data-size="${item.size || ""}"
            data-color="${item.color || ""}"
          />
        </td>

        <td>
          <span class="table__subtotal">Rs. ${lineTotal.toFixed(2)}</span>
        </td>

        <td>
          <a href="#" class="table__trash" data-remove data-product-id="${p._id}" data-size="${item.size || ""}" data-color="${item.color || ""}">
            <i class="fi fi-rs-trash"></i>
          </a>
        </td>
      </tr>
    `;
  });

  subtotalEl.textContent = `Rs. ${subtotal.toFixed(2)}`;
}