import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  FiUserPlus,
  FiMapPin,
  FiFileText,
  FiUsers,
  FiUserX,
  FiClock,
  FiArrowUpRight,
  FiCalendar,
} from "react-icons/fi";

export default function AdminDashboard() {
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [nonaktif, setNonaktif] = useState(0);
  const [aktivitas, setAktivitas] = useState([]);

  const navigate = useNavigate();

  const loadData = async () => {
    const guruSnap = await getDocs(collection(db, "users"));
    const cabangSnap = await getDocs(collection(db, "branches"));

    const guruData = guruSnap.docs.map((doc) => doc.data());

    const onlyGuru = guruData.filter(
      (u) => (u.role || "").toLowerCase().trim() === "guru",
    );

    setTotalGuru(onlyGuru.length);
    setTotalCabang(cabangSnap.size);

    let nonaktifCount = 0;
    onlyGuru.forEach((u) => {
      if (u.aktif === false) nonaktifCount++;
    });

    setNonaktif(nonaktifCount);

    const q = query(
      collection(db, "attendance"),
      orderBy("createdAt", "desc"),
      limit(5),
    );

    const absensiSnap = await getDocs(q);

    const data = absensiSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setAktivitas(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formattedDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚀</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Dashboard Super Admin
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Monitoring sistem absensi & kelola data guru secara real-time
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700 w-fit shadow-sm">
          <FiCalendar className="w-4 h-4 text-indigo-600" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="group relative bg-white hover:bg-indigo-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <FiUserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Tambah Guru
              </p>
              <p className="text-xs text-slate-500">Registrasi akun baru</p>
            </div>
          </div>
          <FiArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/branches")}
          className="group relative bg-white hover:bg-purple-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
              <FiMapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                Tambah Cabang
              </p>
              <p className="text-xs text-slate-500">Lokasi unit presensi</p>
            </div>
          </div>
          <FiArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/attendance")}
          className="group relative bg-white hover:bg-emerald-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                Lihat Laporan
              </p>
              <p className="text-xs text-slate-500">Rekapitulasi absensi</p>
            </div>
          </div>
          <FiArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TOTAL GURU */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Guru
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalGuru}
            </h2>
            <span className="inline-block mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Guru Terdaftar
            </span>
          </div>
          <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shadow-inner">
            <FiUsers className="w-6 h-6" />
          </div>
        </div>

        {/* TOTAL CABANG */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Cabang
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalCabang}
            </h2>
            <span className="inline-block mt-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Lokasi Presensi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60 shadow-inner">
            <FiMapPin className="w-6 h-6" />
          </div>
        </div>

        {/* GURU NONAKTIF */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Guru Nonaktif
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {nonaktif}
            </h2>
            <span className="inline-block mt-2 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
              Akun Nonaktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/60 shadow-inner">
            <FiUserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* AKTIVITAS TABLE / CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Aktivitas Absensi Terbaru
              </h3>
              <p className="text-xs text-slate-400">Log kehadiran paling akhir</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
            5 Terakhir
          </span>
        </div>

        {aktivitas.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Belum ada aktivitas absensi tercatat
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-indigo-50/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 font-bold border border-indigo-100/80 flex items-center justify-center text-base shadow-sm">
                    {item.nama?.charAt(0) || "G"}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {item.nama || "Guru"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    {item.waktu}
                  </span>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs ${
                      item.status === "Tepat Waktu"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : item.status === "Lebih Awal"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                          : "bg-rose-50 text-rose-700 border border-rose-200/80"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.status === "Tepat Waktu"
                          ? "bg-emerald-500"
                          : item.status === "Lebih Awal"
                            ? "bg-blue-500"
                            : "bg-rose-500"
                      }`}
                    />
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

