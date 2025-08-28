// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMZZ8P-tqwk1T0fIr7V7k5jgrprH4OMdE",
  authDomain: "daysofcode-c1307.firebaseapp.com",
  projectId: "daysofcode-c1307",
  storageBucket: "daysofcode-c1307.firebasestorage.app",
  messagingSenderId: "599346222271",
  appId: "1:599346222271:web:984ab0cc54458c7beaa20a",
  measurementId: "G-ZSLS3C4GMQ"
};

// Initialize (avoid re-init during hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only in browser (optional)
if (typeof window !== 'undefined') {
  try { getAnalytics(app); } catch (_) { /* analytics optional */ }
}

export default app;
