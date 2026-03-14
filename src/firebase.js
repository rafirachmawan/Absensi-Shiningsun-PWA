import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBxaNGe5_gPIbrg2Ywh2Z7Msef8Av6OL_U",
  authDomain: "absensi-shiningsun.firebaseapp.com",
  projectId: "absensi-shiningsun",
  storageBucket: "absensi-shiningsun.firebasestorage.app",
  messagingSenderId: "1084678579963",
  appId: "1:1084678579963:web:d7356bcff28ed33711b25e",
};

// APP UTAMA
const app = initializeApp(firebaseConfig);

// AUTH ADMIN (LOGIN DASHBOARD)
export const auth = getAuth(app);

// DATABASE
export const db = getFirestore(app);

// STORAGE
export const storage = getStorage(app);

// APP KEDUA (UNTUK MEMBUAT USER TANPA MENGGANTI LOGIN ADMIN)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");

// AUTH UNTUK CREATE USER
export const secondaryAuth = getAuth(secondaryApp);
