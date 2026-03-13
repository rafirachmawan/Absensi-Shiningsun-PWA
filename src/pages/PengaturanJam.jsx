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
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Pengaturan Jam Absensi
        </h1>

        <p className="text-gray-500 text-sm">
          Atur jam operasional absensi guru
        </p>
      </div>

      {/* FORM */}

      <div className="bg-white border rounded-2xl shadow-sm p-6 max-w-xl">
        <div className="space-y-6">
          {/* JAM BUKA */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Jam Buka Absensi
            </label>

            <p className="text-xs text-gray-400 mb-1">
              Guru sudah bisa mulai absen sejak jam ini
            </p>

            <input
              type="time"
              value={jamBuka}
              onChange={(e) => setJamBuka(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full text-sm"
            />
          </div>

          {/* JAM MASUK */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Jam Masuk
            </label>

            <p className="text-xs text-gray-400 mb-1">
              Jam standar kehadiran guru
            </p>

            <input
              type="time"
              value={jamMasuk}
              onChange={(e) => setJamMasuk(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full text-sm"
            />
          </div>

          {/* JAM PULANG */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Jam Pulang
            </label>

            <p className="text-xs text-gray-400 mb-1">
              Jam minimal guru dapat melakukan absensi pulang
            </p>

            <input
              type="time"
              value={jamPulang}
              onChange={(e) => setJamPulang(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full text-sm"
            />
          </div>

          {/* BATAS TELAT */}

          <div>
            <label className="text-sm font-medium text-gray-700">
              Batas Keterlambatan (menit)
            </label>

            <p className="text-xs text-gray-400 mb-1">
              Jika melewati batas ini maka status menjadi terlambat
            </p>

            <input
              type="number"
              value={batasTelat}
              onChange={(e) => setBatasTelat(e.target.value)}
              className="border rounded-lg px-4 py-2 w-full text-sm"
            />
          </div>

          {/* BUTTON */}

          <button
            onClick={simpan}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 w-full font-medium"
          >
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
