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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
