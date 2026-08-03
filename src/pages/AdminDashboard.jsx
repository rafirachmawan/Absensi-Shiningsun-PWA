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
  FiX,
  FiSearch,
  FiExternalLink,
  FiChevronRight,
} from "react-icons/fi";

export default function AdminDashboard() {
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [nonaktif, setNonaktif] = useState(0);
  const [aktivitas, setAktivitas] = useState([]);

  const [guruList, setGuruList] = useState([]);
  const [cabangList, setCabangList] = useState([]);
  const [nonaktifList, setNonaktifList] = useState([]);

  const [activeModal, setActiveModal] = useState(null); // 'guru' | 'cabang' | 'nonaktif' | null
  const [modalSearch, setModalSearch] = useState("");

  const navigate = useNavigate();

  const loadData = async () => {
    const guruSnap = await getDocs(collection(db, "users"));
    const cabangSnap = await getDocs(collection(db, "branches"));

    const guruData = guruSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const onlyGuru = guruData.filter(
      (u) => (u.role || "").toLowerCase().trim() === "guru",
    );

    const sortedGuru = onlyGuru.sort((a, b) =>
      (a.namaLengkap || "").localeCompare(b.namaLengkap || "", "id", {
        sensitivity: "base",
      }),
    );

    const cabangData = cabangSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) =>
        (a.nama || "").localeCompare(b.nama || "", "id", {
          sensitivity: "base",
        }),
      );

    const inactiveGuru = sortedGuru.filter((u) => u.aktif === false);

    setGuruList(sortedGuru);
    setTotalGuru(sortedGuru.length);

    setCabangList(cabangData);
    setTotalCabang(cabangData.length);

    setNonaktifList(inactiveGuru);
    setNonaktif(inactiveGuru.length);

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

  const openModal = (type) => {
    setActiveModal(type);
    setModalSearch("");
  };

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
          className="group relative bg-white hover:bg-indigo-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between cursor-pointer"
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
          className="group relative bg-white hover:bg-purple-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between cursor-pointer"
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
          className="group relative bg-white hover:bg-emerald-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center justify-between cursor-pointer"
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

      {/* METRIC CARDS - CLICKABLE WITH DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TOTAL GURU */}
        <div
          onClick={() => openModal("guru")}
          className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group select-none"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Total Guru</span>
              <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-indigo-500" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalGuru}
            </h2>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full group-hover:bg-indigo-100 transition-colors">
              <span>Guru Terdaftar</span>
              <span className="text-[10px] font-normal text-indigo-400">
                (Klik detail)
              </span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center border border-indigo-100/60 shadow-inner transition-colors duration-200">
            <FiUsers className="w-6 h-6" />
          </div>
        </div>

        {/* TOTAL CABANG */}
        <div
          onClick={() => openModal("cabang")}
          className="bg-white border border-slate-200/80 hover:border-purple-300 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group select-none"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Total Cabang</span>
              <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-500" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {totalCabang}
            </h2>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full group-hover:bg-purple-100 transition-colors">
              <span>Lokasi Presensi</span>
              <span className="text-[10px] font-normal text-purple-400">
                (Klik detail)
              </span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center border border-purple-100/60 shadow-inner transition-colors duration-200">
            <FiMapPin className="w-6 h-6" />
          </div>
        </div>

        {/* GURU NONAKTIF */}
        <div
          onClick={() => openModal("nonaktif")}
          className="bg-white border border-slate-200/80 hover:border-rose-300 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between relative overflow-hidden group select-none"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Guru Nonaktif</span>
              <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-rose-500" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {nonaktif}
            </h2>
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full group-hover:bg-rose-100 transition-colors">
              <span>Akun Nonaktif</span>
              <span className="text-[10px] font-normal text-rose-400">
                (Klik detail)
              </span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center border border-rose-100/60 shadow-inner transition-colors duration-200">
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

      {/* DETAIL MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* MODAL HEADER */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                    activeModal === "guru"
                      ? "bg-indigo-50 text-indigo-600"
                      : activeModal === "cabang"
                        ? "bg-purple-50 text-purple-600"
                        : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {activeModal === "guru" && <FiUsers className="w-5 h-5" />}
                  {activeModal === "cabang" && <FiMapPin className="w-5 h-5" />}
                  {activeModal === "nonaktif" && <FiUserX className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-slate-800">
                      {activeModal === "guru" && "Daftar Guru Terdaftar"}
                      {activeModal === "cabang" && "Daftar Cabang Presensi"}
                      {activeModal === "nonaktif" && "Daftar Guru Nonaktif"}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        activeModal === "guru"
                          ? "bg-indigo-100 text-indigo-700"
                          : activeModal === "cabang"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {activeModal === "guru" && guruList.length}
                      {activeModal === "cabang" && cabangList.length}
                      {activeModal === "nonaktif" && nonaktifList.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeModal === "guru" &&
                      "Rincian data seluruh tenaga pengajar terdaftar"}
                    {activeModal === "cabang" &&
                      "Rincian lokasi & radius titik presensi cabang"}
                    {activeModal === "nonaktif" &&
                      "Data akun guru yang saat ini sedang dinonaktifkan"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* SEARCH BAR IN MODAL */}
            <div className="px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <FiSearch className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={
                    activeModal === "cabang"
                      ? "Ketik nama cabang untuk mencari..."
                      : "Ketik nama, cabang, jabatan, atau no hp..."
                  }
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 font-medium focus:outline-hidden placeholder:text-slate-400 placeholder:font-normal"
                />
                {modalSearch && (
                  <button
                    type="button"
                    onClick={() => setModalSearch("")}
                    className="shrink-0 px-2.5 py-1 bg-slate-200/80 hover:bg-slate-300 text-[11px] text-slate-600 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>

            {/* MODAL BODY (CONTENT LIST) */}
            <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
              {activeModal === "cabang" ? (
                (() => {
                  const filtered = cabangList.filter((b) =>
                    (b.nama || "").toLowerCase().includes(modalSearch.toLowerCase()),
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada data cabang ditemukan
                      </div>
                    );
                  }

                  return filtered.map((b) => (
                    <div
                      key={b.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center text-sm border border-purple-100/60 shadow-xs">
                          <FiMapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {b.nama}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Lat: {b.latitude ?? "-"} | Long: {b.longitude ?? "-"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-full text-[11px] font-bold">
                          {b.radius ? `${b.radius} Meter` : "Bebas Lokasi"}
                        </span>
                      </div>
                    </div>
                  ));
                })()
              ) : (
                (() => {
                  const source =
                    activeModal === "guru" ? guruList : nonaktifList;
                  const filtered = source.filter((g) => {
                    const q = modalSearch.toLowerCase();
                    return (
                      (g.namaLengkap || "").toLowerCase().includes(q) ||
                      (g.username || "").toLowerCase().includes(q) ||
                      (g.cabang || "").toLowerCase().includes(q) ||
                      (g.noHp || "").toLowerCase().includes(q) ||
                      (g.email || "").toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada data guru ditemukan
                      </div>
                    );
                  }

                  return filtered.map((g) => (
                    <div
                      key={g.id || g.uid || g.username}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            g.photoURL ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=EEF2FF&color=4F46E5&bold=true&size=80`
                          }
                          alt={g.namaLengkap || "Guru"}
                          className="w-11 h-11 rounded-2xl object-cover border border-indigo-100/60 shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {g.namaLengkap || "Tanpa Nama"}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                            <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-[11px] text-slate-600">
                              {g.cabang || "Tanpa Cabang"}
                            </span>
                            {g.jabatan && (
                              <span className="text-[11px] text-slate-400">
                                • {g.jabatan}
                              </span>
                            )}
                            {g.noHp && (
                              <span className="text-[11px] text-slate-400">
                                • {g.noHp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {g.aktif !== false ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const path =
                    activeModal === "cabang"
                      ? "/admin/branches"
                      : "/admin/users";
                  setActiveModal(null);
                  navigate(path);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                <span>
                  Kelola {activeModal === "cabang" ? "Cabang" : "Guru"} di Halaman
                  Kelola
                </span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


