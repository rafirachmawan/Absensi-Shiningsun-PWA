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
    <div className="space-y-6 font-sans">
      {/* ================= HEADER CONTAINER (FULL WIDTH) ================= */}
      <div className="bg-gray-50 border-b px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
              Dashboard Super Admin
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Monitoring sistem absensi secara real-time
            </p>
          </div>

          {/* RIGHT */}
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="px-6 space-y-6">
        {/* ================= STATISTIK ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TOTAL GURU */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
            <p className="text-sm text-gray-500">Total Guru</p>

            <div className="flex items-center justify-between mt-3">
              <h2 className="text-2xl font-semibold text-gray-800">
                {totalGuru}
              </h2>

              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg">
                👨‍🏫
              </div>
            </div>
          </div>

          {/* TOTAL CABANG */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
            <p className="text-sm text-gray-500">Total Cabang</p>

            <div className="flex items-center justify-between mt-3">
              <h2 className="text-2xl font-semibold text-gray-800">
                {totalCabang}
              </h2>

              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
                🏢
              </div>
            </div>
          </div>

          {/* NONAKTIF */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition">
            <p className="text-sm text-gray-500">Guru Nonaktif</p>

            <div className="flex items-center justify-between mt-3">
              <h2 className="text-2xl font-semibold text-red-600">
                {nonaktif}
              </h2>

              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center text-lg">
                ⚠️
              </div>
            </div>
          </div>
        </div>

        {/* ================= AKTIVITAS ================= */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 font-medium text-gray-700">
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
                  className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {item.nama?.charAt(0) || "G"}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-800">
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
                    <p className="text-sm font-medium text-gray-800">
                      {item.waktu}
                    </p>

                    <span
                      className={`text-xs px-2 py-1 rounded-md ${
                        item.status === "Tepat Waktu"
                          ? "bg-green-50 text-green-700"
                          : item.status === "Lebih Awal"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
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
    </div>
  );
}
