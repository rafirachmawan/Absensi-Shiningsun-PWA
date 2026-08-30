import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  FiDownload,
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
  const [previewPhoto, setPreviewPhoto] = useState(null); // { url, name }

  const navigate = useNavigate();

  const loadData = async () => {
    const guruSnap = await getDocs(collection(db, "users"));
    const cabangSnap = await getDocs(collection(db, "branches"));

    const guruData = guruSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const onlyGuru = guruData.filter(
      (u) => (u.role || "guru").toLowerCase().trim() !== "superadmin",
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

  const handleDownloadPhoto = async (url, name) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(name || "profile").replace(/\s+/g, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab if CORS blocks download
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* 🚀 CLEAN ENTERPRISE HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dashboard Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Monitoring sistem absensi & kelola data guru secara real-time
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 w-fit shrink-0">
          <FiCalendar className="w-4 h-4 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* STANDALONE CLEAN METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* TOTAL GURU */}
        <div
          onClick={() => openModal("guru")}
          className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Total Guru</span>
              <FiChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {totalGuru}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Guru Terdaftar <span className="text-slate-400 font-normal">(Klik detail)</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL CABANG */}
        <div
          onClick={() => openModal("cabang")}
          className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Total Cabang</span>
              <FiChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {totalCabang}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Lokasi Presensi <span className="text-slate-400 font-normal">(Klik detail)</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <FiMapPin className="w-5 h-5" />
          </div>
        </div>

        {/* GURU NONAKTIF */}
        <div
          onClick={() => openModal("nonaktif")}
          className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.99]"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>Guru Nonaktif</span>
              <FiChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {nonaktif}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Akun Nonaktif <span className="text-slate-400 font-normal">(Klik detail)</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <FiUserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS TOOLBAR */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Akses Cepat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-xs transition-all duration-150 text-left flex items-center justify-between cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                <FiUserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Tambah Guru</p>
                <p className="text-xs text-slate-400">Registrasi akun baru</p>
              </div>
            </div>
            <FiArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/branches")}
            className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-xs transition-all duration-150 text-left flex items-center justify-between cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                <FiMapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Tambah Cabang</p>
                <p className="text-xs text-slate-400">Lokasi unit presensi</p>
              </div>
            </div>
            <FiArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/attendance")}
            className="group bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 shadow-xs transition-all duration-150 text-left flex items-center justify-between cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Lihat Laporan</p>
                <p className="text-xs text-slate-400">Rekapitulasi absensi</p>
              </div>
            </div>
            <FiArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* AKTIVITAS TABLE / LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-tight">
                Aktivitas Absensi Terbaru
              </h3>
              <p className="text-xs text-slate-400">Log kehadiran paling akhir</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
            5 Terakhir
          </span>
        </div>

        {aktivitas.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm font-medium">
            Belum ada aktivitas absensi tercatat
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200/60 flex items-center justify-center text-sm shrink-0">
                    {item.nama?.charAt(0) || "G"}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
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

                <div className="text-right flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    {item.waktu}
                  </span>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
                      item.status === "Tepat Waktu"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : item.status === "Lebih Awal"
                          ? "bg-slate-100 text-slate-700 border border-slate-200/80"
                          : "bg-rose-50 text-rose-700 border border-rose-200/80"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.status === "Tepat Waktu"
                          ? "bg-emerald-500"
                          : item.status === "Lebih Awal"
                            ? "bg-slate-500"
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
      {activeModal &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
            className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          >
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
              {/* MODAL HEADER */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center shrink-0">
                    {activeModal === "guru" && <FiUsers className="w-5 h-5" />}
                    {activeModal === "cabang" && <FiMapPin className="w-5 h-5" />}
                    {activeModal === "nonaktif" && <FiUserX className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {activeModal === "guru" && "Daftar Guru Terdaftar"}
                        {activeModal === "cabang" && "Daftar Cabang Presensi"}
                        {activeModal === "nonaktif" && "Daftar Guru Nonaktif"}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                        {activeModal === "guru" && guruList.length}
                        {activeModal === "cabang" && cabangList.length}
                        {activeModal === "nonaktif" && nonaktifList.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeModal === "guru" &&
                        "Rincian seluruh tenaga pengajar yang terdaftar di sistem"}
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
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* SEARCH BAR IN MODAL */}
              <div className="px-5 py-3.5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                  <FiSearch className="w-4 h-4 text-slate-400 shrink-0" />
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
                      className="shrink-0 px-2.5 py-1 bg-slate-200/80 hover:bg-slate-300 text-[11px] text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* MODAL BODY (CONTENT LIST) */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 divide-y divide-slate-100 bg-white">
                {activeModal === "cabang" ? (
                  (() => {
                    const filtered = cabangList.filter((b) =>
                      (b.nama || "").toLowerCase().includes(modalSearch.toLowerCase()),
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-10 text-center text-slate-400 text-xs font-medium">
                          Tidak ada data cabang ditemukan
                        </div>
                      );
                    }

                    return filtered.map((b) => (
                      <div
                        key={b.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm border border-slate-200/60 shadow-xs shrink-0">
                            <FiMapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {b.nama}
                            </h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              Lat: {b.latitude ?? "-"} | Long: {b.longitude ?? "-"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-full text-[11px] font-bold">
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
                        <div className="py-10 text-center text-slate-400 text-xs font-medium">
                          Tidak ada data guru ditemukan
                        </div>
                      );
                    }

                    return filtered.map((g) => (
                      <div
                        key={g.id || g.uid || g.username}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={
                              g.photoURL ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=F1F5F9&color=0F172A&bold=true&size=80`
                            }
                            alt={g.namaLengkap || "Guru"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPhoto({
                                url:
                                  g.photoURL ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=F1F5F9&color=0F172A&bold=true&size=400`,
                                name: g.namaLengkap || "Guru",
                              });
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shadow-xs shrink-0 cursor-pointer hover:ring-2 hover:ring-slate-400/50 hover:scale-105 transition-all duration-200"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {g.namaLengkap || "Tanpa Nama"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-500">
                              <span className="font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/60">
                                {g.cabang || "Tanpa Cabang"}
                              </span>
                              {g.jabatan && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {g.jabatan}
                                </span>
                              )}
                              {g.noHp && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {g.noHp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {g.aktif !== false ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* PHOTO PREVIEW MODAL (WhatsApp-style) */}
      {previewPhoto &&
        createPortal(
          <div
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 z-[10000] w-screen h-screen flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            {/* Top Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-b from-black/60 to-transparent z-10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={previewPhoto.url}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/30 shrink-0"
                />
                <span className="text-white font-bold text-sm sm:text-base truncate">
                  {previewPhoto.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPhoto(previewPhoto.url, previewPhoto.name);
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Download foto"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo */}
            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[75vh] rounded-2xl object-contain shadow-2xl"
              style={{ animation: "scaleIn 0.25s ease-out" }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}


