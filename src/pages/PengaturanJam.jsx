import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function PengaturanJam() {
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
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Pengaturan Jam Absensi
        </h1>

        <p className="text-gray-500 text-sm">
          Atur jam masuk dan jam pulang untuk sistem absensi
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Jam Masuk</label>

            <input
              type="time"
              value={jamMasuk}
              onChange={(e) => setJamMasuk(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Jam Pulang</label>

            <input
              type="time"
              value={jamPulang}
              onChange={(e) => setJamPulang(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Batas Telat (menit)</label>

            <input
              type="number"
              value={batasTelat}
              onChange={(e) => setBatasTelat(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full mt-1"
            />
          </div>

          <button
            onClick={simpan}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 w-full"
          >
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
