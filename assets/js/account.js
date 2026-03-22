const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_USER_API = `${ELVO_SERVER}/api/users`;
const ELVO_ORDER_API = `${ELVO_SERVER}/api/orders`;

// for color information in product details
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

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    showToast("Please login first", "warning");
    setTimeout(() => {
      window.location.href = window.location.origin + "/login-register.html";
    }, 1000);
    return;
  }

  // Modal elements
  const userOrderModal = document.getElementById("userOrderModal");
  const userOrderModalBody = document.getElementById("userOrderModalBody");
  const closeUserOrderModal = document.getElementById("closeUserOrderModal");

  // Close modal by X button
  if (closeUserOrderModal && userOrderModal) {
    closeUserOrderModal.addEventListener("click", () => {
      userOrderModal.classList.remove("show");
    });
  }

  // Close modal by clicking outside modal content
  if (userOrderModal) {
    userOrderModal.addEventListener("click", (e) => {
      if (e.target === userOrderModal) {
        userOrderModal.classList.remove("show");
      }
    });
  }

  // Close modal with ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && userOrderModal?.classList.contains("show")) {
      userOrderModal.classList.remove("show");
    }
  });

  loadAccountData();
  loadMyOrders();

  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", updateProfile);
  }

  const saveAddressBtn = document.getElementById("saveAddressBtn");
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener("click", saveAddress);
  }

  const updatePasswordBtn = document.getElementById("updatePasswordBtn");
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener("click", changePassword);
  }
});

async function loadAccountData() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ELVO_USER_API}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await res.json();

    if (!res.ok) {
      throw new Error(user.message || "Failed to load account data");
    }

    fillDashboard(user);
    fillProfileForm(user);
    fillAddressForm(user);
  } catch (error) {
    console.error("Account load error:", error);
  }
}

