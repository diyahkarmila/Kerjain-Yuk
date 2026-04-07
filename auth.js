import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  applyActionCode
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

function getBasePath() {
  const path = window.location.pathname;
  const fileName = path.split("/").pop();
  return fileName ? path.slice(0, -fileName.length) : path;
}

function buildAppUrl(fileName) {
  return `${window.location.origin}${getBasePath()}${fileName}`;
}

function setButtonLoading(button, isLoading, loadingText, normalText) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : normalText;
}

function saveFlashMessage(message, type = "success") {
  sessionStorage.setItem("flashMessage", JSON.stringify({ message, type }));
}

function consumeFlashMessage() {
  const raw = sessionStorage.getItem("flashMessage");
  if (!raw) return;

  sessionStorage.removeItem("flashMessage");

  try {
    const data = JSON.parse(raw);
    showMessage(data.message, data.type);
  } catch {
    // abaikan data rusak
  }
}

function showMessage(message, type = "danger") {
  const oldAlert = document.getElementById("alertBox");
  if (oldAlert) oldAlert.remove();

  const alertBox = document.createElement("div");
  alertBox.id = "alertBox";
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;

  const formContainer = document.querySelector(".auth-form") || document.querySelector(".page-message") || document.body;
  formContainer.prepend(alertBox);
}

async function sendVerification(user) {
  return sendEmailVerification(user, {
    url: buildAppUrl("login.html"),
    handleCodeInApp: false
  });
}

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const oobCode = params.get("oobCode");

if (mode === "verifyEmail" && oobCode) {
  applyActionCode(auth, oobCode)
    .then(() => {
      showMessage("Email berhasil diverifikasi. Silakan login.", "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    })
    .catch(() => {
      showMessage("Link verifikasi tidak valid, kedaluwarsa, atau sudah pernah digunakan.");
    });
}

window.register = async function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const registerBtn = document.getElementById("registerBtn");

  if (!email || !password) {
    return showMessage("Email dan password harus diisi.");
  }

  if (password.length < 6) {
    return showMessage("Password minimal 6 karakter.");
  }

  try {
    setButtonLoading(registerBtn, true, "Sedang register...", "Register");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendVerification(userCredential.user);
    await signOut(auth);

    saveFlashMessage("Register berhasil. Cek email kamu lalu verifikasi akun sebelum login.", "success");
    window.location.href = "login.html";
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showMessage("Email sudah digunakan.");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Format email tidak valid.");
    } else if (error.code === "auth/weak-password") {
      showMessage("Password terlalu lemah.");
    } else if (error.code === "auth/operation-not-allowed") {
      showMessage("Login Email/Password belum diaktifkan di Firebase Authentication.");
    } else if (error.code === "auth/unauthorized-continue-uri") {
      showMessage("Domain website ini belum diizinkan di Firebase Authentication > Authorized domains.");
    } else {
      showMessage("Terjadi kesalahan: " + error.message);
    }
  } finally {
    setButtonLoading(registerBtn, false, "Sedang register...", "Register");
  }
};

window.login = async function () {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const loginBtn = document.getElementById("loginBtn");

  if (!email || !password) {
    return showMessage("Email dan password harus diisi.");
  }

  try {
    setButtonLoading(loginBtn, true, "Sedang login...", "Login");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await reload(userCredential.user);

    if (!userCredential.user.emailVerified) {
      try {
        await sendVerification(userCredential.user);
        await signOut(auth);
        return showMessage("Email belum diverifikasi. Link verifikasi baru sudah dikirim ke email kamu.", "warning");
      } catch (verificationError) {
        await signOut(auth);

        if (verificationError.code === "auth/too-many-requests") {
          return showMessage("Email belum diverifikasi. Tunggu beberapa saat sebelum meminta link verifikasi lagi.", "warning");
        }

        return showMessage("Email belum diverifikasi. Periksa inbox atau spam lalu coba lagi.", "warning");
      }
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      showMessage("Akun tidak ditemukan.");
    } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      showMessage("Email atau password salah.");
    } else if (error.code === "auth/invalid-email") {
      showMessage("Format email tidak valid.");
    } else if (error.code === "auth/too-many-requests") {
      showMessage("Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.");
    } else if (error.code === "auth/network-request-failed") {
      showMessage("Gagal terhubung ke server. Periksa koneksi internet kamu.");
    } else if (error.code === "auth/operation-not-allowed") {
      showMessage("Login Email/Password belum diaktifkan di Firebase Authentication.");
    } else {
      showMessage("Terjadi kesalahan: " + error.message);
    }
  } finally {
    setButtonLoading(loginBtn, false, "Sedang login...", "Login");
  }
};

window.logout = async function () {
  const logoutBtn = document.getElementById("logoutBtn");

  try {
    setButtonLoading(logoutBtn, true, "Sedang logout...", "Logout");
    await signOut(auth);
    saveFlashMessage("Berhasil logout.", "success");
    window.location.href = "login.html";
  } catch (error) {
    alert("Logout gagal: " + error.message);
  } finally {
    setButtonLoading(logoutBtn, false, "Sedang logout...", "Logout");
  }
};

const currentPage = window.location.pathname.split("/").pop() || "index.html";

onAuthStateChanged(auth, async (user) => {
  if (currentPage === "login.html" || currentPage === "register.html") {
    consumeFlashMessage();
  }

  if (currentPage === "dashboard.html") {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (!user.emailVerified) {
      await signOut(auth);
      saveFlashMessage("Silakan verifikasi email sebelum masuk ke dashboard.", "warning");
      window.location.href = "login.html";
      return;
    }

    const userEmailLabel = document.getElementById("userEmail");
    if (userEmailLabel) {
      userEmailLabel.textContent = user.email || "Pengguna";
    }
  }

  if ((currentPage === "login.html" || currentPage === "register.html") && user && user.emailVerified) {
    window.location.href = "dashboard.html";
  }
});

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.login();
  });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.register();
  });
}
