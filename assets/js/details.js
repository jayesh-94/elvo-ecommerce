const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_API = window.ELVO_API;

function imgUrl(path, fallback = "assets/img/cloth-1.png") {
  if (typeof window.getProductImageUrl === "function") {
    return window.getProductImageUrl(path, fallback);
  }

  if (!path) return fallback;

  const cleanPath = String(path).trim();

  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  return `${ELVO_SERVER}/${cleanPath.replace(/\\/g, "/")}`;
}

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

document.addEventListener("DOMContentLoaded", () => {
  if (!productId) {
    console.error("No product id found in URL");
    return;
  }
  loadProduct();
});

async function loadProduct() {
  try {
    const response = await fetch(`${ELVO_API}/${productId}`);
    const product = await response.json();

    renderProduct(product);
    loadRecommendations(product.category, product._id);
  } catch (error) {
    console.error("Error loading product:", error);
  }
}

function renderProduct(product) {
  document.getElementById("productTitle").innerText = product.name || "";
  document.getElementById("productPrice").innerText = product.price
    ? `₹${product.price}`
    : "";
  document.getElementById("productDescription").innerText =
    product.description || "";
  document.getElementById("productStock").innerText =
    product.stock > 0 ? "In Stock" : "Out of Stock";

  const qtyInput = document.querySelector(".details__action .quantity");
  if (qtyInput) {
    qtyInput.value = "1";
    qtyInput.min = "1";
  }

  const mainImage = document.getElementById("mainImage");
  mainImage.src = product.images?.length
    ? imgUrl(product.images[0], "assets/img/cloth-1.png")
    : "assets/img/cloth-1.png";

  const thumbContainer = document.getElementById("thumbnailContainer");
  thumbContainer.innerHTML = "";

  (product.images || []).forEach((image) => {
    const thumb = document.createElement("img");
    thumb.src = imgUrl(image, "assets/img/cloth-1.png");
    thumb.classList.add("details__small-img");

    thumb.addEventListener("click", () => {
      mainImage.src = thumb.src;
    });

    thumbContainer.appendChild(thumb);
  });

  const wBtn = document.getElementById("detailsWishlistBtn");
  if (wBtn) {
    wBtn.setAttribute("data-product-id", product._id);
    wBtn.classList.toggle("active", isInWishlist(product._id));
  }

  const colorContainer = document.getElementById("colorContainer");
  colorContainer.innerHTML = "";

  (product.colors || []).forEach((color, index) => {
    const li = document.createElement("li");
    const colorLink = document.createElement("a");
    colorLink.href = "#";
    colorLink.classList.add("color__links");
    colorLink.style.backgroundColor = color;
    colorLink.setAttribute("data-color", color);

    if (index === 0) colorLink.classList.add("color-active");

    colorLink.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".color__links")
        .forEach((c) => c.classList.remove("color-active"));
      colorLink.classList.add("color-active");
    });

    li.appendChild(colorLink);
    colorContainer.appendChild(li);
  });

  const sizeContainer = document.getElementById("sizeContainer");
  sizeContainer.innerHTML = "";

  (product.sizes || []).forEach((size, index) => {
    const li = document.createElement("li");
    const sizeLink = document.createElement("a");
    sizeLink.href = "#";
    sizeLink.classList.add("size__links");
    sizeLink.innerText = size;
    sizeLink.setAttribute("data-size", size);

    if (index === 0) sizeLink.classList.add("size-active");

    sizeLink.addEventListener("click", (e) => {
      e.preventDefault();
      document
        .querySelectorAll(".size__links")
        .forEach((link) => link.classList.remove("size-active"));
      sizeLink.classList.add("size-active");
    });

    li.appendChild(sizeLink);
    sizeContainer.appendChild(li);
  });

  const detailsCartBtn = document.getElementById("detailsAddToCart");

  if (detailsCartBtn && !detailsCartBtn.dataset.bound) {
    detailsCartBtn.dataset.bound = "1";

    detailsCartBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const qtyInput = document.querySelector(".details__action .quantity");
      const qty = Number(qtyInput?.value) || 1;

      const activeSize = document.querySelector(".size__links.size-active");
      const activeColor = document.querySelector(".color__links.color-active");

      const selectedSize = activeSize?.getAttribute("data-size") || "";
      const selectedColor = activeColor?.getAttribute("data-color") || "";

      if (typeof addToCart === "function") {
        addToCart(product._id, qty, selectedSize, selectedColor);
      }

      if (typeof updateCartCount === "function") updateCartCount();

      window.location.href = "cart.html";
    });
  }
}

async function loadRecommendations(category, currentProductId) {
  try {
    const response = await fetch(ELVO_API);
    const data = await response.json();
    const products = Array.isArray(data) ? data : data.products || [];

    const related = products.filter(
      (p) => p.category === category && p._id !== currentProductId
    );

    const container = document.getElementById("recommendationContainer");
    if (!container) return;

    container.innerHTML = "";

    if (related.length === 0) {
      container.innerHTML = "<p>No related products found.</p>";
      return;
    }

    related.slice(0, 4).forEach((product) => {
      const img1 = imgUrl(product.images?.[0], "assets/img/cloth-1.png");
      const img2 = imgUrl(product.images?.[1] || product.images?.[0], "assets/img/cloth-1.png");

      container.innerHTML += `
        <div class="product__item">
          <div class="product__banner">
            <a href="details.html?id=${product._id}" class="product__images">
              <img src="${img1}" class="product__img default" alt="${product.name || ""}" />
              <img src="${img2}" class="product__img hover" alt="${product.name || ""}" />
            </a>

            <div class="product__actions">
              <a href="details.html?id=${product._id}" class="action__btn" aria-label="Quick View">
                <i class="fi fi-rs-eye"></i>
              </a>

              <a href="#"
                class="action__btn wishlist__btn"
                aria-label="Add To Wishlist"
                data-product-id="${product._id}">
                <i class="fi fi-rs-heart"></i>
              </a>

              <a href="#"
                class="action__btn compare__btn"
                data-product-id="${product._id}"
                aria-label="Add To Outfit">
                <i class="fi fi-rs-shuffle"></i>
              </a>
            </div>
          </div>

          <div class="product__content">
            <span class="product__category">${product.category || "Product"}</span>

            <a href="details.html?id=${product._id}">
              <h3 class="product__title">${product.name}</h3>
            </a>

            <div class="product__price flex">
              <span class="new__price">Rs. ${product.price}</span>
            </div>

            <a href="#"
              class="action__btn cart__btn"
              data-product-id="${product._id}"
              aria-label="Add To Cart">
              <i class="fi fi-rs-shopping-bag-add"></i>
            </a>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error("Error loading recommendations:", error);
  }
}