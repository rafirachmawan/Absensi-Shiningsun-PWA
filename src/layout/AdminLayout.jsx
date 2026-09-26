import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import logo from "../assets/logo.png";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import {
  FiMenu,
  FiBell,
  FiGrid,
  FiUsers,
  FiMapPin,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiCheckCircle,
  FiX,
  FiShield,
} from "react-icons/fi";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState("");

  // 🔥 NOTIF STATE
  const [showNotif, setShowNotif] = useState(false);
  const [aktivitas, setAktivitas] = useState([]);

  const notifRef = useRef();

  // Dynamic header title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/admin/users":
        return "Kelola Guru";
      case "/admin/branches":
        return "Kelola Cabang";
      case "/admin/attendance":
        return "Rekap Absensi";
      case "/admin/settings":
        return "Pengaturan Jam";
      default:
        return "Dashboard";
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const timeString = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const dateString = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setTime(`${dateString} • ${timeString}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 LOAD NOTIF DATA
  const loadNotif = async () => {
    const q = query(
      collection(db, "attendance"),
      orderBy("createdAt", "desc"),
      limit(5),
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setAktivitas(data);
  };

  // 🔥 CLICK OUTSIDE CLOSE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("autoLogin");
    await signOut(auth);
    navigate("/");
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
    { path: "/admin/users", label: "Kelola Guru", icon: FiUsers },
    { path: "/admin/branches", label: "Kelola Cabang", icon: FiMapPin },
    { path: "/admin/attendance", label: "Rekap Absensi", icon: FiBarChart2 },
    { path: "/admin/settings", label: "Pengaturan Jam", icon: FiSettings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 selection:bg-slate-900 selection:text-white">
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 max-w-[85vw] bg-white border-r border-slate-200 shadow-xl shadow-slate-900/5 transform transition-transform duration-300 flex flex-col justify-between
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* SIDEBAR HEADER */}
          <div className="flex h-[68px] items-center justify-between border-b border-slate-100 bg-white px-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <img
                src={logo}
                alt="Logo Shiningsun"
                className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
              />

              <div className="min-w-0 leading-tight">
                <h2 className="truncate text-[13px] font-extrabold tracking-[0.08em] text-slate-900">
                  SHININGSUN
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <FiShield className="h-3 w-3 text-amber-500" /> Admin Panel
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:hidden"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex-1 overflow-y-auto p-3">
            <p className="px-3.5 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Menu Utama
            </p>
            <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-slate-900 font-semibold text-white shadow-sm"
                      : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
            </div>
          </nav>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
          >
            <FiLogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
          <p className="mt-2.5 text-center text-[10px] text-slate-400">
            &copy; 2026 Shiningsun
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col w-full min-w-0 max-w-full overflow-x-clip">
        {/* HEADER NAVBAR */}
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:gap-3 sm:px-6">
          {/* LEFT NAVBAR: Sidebar Toggle & Breadcrumbs */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Buka menu"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              title="Menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>

            <div className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block" />

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="hidden shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 min-[420px]:inline-block">
                Super Admin
              </span>
              <span className="hidden shrink-0 text-sm font-light text-slate-300 min-[420px]:inline">
                /
              </span>
              <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-slate-900 sm:text-base">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* RIGHT NAVBAR: Clock Pill & Notification Bell */}
          <div className="flex shrink-0 items-center gap-2">
            {/* REAL-TIME CLOCK PILL */}
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold tabular-nums text-slate-600 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{time}</span>
            </div>

            {/* NOTIF BUTTON */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={async () => {
                  setShowNotif(!showNotif);
                  await loadNotif();
                }}
                aria-label="Notifikasi aktivitas"
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                title="Notifikasi Aktivitas"
              >
                <FiBell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
              </button>

              {/* NOTIF POPUP */}
              {showNotif && (
                <div
                  className="
                    fixed md:absolute
                    top-[74px] md:top-auto
                    left-4 md:left-auto
                    right-4 md:right-0
                    w-auto md:w-80
                    overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50
                  "
                >
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">
                      Aktivitas Terbaru
                    </p>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white">
                      {aktivitas.length}
                    </span>
                  </div>

                  {aktivitas.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <FiBell className="h-5 w-5" />
                      </span>
                      <p className="text-xs text-slate-500">
                        Belum ada aktivitas absensi
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                      {aktivitas.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {item.nama?.charAt(0) || "G"}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-800">
                                {item.nama || "Guru"}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                                {item.waktu}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.status === "Tepat Waktu"
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </header>

        <main className="w-full min-w-0 max-w-full flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


