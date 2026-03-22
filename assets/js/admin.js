let editMode = false;
let editProductId = null;

const API_URL = "http://localhost:5000/api/products";
const SERVER_BASE = "http://localhost:5000";

// for color information on product details tab
function getColorLabel(colorValue) {
  if (!colorValue) return "";

  const hex = String(colorValue).trim().toLowerCase();

  const colorMap = {
    "#000000": "Black",
    "#ffffff": "White",
    "#ff0000": "Red",
    "#00ff00": "Lime",
    "#0000ff": "Blue",
    "#ffff00": "Yellow",
    "#ffa500": "Orange",
    "#800080": "Purple",
    "#ffc0cb": "Pink",
    "#a52a2a": "Brown",
    "#808080": "Gray",
    "#grey": "Gray",
    "#008000": "Green",
    "#add8e6": "Light Blue",
    "#000080": "Navy",
    "#f5deb3": "Wheat",
    "#beige": "Beige",
    "#c0c0c0": "Silver",
    "#800000": "Maroon",
    "#olive": "Olive",
  };

  return colorMap[hex] || colorValue;
}

// Page elements
const productTable = document.getElementById("productTable");
const productForm = document.getElementById("productForm");

document.addEventListener("DOMContentLoaded", () => {
  // Dashboard stats
  const totalProductsEl = document.getElementById("totalProducts");
  const totalOrdersEl = document.getElementById("totalOrders");
  const totalUsersEl = document.getElementById("totalUsers");

  if (totalProductsEl || totalOrdersEl || totalUsersEl) {
    loadDashboardStats();
  }

  // Only run product code if product table exists
  if (productTable) {
    fetchProducts();
  }

  // Only attach submit listener if form exists
  if (productForm) {
    productForm.addEventListener("submit", handleProductSubmit);
  }

  const orderTable = document.getElementById("orderTable");
  if (orderTable) {
    loadOrders();
  }

  const closeModalBtn = document.getElementById("closeOrderModal");
  const orderModal = document.getElementById("orderModal");

  if (closeModalBtn && orderModal) {
    closeModalBtn.addEventListener("click", () => {
      orderModal.classList.remove("show");
    });

    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) {
        orderModal.classList.remove("show");
      }
    });
  }
});

// ===== DASHBOARD STATS =====
async function loadDashboardStats() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/orders/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!data.success) {
      console.error(data.message || "Failed to load dashboard stats");
      return;
    }

    const totalProducts = document.getElementById("totalProducts");
    const totalOrders = document.getElementById("totalOrders");
    const totalUsers = document.getElementById("totalUsers");
    const pendingOrders = document.getElementById("pendingOrders");
    const deliveredOrders = document.getElementById("deliveredOrders");
    const cancelledOrders = document.getElementById("cancelledOrders");
    const totalRevenue = document.getElementById("totalRevenue");

    if (totalProducts) totalProducts.innerText = data.stats.totalProducts || 0;
    if (totalOrders) totalOrders.innerText = data.stats.totalOrders || 0;
    if (totalUsers) totalUsers.innerText = data.stats.totalUsers || 0;
    if (pendingOrders) pendingOrders.innerText = data.stats.pendingOrders || 0;
    if (deliveredOrders)
      deliveredOrders.innerText = data.stats.deliveredOrders || 0;
    if (cancelledOrders)
      cancelledOrders.innerText = data.stats.cancelledOrders || 0;
    if (totalRevenue) {
      totalRevenue.innerText = `₹${Number(
        data.stats.totalRevenue || 0,
      ).toLocaleString("en-IN")}`;
    }
  } catch (error) {
    console.error("Dashboard stats error:", error);
  }
}

