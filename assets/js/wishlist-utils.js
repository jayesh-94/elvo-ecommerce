// assets/js/wishlist-utils.js

const WISHLIST_KEY_PREFIX = "elvo_wishlist";
const LEGACY_WISHLIST_KEY = "elvo_wishlist_v1";

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.id || user?._id || "guest";
  } catch {
    return "guest";
  }
}

function getWishlistKey() {
  return `${WISHLIST_KEY_PREFIX}_${getCurrentUserId()}`;
}

function migrateLegacyWishlistIfNeeded() {
  try {
    const currentKey = getWishlistKey();
    const currentData = localStorage.getItem(currentKey);
    const legacyData = localStorage.getItem(LEGACY_WISHLIST_KEY);

    if (!currentData && legacyData) {
      localStorage.setItem(currentKey, legacyData);
      localStorage.removeItem(LEGACY_WISHLIST_KEY);
    }
  } catch (error) {
    console.error("Wishlist migration error:", error);
  }
}

function readWishlist() {
  try {
    migrateLegacyWishlistIfNeeded();
    return JSON.parse(localStorage.getItem(getWishlistKey())) || [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(getWishlistKey(), JSON.stringify(list));
  updateWishlistCount();
}

function getWishlistCount() {
  return readWishlist().length;
}

function updateWishlistCount() {
  const count = getWishlistCount();
  const el =
    document.querySelector("[data-wishlist-count]") ||
    document.getElementById("wishlistCount") ||
    document.querySelector(".wishlist__count");

  if (el) el.textContent = count;
}

function isInWishlist(productId) {
  return readWishlist().some((x) => x.productId === productId);
}

function addToWishlist(productId) {
  if (!productId) return;

  const list = readWishlist();
  if (list.some((x) => x.productId === productId)) return;

  list.push({ productId });
  saveWishlist(list);
}

function removeFromWishlist(productId) {
  const list = readWishlist().filter((x) => x.productId !== productId);
  saveWishlist(list);
}

function toggleWishlist(productId) {
  if (isInWishlist(productId)) removeFromWishlist(productId);
  else addToWishlist(productId);
}

function clearWishlist() {
  saveWishlist([]);
}

// Auto-handle click on any .wishlist__btn
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".wishlist__btn");
  if (!btn) return;

  const id = btn.getAttribute("data-product-id");
  if (!id) return;

  e.preventDefault();
  toggleWishlist(id);

  btn.classList.toggle("active", isInWishlist(id));
});

window.readWishlist = readWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.toggleWishlist = toggleWishlist;
window.updateWishlistCount = updateWishlistCount;
window.isInWishlist = isInWishlist;
window.clearWishlist = clearWishlist;

document.addEventListener("DOMContentLoaded", () => {
  updateWishlistCount();

  document.querySelectorAll(".wishlist__btn").forEach((btn) => {
    const id = btn.getAttribute("data-product-id");
    if (id && isInWishlist(id)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
});