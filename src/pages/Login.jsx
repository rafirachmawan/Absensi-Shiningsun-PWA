import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiLock,
  FiArrowRight,
  FiAlertCircle,
  FiX,
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
  // Pesan error tampil inline di kartu form (pengganti alert bawaan browser)
  const [error, setError] = useState("");

  // Presentational only — tidak menyentuh logika auth
  const todayLong = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const saved = localStorage.getItem("rememberUser");
    const isAutoLogin = localStorage.getItem("autoLogin") === "true";

    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }

    if (isAutoLogin) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.aktif !== false) {
                if (userData.role === "superadmin") {
                  navigate("/admin/dashboard");
                } else {
                  navigate("/dashboard");
                }
              }
            }
          } catch (err) {
            console.error("Auto login check error:", err);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const cleanIdentifier = identifier.trim();
      const cleanPassword = password;

      if (!cleanIdentifier || !cleanPassword) {
        setError("Mohon lengkapi email/username dan password Anda.");
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
          setError(
            `Username '${cleanIdentifier}' tidak terdaftar. Periksa kembali atau hubungi admin.`,
          );
          return;
        }

        const userData = snapshot.docs[0].data();
        if (!userData.email) {
          setError(
            "Data email untuk username ini tidak tersedia. Silakan hubungi admin.",
          );
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
        setError("Data pengguna tidak ditemukan. Silakan hubungi admin.");
        return;
      }

      const userData = userSnap.data();

      if (userData.aktif === false) {
        setError("Akun Anda dinonaktifkan. Silakan hubungi admin.");
        return;
      }

      if (remember) {
        localStorage.setItem("rememberUser", cleanIdentifier);
        localStorage.setItem("autoLogin", "true");
      } else {
        localStorage.removeItem("rememberUser");
        localStorage.removeItem("autoLogin");
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
        setError(
          "Email/username atau password yang Anda masukkan salah. Silakan coba lagi.",
        );
      } else {
        setError("Terjadi kesalahan saat masuk. Silakan coba beberapa saat lagi.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#FAF6EF] font-sans text-stone-900 antialiased lg:grid lg:grid-cols-[1.02fr_1fr]">
      {/* ===== HEADER / PANEL KIRI ===== */}
      <aside className="relative overflow-hidden bg-stone-950 text-stone-300 rounded-b-[28px] lg:rounded-none">
        {/* aksen matahari — satu sumber cahaya, bukan blob acak */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-96px] h-80 w-80 rounded-full bg-amber-400/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative px-6 pb-16 pt-12 sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:px-12 lg:py-12">
          {/* MOBILE: brand tengah */}
          <div className="flex flex-col items-center px-2 text-center lg:hidden">
            <img
              src={logo}
              alt="Logo Shiningsun"
              className="h-[76px] w-[76px] rounded-[22px] bg-white object-contain p-2 shadow-xl shadow-black/40 ring-1 ring-white/20"
            />
            <p className="mt-4 text-[17px] font-extrabold tracking-[0.24em] text-white">
              SHININGSUN
            </p>
            <p className="mt-1.5 text-[13.5px] font-medium tracking-wide text-stone-400">
              Presensi &amp; Kehadiran Digital
            </p>
            <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-[7px] text-[12.5px] font-medium text-stone-200 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
              <span className="truncate">{todayLong}</span>
            </p>
          </div>

          {/* DESKTOP: brand kiri + cerita produk */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo Shiningsun"
                className="h-11 w-11 rounded-xl bg-white object-contain p-1"
              />
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-[0.16em] text-white">
                  SHININGSUN
                </p>
                <p className="text-xs text-stone-400">
                  Presensi &amp; Kehadiran Digital
                </p>
              </div>
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-stone-300">
                PWA • Offline-ready
              </span>
            </div>

            <h1 className="mt-14 max-w-md text-[40px] font-semibold leading-[1.08] tracking-tight text-white">
              Absen 30 detik,
              <br />
              rekap langsung beres.
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-stone-400">
              Dibuat untuk guru Shiningsun — catat masuk, pulang, dan izin
              tanpa buku tulis, tanpa rekap manual akhir bulan.
            </p>

            {/* kartu pratinjau — produk terlihat nyata, bukan spek abstrak */}
            <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Kehadiran hari ini
                </p>
                <p className="text-xs text-stone-500">Cabang Pusat</p>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-stone-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Masuk • 07.02
                  </span>
                  <span className="text-xs font-medium text-emerald-300">
                    Tepat waktu
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-stone-200">
                    <span className="h-2 w-2 rounded-full bg-stone-500" />
                    Pulang • 15.05
                  </span>
                  <span className="text-xs text-stone-400">Terjadwal</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>128 dari 140 guru sudah absen</span>
                  <span className="font-semibold text-white">91%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[91%] rounded-full bg-amber-400" />
                </div>
              </div>
            </div>

            <div className="mt-10 flex max-w-sm gap-8">
              {[
                ["12", "cabang"],
                ["140+", "guru"],
                ["Real-time", "sinkron"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-lg font-semibold text-white">{v}</p>
                  <p className="text-xs text-stone-500">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="hidden text-xs text-stone-600 lg:mt-auto lg:block lg:pt-12">
            &copy; 2026 Shiningsun
          </p>
        </div>
      </aside>

      {/* ===== FORM ===== */}
      <main className="relative z-10 min-w-0 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8 -mt-10 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:px-12 lg:py-12">
        <div className="mx-auto w-full min-w-0 max-w-[430px]">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-[0_12px_40px_rgba(28,25,23,0.08)] sm:p-8">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/70">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Presensi hari ini
            </p>
            <h2 className="mt-3 text-[22px] font-semibold tracking-tight">
              Selamat datang kembali
            </h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-stone-500">
              Masuk untuk mencatat kehadiran.
            </p>

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
                >
                  <FiAlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
                  <p className="flex-1 min-w-0 break-words text-sm leading-relaxed text-red-800">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    aria-label="Tutup pesan error"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-red-400 hover:bg-red-100 hover:text-red-700"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Email atau username
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <FiUser className="h-[18px] w-[18px]" />
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    autoComplete="username"
                    placeholder="cth: admin@shiningsun.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError("");
                    }}
                    className="h-[52px] w-full rounded-xl border border-stone-200 bg-white pl-11 pr-3 text-[16px] text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:text-[15px]"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-stone-700"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <FiLock className="h-[18px] w-[18px]" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="h-[52px] w-full rounded-xl border border-stone-200 bg-white pl-11 pr-12 text-[16px] text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                  </button>
                </div>
              </div>

              <label className="flex w-fit cursor-pointer select-none items-center gap-2 py-2 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-[18px] w-[18px] rounded border-stone-300 accent-stone-900"
                />
                Ingat saya di perangkat ini
              </label>

              <button
                type="submit"
                className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-[15px] font-semibold text-white transition-colors hover:bg-stone-800 active:bg-stone-950"
              >
                Masuk ke Dashboard
                <FiArrowRight size={18} />
              </button>
            </form>

            <div className="my-5 h-px bg-stone-100" />

            <InstallPWA />

            <p className="mt-4 text-center text-[13px] leading-relaxed text-stone-500">
              Kendala masuk? Hubungi admin cabang masing-masing.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            &copy; 2026 Shiningsun • Absensi Guru
          </p>
        </div>
      </main>
    </div>
  );
}