// ===== Fetch Products =====
async function fetchProducts() {
  if (!productTable) return;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const products = Array.isArray(data) ? data : data.products || [];

    productTable.innerHTML = "";

    products.forEach((product) => {
      const firstImg = product.images?.[0]
        ? `${SERVER_BASE}/${product.images[0]}`
        : "/assets/img/category-1.jpg";

      let stockClass = "stock-in";
      let stockText = `${product.stock}`;

      if (product.stock === 0) {
        stockClass = "stock-out";
        stockText = "Out of Stock";
      } else if (product.stock <= 5) {
        stockClass = "stock-low";
        stockText = `Low (${product.stock})`;
      }

      const row = `
        <tr>
          <td>
            <div class="product-info">
              <img src="${firstImg}" alt="${product.name}" class="product-thumb" />
              <div>
                <div class="product-name">${product.name}</div>
              </div>
            </div>
          </td>
          <td>₹${Number(product.price || 0).toLocaleString("en-IN")}</td>
          <td><span class="product-category">${product.category}</span></td>
          <td><span class="stock-badge ${stockClass}">${stockText}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit-btn" onclick="editProduct('${product._id}')">Edit</button>
              <button class="action-btn delete-btn" onclick="deleteProduct('${product._id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;

      productTable.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// ===== Add / Update Product =====
async function handleProductSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("name");
  const price = document.getElementById("price");
  const category = document.getElementById("category");
  const stock = document.getElementById("stock");
  const description = document.getElementById("description");
  const imageInput = document.getElementById("images");

  const colorsInput = document.querySelector("input[name='colors']");
  const sizesInput = document.querySelector("input[name='sizes']");

  const isFeatured = document.getElementById("isFeatured");
  const isPopular = document.getElementById("isPopular");
  const isTrending = document.getElementById("isTrending");
  const isChicEssential = document.getElementById("isChicEssential");
  const isNewArrival = document.getElementById("isNewArrival");

  if (
    !name ||
    !price ||
    !category ||
    !stock ||
    !description ||
    !imageInput ||
    !colorsInput ||
    !sizesInput ||
    !isFeatured ||
    !isPopular ||
    !isTrending ||
    !isChicEssential ||
    !isNewArrival
  ) {
    console.error("Some product form fields are missing on this page.");
    return;
  }

  const formData = new FormData();
  formData.append("name", name.value);
  formData.append("price", price.value);
  formData.append("category", category.value);
  formData.append("stock", stock.value);
  formData.append("description", description.value);

  formData.append("colors", colorsInput.value);
  formData.append("sizes", sizesInput.value);

  formData.append("isFeatured", isFeatured.checked);
  formData.append("isPopular", isPopular.checked);
  formData.append("isTrending", isTrending.checked);
  formData.append("isChicEssential", isChicEssential.checked);
  formData.append("isNewArrival", isNewArrival.checked);

  for (let i = 0; i < imageInput.files.length; i++) {
    formData.append("images", imageInput.files[i]);
  }

  try {
    const url = editMode ? `${API_URL}/${editProductId}` : API_URL;
    const method = editMode ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg);
    }

    editMode = false;
    editProductId = null;
    productForm.reset();

    const submitBtn = document.querySelector("#productForm button");
    if (submitBtn) {
      submitBtn.innerText = "Add Product";
    }

    fetchProducts();
  } catch (error) {
    console.error("Error saving product:", error);
    alert("Error saving product. Check console.");
  }
}

// ===== Delete Product =====
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
  }
}

// ===== Edit Product =====
async function editProduct(id) {
  const name = document.getElementById("name");
  const price = document.getElementById("price");
  const category = document.getElementById("category");
  const stock = document.getElementById("stock");
  const description = document.getElementById("description");

  const colorsInput = document.querySelector("input[name='colors']");
  const sizesInput = document.querySelector("input[name='sizes']");

  const isFeatured = document.getElementById("isFeatured");
  const isPopular = document.getElementById("isPopular");
  const isTrending = document.getElementById("isTrending");
  const isChicEssential = document.getElementById("isChicEssential");
  const isNewArrival = document.getElementById("isNewArrival");

  if (
    !name ||
    !price ||
    !category ||
    !stock ||
    !description ||
    !colorsInput ||
    !sizesInput ||
    !isFeatured ||
    !isPopular ||
    !isTrending ||
    !isChicEssential ||
    !isNewArrival
  ) {
    console.error("Edit form elements are missing on this page.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`);
    const product = await response.json();

    name.value = product.name || "";
    price.value = product.price || "";
    category.value = product.category || "";
    stock.value = product.stock || "";
    description.value = product.description || "";

    colorsInput.value = (product.colors || []).join(",");
    sizesInput.value = (product.sizes || []).join(",");

    isFeatured.checked = !!product.isFeatured;
    isPopular.checked = !!product.isPopular;
    isTrending.checked = !!product.isTrending;
    isChicEssential.checked = !!product.isChicEssential;
    isNewArrival.checked = !!product.isNewArrival;

    editMode = true;
    editProductId = id;

    const submitBtn = document.querySelector("#productForm button");
    if (submitBtn) {
      submitBtn.innerText = "Update Product";
    }
  } catch (error) {
    console.error("Error loading product:", error);
  }
}

