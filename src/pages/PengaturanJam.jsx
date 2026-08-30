import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function PengaturanJam() {
  const [jamBuka, setJamBuka] = useState("06:00");

  const [jamMasuk, setJamMasuk] = useState("07:00");
  const [jamPulang, setJamPulang] = useState("15:00");
  const [batasTelat, setBatasTelat] = useState(15);

  const [loading, setLoading] = useState(false);

  const settingsRef = doc(db, "settings", "attendance");

  /* LOAD SETTINGS */

  const loadSettings = async () => {
    const snapshot = await getDoc(settingsRef);

    if (snapshot.exists()) {
      const data = snapshot.data();

      setJamBuka(data.jamBuka || "06:00");
      setJamMasuk(data.jamMasuk);
      setJamPulang(data.jamPulang);
      setBatasTelat(data.batasTelat);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /* SIMPAN SETTINGS */

  const simpan = async () => {
    try {
      setLoading(true);

      await setDoc(settingsRef, {
        jamBuka,
        jamMasuk,
        jamPulang,
        batasTelat: parseInt(batasTelat),
        updatedAt: new Date(),
      });

      alert("Pengaturan jam berhasil disimpan");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              Konfigurasi Absen
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pengaturan Jam Absensi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Atur jam operasional & batas keterlambatan presensi guru
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 sm:p-6 max-w-xl space-y-6">
        <div className="space-y-5">
          {/* JAM BUKA */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Jam Buka Absensi
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Guru sudah bisa mulai absen sejak jam ini
            </p>
            <input
              type="time"
              value={jamBuka}
              onChange={(e) => setJamBuka(e.target.value)}
              className="border border-slate-200/90 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 outline-hidden transition-all"
            />
          </div>

          {/* JAM MASUK */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Jam Masuk Standar
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Jam acuan utama kehadiran tepat waktu
            </p>
            <input
              type="time"
              value={jamMasuk}
              onChange={(e) => setJamMasuk(e.target.value)}
              className="border border-slate-200/90 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 outline-hidden transition-all"
            />
          </div>

          {/* JAM PULANG */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Jam Pulang Minimal
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Jam minimal guru dapat melakukan absensi pulang
            </p>
            <input
              type="time"
              value={jamPulang}
              onChange={(e) => setJamPulang(e.target.value)}
              className="border border-slate-200/90 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 outline-hidden transition-all"
            />
          </div>

          {/* BATAS TELAT */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Batas Keterlambatan (Menit)
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Jika melewati toleransi menit ini maka status tercatat terlambat
            </p>
            <input
              type="number"
              value={batasTelat}
              onChange={(e) => setBatasTelat(e.target.value)}
              className="border border-slate-200/90 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 outline-hidden transition-all"
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={simpan}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-xl px-4 py-3 w-full text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
