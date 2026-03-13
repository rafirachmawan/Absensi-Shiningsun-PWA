import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminDashboard() {
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [nonaktif, setNonaktif] = useState(0);
  const [aktivitas, setAktivitas] = useState([]);

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

    // aktivitas terbaru (limit agar hemat read)
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

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
          Dashboard Super Admin
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Pantau statistik sistem absensi secara real-time
        </p>
      </div>

      {/* STATISTIK SISTEM */}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 font-semibold text-gray-700">
          Statistik Sistem
        </div>

        <div className="divide-y">
          <div className="flex justify-between px-6 py-4">
            <span className="text-gray-600">Total Guru</span>
            <span className="font-semibold">{totalGuru}</span>
          </div>

          <div className="flex justify-between px-6 py-4">
            <span className="text-gray-600">Total Cabang</span>
            <span className="font-semibold">{totalCabang}</span>
          </div>

          <div className="flex justify-between px-6 py-4">
            <span className="text-gray-600">Guru Nonaktif</span>
            <span className="font-semibold text-red-600">{nonaktif}</span>
          </div>
        </div>
      </div>

      {/* AKTIVITAS TERBARU */}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 font-semibold text-gray-700">
          Aktivitas Absensi Terbaru
        </div>

        {aktivitas.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-500">
            Belum ada aktivitas absensi
          </p>
        ) : (
          <div className="divide-y">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-700">
                    {item.nama || "Guru"}
                  </p>

                  <p className="text-gray-500 text-xs">
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{item.waktu}</p>

                  <p
                    className={`text-xs ${
                      item.status === "Tepat Waktu"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
