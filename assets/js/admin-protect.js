const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
  showToast("Please login first", "warning");
  setTimeout(() => {
    window.location.href = "../login-register.html";
  }, 1000);
}

if (user.role !== "admin") {
  showToast("Access denied. Admin only.", "error");
  setTimeout(() => {
    window.location.href = "../login-register.html";
  }, 1000);
}