async function loadMyOrders() {
  try {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("ordersTableBody");
    const userOrderModal = document.getElementById("userOrderModal");
    const userOrderModalBody = document.getElementById("userOrderModalBody");

    if (!tbody) return;

    const res = await fetch(`${ELVO_ORDER_API}/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">Failed to load orders.</td>
        </tr>
      `;
      return;
    }

    const orders = data.orders || [];

    if (!orders.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No orders yet.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders
      .map((order) => {
        const orderId = order._id.slice(-6).toUpperCase();
        const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        const status = order.status || "Pending";
        const total = Number(order.totalAmount || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        const statusColorMap = {
          Pending: "#f39c12",
          Processing: "#3498db",
          Shipped: "#8e44ad",
          Delivered: "#27ae60",
          Cancelled: "#e74c3c",
        };

        const statusStyle = `
          display:inline-block;
          padding:4px 10px;
          border-radius:999px;
          color:#fff;
          font-size:12px;
          font-weight:600;
          background:${statusColorMap[status] || "#555"};
        `;

        const showCancelBtn = status !== "Cancelled" && status !== "Delivered";

        return `
          <tr>
            <td>#${orderId}</td>
            <td>${date}</td>
            <td><span style="${statusStyle}">${status}</span></td>
            <td>Rs. ${total}</td>
            <td>
              <a href="#" class="view__order" data-order-id="${order._id}">View</a>
              ${
                showCancelBtn
                  ? ` | <a href="#" class="cancel__order" data-order-id="${order._id}">Cancel</a>`
                  : ""
              }
            </td>
          </tr>
        `;
      })
      .join("");

    tbody.querySelectorAll(".view__order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const orderId = btn.getAttribute("data-order-id");
        const order = orders.find((o) => o._id === orderId);
        if (!order || !userOrderModal || !userOrderModalBody) return;

        const status = order.status || "Pending";
        const statusClass = status.toLowerCase();

        const itemsHtml = (order.items || [])
          .map((item) => {
            const image = item.image
              ? `${ELVO_SERVER}/${String(item.image).replace(/\\/g, "/")}`
              : "assets/img/category-1.jpg";

            return `
            <li class="order-item-card">
              <img src="${image}" alt="${item.name || "Product"}" class="order-item-image" />
              <div class="order-item-content">
                <div class="order-item-name">${item.name || "Product"}</div>
                <div class="order-item-meta">Quantity: ${item.qty || 1}</div>
                <div class="order-item-meta">Price: Rs. ${Number(
                  item.price || 0,
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</div>
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

        userOrderModalBody.innerHTML = `
      <h2 class="order-modal-title">Order Details</h2>
      <p class="order-modal-subtitle">Track your purchased items and billing details.</p>

      <div class="order-section">
        <h3>Order Info</h3>
        <div class="order-info-grid">
          <div class="order-info-item"><strong>Order ID:</strong> #${order._id.slice(-6).toUpperCase()}</div>
          <div class="order-info-item"><strong>Status:</strong> <span class="order-status-badge order-status-${statusClass}">${status}</span></div>
          <div class="order-info-item"><strong>Payment:</strong> ${order.paymentMethod || "-"}</div>
          <div class="order-info-item"><strong>Total:</strong> Rs. ${Number(
            order.totalAmount || 0,
          ).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</div>
          <div class="order-info-item"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString("en-IN")}</div>
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

      <div class="order-actions-row">
        <button type="button" class="order-popup-btn secondary" onclick="document.getElementById('userOrderModal').classList.remove('show')">Close</button>
      </div>
    `;

        userOrderModal.classList.add("show");
      });
    });

    tbody.querySelectorAll(".cancel__order").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();

        const orderId = btn.getAttribute("data-order-id");
        const confirmCancel = confirm(
          "Are you sure you want to cancel this order?",
        );
        if (!confirmCancel) return;

        try {
          const cancelRes = await fetch(`${ELVO_ORDER_API}/${orderId}/cancel`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const cancelData = await cancelRes.json();

          if (cancelData.success) {
            showToast(
              "Order cancelled successfully. Money will be refunded to your payment method within 7 days.",
              "success",
            );
            loadMyOrders();
          } else {
            showToast(cancelData.message || "Failed to cancel order", "error");
          }
        } catch (error) {
          console.error("Cancel order error:", error);
          showToast("Something went wrong while cancelling order.", "error");
        }
      });
    });
  } catch (error) {
    console.error("Load orders error:", error);

    const tbody = document.getElementById("ordersTableBody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">Something went wrong while loading orders.</td>
        </tr>
      `;
    }
  }
}

function fillDashboard(user) {
  const dashboardGreeting = document.getElementById("dashboardGreeting");
  if (dashboardGreeting) {
    dashboardGreeting.textContent = `Hello ${user.firstName || "User"}!`;
  }
}

function fillProfileForm(user) {
  const firstName = document.getElementById("profileFirstName");
  const lastName = document.getElementById("profileLastName");
  const email = document.getElementById("profileEmail");
  const phone = document.getElementById("profilePhone");

  if (firstName) firstName.value = user.firstName || "";
  if (lastName) lastName.value = user.lastName || "";
  if (email) email.value = user.email || "";
  if (phone) phone.value = user.phone || "";
}

function fillAddressForm(user) {
  const fullName = document.getElementById("addressFullName");
  const line1 = document.getElementById("addressLine1");
  const city = document.getElementById("addressCity");
  const state = document.getElementById("addressState");
  const postalCode = document.getElementById("addressPostalCode");
  const country = document.getElementById("addressCountry");
  const phone = document.getElementById("addressPhone");

  if (fullName) fullName.value = user.address?.fullName || "";
  if (line1) line1.value = user.address?.line1 || "";
  if (city) city.value = user.address?.city || "";
  if (state) state.value = user.address?.state || "";
  if (postalCode) postalCode.value = user.address?.postalCode || "";
  if (country) country.value = user.address?.country || "";
  if (phone) phone.value = user.phone || "";
}

async function updateProfile(e) {
  e.preventDefault();

  const firstName = document.getElementById("profileFirstName")?.value.trim();
  const lastName = document.getElementById("profileLastName")?.value.trim();
  const phone = document.getElementById("profilePhone")?.value.trim();

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ELVO_USER_API}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Profile update failed", "error");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    showToast("Profile updated successfully", "success");
    loadAccountData();
  } catch (error) {
    console.error("Profile update error:", error);
    showToast("Something went wrong while updating profile", "error");
  }
}

async function saveAddress(e) {
  e.preventDefault();

  const fullName = document.getElementById("addressFullName")?.value.trim();
  const line1 = document.getElementById("addressLine1")?.value.trim();
  const city = document.getElementById("addressCity")?.value.trim();
  const state = document.getElementById("addressState")?.value.trim();
  const postalCode = document.getElementById("addressPostalCode")?.value.trim();
  const country = document.getElementById("addressCountry")?.value.trim();
  const phone = document.getElementById("addressPhone")?.value.trim();

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ELVO_USER_API}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone,
        address: {
          fullName,
          line1,
          city,
          state,
          postalCode,
          country,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Address update failed", "error");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    showToast("Address saved successfully", "success");
    loadAccountData();
  } catch (error) {
    console.error("Address update error:", error);
    showToast("Something went wrong while saving address", "error");
  }
}

async function changePassword(e) {
  e.preventDefault();

  const currentPassword = document
    .getElementById("currentPassword")
    ?.value.trim();
  const newPassword = document.getElementById("newPassword")?.value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    ?.value.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast("Please fill all password fields.", "warning");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("New password and confirm password do not match.", "warning");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ELVO_USER_API}/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || "Password change failed", "error");
      return;
    }

    showToast("Password updated successfully", "success");
    document.getElementById("changePasswordForm")?.reset();
  } catch (error) {
    console.error("Password change error:", error);
    showToast("Something went wrong while changing password", "error");
  }
}
