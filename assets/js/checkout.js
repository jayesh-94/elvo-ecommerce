const ELVO_SERVER = window.ELVO_SERVER;
const ELVO_PRODUCTS_API = window.ELVO_API;

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

    const cartIds = cart.map((item) => String(item.productId));
    const products = allProducts.filter((p) => cartIds.includes(String(p._id)));

    const productMap = {};
    products.forEach((p) => {
      productMap[String(p._id)] = p;
    });

    let subtotal = 0;

    tbody.innerHTML = cart
      .map((item) => {
        const product = productMap[String(item.productId)];
        if (!product) return "";

        const qty = Number(item.qty) || 1;
        const price = Number(product.price) || 0;
        const rowTotal = qty * price;
        subtotal += rowTotal;

        const image = product.images?.[0]
          ? `${ELVO_SERVER}/${String(product.images[0]).replace(/\\/g, "/")}`
          : "assets/img/category-1.jpg";

        const sizeHtml = item.size
          ? `<p class="table__quantity">Size: ${item.size}</p>`
          : "";

        const colorHtml = item.color
          ? `<p class="table__quantity">Color: ${item.color}</p>`
          : "";

        return `
          <tr>
            <td>
              <img src="${image}" alt="${product.name}" class="order__img"/>
            </td>

            <td>
              <h3 class="table__title">${product.name}</h3>
              <p class="table__quantity">x ${qty}</p>
              ${sizeHtml}
              ${colorHtml}
            </td>
            
            <td><span class="table__price">Rs. ${formatPrice(rowTotal)}</span></td>
          </tr>
        `;
      })
      .join("");

    if (!tbody.innerHTML.trim()) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3">Unable to load cart products.</td>
        </tr>
      `;
    }

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
    placeOrderBtn.textContent = "Processing...";
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
        showToast(data.message || "Order failed", "error");
      }

      return;
    }

    if (paymentMethod === "Online Payment") {
      const razorpayRes = await fetch(
        `${ELVO_SERVER}/api/orders/create-razorpay-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: cart }),
        },
      );

      const razorpayData = await razorpayRes.json();

      if (!razorpayData.success) {
        showToast(
          razorpayData.message || "Failed to create payment order",
          "error",
        );
        return;
      }

      const options = {
        key: razorpayData.key,
        amount: razorpayData.order.amount,
        currency: razorpayData.order.currency,
        name: "ELVO",
        description: "Order Payment",
        order_id: razorpayData.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(
              `${ELVO_SERVER}/api/orders/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData,
                }),
              },
            );

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              if (window.clearCart) window.clearCart();
              if (window.updateCartCount) window.updateCartCount();
              window.location.href = "order-success.html";
            } else {
              showToast(
                verifyData.message || "Payment verification failed",
                "error",
              );
            }
          } catch (error) {
            console.error("Verify payment error:", error);
            showToast("Payment verification failed", "error");
          } finally {
            if (placeOrderBtn) {
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = "Place Order";
            }
          }
        },
        prefill: {
          name: billingDetails.name,
          email: billingDetails.email,
          contact: billingDetails.phone,
        },
        notes: {
          address: billingDetails.address,
        },
        theme: {
          color: "#111827",
        },
        modal: {
          ondismiss: function () {
            if (placeOrderBtn) {
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = "Place Order";
            }
          },
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
      return;
    }

    showToast("Invalid payment method selected", "error");
  } catch (err) {
    console.error("Place order error:", err);
    showToast("Something went wrong. Please try again later.", "error");
  } finally {
    if (placeOrderBtn && paymentMethod === "Cash On Delivery") {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    }
  }
}
