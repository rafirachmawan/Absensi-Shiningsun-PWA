import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalCabang, setTotalCabang] = useState(0);
  const [nonaktif, setNonaktif] = useState(0);
  const [aktivitas, setAktivitas] = useState([]);

  const navigate = useNavigate();

  const loadData = async () => {
    const guruSnap = await getDocs(collection(db, "users"));
    const cabangSnap = await getDocs(collection(db, "branches"));

    const guruData = guruSnap.docs.map((doc) => doc.data());

    const onlyGuru = guruData.filter(
      (u) => (u.role || "").toLowerCase().trim() === "guru",
    );

    setTotalGuru(onlyGuru.length);
    setTotalCabang(cabangSnap.size);

    let nonaktifCount = 0;
    onlyGuru.forEach((u) => {
      if (u.aktif === false) nonaktifCount++;
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
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Dashboard Super Admin 🚀
          </h1>
          <p className="text-sm text-gray-500">
            Monitoring sistem absensi secara real-time
          </p>
        </div>

        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate("/admin/users")}
          className="bg-blue-600 text-white py-3 rounded-xl shadow hover:bg-blue-700 transition"
        >
          ➕ Tambah Guru
        </button>

        <button
          onClick={() => navigate("/admin/branches")}
          className="bg-indigo-600 text-white py-3 rounded-xl shadow hover:bg-indigo-700 transition"
        >
          ➕ Tambah Cabang
        </button>

        <button
          onClick={() => navigate("/admin/attendance")}
          className="bg-green-600 text-white py-3 rounded-xl shadow hover:bg-green-700 transition"
        >
          📊 Lihat Laporan
        </button>
      </div>

      {/* CARD STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <p className="text-sm opacity-80">Total Guru</p>
          <h2 className="text-3xl font-bold mt-2">{totalGuru}</h2>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <p className="text-sm opacity-80">Total Cabang</p>
          <h2 className="text-3xl font-bold mt-2">{totalCabang}</h2>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5 rounded-2xl shadow-lg hover:scale-[1.02] transition">
          <p className="text-sm opacity-80">Guru Nonaktif</p>
          <h2 className="text-3xl font-bold mt-2">{nonaktif}</h2>
        </div>
      </div>

      {/* AKTIVITAS */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold text-gray-700">
          Aktivitas Absensi Terbaru
        </div>

        {aktivitas.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">
            Belum ada aktivitas absensi
          </p>
        ) : (
          <div className="divide-y">
            {aktivitas.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    {item.nama?.charAt(0) || "G"}
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {item.nama || "Guru"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">{item.waktu}</p>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
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
