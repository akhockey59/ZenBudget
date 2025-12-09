import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL-Bux7MrGHi40a30Lb2bdqYbxphwP0dc",
  authDomain: "expense-dd1f9.firebaseapp.com",
  projectId: "expense-dd1f9",
  storageBucket: "expense-dd1f9.firebasestorage.app",
  messagingSenderId: "925781362108",
  appId: "1:925781362108:web:baf3f2b33c79c37d6917b9",
  measurementId: "G-2WYWY6248M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const googleProvider = new GoogleAuthProvider();
export default app;