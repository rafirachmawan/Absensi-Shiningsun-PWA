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
    <div className="w-full min-w-0 max-w-full space-y-5 sm:space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-slate-900" />
          Konfigurasi Absen
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Pengaturan Jam Absensi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur jam operasional & batas keterlambatan presensi guru
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 max-w-xl w-full space-y-6 min-w-0">
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
              className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
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
              className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
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
              className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
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
              className="border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 w-full text-sm font-semibold text-slate-800 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={simpan}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-xl px-4 py-3 min-h-[48px] w-full text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
