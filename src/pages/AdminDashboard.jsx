import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminDashboard() {
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [nonaktif, setNonaktif] = useState(0);

  const loadData = async () => {
    const guruSnap = await getDocs(collection(db, "users"));
    const cabangSnap = await getDocs(collection(db, "branches"));

    setTotalGuru(guruSnap.size);
    setTotalCabang(cabangSnap.size);

    let nonaktifCount = 0;

    guruSnap.docs.forEach((doc) => {
      const data = doc.data();

      if (data.aktif === false) {
        nonaktifCount++;
      }
    });

    setNonaktif(nonaktifCount);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Dashboard Super Admin
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Pantau statistik sistem absensi secara real-time
        </p>
      </div>

      {/* STATISTIK */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TOTAL GURU */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Guru</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">{totalGuru}</h2>

          <p className="text-xs text-gray-400 mt-2">
            Jumlah akun guru terdaftar
          </p>
        </div>

        {/* TOTAL CABANG */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Cabang</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {totalCabang}
          </h2>

          <p className="text-xs text-gray-400 mt-2">Lokasi cabang aktif</p>
        </div>

        {/* ABSENSI HARI INI */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Absensi Hari Ini</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">0</h2>

          <p className="text-xs text-gray-400 mt-2">
            Jumlah guru yang sudah absen
          </p>
        </div>

        {/* GURU NONAKTIF */}

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Guru Nonaktif</p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">{nonaktif}</h2>

          <p className="text-xs text-gray-400 mt-2">Akun guru dinonaktifkan</p>
        </div>
      </div>
    </div>
  );
}
