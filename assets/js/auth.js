// ========================
// BASE URLS
// ========================
const ELVO_SERVER = window.ELVO_SERVER || "http://localhost:5000";
const ELVO_AUTH_API = `${ELVO_SERVER}/api/auth`;

// ========================
// SIGNUP
// ========================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("signupFirstName").value.trim();
    const lastName = document.getElementById("signupLastName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    try {
      const res = await fetch(`${ELVO_AUTH_API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Signup failed", "error");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Signup successful!", "success");

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "accounts.html";
        }
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      showToast("Something went wrong during signup", "error");
    }
  });
}

// ========================
// LOGIN
// ========================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await fetch(`${ELVO_AUTH_API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "Login failed", "error");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Login successful!", "success");

      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href =
            window.location.origin + "/admin/dashboard.html";
        } else {
          window.location.href = window.location.origin + "/accounts.html";
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      showToast("Something went wrong during login", "error");
    }
  });
}
