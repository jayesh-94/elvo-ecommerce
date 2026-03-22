(function () {
  // ✅ use common.js global config
  const SERVER = window.ELVO_SERVER;
  const API = window.ELVO_API;

  const OUTFIT_KEY = "elvo_outfit";

  function outfitImgUrl(path) {
    if (!path) return "assets/img/category-1.jpg";
    return `${SERVER}/${String(path).replace(/\\/g, "/")}`;
  }

  function readOutfit() {
    try {
      return JSON.parse(localStorage.getItem(OUTFIT_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveOutfit(items) {
    localStorage.setItem(OUTFIT_KEY, JSON.stringify(items));
  }

  function addToOutfit(productId) {
    if (!productId) return;

    const outfit = readOutfit();
    const exists = outfit.some((item) => item.productId === productId);

    if (exists) {
      showToast("This product is already in your outfit.", "warning");
      return;
    }

    outfit.push({ productId });
    saveOutfit(outfit);
    showToast("Added to outfit successfully.", "success");
  }

  function removeFromOutfit(productId) {
    const outfit = readOutfit().filter((item) => item.productId !== productId);
    saveOutfit(outfit);
    renderOutfitPage();
  }

  function clearOutfit() {
    saveOutfit([]);
    renderOutfitPage();
  }

  async function fetchProduct(productId) {
    try {
      const res = await fetch(`${API}/${productId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function renderOutfitCard(product) {
    const image = product.images?.[0]
      ? outfitImgUrl(product.images[0])
      : "assets/img/category-1.jpg";

    const stockText = Number(product.stock) > 0 ? "Available" : "Out of stock";

    const colorsHtml =
      Array.isArray(product.colors) && product.colors.length
        ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
          ${product.colors
            .slice(0, 5)
            .map(
              (color) => `
              <span style="
                width:16px;
                height:16px;
                border-radius:50%;
                display:inline-block;
                background:${color};
                border:1px solid #ddd;
              "></span>
            `,
            )
            .join("")}
        </div>
      `
        : `<div style="margin-top:8px;color:#888;font-size:13px;">No colors</div>`;

    return `
      <div class="product__item" style="position:relative;">
        <div class="product__banner">
          <a href="details.html?id=${product._id}" class="product__images">
            <img src="${image}" class="product__img default" alt="${product.name || "Product"}">
          </a>
        </div>

        <div class="product__content">
          <span class="product__category">${product.category || "Product"}</span>

          <a href="details.html?id=${product._id}">
            <h3 class="product__title">${product.name || "Product"}</h3>
          </a>

          <div class="product__price flex">
            <span class="new__price">Rs. ${Number(product.price || 0).toLocaleString("en-IN")}</span>
          </div>

          <div style="margin-top:8px;font-size:13px;color:#666;">
            Stock: ${stockText}
          </div>

          ${colorsHtml}

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            <a href="#"
               class="btn btn--sm outfit-add-cart-btn"
               data-product-id="${product._id}">
               Add To Cart
            </a>

            <a href="#"
               class="btn btn--sm outfit-remove-btn"
               data-product-id="${product._id}"
               style="background:#f5f5f5;color:#222;border:1px solid #ddd;">
               Remove
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async function renderOutfitPage() {
    const grid = document.getElementById("outfitGrid");
    const summary = document.getElementById("outfitSummary");
    const emptyState = document.getElementById("outfitEmptyState");
    const addAllBtn = document.getElementById("addOutfitToCartBtn");
    const clearBtn = document.getElementById("clearOutfitBtn");

    if (!grid || !summary || !emptyState) return;

    const outfit = readOutfit();

    if (!outfit.length) {
      grid.innerHTML = "";
      summary.innerHTML = "";
      emptyState.style.display = "block";
      if (addAllBtn) addAllBtn.style.display = "none";
      if (clearBtn) clearBtn.style.display = "none";
      return;
    }

    emptyState.style.display = "block";
    emptyState.style.display = "none";
    if (addAllBtn) addAllBtn.style.display = "inline-flex";
    if (clearBtn) clearBtn.style.display = "inline-flex";

    const products = await Promise.all(
      outfit.map((item) => fetchProduct(item.productId)),
    );
    const validProducts = products.filter(Boolean);

    if (!validProducts.length) {
      grid.innerHTML = "";
      summary.innerHTML = "No valid outfit items found.";
      return;
    }

    grid.innerHTML = validProducts.map(renderOutfitCard).join("");

    const totalPrice = validProducts.reduce(
      (sum, p) => sum + Number(p.price || 0),
      0,
    );

    summary.innerHTML = `
      ${validProducts.length} item(s) in outfit · Total: Rs. ${totalPrice.toLocaleString("en-IN")}
    `;

    grid.querySelectorAll(".outfit-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        removeFromOutfit(btn.getAttribute("data-product-id"));
      });
    });

    grid.querySelectorAll(".outfit-add-cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = btn.getAttribute("data-product-id");

        if (typeof window.addToCart === "function") {
          window.addToCart(productId, 1, "", "");
        }

        if (typeof window.updateCartCount === "function") {
          window.updateCartCount();
        }

        showToast("Product added to cart.", "success");
      });
    });
  }

  document.addEventListener("click", (e) => {
    const compareBtn = e.target.closest(".compare__btn");
    if (!compareBtn) return;

    e.preventDefault();
    const productId = compareBtn.getAttribute("data-product-id");
    addToOutfit(productId);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const addOutfitToCartBtn = document.getElementById("addOutfitToCartBtn");
    const clearOutfitBtn = document.getElementById("clearOutfitBtn");

    if (addOutfitToCartBtn) {
      addOutfitToCartBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const outfit = readOutfit();
        if (!outfit.length) {
          showToast("Your outfit is empty.", "warning");
          return;
        }

        if (typeof window.addToCart === "function") {
          outfit.forEach((item) => {
            window.addToCart(item.productId, 1, "", "");
          });
        }

        if (typeof window.updateCartCount === "function") {
          window.updateCartCount();
        }

        showToast("Full outfit added to cart.", "success");
      });
    }

    if (clearOutfitBtn) {
      clearOutfitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearOutfit();
      });
    }

    renderOutfitPage();
  });
})();
