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
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";

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
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans">
      {/* HEADER GLASSMORPHISM */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight">
                SHININGSUN
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <FiClock className="w-3 h-3 text-indigo-500" />
              <span>{time}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/80">
              <img
                onClick={() => setPreview(true)}
                src={
                  user?.photoURL ||
                  "https://ui-avatars.com/api/?name=" +
                    (user?.namaLengkap || "Guru")
                }
                alt="Profile"
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 cursor-pointer hover:opacity-90 transition-all shadow-xs"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.namaLengkap || "Guru"}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {user?.cabang || "Pengajar"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 flex items-center gap-1.5"
              title="Keluar"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* PREVIEW FOTO MODAL */}
      {preview && (
        <div
          onClick={() => setPreview(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        >
          <img
            src={
              user?.photoURL ||
              "https://ui-avatars.com/api/?name=" +
                (user?.namaLengkap || "Guru")
            }
            alt="Preview Profile"
            className="max-h-[75vh] rounded-3xl shadow-2xl ring-4 ring-white"
          />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 pb-28">
        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            {/* GREETING CARD */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-1">
                <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-semibold tracking-wide">
                  Selamat Datang 👋
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight pt-1">
                  {user?.namaLengkap || "Guru Shiningsun"}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100/90 font-medium">
                  {user?.cabang ? `Cabang: ${user.cabang}` : "Sistem Presensi Kehadiran Online"}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS GRID */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/absen")}
                className="bg-white hover:bg-emerald-50/40 border border-slate-200/80 hover:border-emerald-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group text-left flex items-start justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                    <FiLogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      Absen Masuk
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Catat presensi kehadiran kedatangan
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors">
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => navigate("/absen-pulang")}
                className="bg-white hover:bg-rose-50/40 border border-slate-200/80 hover:border-rose-200/90 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group text-left flex items-start justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors">
                    <FiLogOut className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-rose-700 transition-colors">
                      Absen Pulang
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Catat waktu selesai jam mengajar
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-rose-50 text-slate-400 group-hover:text-rose-600 flex items-center justify-center transition-colors">
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* REKAP TAB */}
        {tab === "rekap" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
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
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-36">
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <span className="text-slate-300 font-bold text-xs">-</span>
                <div className="relative flex-1 sm:w-36">
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
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
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
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
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="p-3.5">Tanggal</th>
                          <th className="p-3.5 text-center">Masuk</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5">Keterangan</th>
                          <th className="p-3.5 text-center">Pulang</th>
                          <th className="p-3.5 text-center">Status Pulang</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {tanggalList.map((tgl, i) => {
                          const dataHari = grouped[tgl][0];

                          return (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3.5 font-bold text-slate-800">
                                {new Date(tgl).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>

                              <td className="p-3.5 text-center font-bold text-emerald-600">
                                {dataHari?.waktu || "-"}
                              </td>

                              <td className="p-3.5 text-center">
                                {dataHari?.status ? (
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusStyle(
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

                              <td className="p-3.5 text-center font-bold text-rose-600">
                                {dataHari?.jamPulang || "-"}
                              </td>

                              <td className="p-3.5 text-center">
                                {dataHari?.statusPulang ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 max-w-2xl mx-auto w-full space-y-8">
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
                  className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-500/10 shadow-lg cursor-pointer group-hover:opacity-90 transition-all"
                />
                <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
                  <FiCamera className="w-4 h-4" />
                  <input
                    type="file"
                    hidden
                    onChange={(e) => uploadProfile(e.target.files[0])}
                  />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {user?.namaLengkap || "Nama Guru"}
                </h2>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
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
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {user?.username || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  No HP
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {user?.noHp || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Tempat, Tanggal Lahir
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {user?.tempatLahir || "-"}, {user?.tanggalLahir || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Tanggal Masuk
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {user?.tglMasuk || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Alamat
                </span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {user?.alamat || "-"}
                </span>
              </div>

              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Jam Masuk
                  </span>
                  <span className="font-extrabold text-indigo-700 text-xs">
                    {user?.jamMasuk || "07:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Jam Pulang
                  </span>
                  <span className="font-extrabold text-indigo-700 text-xs">
                    {user?.jamPulang || "16:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Mulai Absen
                  </span>
                  <span className="font-extrabold text-indigo-700 text-xs">
                    {user?.jamMulaiAbsen || "06:00"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">
                    Batas Telat
                  </span>
                  <span className="font-extrabold text-indigo-700 text-xs">
                    {user?.batasTelat || 15} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING BOTTOM NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 shadow-2xl z-40">
        <div className="max-w-md mx-auto grid grid-cols-3 py-2.5 px-4 text-xs">
          <button
            onClick={() => setTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 font-bold transition-all ${
              tab === "dashboard"
                ? "text-indigo-600 scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FiGrid className="w-5 h-5" />
            <span className="text-[11px]">Dashboard</span>
          </button>

          <button
            onClick={() => setTab("rekap")}
            className={`flex flex-col items-center justify-center gap-1 font-bold transition-all ${
              tab === "rekap"
                ? "text-indigo-600 scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FiFileText className="w-5 h-5" />
            <span className="text-[11px]">Rekapan</span>
          </button>

          <button
            onClick={() => setTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 font-bold transition-all ${
              tab === "profile"
                ? "text-indigo-600 scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FiUser className="w-5 h-5" />
            <span className="text-[11px]">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

