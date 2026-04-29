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
  linkWithCredential,
  signOut,
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
let pendingCredential = null; // saved when account-exists conflict is detected

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
  if (submitBtn)  submitBtn.value  = signUp ? "Sign Up" : "Login";
  if (modeLabel)  modeLabel.textContent  = signUp ? "Sign Up" : "Login";
  if (signupLink) signupLink.textContent = signUp ? "Already registered? Login" : "Not registered? Sign Up";
  clearError();
}

async function handleAuthError(err) {
  if (err.code === "auth/account-exists-with-different-credential") {
    // Save the credential the user just tried (e.g. Facebook)
    pendingCredential =
      FacebookAuthProvider.credentialFromError(err) ||
      GoogleAuthProvider.credentialFromError(err);

    // Work out which provider they originally signed up with by checking the email domain.
    // Firebase won't tell us directly (fetchSignInMethodsForEmail is deprecated), so we
    // ask them to sign in with the other provider to prove ownership, then link.
    const isFacebookPending = pendingCredential?.providerId === "facebook.com";
    const providerName = isFacebookPending ? "Google" : "Facebook";

    showError(
      `This email is already linked to ${providerName}. ` +
      `Click the ${providerName} button to sign in and automatically connect both accounts.`
    );
    return;
  }

  const messages = {
    "auth/user-not-found":       "No account found with that email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing.",
  };
  showError(messages[err.code] || "Something went wrong. Please try again.");
}

// After a successful sign-in, link the pending credential if one was saved
async function linkPendingCredential(user) {
  if (!pendingCredential) return;
  try {
    await linkWithCredential(user, pendingCredential);
  } catch (_) {
    // Already linked or incompatible — safe to ignore
  } finally {
    pendingCredential = null;
  }
}

// ── 6. GOOGLE SIGN-IN ────────────────────────────────────────
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    clearError();
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await linkPendingCredential(result.user);
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
      const result = await signInWithPopup(auth, new FacebookAuthProvider());
      await linkPendingCredential(result.user);
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

    console.log('Sign-Up Btn Clicked!!!')

    const email    = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    console.log('isSignUpMode::', isSignUpMode)

    try {
      let result;
      if (isSignUpMode) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } 
      else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await linkPendingCredential(result.user);
      window.location.href = REDIRECT_AFTER_LOGIN;
    } 
    catch (err) {
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

// ── 10. LOGOUT ───────────────────────────────────────────────
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "/login";
  });
}

// ── 11. REDIRECT ALREADY-LOGGED-IN USERS ────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    // window.location.href = REDIRECT_AFTER_LOGIN;
    console.log('Logged In!!')
  }
  console.log('user::', user)
  console.log('email::', user?.email)
  // console.log('user.providerData::', user?.providerData)
  // console.log('user.providerData[0]', user?.providerData[0])
  // for (let [x,y] of Object.entries(user)) {
  //   y = JSON.stringify(y)
  //   console.log(`${x}: ${y}`)
  // }
});

