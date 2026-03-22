const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_API = window.ELVO_API;

function imgUrl(path) {
  if (!path) return "assets/img/cloth-1.png";
  return `${ELVO_SERVER}/${path.replace(/\\/g, "/")}`;
}

async function renderWishlist() {
  const tbody = document.getElementById("wishlistTableBody");
  if (!tbody) return;

  const list = readWishlist();

  if (!list.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px">
          Your wishlist is empty
        </td>
      </tr>`;
    return;
  }

  try {
    const res = await fetch(ELVO_API);
    const data = await res.json();
    const products = Array.isArray(data) ? data : data.products || [];

    const wishlistProducts = products.filter((p) =>
      list.some((w) => w.productId === String(p._id)),
    );

    tbody.innerHTML = wishlistProducts
      .map((p) => {
        const img = imgUrl(p.images?.[0]);

        return `
        <tr>

        <td>
          <a href="details.html?id=${p._id}">
            <img src="${img}" class="table__img">
          </a>
        </td>

        <td>
          <h3 class="table__title">${p.name}</h3>
          <p class="table__description">${p.category || ""}</p>
        </td>

        <td>
          <span class="table__price">Rs. ${Number(p.price).toFixed(2)}</span>
        </td>

        <td>
          <span class="table__stock">
            ${p.stock > 0 ? "Available" : "Out of Stock"}
          </span>
        </td>

        <td>
          <a href="#"
            class="btn btn--sm cart__btn"
            data-product-id="${p._id}">
            Add to cart
          </a>
        </td>

        <td>
          <a href="#"
            data-remove-wishlist
            data-product-id="${p._id}">
            <i class="fi fi-rs-trash table__trash"></i>
          </a>
        </td>

        </tr>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Wishlist error:", err);
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove-wishlist]");
  if (!btn) return;

  e.preventDefault();

  const id = btn.getAttribute("data-product-id");
  removeFromWishlist(id);

  renderWishlist();
});

// Add-to-cart from wishlist (ADD ONCE + remove from wishlist)
document.addEventListener(
  "click",
  (e) => {
    const cartBtn = e.target.closest(".cart__btn");
    if (!cartBtn) return;

    // stop cart-utils.js from also handling this click
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const productId = cartBtn.getAttribute("data-product-id");
    if (!productId) return;

    // 1) add to cart (qty 1)
    if (typeof addToCart === "function") addToCart(productId, 1);

    // 2) remove from wishlist
    if (typeof removeFromWishlist === "function") removeFromWishlist(productId);

    // 3) update header counts
    if (typeof updateCartCount === "function") updateCartCount();
    if (typeof updateWishlistCount === "function") updateWishlistCount();

    // 4) re-render wishlist table
    renderWishlist();
  },
  true, // ⭐ CAPTURE MODE (runs before cart-utils document listener)
);

document.addEventListener("DOMContentLoaded", renderWishlist);
