import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiLock,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
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
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password;

      if (!cleanIdentifier || !cleanPassword) {
        alert("Silakan isi email/username dan password");
        return;
      }

      let email = cleanIdentifier;

      if (!cleanIdentifier.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("username", "==", cleanIdentifier),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          alert(`Username '${cleanIdentifier}' tidak ditemukan di database`);
          return;
        }

        const userData = snapshot.docs[0].data();
        if (!userData.email) {
          alert("Data email untuk username ini tidak ditemukan");
          return;
        }
        email = userData.email.trim();
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        cleanPassword,
      );

      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Data user tidak ditemukan di database Firestore");
        return;
      }

      const userData = userSnap.data();

      if (userData.aktif === false) {
        alert("Akun anda dinonaktifkan");
        return;
      }

      if (remember) {
        localStorage.setItem("rememberUser", cleanIdentifier);
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
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        alert("Password salah atau akun tidak cocok dengan Firebase Auth.");
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* AMBIENT BACKGROUND GLOW BLOBS */}

      <div className="absolute -top-28 -left-28 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-16">
        {/* LEFT BRAND HERO (DESKTOP) */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700 border border-indigo-200/60 shadow-sm w-fit mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Sistem Absensi Guru Modern
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-xl shadow-indigo-500/10 border border-slate-100 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                SHININGSUN
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Presensi & Kehadiran Digital
              </p>
            </div>
          </div>

          <p className="text-slate-600 text-base leading-relaxed max-w-lg">
            Aplikasi absensi digital berbasis PWA untuk mempermudah pengelolaan
            kehadiran guru secara real-time, akurat, dan terintegrasi.
          </p>

          {/* FEATURE HIGHLIGHT BADGES */}
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-lg">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FiClock className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700">Real-Time Sync</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiCheckCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700">Presensi Akurat</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FiSmartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700">Multi-Device PWA</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FiShield className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700">Aman & Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (LOGIN CARD) */}
        <div className="w-full max-w-md md:w-1/2">
          {/* MOBILE BRAND HEADER */}
          <div className="text-center mb-6 md:hidden">
            <div className="w-20 h-20 rounded-2xl bg-white p-3 shadow-lg shadow-indigo-500/10 border border-slate-100 flex items-center justify-center mx-auto mb-3">
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
              SHININGSUN
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Sistem Absensi Guru Modern
            </p>
          </div>

          {/* MODERN GLASS LOGIN CARD */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 shadow-2xl shadow-slate-900/10 rounded-3xl p-6 sm:p-8 transform transition duration-300">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Login Guru
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan kredensial Anda untuk masuk ke sistem
              </p>
            </div>

            <div className="mb-5">
              <InstallPWA />
            </div>

            {/* USERNAME / EMAIL INPUT */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiUser className="w-4 h-4" />
                </div>
                <input
                  placeholder="Masukkan email atau username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 accent-indigo-600 cursor-pointer"
                />
                <span>Simpan username</span>
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="button"
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all duration-200 text-sm tracking-wide"
            >
              Login ke Dashboard
            </button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-slate-400 text-xs mt-6">
            © 2026 Shiningsun • Presensi Guru Modern
          </p>
        </div>
      </div>
    </div>
  );
}

