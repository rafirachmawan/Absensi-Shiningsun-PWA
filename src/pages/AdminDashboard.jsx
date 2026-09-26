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
  FiX,
  FiSearch,
  FiExternalLink,
  FiChevronRight,
  FiDownload,
  FiPieChart,
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

  // Presentational only — sapaan waktu & ringkasan turunan dari state yang sudah ada
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";

  const latest = aktivitas.length > 0 ? aktivitas[0] : null;

  const tepatCount = aktivitas.filter((a) => a.status === "Tepat Waktu").length;
  const awalCount = aktivitas.filter((a) => a.status === "Lebih Awal").length;
  const lainCount = aktivitas.length - tepatCount - awalCount;
  const totalAkt = aktivitas.length;

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
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-clip">
      {/* HERO — panel tinta tunggal, satu sumber cahaya amber */}
      <div className="relative overflow-hidden rounded-2xl bg-stone-950 text-stone-300">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-72px] h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-stone-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span className="truncate">{formattedDate}</span>
            </p>
            <h1 className="mt-4 text-balance break-words text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]">
              {greeting}, Admin
            </h1>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-stone-400">
              Pantau kehadiran guru dan kelola data dari satu tempat.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div>
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {totalGuru}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">guru</p>
              </div>
              <span aria-hidden className="h-9 w-px bg-white/10" />
              <div>
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {totalCabang}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">cabang</p>
              </div>
              <span aria-hidden className="h-9 w-px bg-white/10" />
              <div>
                <p className="text-xl font-semibold tabular-nums tracking-tight text-white">
                  {totalAkt}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">absensi dimuat</p>
              </div>
            </div>
          </div>

          {latest && (
            <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] p-4 lg:w-[300px]">
              <p className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-stone-500">
                <span>Terakhir tercatat</span>
                <span className="font-mono normal-case tracking-normal tabular-nums text-stone-300">
                  {latest.waktu}
                </span>
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-sm font-bold text-amber-300"
                >
                  {latest.nama?.charAt(0) || "G"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {latest.nama || "Guru"}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      latest.status === "Tepat Waktu"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : latest.status === "Lebih Awal"
                          ? "bg-white/10 text-stone-300"
                          : "bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        latest.status === "Tepat Waktu"
                          ? "bg-emerald-400"
                          : latest.status === "Lebih Awal"
                            ? "bg-stone-400"
                            : "bg-rose-400"
                      }`}
                    />
                    {latest.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATS — satu strip berbagi pembatas, bukan tiga kartu kembar */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {/* TOTAL GURU */}
        <button
          type="button"
          onClick={() => openModal("guru")}
          className="group min-w-0 rounded-l-2xl px-3 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
        >
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
            <FiUsers className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">Total guru</span>
          </p>
          <p className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight text-slate-900 sm:text-[30px]">
            {totalGuru}
          </p>
          <p className="mt-0.5 hidden items-center gap-0.5 whitespace-nowrap text-xs text-slate-400 transition-colors group-hover:text-slate-700 min-[420px]:inline-flex">
            Lihat detail
            <FiChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>

        {/* TOTAL CABANG */}
        <button
          type="button"
          onClick={() => openModal("cabang")}
          className="group min-w-0 px-3 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
        >
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
            <FiMapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">Total cabang</span>
          </p>
          <p className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight text-slate-900 sm:text-[30px]">
            {totalCabang}
          </p>
          <p className="mt-0.5 hidden items-center gap-0.5 whitespace-nowrap text-xs text-slate-400 transition-colors group-hover:text-slate-700 min-[420px]:inline-flex">
            Lihat detail
            <FiChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>

        {/* GURU NONAKTIF */}
        <button
          type="button"
          onClick={() => openModal("nonaktif")}
          className="group min-w-0 rounded-r-2xl px-3 py-4 text-left transition-colors hover:bg-slate-50 sm:px-5"
        >
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
            <FiUserX className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">Nonaktif</span>
          </p>
          <p
            className={`mt-1 text-[26px] font-semibold tabular-nums tracking-tight sm:text-[30px] ${
              nonaktif > 0 ? "text-rose-600" : "text-slate-900"
            }`}
          >
            {nonaktif}
          </p>
          <p className="mt-0.5 hidden items-center gap-0.5 whitespace-nowrap text-xs text-slate-400 transition-colors group-hover:text-slate-700 min-[420px]:inline-flex">
            Lihat detail
            <FiChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </button>
      </div>

      {/* QUICK ACTIONS — ubin tinta, bahasa visual dibedakan dari strip statistik */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-stone-900"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
              <FiUserPlus className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                Tambah Guru
              </span>
              <span className="block truncate text-xs text-slate-500">
                Registrasi akun baru
              </span>
            </span>
            <FiArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/branches")}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-stone-900"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
              <FiMapPin className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                Tambah Cabang
              </span>
              <span className="block truncate text-xs text-slate-500">
                Lokasi unit presensi
              </span>
            </span>
            <FiArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/attendance")}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-stone-900"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
              <FiFileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">
                Lihat Laporan
              </span>
              <span className="block truncate text-xs text-slate-500">
                Rekapitulasi absensi
              </span>
            </span>
            <FiArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
          </button>
        </div>

      {/* ACTIVITY + KETEPATAN */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
              <FiClock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                Aktivitas absensi terbaru
              </h2>
              <p className="truncate text-xs text-slate-500">
                Log kehadiran paling akhir
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-600">
            {totalAkt} terakhir
          </span>
        </div>

        {aktivitas.length === 0 ? (
          <div className="p-10 text-center text-sm font-medium text-slate-400">
            Belum ada aktivitas absensi tercatat
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                    {item.nama?.charAt(0) || "G"}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.nama || "Guru"}
                    </p>
                    <p className="mt-0.5 truncate text-xs tabular-nums text-slate-400">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-slate-600">
                    {item.waktu}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === "Tepat Waktu"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                        : item.status === "Lebih Awal"
                          ? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                          : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.status === "Tepat Waktu"
                          ? "bg-emerald-500"
                          : item.status === "Lebih Awal"
                            ? "bg-slate-400"
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
      </section>

        {/* KETEPATAN — donat SVG dari data aktivitas yang sama, tanpa lib tambahan */}
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-amber-400">
              <FiPieChart className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-slate-900">Ketepatan absensi</h2>
              <p className="truncate text-xs tabular-nums text-slate-500">
                {totalAkt} data terakhir
              </p>
            </div>
          </div>

          <div className="p-5">
          {totalAkt === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Belum ada data absensi
            </p>
          ) : (
            <>
              <div className="relative mx-auto h-36 w-36">
                {(() => {
                  const R = 44;
                  const C = 2 * Math.PI * R;
                  const segT = (tepatCount / totalAkt) * C;
                  const segA = (awalCount / totalAkt) * C;
                  const segL = (lainCount / totalAkt) * C;
                  return (
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                      {segT > 0 && (
                        <circle cx="60" cy="60" r={R} fill="none" stroke="#10b981" strokeWidth="14"
                          strokeDasharray={`${segT} ${C - segT}`} strokeDashoffset={0} strokeLinecap="butt" />
                      )}
                      {segA > 0 && (
                        <circle cx="60" cy="60" r={R} fill="none" stroke="#94a3b8" strokeWidth="14"
                          strokeDasharray={`${segA} ${C - segA}`} strokeDashoffset={-segT} strokeLinecap="butt" />
                      )}
                      {segL > 0 && (
                        <circle cx="60" cy="60" r={R} fill="none" stroke="#f43f5e" strokeWidth="14"
                          strokeDasharray={`${segL} ${C - segL}`} strokeDashoffset={-(segT + segA)} strokeLinecap="butt" />
                      )}
                    </svg>
                  );
                })()}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
                    {tepatCount}
                    <span className="text-sm font-medium text-slate-400">
                      /{totalAkt}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">tepat waktu</p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
                {[
                  ["Tepat waktu", tepatCount, "bg-emerald-500"],
                  ["Lebih awal", awalCount, "bg-slate-400"],
                  ["Lainnya", lainCount, "bg-rose-500"],
                ].map(([label, count, dot]) => (
                  <div key={label} className="flex items-center gap-2.5 py-2.5 text-sm">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="flex-1 text-slate-600">{label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </aside>
      </div>

      {/* DETAIL MODAL */}
      {activeModal &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveModal(null);
            }}
            className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn sm:p-6"
          >
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between gap-3 bg-stone-950 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-amber-400">
                    {activeModal === "guru" && <FiUsers className="h-5 w-5" />}
                    {activeModal === "cabang" && <FiMapPin className="h-5 w-5" />}
                    {activeModal === "nonaktif" && <FiUserX className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base">
                        {activeModal === "guru" && "Daftar Guru Terdaftar"}
                        {activeModal === "cabang" && "Daftar Cabang Presensi"}
                        {activeModal === "nonaktif" && "Daftar Guru Nonaktif"}
                      </h2>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-stone-200">
                        {activeModal === "guru" && guruList.length}
                        {activeModal === "cabang" && cabangList.length}
                        {activeModal === "nonaktif" && nonaktifList.length}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-400">
                      {activeModal === "guru" &&
                        "Tenaga pengajar yang terdaftar"}
                      {activeModal === "cabang" &&
                        "Titik presensi tiap cabang"}
                      {activeModal === "nonaktif" &&
                        "Akun guru yang dinonaktifkan"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Tutup"
                  className="shrink-0 rounded-xl p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* SEARCH BAR IN MODAL */}
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-slate-500">
                  <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      activeModal === "cabang"
                        ? "Ketik nama cabang untuk mencari..."
                        : "Ketik nama, cabang, jabatan, atau no hp..."
                    }
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch("")}
                      className="shrink-0 rounded-lg bg-slate-200/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-300"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* MODAL BODY (CONTENT LIST) */}
              <div className="flex-1 divide-y divide-slate-100 overflow-y-auto bg-white p-4 sm:p-5">
                {activeModal === "cabang" ? (
                  (() => {
                    const filtered = cabangList.filter((b) =>
                      (b.nama || "").toLowerCase().includes(modalSearch.toLowerCase()),
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-10 text-center text-xs font-medium text-slate-400">
                          Tidak ada data cabang ditemukan
                        </div>
                      );
                    }

                    return filtered.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-3.5 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 shadow-sm">
                            <FiMapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-slate-900">
                              {b.nama}
                            </h4>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                              Lat: {b.latitude ?? "-"} | Long: {b.longitude ?? "-"}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
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
                        <div className="py-10 text-center text-xs font-medium text-slate-400">
                          Tidak ada data guru ditemukan
                        </div>
                      );
                    }

                    return filtered.map((g) => (
                      <div
                        key={g.id || g.uid || g.username}
                        className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-3.5 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3.5">
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
                            className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-slate-200 object-cover shadow-sm transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-slate-400/50"
                          />
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-slate-900">
                              {g.namaLengkap || "Tanpa Nama"}
                            </h4>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                {g.cabang || "Tanpa Cabang"}
                              </span>
                              {(g.jabatan || g.noHp) && (
                                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-400">
                                  {[g.jabatan, g.noHp]
                                    .filter(Boolean)
                                    .join("  •  ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {g.aktif !== false ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
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
              <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 sm:justify-start sm:py-1.5"
                >
                  <span className="truncate">
                    Kelola {activeModal === "cabang" ? "Cabang" : "Guru"} di Halaman
                    Kelola
                  </span>
                  <FiExternalLink className="h-3.5 w-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-full shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 sm:w-auto"
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
            className="fixed inset-0 z-[10000] flex h-screen w-screen flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg"
            style={{ animation: "fadeIn 0.2s ease-out" }}
          >
            {/* Top Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 right-0 top-0 z-10 mt-[env(safe-area-inset-top)] flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 py-3 sm:px-6 sm:py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={previewPhoto.url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border-2 border-white/30 object-cover"
                />
                <span className="truncate text-sm font-bold text-white sm:text-base">
                  {previewPhoto.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadPhoto(previewPhoto.url, previewPhoto.name);
                  }}
                  className="cursor-pointer rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
                  title="Download foto"
                >
                  <FiDownload className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="cursor-pointer rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
                  title="Tutup"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Photo */}
            <img
              src={previewPhoto.url}
              alt={previewPhoto.name}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[75vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              style={{ animation: "scaleIn 0.25s ease-out" }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
