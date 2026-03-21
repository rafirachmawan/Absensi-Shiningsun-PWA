import { useNavigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState("");

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
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* LOGO */}
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

        {/* MENU */}
        <nav className="p-3 space-y-1">
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

        {/* LOGOUT */}
        <div className="absolute bottom-0 w-full p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col w-full">
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-[64px] flex items-center justify-between px-6">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xl text-gray-600 hover:text-gray-900"
            >
              ☰
            </button>

            <div>
              <h1 className="text-sm md:text-base font-semibold text-gray-800">
                Dashboard
              </h1>
              <p className="text-xs text-gray-500 hidden md:block">{time}</p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            {/* NOTIF */}
            <div className="relative cursor-pointer">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                🔔
              </div>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>

            {/* USER */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                A
              </div>
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
