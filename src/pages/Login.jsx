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
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      {/* LEFT SIDE (DESKTOP ONLY) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center text-white p-10">
        <div className="max-w-md text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold">
              S
            </div>

            <div>
              <h1 className="text-4xl font-bold">SHININGSUN</h1>

              <p className="text-white/80 text-lg">
                Sistem Absensi Guru Modern
              </p>
            </div>
          </div>

          <p className="text-white/60 text-sm">
            Aplikasi absensi digital untuk mempermudah pengelolaan kehadiran
            guru secara realtime.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* MOBILE HEADER */}
          <div className="text-center mb-8 md:hidden">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-white text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                S
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white">SHININGSUN</h1>

            <p className="text-white/80 text-sm mt-1">Sistem Absensi Guru</p>
          </div>

          {/* LOGIN CARD */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Login Guru
            </h2>

            <InstallPWA />

            {/* IDENTIFIER */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">Email / Nama</label>

              <input
                placeholder="Masukkan email atau nama"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            {/* BUTTON */}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold py-3 rounded-lg shadow-lg transition"
            >
              Login
            </button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-white/70 text-sm mt-6">
            © 2026 Shiningsun
          </p>
        </div>
      </div>
    </div>
  );
}
