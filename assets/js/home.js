// ========================
// BASE URLS (use common.js global)
// ========================

const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_API = window.ELVO_API;

// ========================
// IMAGE URL FIX
// ========================
function imgUrl(path) {
  if (typeof window.getProductImageUrl === "function") {
    return window.getProductImageUrl(path, "assets/img/category-1.jpg");
  }

  if (!path) return "assets/img/category-1.jpg";

  const cleanPath = String(path).trim();

  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://")
  ) {
    return cleanPath;
  }

  return `${window.ELVO_SERVER}/${cleanPath.replace(/\\/g, "/")}`;
}

// ========================
// CHIC ESSENTIALS
// ========================
async function loadChicEssentials() {
  try {
    const res = await fetch(`${ELVO_API}/home/chic-essentials`);
    const products = await res.json();

    const wrapper = document.getElementById("chicCategoriesWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = products
      .map(
        (p) => `
      <a href="details.html?id=${p._id}" class="category__item swiper-slide">
        <img src="${imgUrl(p.images?.[0])}" 
             alt="${p.name}" 
             class="category__img">
        <h3 class="category__title">${p.name}</h3>
      </a>
    `,
      )
      .join("");

    if (window.categoriesSwiper) window.categoriesSwiper.update();
  } catch (err) {
    console.error("Chic Essentials error:", err);
  }
}

// ========================
// NEW ARRIVALS
// ========================
async function loadNewArrivals() {
  try {
    const res = await fetch(`${ELVO_API}/home/new-arrivals`);
    const products = await res.json();

    const wrapper = document.getElementById("newArrivalsWrapper");
    if (!wrapper) return;

    wrapper.innerHTML = products
      .map((p) => {
        const img1 = imgUrl(p.images?.[0]);
        const img2 = imgUrl(p.images?.[1] || p.images?.[0]);

        return `
      <div class="product__item swiper-slide">
        <div class="product__banner">
          <a href="details.html?id=${p._id}" class="product__images">
            <img src="${img1}" class="product__img default">
            <img src="${img2}" class="product__img hover">
          </a>

          <div class="product__actions">
            <a href="details.html?id=${p._id}" class="action__btn" aria-label="Quick View">
              <i class="fi fi-rs-eye"></i>
            </a>

            <a href="#"
                class="action__btn wishlist__btn"
                aria-label="Add To Wishlist"
                data-product-id="${p._id}">
                <i class="fi fi-rs-heart"></i>
            </a>

            <a href="#"
              class="action__btn compare__btn"
              data-product-id="${p._id}"
              aria-label="Add To Outfit">
              <i class="fi fi-rs-shuffle"></i>
            </a>
          </div>
        </div>

        <div class="product__content">
          <span class="product__category">${p.category || "Product"}</span>

          <a href="details.html?id=${p._id}">
            <h3 class="product__title">${p.name}</h3>
          </a>

          <div class="product__price flex">
            <span class="new__price">Rs. ${p.price}</span>
          </div>

          <a href="#"
             class="action__btn cart__btn"
             data-product-id="${p._id}"
             aria-label="Add To Cart">
            <i class="fi fi-rs-shopping-bag-add"></i>
          </a>
        </div>
      </div>
      `;
      })
      .join("");

    if (window.newArrivalsSwiper) window.newArrivalsSwiper.update();
  } catch (err) {
    console.error("New Arrivals error:", err);
  }
}

// ========================
// FEATURED / POPULAR / TRENDING
// ========================
function productCard(p) {
  const img1 = imgUrl(p.images?.[0]);
  const img2 = imgUrl(p.images?.[1] || p.images?.[0]);

  return `
    <div class="product__item">
      <div class="product__banner">
        <a href="details.html?id=${p._id}" class="product__images">
          <img src="${img1}" class="product__img default">
          <img src="${img2}" class="product__img hover">
        </a>

        <div class="product__actions">
          <a href="details.html?id=${p._id}" class="action__btn" aria-label="Quick View">
            <i class="fi fi-rs-eye"></i>
          </a>

          <a href="#"
            class="action__btn wishlist__btn"
            aria-label="Add To Wishlist"
            data-product-id="${p._id}">
            <i class="fi fi-rs-heart"></i>
          </a>

          <a href="#"
            class="action__btn compare__btn"
            data-product-id="${p._id}"
            aria-label="Add To Outfit">
            <i class="fi fi-rs-shuffle"></i>
          </a>
        </div>
      </div>

      <div class="product__content">
        <span class="product__category">${p.category || "Product"}</span>

        <a href="details.html?id=${p._id}">
          <h3 class="product__title">${p.name}</h3>
        </a>

        <div class="product__price flex">
          <span class="new__price">Rs. ${p.price}</span>
        </div>

        <a href="#"
           class="action__btn cart__btn"
           data-product-id="${p._id}"
           aria-label="Add To Cart">
          <i class="fi fi-rs-shopping-bag-add"></i>
        </a>
      </div>
    </div>
  `;
}

async function loadProductsInto(type, containerId) {
  try {
    const res = await fetch(`${ELVO_API}/type/${type}`);
    const products = await res.json();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = products.map(productCard).join("");
  } catch (err) {
    console.error(`${type} error:`, err);
  }
}

// ========================
// SHOWCASE SECTION
// ========================
function showcaseCard(p) {
  return `
    <a href="details.html?id=${p._id}" class="showcase__item">
      <img src="${imgUrl(p.images?.[0])}" alt="${p.name}" class="showcase__img" />
      <div class="showcase__content">
        <h4 class="showcase__title">${p.name}</h4>
        <span class="showcase__category">${p.category || "Product"}</span>
        <div class="showcase__price">Rs. ${p.price}</div>
      </div>
    </a>
  `;
}

async function loadShowcase() {
  try {
    const res = await fetch(`${ELVO_API}/home/showcase`);
    const data = await res.json();

    const capsList = document.getElementById("capsList");
    const sunglassesList = document.getElementById("sunglassesList");
    const bagsList = document.getElementById("bagsList");
    const jewelleryList = document.getElementById("jewelleryList");

    if (capsList) {
      capsList.innerHTML = (data.caps || []).map(showcaseCard).join("");
    }

    if (sunglassesList) {
      sunglassesList.innerHTML = (data.sunglasses || []).map(showcaseCard).join("");
    }

    if (bagsList) {
      bagsList.innerHTML = (data.bags || []).map(showcaseCard).join("");
    }

    if (jewelleryList) {
      jewelleryList.innerHTML = (data.jewellery || []).map(showcaseCard).join("");
    }
  } catch (err) {
    console.error("Showcase load error:", err);
  }
}

// ========================
// INIT
// ========================
document.addEventListener("DOMContentLoaded", () => {
  loadChicEssentials();
  loadNewArrivals();
  loadProductsInto("featured", "featuredProducts");
  loadProductsInto("popular", "popularProducts");
  loadProductsInto("trending", "trendingProducts");
});