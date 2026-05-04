// ============================================================
// FIREBASE PASSWORD RESET HANDLER FOR WEBFLOW
// Add these element IDs in Webflow Designer:
//
//   reset-password-new      → New password input
//   reset-password-confirm  → Confirm new password input
//   reset-submit            → Submit button
//   reset-error             → Text element for error messages
//   reset-success           → Text element for success message
//   reset-form-wrap         → The form/wrapper (hidden on success)
//   reset-invalid-wrap      → Shown when link is expired/invalid
// ============================================================

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── YOUR FIREBASE CONFIG ────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBQPqbtlfHPLpB-JYbyxDZiugu4NqwpSeM",
  authDomain: "askkhonsu-map.firebaseapp.com",
  projectId: "askkhonsu-map",
  storageBucket: "askkhonsu-map.appspot.com",
  messagingSenderId: "266031876218",
  appId: "1:266031876218:web:ec93411f1c13d9731e93c3",
  measurementId: "G-Z7F4NJ4PHW"
};

// ── WHERE TO SEND USER AFTER SUCCESSFUL RESET ───────────────
const REDIRECT_AFTER_RESET = "/login";

// ── INIT ────────────────────────────────────────────────────
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── READ URL PARAMS ─────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const mode    = params.get("mode");
const oobCode = params.get("oobCode");

// ── ELEMENTS ────────────────────────────────────────────────
const newPasswordEl     = document.getElementById("reset-password-new");
const confirmPasswordEl = document.getElementById("reset-password-confirm");
const submitBtn         = document.getElementById("reset-submit");
const errorEl           = document.getElementById("reset-error");
const successEl         = document.getElementById("reset-success");
const formWrap          = document.getElementById("reset-form-wrap");
const invalidWrap       = document.getElementById("reset-invalid-wrap");

function showError(msg) {
  if (errorEl) { errorEl.textContent = msg; errorEl.style.display = "block"; }
}
function clearError() {
  if (errorEl) { errorEl.textContent = ""; errorEl.style.display = "none"; }
}

// ── VALIDATE THE LINK ON PAGE LOAD ──────────────────────────
async function init() {
  // If it's not a password reset link, or there's no code, show invalid state
  if (mode !== "resetPassword" || !oobCode) {
    showInvalid();
    return;
  }

  try {
    await verifyPasswordResetCode(auth, oobCode);
    // Code is valid — form is already visible, nothing else to do
  } catch {
    showInvalid();
  }
}

function showInvalid() {
  if (formWrap)    formWrap.style.display    = "none";
  if (invalidWrap) invalidWrap.style.display = "block";
}

// ── SUBMIT ───────────────────────────────────────────────────
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    clearError();

    const newPassword     = newPasswordEl?.value?.trim();
    const confirmPassword = confirmPasswordEl?.value?.trim();

    if (!newPassword || !confirmPassword) {
      showError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    submitBtn.disabled = true;

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      if (formWrap)   formWrap.style.display   = "none";
      if (successEl)  successEl.style.display  = "block";

      setTimeout(() => { window.location.href = REDIRECT_AFTER_RESET; }, 3000);
    } catch (err) {
      submitBtn.disabled = false;

      if (err.code === "auth/expired-action-code") {
        showError("This reset link has expired. Please request a new one.");
      } else if (err.code === "auth/invalid-action-code") {
        showError("This reset link is invalid or has already been used.");
      } else if (err.code === "auth/weak-password") {
        showError("Password is too weak. Use at least 6 characters.");
      } else {
        showError("Something went wrong. Please try again.");
      }
    }
  });
}

init();
