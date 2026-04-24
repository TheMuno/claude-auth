// ============================================================
// FIREBASE AUTH FOR WEBFLOW
// Add element IDs in Webflow Designer > Element Settings panel:
//
//   google-btn       → Google button
//   facebook-btn     → Facebook button
//   login-email      → Email input
//   login-password   → Password input
//   login-submit     → Login / Sign Up submit button
//   signup-link      → "Not registered? Sign Up" link/text
//   auth-error       → A text element to show error messages
//   auth-mode-label  → (optional) element that shows "Login" or "Sign Up"
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── 1. YOUR FIREBASE CONFIG ─────────────────────────────────
// Replace these values with your project's config from:
// Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
    apiKey: "AIzaSyBQPqbtlfHPLpB-JYbyxDZiugu4NqwpSeM",
    authDomain: "askkhonsu-map.firebaseapp.com",
    projectId: "askkhonsu-map",
    storageBucket: "askkhonsu-map.appspot.com",
    messagingSenderId: "266031876218",
    appId: "1:266031876218:web:ec93411f1c13d9731e93c3",
    measurementId: "G-Z7F4NJ4PHW"
};

// ── 2. WHERE TO SEND THE USER AFTER LOGIN ───────────────────
const REDIRECT_AFTER_LOGIN = "/"; // change to your post-login page

// ── 3. INIT ─────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── 4. ELEMENT REFS ─────────────────────────────────────────
const googleBtn     = document.getElementById("google-btn");
const facebookBtn   = document.getElementById("facebook-btn");
const emailInput    = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn     = document.getElementById("login-submit");
const signupLink    = document.getElementById("signup-link");
const errorEl       = document.getElementById("auth-error");
const modeLabel     = document.getElementById("auth-mode-label");

let isSignUpMode = false;

// ── 5. HELPERS ───────────────────────────────────────────────
function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.style.display = "block";
}

function clearError() {
  if (!errorEl) return;
  errorEl.textContent = "";
  errorEl.style.display = "none";
}

function setMode(signUp) {
  isSignUpMode = signUp;
  if (submitBtn)  submitBtn.textContent  = signUp ? "Sign Up" : "Login";
  if (modeLabel)  modeLabel.textContent  = signUp ? "Sign Up" : "Login";
  if (signupLink) signupLink.textContent = signUp ? "Already registered? Login" : "Not registered? Sign Up";
  clearError();
}

function handleAuthError(err) {
  const messages = {
    "auth/user-not-found":       "No account found with that email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
    "auth/account-exists-with-different-credential":
      "An account already exists with a different sign-in method for this email.",
  };
  showError(messages[err.code] || "Something went wrong. Please try again.");
}

// ── 6. GOOGLE SIGN-IN ────────────────────────────────────────
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    clearError();
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.href = REDIRECT_AFTER_LOGIN;
    } catch (err) {
      handleAuthError(err);
    }
  });
}

// ── 7. FACEBOOK SIGN-IN ──────────────────────────────────────
if (facebookBtn) {
  facebookBtn.addEventListener("click", async () => {
    clearError();
    try {
      await signInWithPopup(auth, new FacebookAuthProvider());
      window.location.href = REDIRECT_AFTER_LOGIN;
    } catch (err) {
      handleAuthError(err);
    }
  });
}

// ── 8. EMAIL / PASSWORD ──────────────────────────────────────
if (submitBtn) {
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    clearError();

    const email    = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      window.location.href = REDIRECT_AFTER_LOGIN;
    } catch (err) {
      handleAuthError(err);
    }
  });
}

// ── 9. TOGGLE LOGIN ↔ SIGN UP ────────────────────────────────
if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    setMode(!isSignUpMode);
  });
}

// ── 10. REDIRECT ALREADY-LOGGED-IN USERS ────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = REDIRECT_AFTER_LOGIN;
  }
});
