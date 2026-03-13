import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import InstallPWA from "../components/InstallPWA";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      let email = identifier;

      // Jika bukan email → cari berdasarkan nama
      if (!identifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("nama", "==", identifier),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          alert("Nama tidak ditemukan");
          return;
        }

        const userData = snapshot.docs[0].data();
        email = userData.email;
      }

      // Login Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Data user tidak ditemukan");
        return;
      }

      const userData = userSnap.data();

      if (userData.aktif === false) {
        alert("Akun anda dinonaktifkan");
        return;
      }

      if (userData.role === "superadmin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-xl font-bold text-xl shadow">
              S
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">SHININGSUN</h1>

          <p className="text-gray-500 text-sm mt-1">Sistem Absensi Guru</p>

          <InstallPWA />
        </div>

        {/* LOGIN CARD */}

        <div className="bg-white rounded-2xl shadow-md p-7">
          <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">
            Login Guru
          </h2>

          {/* EMAIL / NAMA */}

          <div className="mb-4">
            <label className="text-sm text-gray-600">Email / Nama</label>

            <input
              placeholder="Masukkan email atau nama"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* PASSWORD */}

          <div className="mb-6">
            <label className="text-sm text-gray-600">Password</label>

            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* BUTTON */}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
          >
            Login
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          © 2026 Shiningsun
        </p>
      </div>
    </div>
  );
}
