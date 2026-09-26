import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
} from "firebase/firestore";

import {
  FiGrid,
  FiFileText,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiClock,
  FiCalendar,
  FiCamera,
  FiArrowRight,
} from "react-icons/fi";

export default function Dashboard() {
  const navigate = useNavigate();

  const [time, setTime] = useState("");
  const [user, setUser] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Lebih Awal":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";

      case "Tepat Waktu":
        return "bg-indigo-50 text-slate-900 border border-indigo-200";

      case "Terlambat":
        return "bg-amber-50 text-amber-700 border border-amber-200";

      case "Terlambat Berat":
        return "bg-rose-50 text-rose-700 border border-rose-200";

      case "Kelas Tambahan":
        return "bg-purple-50 text-purple-700 border border-purple-200";

      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  // Format tampil saja — "2001-01-28" menjadi "28 Jan 2001"
  const formatTgl = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

  useEffect(() => {
    let unsubRiwayat = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUser(snap.data());
      }

      const q = query(
        collection(db, "attendance"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      );

      unsubRiwayat = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRiwayat(data);
      });
    });

    return () => {
      if (unsubRiwayat) unsubRiwayat();
      unsubscribeAuth();
    };
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("autoLogin");
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const uploadProfile = async (file) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "absensi_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dbefoaekm/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      const userRef = doc(db, "users", auth.currentUser.uid);

      await updateDoc(userRef, {
        photoURL: data.secure_url,
      });

      setUser((prev) => ({
        ...prev,
        photoURL: data.secure_url,
      }));
    } catch (err) {
      alert("Upload gagal");
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50/80 flex flex-col font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900">
                SHININGSUN
              </h1>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <FiClock className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="min-w-0 truncate tabular-nums">{time}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden min-w-0 max-w-[200px] flex-col border-l border-slate-200 pl-3 text-right sm:flex">
              <span className="truncate text-xs font-bold leading-tight text-slate-900">
                {user?.namaLengkap || "Guru"}
              </span>
              <span className="truncate text-[10px] font-medium text-slate-400">
                {user?.cabang || "Pengajar"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
              title="Keluar"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* PREVIEW FOTO MODAL */}
      {preview && (
        <div
          onClick={() => setPreview(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <img
            src={
              user?.photoURL ||
              "https://ui-avatars.com/api/?name=" +
                (user?.namaLengkap || "Guru")
            }
            alt="Preview Profile"
            className="max-h-[75vh] w-auto max-w-[calc(100vw-2rem)] rounded-2xl object-contain shadow-2xl ring-4 ring-white"
          />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl mx-auto w-full min-w-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-32">
        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* GREETING CARD */}
            <div className="flex items-center gap-3 rounded-2xl bg-black p-4 text-white shadow-sm sm:gap-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-stone-200">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="truncate">Selamat Datang</span>
                </span>
                <h2 className="text-balance break-words pt-2 text-lg font-bold tracking-tight sm:text-2xl">
                  {user?.namaLengkap || "Guru Shiningsun"}
                </h2>
                <p className="mt-1 truncate text-xs font-medium text-stone-400 sm:text-sm">
                  {user?.cabang ? `Cabang: ${user.cabang}` : "Sistem Presensi Kehadiran Online"}
                </p>
              </div>
              <img
                onClick={() => setPreview(true)}
                src={
                  user?.photoURL ||
                  "https://ui-avatars.com/api/?name=" +
                    (user?.namaLengkap || "Guru")
                }
                alt="Foto profil"
                className="aspect-[3/4] w-[84px] shrink-0 cursor-pointer self-start rounded-2xl bg-white/10 object-cover object-top ring-2 ring-white/25 transition hover:opacity-90 sm:w-28"
              />
            </div>

            {/* ACTION BUTTONS GRID */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                onClick={() => navigate("/absen")}
                className="group flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[0.99] sm:p-6"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <FiLogIn className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Absen Masuk
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Catat presensi kehadiran kedatangan
                    </p>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-slate-200 group-hover:text-slate-700">
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>

              <button
                onClick={() => navigate("/absen-pulang")}
                className="group flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow active:scale-[0.99] sm:p-6"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <FiLogOut className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Absen Pulang
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Catat waktu selesai jam mengajar
                    </p>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-slate-200 group-hover:text-slate-700">
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* REKAP TAB */}
        {tab === "rekap" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  Riwayat Absensi
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Log data presensi kehadiran Anda
                </p>
              </div>

              {/* DATE FILTERS */}
              <div className="flex w-full flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center">
                <div className="relative w-full min-w-0 min-[420px]:flex-1 sm:w-36">
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <span className="hidden shrink-0 font-bold text-xs text-slate-300 min-[420px]:inline">-</span>
                <div className="relative w-full min-w-0 min-[420px]:flex-1 sm:w-36">
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>

            {riwayat.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FiCalendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Belum ada riwayat absensi</p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto rounded-2xl border border-slate-100">
                {(() => {
                  const filtered = riwayat.filter((d) => {
                    if (!tanggalMulai || !tanggalSelesai) return true;

                    return (
                      d.tanggal >= tanggalMulai && d.tanggal <= tanggalSelesai
                    );
                  });

                  const grouped = {};
                  filtered.forEach((d) => {
                    if (!grouped[d.tanggal]) grouped[d.tanggal] = [];
                    grouped[d.tanggal].push(d);
                  });

                  const tanggalList = Object.keys(grouped).sort(
                    (a, b) => new Date(b) - new Date(a),
                  );

                  return (
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead className="bg-black font-bold uppercase tracking-wider">
                        <tr className="border-b-2 border-black">
                          <th className="p-3.5 text-left text-white">Tanggal</th>
                          <th className="p-3.5 text-center text-emerald-300">Masuk</th>
                          <th className="p-3.5 text-center text-stone-300">Status</th>
                          <th className="p-3.5 text-left text-stone-300">Keterangan</th>
                          <th className="p-3.5 text-center text-rose-300">Pulang</th>
                          <th className="p-3.5 text-center text-stone-300">Status Pulang</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {tanggalList.map((tgl, i) => {
                          const dataHari = grouped[tgl][0];

                          return (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="whitespace-nowrap p-3.5 font-bold tabular-nums text-slate-800">
                                {new Date(tgl).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>

                              <td className="whitespace-nowrap p-3.5 text-center font-bold tabular-nums text-emerald-600">
                                {dataHari?.waktu || "-"}
                              </td>

                              <td className="p-3.5 text-center">
                                {dataHari?.status ? (
                                  <span
                                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(
                                      dataHari.status,
                                    )}`}
                                  >
                                    {dataHari.status}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>

                              <td className="p-3.5 text-slate-500 max-w-xs truncate">
                                {dataHari?.keterangan || "-"}
                              </td>

                              <td className="whitespace-nowrap p-3.5 text-center font-bold tabular-nums text-rose-600">
                                {dataHari?.jamPulang || "-"}
                              </td>

                              <td className="p-3.5 text-center">
                                {dataHari?.statusPulang ? (
                                  <span className="inline-block whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                                    {dataHari.statusPulang}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 max-w-2xl mx-auto w-full space-y-8">
            {/* AVATAR HEADER */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <img
                  onClick={() => setPreview(true)}
                  src={
                    user?.photoURL ||
                    "https://ui-avatars.com/api/?name=" +
                      (user?.namaLengkap || "Guru")
                  }
                  alt="Profile"
                  className="aspect-[3/4] w-28 cursor-pointer rounded-2xl bg-slate-100 object-cover object-top shadow-lg ring-4 ring-slate-900/10 transition group-hover:opacity-90 sm:w-32"
                />
                <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl bg-slate-900 p-2 text-white shadow-md transition hover:bg-slate-800">
                  <FiCamera className="w-4 h-4" />
                  <input
                    type="file"
                    hidden
                    onChange={(e) => uploadProfile(e.target.files[0])}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {user?.namaLengkap || "Nama Guru"}
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {user?.cabang || "Cabang Belum Diset"}
                </p>
              </div>

              {uploading && (
                <p className="text-xs text-slate-400 font-medium animate-pulse">
                  Uploading foto profil...
                </p>
              )}
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Username
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block break-words">
                  {user?.username || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  No HP
                </span>
                <span className="mt-0.5 block break-words font-mono text-sm font-bold tabular-nums text-slate-800">
                  {user?.noHp || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Tempat, Tanggal Lahir
                </span>
                <span className="mt-0.5 block break-words font-bold text-slate-800 text-sm">
                  {user?.tempatLahir
                    ? `${user.tempatLahir}, ${formatTgl(user?.tanggalLahir)}`
                    : formatTgl(user?.tanggalLahir)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Tanggal Masuk
                </span>
                <span className="mt-0.5 block break-words font-bold text-slate-800 text-sm">
                  {formatTgl(user?.tglMasuk)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Alamat
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block break-words">
                  {user?.alamat || "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 border border-slate-200 bg-slate-50 p-3.5 text-center sm:col-span-2 sm:grid-cols-4 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Jam Masuk
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                    {user?.jamMasuk || "07:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Jam Pulang
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                    {user?.jamPulang || "16:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Mulai Absen
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                    {user?.jamMulaiAbsen || "06:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Batas Telat
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                    {user?.batasTelat || 15} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING BOTTOM NAV */}
      <nav className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] sm:inset-x-4 sm:bottom-6">
        <div className="mx-auto grid w-full min-w-0 max-w-md grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)]">
          <button
            onClick={() => setTab("dashboard")}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-xs ${
              tab === "dashboard"
                ? "bg-black text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <FiGrid className="h-[18px] w-[18px] shrink-0" />
            <span className="max-w-full truncate">Dashboard</span>
          </button>

          <button
            onClick={() => setTab("rekap")}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-xs ${
              tab === "rekap"
                ? "bg-black text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <FiFileText className="h-[18px] w-[18px] shrink-0" />
            <span className="max-w-full truncate">Rekapan</span>
          </button>

          <button
            onClick={() => setTab("profile")}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-xs ${
              tab === "profile"
                ? "bg-black text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            <FiUser className="h-[18px] w-[18px] shrink-0" />
            <span className="max-w-full truncate">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

