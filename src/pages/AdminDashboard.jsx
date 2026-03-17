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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL GURU */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition">
          <p className="text-sm text-gray-500">Total Guru</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">{totalGuru}</h2>
        </div>

        {/* TOTAL CABANG */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition">
          <p className="text-sm text-gray-500">Total Cabang</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">
            {totalCabang}
          </h2>
        </div>

        {/* NONAKTIF */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition">
          <p className="text-sm text-gray-500">Guru Nonaktif</p>
          <h2 className="text-2xl font-bold text-red-600 mt-1">{nonaktif}</h2>
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
          <div className="space-y-3 p-4">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-4 rounded-xl transition"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {item.nama?.charAt(0) || "G"}
                  </div>

                  <div>
                    <p className="font-medium text-gray-800">
                      {item.nama || "Guru"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{item.waktu}</p>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.status === "Tepat Waktu"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Lebih Awal"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
