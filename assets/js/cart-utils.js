// assets/js/cart-utils.js

// ===== GLOBAL SERVER CONFIG (declare once, reuse everywhere) =====
const SERVER_BASE = window.ELVO_SERVER;
const API_BASE = window.ELVO_API;

const CART_KEY_PREFIX = "elvo_cart";
const LEGACY_CART_KEY = "elvo_cart_v1";

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id || user?._id || "guest";
  } catch {
    return "guest";
  }
}

function getCartKey() {
  return `${CART_KEY_PREFIX}_${getCurrentUserId()}`;
}

function migrateLegacyCartIfNeeded() {
  try {
    const currentKey = getCartKey();
    const currentData = localStorage.getItem(currentKey);
    const legacyData = localStorage.getItem(LEGACY_CART_KEY);

    if (!currentData && legacyData) {
      localStorage.setItem(currentKey, legacyData);
      localStorage.removeItem(LEGACY_CART_KEY);
    }
  } catch (error) {
    console.error("Cart migration error:", error);
  }
}

function readCart() {
  try {
    migrateLegacyCartIfNeeded();
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  updateCartCount();
}

function getCartCount() {
  const cart = readCart();
  return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

// This updates any element you give for cart count
function updateCartCount() {
  const count = getCartCount();

  const el =
    document.getElementById("cartCount") ||
    document.querySelector(".cart__count") ||
    document.querySelector("[data-cart-count]");

  if (el) el.textContent = count;
}

// Add to cart (global)
function addToCart(productId, qty = 1, size = "", color = "") {
  if (!productId) return;

  qty = Number(qty) || 1;
  if (qty < 1) qty = 1;

  const cart = readCart();

  const existing = cart.find(
    (i) =>
      i.productId === productId &&
      (i.size || "") === (size || "") &&
      (i.color || "") === (color || "")
  );

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty, size, color });
  }

  saveCart(cart);
}

// Remove
function removeFromCart(productId, size = "", color = "") {
  const cart = readCart().filter(
    (i) =>
      !(
        i.productId === productId &&
        (i.size || "") === (size || "") &&
        (i.color || "") === (color || "")
      )
  );
  saveCart(cart);
}

// Update qty
function setCartQty(productId, qty, size = "", color = "") {
  qty = Number(qty) || 1;
  if (qty < 1) qty = 1;

  const cart = readCart();
  const item = cart.find(
    (i) =>
      i.productId === productId &&
      (i.size || "") === (size || "") &&
      (i.color || "") === (color || "")
  );

  if (!item) return;

  item.qty = qty;
  saveCart(cart);
}

// Clear cart
function clearCart() {
  saveCart([]);
}

// ------------------------------
// AUTO: connect buttons everywhere
// ------------------------------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".cart__btn");
  if (!btn) return;

  const id = btn.getAttribute("data-product-id");
  if (!id) return;

  e.preventDefault();
  addToCart(id, 1, "", "");
});

// expose globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.setCartQty = setCartQty;
window.readCart = readCart;
window.clearCart = clearCart;
window.updateCartCount = updateCartCount;

// expose API too
window.SERVER_BASE = SERVER_BASE;
window.API_BASE = API_BASE;

// update count on every page load
document.addEventListener("DOMContentLoaded", updateCartCount);