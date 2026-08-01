import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import {
  FiMenu,
  FiBell,
  FiClock,
  FiGrid,
  FiUsers,
  FiMapPin,
  FiBarChart2,
  FiLogOut,
  FiCheckCircle,
  FiX,
  FiShield,
} from "react-icons/fi";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState("");

  // 🔥 NOTIF STATE
  const [showNotif, setShowNotif] = useState(false);
  const [aktivitas, setAktivitas] = useState([]);

  const notifRef = useRef();

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
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-slate-50 to-slate-50 flex font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 shadow-2xl shadow-slate-900/10 transform transition-transform duration-300 flex flex-col justify-between
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          {/* SIDEBAR HEADER */}
          <div className="h-[70px] flex items-center justify-between border-b border-slate-100 px-5 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-extrabold text-lg shadow-md shadow-indigo-500/25">
                S
              </div>

              <div>
                <h2 className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                  SHININGSUN
                </h2>
                <p className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
                  <FiShield className="w-3 h-3" /> Admin Panel
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-3.5 space-y-1.5">
            <button
              onClick={() => {
                navigate("/admin/dashboard");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
            >
              <FiGrid className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/users");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
            >
              <FiUsers className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Kelola Guru</span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/branches");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
            >
              <FiMapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Kelola Cabang</span>
            </button>

            <button
              onClick={() => {
                navigate("/admin/attendance");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
            >
              <FiBarChart2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              <span>Rekap Absensi</span>
            </button>
          </nav>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="p-3.5 border-t border-slate-100 mb-2 bg-slate-50/30">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 text-rose-600 font-bold text-sm w-full px-4 py-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100 transition-all duration-200 shadow-2xs"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* HEADER NAVBAR */}
        <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/80 h-[70px] flex items-center justify-between px-4 sm:px-8 shadow-sm">
          {/* LEFT NAVBAR */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-all duration-200 shadow-2xs group"
              title="Buka Sidebar"
            >
              <FiMenu className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/80">
                  Super Admin
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <h1
                  onClick={() => navigate("/admin/dashboard")}
                  className="cursor-pointer font-extrabold text-slate-800 text-base sm:text-lg hover:text-indigo-600 transition-colors tracking-tight"
                >
                  Dashboard
                </h1>
              </div>
              <p className="text-xs font-medium text-slate-400 hidden sm:flex items-center gap-1.5 mt-0.5">
                <FiClock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{time}</span>
              </p>
            </div>
          </div>

          {/* RIGHT NAVBAR */}
          <div className="flex items-center gap-3.5">
            {/* NOTIF BUTTON */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={async () => {
                  setShowNotif(!showNotif);
                  await loadNotif();
                }}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-all duration-200 shadow-2xs group"
                title="Notifikasi"
              >
                <FiBell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
              </button>

              {/* NOTIF POPUP */}
              {showNotif && (
                <div
                  className="
                    fixed md:absolute
                    top-[74px] md:top-auto
                    left-4 md:left-auto
                    right-4 md:right-0
                    w-auto md:w-84
                    bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden
                  "
                >
                  <div className="p-3.5 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider bg-slate-50/80 flex items-center justify-between">
                    <span>Aktivitas Terbaru</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                      Real-time
                    </span>
                  </div>

                  {aktivitas.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">
                      Belum ada aktivitas absensi
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {aktivitas.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 hover:bg-indigo-50/40 active:bg-indigo-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                              {item.nama?.charAt(0) || "G"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {item.nama || "Guru"}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.waktu}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              item.status === "Tepat Waktu"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-rose-50 text-rose-600 border border-rose-200"
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

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


