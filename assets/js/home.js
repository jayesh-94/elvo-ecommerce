// ========================
// BASE URLS (renamed to avoid conflict with cart-utils.js)
// ========================

// reuse global server declared in cart-utils.js
const ELVO_SERVER = window.ELVO_SERVER || "http://localhost:5000";
const ELVO_API = window.ELVO_API || `${ELVO_SERVER}/api/products`;

// ========================
// IMAGE URL FIX
// ========================
function imgUrl(path) {
  if (!path) return "assets/img/category-1.jpg";
  return `${ELVO_SERVER}/${path.replace(/\\/g, "/")}`;
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

          <!-- ACTION ICONS -->
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

          <!--  IMPORTANT: data-product-id added -->
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

        <!-- ACTION ICONS -->
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

        <!-- ✅ IMPORTANT: data-product-id added -->
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
// DEALS COUNTDOWN
// ========================
function startCountdown(endTimeISO, ids) {
  const d = document.getElementById(ids.days);
  const h = document.getElementById(ids.hours);
  const m = document.getElementById(ids.mins);
  const s = document.getElementById(ids.secs);
  if (!d) return;

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const now = Date.now();
    const end = new Date(endTimeISO).getTime();
    let diff = Math.max(0, end - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff %= 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff %= 1000 * 60 * 60;
    const mins = Math.floor(diff / (1000 * 60));
    diff %= 1000 * 60;
    const secs = Math.floor(diff / 1000);

    d.textContent = pad(days);
    h.textContent = pad(hours);
    m.textContent = pad(mins);
    s.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);
}

// ========================
// SHOWCASE
// ========================
async function loadShowcase() {
  try {
    const res = await fetch(`${ELVO_API}/home/showcase`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    function item(p) {
      const img = imgUrl(p.images?.[0]);
      return `
        <div class="showcase__item">
          <a href="details.html?id=${p._id}" class="showcase__img-box">
            <img src="${img}" alt="${p.name}" class="showcase__img">
          </a>

          <div class="showcase__content">
            <a href="details.html?id=${p._id}">
              <h4 class="showcase__title">${p.name}</h4>
            </a>

            <div class="showcase__price flex">
              <span class="new__price">Rs. ${p.price}</span>
            </div>
          </div>
        </div>
      `;
    }

    const caps = document.getElementById("capsList");
    const sung = document.getElementById("sunglassesList");
    const bags = document.getElementById("bagsList");
    const jewl = document.getElementById("jewelleryList");

    if (caps) caps.innerHTML = (data.caps || []).map(item).join("");
    if (sung) sung.innerHTML = (data.sunglasses || []).map(item).join("");
    if (bags) bags.innerHTML = (data.bags || []).map(item).join("");
    if (jewl) jewl.innerHTML = (data.jewellery || []).map(item).join("");
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
  loadShowcase();

  loadProductsInto("featured", "featuredProducts");
  loadProductsInto("popular", "popularProducts");
  loadProductsInto("trending", "trendingProducts");

  startCountdown("2026-03-30T23:59:59+05:30", {
    days: "deal1Days",
    hours: "deal1Hours",
    mins: "deal1Mins",
    secs: "deal1Secs",
  });

  startCountdown("2026-03-28T23:59:59+05:30", {
    days: "deal2Days",
    hours: "deal2Hours",
    mins: "deal2Mins",
    secs: "deal2Secs",
  });
});
