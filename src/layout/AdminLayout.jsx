import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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
    <div className="min-h-screen bg-gray-100 flex">
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-[64px] flex items-center border-b px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg font-semibold">
              S
            </div>

            <div>
              <h2 className="font-bold text-blue-600">SHININGSUN</h2>
              <p className="text-xs text-gray-500">Super Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              navigate("/admin/dashboard");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded hover:bg-blue-50"
          >
            🏠 Dashboard
          </button>

          <button
            onClick={() => {
              navigate("/admin/users");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded hover:bg-blue-50"
          >
            👨‍🏫 Kelola Guru
          </button>

          <button
            onClick={() => {
              navigate("/admin/branches");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded hover:bg-blue-50"
          >
            🏫 Kelola Cabang
          </button>

          <button
            onClick={() => {
              navigate("/admin/attendance");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-3 rounded hover:bg-blue-50"
          >
            📊 Rekap Absensi
          </button>
        </nav>

        <div className="p-3 border-t mb-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500 w-full px-3 py-2 rounded hover:bg-red-50"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col w-full">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b h-[64px] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xl"
            >
              ☰
            </button>

            <div>
              <h1
                onClick={() => navigate("/admin/dashboard")}
                className="cursor-pointer font-semibold hover:text-blue-600"
              >
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 hidden md:block">{time}</p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative">
            {/* 🔥 NOTIF */}
            <div ref={notifRef} className="relative">
              <div
                onClick={async () => {
                  setShowNotif(!showNotif);
                  await loadNotif();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                🔔
              </div>

              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>

              {/* 🔥 POPUP */}
              {showNotif && (
                <div
                  className="
      fixed md:absolute
      top-[70px] md:top-auto
      left-0 md:left-auto
      right-0 md:right-0
      mx-3 md:mx-0
      w-auto md:w-80
      bg-white rounded-xl shadow-lg border z-50 overflow-hidden
    "
                >
                  <div className="p-3 border-b font-semibold text-sm">
                    Aktivitas Terbaru
                  </div>

                  {aktivitas.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">
                      Belum ada aktivitas
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {aktivitas.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 border-b hover:bg-gray-50 active:bg-gray-100 transition"
                        >
                          <p className="text-sm font-medium">
                            {item.nama || "Guru"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.waktu} • {item.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* USER */}
            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center">
              A
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
