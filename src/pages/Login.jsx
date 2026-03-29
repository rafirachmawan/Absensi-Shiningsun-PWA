import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../assets/logo.png";

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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rememberUser");
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      let email = identifier;

      if (!identifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("username", "==", identifier),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          alert("Username tidak ditemukan");
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

      if (remember) {
        localStorage.setItem("rememberUser", identifier);
      } else {
        localStorage.removeItem("rememberUser");
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* LEFT SIDE */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center p-10">
        <div className="max-w-xl text-center md:text-left">
          <div className="flex items-center gap-5 mb-8">
            <img src={logo} alt="logo" className="w-24 h-24 object-contain" />

            <div>
              <h1 className="text-5xl font-bold text-gray-800">SHININGSUN</h1>

              <p className="text-gray-500 text-lg mt-2">
                Sistem Absensi Guru Modern
              </p>
            </div>
          </div>

          <p className="text-gray-500 text-base leading-relaxed ml-[96px]">
            Aplikasi absensi digital untuk mempermudah pengelolaan kehadiran
            guru secara realtime.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* MOBILE HEADER */}
          <div className="text-center mb-6 md:hidden">
            <img
              src={logo}
              alt="logo"
              className="w-28 h-28 object-contain mx-auto"
            />

            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              SHININGSUN
            </h1>

            <p className="text-gray-500 text-sm">Sistem Absensi Guru</p>
          </div>

          {/* LOGIN CARD */}
          <div className="bg-white rounded-2xl shadow-lg p-7 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-5 text-center">
              Login Guru
            </h2>

            <div className="mb-4">
              <InstallPWA />
            </div>

            {/* USERNAME */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">Email / Username</label>

              <input
                placeholder="Masukkan email atau username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label className="text-sm text-gray-600">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            <div className="flex items-center mb-5">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mr-2 accent-indigo-600"
              />

              <span className="text-sm text-gray-600">Simpan username</span>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md transition"
            >
              Login
            </button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-gray-400 text-sm mt-6">
            © 2026 Shiningsun
          </p>
        </div>
      </div>
    </div>
  );
}