// ==============================
// ADMIN ORDERS
// ==============================

const ORDER_API = "http://localhost:5000/api/orders";
let currentAdminOrders = [];
let currentAdminPage = 1;
let currentAdminLimit = 20;
let adminPagination = null;

async function loadOrders(page = 1) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${ORDER_API}/admin?page=${page}&limit=${currentAdminLimit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Failed to load orders");
      return;
    }

    currentAdminOrders = data.orders || [];
    adminPagination = data.pagination || null;
    currentAdminPage = adminPagination?.currentPage || page;

    renderOrders(currentAdminOrders);
    renderPagination();
  } catch (err) {
    console.error("Load orders error:", err);
  }
}

function getStatusBadge(status) {
  const safeStatus = status || "Pending";
  const cls = safeStatus.toLowerCase();
  return `<span class="status-badge status-${cls}">${safeStatus}</span>`;
}

function getPaymentBadge(order) {
  const paymentMethod = String(order.paymentMethod || "").trim();
  const paymentStatus = order.paymentStatus || "";
  const paymentDisplay = order.paymentDisplay || paymentMethod || "-";

  const cls = paymentStatus.toLowerCase() === "prepaid" ? "paid" : "unpaid";

  return `
    <span class="payment-badge payment-${cls}">
      ${paymentDisplay}
    </span>
  `;
}

