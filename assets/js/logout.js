function logoutUser(e) {
  if (e) e.preventDefault();

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = window.location.origin + "/login-register.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutLinks = document.querySelectorAll(".logout-link");

  logoutLinks.forEach((link) => {
    link.addEventListener("click", logoutUser);
  });
});