import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Absen from "./pages/Absen";

import AdminLayout from "./layout/AdminLayout";

import AdminDashboard from "./pages/AdminDashboard";
import KelolaGuru from "./pages/KelolaGuru";
import KelolaCabang from "./pages/KelolaCabang";
import PengaturanJam from "./pages/PengaturanJam";
import RekapAbsensi from "./pages/RekapAbsensi";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= USER ================= */}

        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* HALAMAN ABSEN (GPS + RADIUS) */}
        <Route path="/absen" element={<Absen />} />

        {/* ================= ADMIN ================= */}

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="users" element={<KelolaGuru />} />

          <Route path="branches" element={<KelolaCabang />} />

          <Route path="settings" element={<PengaturanJam />} />

          <Route path="attendance" element={<RekapAbsensi />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