function renderOrders(orders) {
  const table = document.getElementById("orderTable");
  if (!table) return;

  if (!orders.length) {
    table.innerHTML = `<tr><td colspan="6">No orders found</td></tr>`;
    return;
  }

  table.innerHTML = orders
    .map((order) => {
      const userName = order.userInfo?.fullName || "Unknown User";
      const userEmail = order.userInfo?.email || "No email";

      const orderItems = (order.items || [])
        .map((item) => `${item.name || "Product"} x ${item.qty || 1}`)
        .join("<br>");

      return `
        <tr>
          <td>
            <strong>${userName}</strong><br>
            <small>${userEmail}</small><br>
            <small>ID: ${order.userId}</small>
          </td>

          <td>
            ${orderItems}
            <br><br>
            <span class="view-btn" onclick="showOrderDetails('${order._id}')">View Details</span>
          </td>

          <td>₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</td>

          <td>${getPaymentBadge(order)}</td>

          <td>${getStatusBadge(order.status)}</td>

          <td>
            <select onchange="updateOrderStatus('${order._id}', this.value)">
              <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Processing" ${order.status === "Processing" ? "selected" : ""}>Processing</option>
              <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
              <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
              <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderPagination() {
  const table = document.getElementById("orderTable");
  if (!table || !adminPagination) return;

  let paginationWrap = document.getElementById("adminPagination");

  if (!paginationWrap) {
    paginationWrap = document.createElement("div");
    paginationWrap.id = "adminPagination";
    paginationWrap.style.marginTop = "20px";
    paginationWrap.style.display = "flex";
    paginationWrap.style.alignItems = "center";
    paginationWrap.style.gap = "10px";
    paginationWrap.style.flexWrap = "wrap";

    const tableContainer = table.closest("table") || table.parentElement;
    tableContainer.parentElement.appendChild(paginationWrap);
  }

  const { currentPage, totalPages, hasPrevPage, hasNextPage, totalOrders } =
    adminPagination;

  paginationWrap.innerHTML = `
    <button ${!hasPrevPage ? "disabled" : ""} onclick="loadOrders(${currentPage - 1})">Prev</button>
    <span>Page ${currentPage} of ${totalPages || 1}</span>
    <button ${!hasNextPage ? "disabled" : ""} onclick="loadOrders(${currentPage + 1})">Next</button>
    <span style="margin-left:10px;">Total Orders: ${totalOrders || 0}</span>
  `;
}

function showOrderDetails(orderId) {
  const order = currentAdminOrders.find((o) => o._id === orderId);
  if (!order) return;

  const modal = document.getElementById("orderModal");
  const modalBody = document.getElementById("orderModalBody");
  if (!modal || !modalBody) return;

  const status = order.status || "Pending";
  const statusClass = status.toLowerCase();

  const itemsHtml = (order.items || [])
    .map((item) => {
      const image = item.image
        ? `${SERVER_BASE}/${String(item.image).replace(/\\/g, "/")}`
        : "/assets/img/category-1.jpg";

      return `
      <li class="order-item-card">
        <img src="${image}" alt="${item.name || "Product"}" class="order-item-image" />
        <div class="order-item-content">
          <div class="order-item-name">${item.name || "Product"}</div>
          <div class="order-item-meta">Quantity: ${item.qty || 1}</div>
          <div class="order-item-meta">Price: ₹${Number(item.price || 0).toLocaleString("en-IN")}</div>
          ${item.size ? `<div class="order-item-meta">Size: ${item.size}</div>` : ""}
          ${
            item.color
              ? `<div class="order-item-meta">
                  Color:
                  <span style="display:inline-flex;align-items:center;gap:6px;">
                    <span style="width:12px;height:12px;border-radius:50%;display:inline-block;background:${item.color};border:1px solid #ccc;"></span>
                    ${getColorLabel(item.color)}
                  </span>
                </div>`
              : ""
          }
        </div>
      </li>
    `;
    })
    .join("");

  modalBody.innerHTML = `
    <h2 class="order-modal-title">Order Details</h2>
    <p class="order-modal-subtitle">Admin view of customer, billing, and purchased product details.</p>

    <div class="order-section">
      <h3>Order Info</h3>
      <div class="order-info-grid">
        <div class="order-info-item"><strong>Order ID:</strong> ${order._id}</div>
        <div class="order-info-item"><strong>Status:</strong> <span class="status-badge status-${statusClass}">${status}</span></div>
        <div class="order-info-item"><strong>Payment Method:</strong> ${order.paymentMethod || "-"}</div>
        <div class="order-info-item"><strong>Payment Status:</strong> ${order.paymentStatus || "-"}</div>
        <div class="order-info-item"><strong>Total:</strong> ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</div>
        <div class="order-info-item"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString("en-IN")}</div>
      </div>
    </div>

    <div class="order-section">
      <h3>User Info</h3>
      <div class="order-info-grid">
        <div class="order-info-item"><strong>Name:</strong> ${order.userInfo?.fullName || "Unknown User"}</div>
        <div class="order-info-item"><strong>Email:</strong> ${order.userInfo?.email || "No email"}</div>
        <div class="order-info-item"><strong>User ID:</strong> ${order.userId}</div>
      </div>
    </div>

    <div class="order-section">
      <h3>Billing Details</h3>
      <div class="order-info-grid">
        <div class="order-info-item"><strong>Name:</strong> ${order.billingDetails?.name || "-"}</div>
        <div class="order-info-item"><strong>Phone:</strong> ${order.billingDetails?.phone || "-"}</div>
        <div class="order-info-item"><strong>Email:</strong> ${order.billingDetails?.email || "-"}</div>
        <div class="order-info-item"><strong>City:</strong> ${order.billingDetails?.city || "-"}</div>
        <div class="order-info-item"><strong>State:</strong> ${order.billingDetails?.state || "-"}</div>
        <div class="order-info-item"><strong>Pincode:</strong> ${order.billingDetails?.pincode || "-"}</div>
        <div class="order-info-item" style="grid-column: 1 / -1;"><strong>Address:</strong> ${order.billingDetails?.address || "-"}</div>
        <div class="order-info-item"><strong>Country:</strong> ${order.billingDetails?.country || "-"}</div>
      </div>
    </div>

    <div class="order-section">
      <h3>Products Purchased</h3>
      <ul class="order-items-list">
        ${itemsHtml}
      </ul>
    </div>
  `;

  modal.classList.add("show");
}

async function updateOrderStatus(orderId, status) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ORDER_API}/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Status updated successfully ✅");
      loadOrders(currentAdminPage);
      loadDashboardStats();
    } else {
      alert(data.message || "Update failed");
    }
  } catch (err) {
    console.error("Update error:", err);
  }
}
