// common.js - this file is for header search works on ALL pages (no design change)

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.querySelector(".header__search");
  if (!searchBox) return;

  const input = searchBox.querySelector(".form__input");
  const btn = searchBox.querySelector(".search__btn");

  if (!input || !btn) return;

  function goSearch() {
    const q = (input.value || "").trim();
    if (!q) return;
    window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
  }

  // click search icon
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    goSearch();
  });

  // press Enter inside input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goSearch();
    }
  });
});

// ========================
// NAVBAR AUTH CONTROL
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  const loginNavLink = document.getElementById("loginNavLink");
  const accountNavLink = document.getElementById("accountNavLink");

  // Hide Login if logged in
  if (token && user) {
    if (loginNavLink) loginNavLink.style.display = "none";
  } else {
    if (loginNavLink) loginNavLink.style.display = "";
  }

  // Change My Account link based on role
  if (token && user && accountNavLink) {
    try {
      const parsedUser = JSON.parse(user);

      if (parsedUser.role === "admin") {
        accountNavLink.href = "admin/dashboard.html";
      } else {
        accountNavLink.href = "accounts.html";
      }
    } catch (err) {
      console.error("Navbar auth error:", err);
    }
  }
});

// ================= TOAST SYSTEM =================
(function () {
  function ensureToastContainer() {
    let container = document.getElementById("toastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function getToastIcon(type) {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  }

  function getToastTitle(type) {
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      default:
        return "Info";
    }
  }

  window.showToast = function (message, type = "info", duration = 3000) {
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    toast.innerHTML = `
      <div class="toast__icon">${getToastIcon(type)}</div>
      <div class="toast__content">
        <div class="toast__title">${getToastTitle(type)}</div>
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close">&times;</button>
    `;

    const removeToast = () => {
      toast.classList.add("toast--hide");
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector(".toast__close").onclick = removeToast;

    container.appendChild(toast);

    setTimeout(removeToast, duration);
  };
})();