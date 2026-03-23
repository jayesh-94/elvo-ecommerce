const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_PRODUCTS_API = window.ELVO_API;

function imgUrl(path, fallback = "assets/img/category-1.jpg") {
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

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    showToast("Please login first to continue checkout", "warning");
    setTimeout(() => {
      window.location.href = window.location.origin + "/login-register.html";
    }, 1000);
    return;
  }

  loadCheckoutUserData();
  loadCheckoutCart();

  const placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", placeOrder);
  }
});

async function loadCheckoutUserData() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${ELVO_SERVER}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await res.json();

    if (!res.ok) {
      throw new Error(user.message || "Failed to load user");
    }

    fillCheckoutForm(user);
  } catch (error) {
    console.error("Checkout user load error:", error);
  }
}

function fillCheckoutForm(user) {
  const fullName =
    user.address?.fullName?.trim() ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim();

  const nameInput = document.getElementById("checkoutName");
  const addressInput = document.getElementById("checkoutAddress");
  const cityInput = document.getElementById("checkoutCity");
  const stateInput = document.getElementById("checkoutState");
  const postalCodeInput = document.getElementById("checkoutPostalCode");
  const countryInput = document.getElementById("checkoutCountry");
  const phoneInput = document.getElementById("checkoutPhone");
  const emailInput = document.getElementById("checkoutEmail");

  if (nameInput) nameInput.value = fullName || "";
  if (addressInput) addressInput.value = user.address?.line1 || "";
  if (cityInput) cityInput.value = user.address?.city || "";
  if (stateInput) stateInput.value = user.address?.state || "";
  if (postalCodeInput) postalCodeInput.value = user.address?.postalCode || "";
  if (countryInput) countryInput.value = user.address?.country || "";
  if (phoneInput) phoneInput.value = user.phone || "";
  if (emailInput) emailInput.value = user.email || "";
}

async function loadCheckoutCart() {
  try {
    const cart = window.readCart ? window.readCart() : [];

    const tbody = document.getElementById("checkoutItemsBody");
    const subtotalEl = document.getElementById("checkoutSubtotal");
    const grandTotalEl = document.getElementById("checkoutGrandTotal");

    if (!tbody) return;

    if (!cart.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">Your cart is empty.</td>
        </tr>
      `;
      if (subtotalEl) subtotalEl.textContent = "Rs. 0.00";
      if (grandTotalEl) grandTotalEl.textContent = "Rs. 0.00";
      return;
    }

    const res = await fetch(ELVO_PRODUCTS_API);
    const data = await res.json();
    const allProducts = Array.isArray(data) ? data : data.products || [];

    let subtotal = 0;

    tbody.innerHTML = cart
      .map((item) => {
        const product = allProducts.find((p) => String(p._id) === String(item.productId));
        if (!product) {
          return `
            <tr>
              <td colspan="3">Product not found</td>
            </tr>
          `;
        }

        const qty = Number(item.qty) || 1;
        const price = Number(product.price) || 0;
        const lineTotal = price * qty;
        subtotal += lineTotal;

        const imagePath = Array.isArray(product.images) ? product.images[0] : product.image;

        return `
          <tr>
            <td class="order-product">
              <img src="${imgUrl(imagePath, "assets/img/category-1.jpg")}" alt="${product.name}" class="table__img">
              <div style="display:inline-block; vertical-align:middle; margin-left:10px;">
                <strong>${product.name}</strong>
                ${
                  item.size || item.color
                    ? `
                    <div style="font-size:12px; color:#666; margin-top:4px;">
                      ${item.size ? `<div>Size: ${item.size}</div>` : ""}
                      ${item.color ? `<div>Color: ${item.color}</div>` : ""}
                    </div>
                  `
                    : ""
                }
              </div>
            </td>
            <td>${qty}</td>
            <td>Rs. ${formatPrice(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    if (subtotalEl) subtotalEl.textContent = `Rs. ${formatPrice(subtotal)}`;
    if (grandTotalEl) grandTotalEl.textContent = `Rs. ${formatPrice(subtotal)}`;
  } catch (error) {
    console.error("Checkout cart load error:", error);

    const tbody = document.getElementById("checkoutItemsBody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">Failed to load cart items.</td>
        </tr>
      `;
    }
  }
}

function formatPrice(value) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getBillingDetails() {
  return {
    name: document.getElementById("checkoutName")?.value.trim(),
    address: document.getElementById("checkoutAddress")?.value.trim(),
    city: document.getElementById("checkoutCity")?.value.trim(),
    state: document.getElementById("checkoutState")?.value.trim(),
    pincode: document.getElementById("checkoutPostalCode")?.value.trim(),
    country: document.getElementById("checkoutCountry")?.value.trim(),
    phone: document.getElementById("checkoutPhone")?.value.trim(),
    email: document.getElementById("checkoutEmail")?.value.trim(),
  };
}

function validateBillingDetails(billingDetails) {
  return (
    billingDetails.name &&
    billingDetails.address &&
    billingDetails.city &&
    billingDetails.state &&
    billingDetails.pincode &&
    billingDetails.country &&
    billingDetails.phone &&
    billingDetails.email
  );
}

async function placeOrder(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    showToast("Please login first", "warning");
    setTimeout(() => {
      window.location.href = "login-register.html";
    }, 1000);
    return;
  }

  const cart = window.readCart ? window.readCart() : [];
  if (!cart.length) {
    showToast("Cart is empty", "warning");
    return;
  }

  const billingDetails = getBillingDetails();

  if (!validateBillingDetails(billingDetails)) {
    showToast("Please fill all billing details", "warning");
    return;
  }

  const payment = document.querySelector(".payment__input:checked");
  if (!payment) {
    showToast("Select payment method", "warning");
    return;
  }

  const paymentMethod = payment.value;
  const token = localStorage.getItem("token");

  const orderData = {
    userId: user._id || user.id,
    items: cart,
    billingDetails,
    paymentMethod,
  };

  const placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Processing.";
  }

  try {
    if (paymentMethod === "Cash On Delivery") {
      const res = await fetch(`${ELVO_SERVER}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        if (window.clearCart) window.clearCart();
        if (window.updateCartCount) window.updateCartCount();
        window.location.href = "order-success.html";
      } else {
        showToast(data.message || "Failed to place order", "error");
      }
    } else {
      showToast("Only Cash On Delivery is active right now", "warning");
    }
  } catch (error) {
    console.error("Place order error:", error);
    showToast("Something went wrong while placing order", "error");
  } finally {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    }
  }
}