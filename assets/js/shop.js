// assets/js/shop.js

const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_API = window.ELVO_API;

const SHOP_PRODUCTS_PER_PAGE = 50;

function imgUrl(path) {
  if (typeof window.imgUrl === "function") {
    return window.imgUrl(path, "assets/img/cloth-1.png");
  }

  if (!path) return "assets/img/cloth-1.png";

  const cleanPath = String(path).trim();

  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://")
  ) {
    return cleanPath;
  }

  return `${ELVO_SERVER}/${cleanPath.replace(/\\/g, "/")}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function productCard(product) {
  const img1 = product.images?.[0]
    ? imgUrl(product.images[0])
    : "assets/img/cloth-1.png";

  const img2 = product.images?.[1]
    ? imgUrl(product.images[1])
    : img1;

  return `
    <div class="product__item">
      <div class="product__banner">
        <a href="details.html?id=${product._id}" class="product__images">
          <img src="${img1}" class="product__img default" alt="${escapeHtml(product.name)}" />
          <img src="${img2}" class="product__img hover" alt="${escapeHtml(product.name)}" />
        </a>

        <div class="product__actions">
          <a href="details.html?id=${product._id}" class="action__btn" aria-label="Quick View">
            <i class="fi fi-rs-eye"></i>
          </a>

          <a href="#"
             class="action__btn wishlist__btn"
             data-product-id="${product._id}"
             aria-label="Add To Wishlist">
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
        <span class="product__category">${escapeHtml(product.category || "Clothing")}</span>

        <a href="details.html?id=${product._id}">
          <h3 class="product__title">${escapeHtml(product.name)}</h3>
        </a>

        <div class="product__price flex">
          <span class="new__price">Rs. ${escapeHtml(String(product.price || ""))}</span>
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
}

function renderProducts(products, totalProducts = 0) {
  const container = document.getElementById("productContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(products)) {
    throw new Error("Products API did not return an array.");
  }

  const frag = document.createDocumentFragment();

  products.forEach((p) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = productCard(p);
    frag.appendChild(wrap.firstElementChild);
  });

  container.appendChild(frag);

  const totalSpan = document.querySelector(".total__products span");
  if (totalSpan) totalSpan.innerText = totalProducts;
}

function renderPagination(currentPage, totalPages, searchQuery = "") {
  const pagination = document.querySelector(".pagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  if (!totalPages || totalPages <= 1) return;

  const createPageItem = (label, page, isActive = false, isIcon = false) => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    a.href = "#";
    a.className = `pagination__link${isActive ? " active" : ""}${isIcon ? " icon" : ""}`;
    a.innerHTML = label;

    a.addEventListener("click", (e) => {
      e.preventDefault();
      loadShopProducts(page, searchQuery);
    });

    li.appendChild(a);
    return li;
  };

  if (currentPage > 1) {
    pagination.appendChild(
      createPageItem(
        '<i class="fi-rs-angle-double-small-left"></i>',
        currentPage - 1,
        false,
        true
      )
    );
  }

  const pages = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage, "...", totalPages);
    }
  }

  pages.forEach((page) => {
    if (page === "...") {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.className = "pagination__link";
      a.textContent = "...";
      li.appendChild(a);
      pagination.appendChild(li);
    } else {
      pagination.appendChild(
        createPageItem(String(page).padStart(2, "0"), page, page === currentPage)
      );
    }
  });

  if (currentPage < totalPages) {
    pagination.appendChild(
      createPageItem(
        '<i class="fi-rs-angle-double-small-right"></i>',
        currentPage + 1,
        false,
        true
      )
    );
  }
}

async function fetchPaginatedProducts(page = 1) {
  const res = await fetch(`${ELVO_API}?page=${page}&limit=${SHOP_PRODUCTS_PER_PAGE}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function fetchPaginatedProductsBySearch(query, page = 1) {
  const res = await fetch(
    `${ELVO_API}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${SHOP_PRODUCTS_PER_PAGE}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function loadShopProducts(page = 1, searchQuery = "") {
  try {
    const data = searchQuery
      ? await fetchPaginatedProductsBySearch(searchQuery, page)
      : await fetchPaginatedProducts(page);

    const products = data.products || [];
    const totalProducts = data.totalProducts || 0;
    const totalPages = data.totalPages || 1;
    const currentPage = data.currentPage || 1;

    renderProducts(products, totalProducts);
    renderPagination(currentPage, totalPages, searchQuery);

    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }
    params.set("page", currentPage);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  } catch (err) {
    console.error("Shop load error:", err);
    const container = document.getElementById("productContainer");
    if (container) {
      container.innerHTML = `<p style="padding:16px;color:#a00;">Failed to load products.</p>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const searchQuery = (params.get("search") || "").trim();
  const page = Math.max(parseInt(params.get("page")) || 1, 1);

  loadShopProducts(page, searchQuery);
});