import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration from the console
const firebaseConfig = {
  apiKey: "AIzaSyBROE5uXMGhYb_v-_ZUwiqeEUVNNtgqRuE",
  authDomain: "py-lerner.firebaseapp.com",
  projectId: "py-lerner",
  storageBucket: "py-lerner.firebasestorage.app",
  messagingSenderId: "180531370291",
  appId: "1:180531370291:web:cc968dfc52ba3a80a04646",
  measurementId: "G-TNG6JWWQQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only if supported in browser)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };
