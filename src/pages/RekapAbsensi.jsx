import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function RekapAbsensi() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [tanggal, setTanggal] = useState("");
  const [cabang, setCabang] = useState("");

  const attendanceRef = collection(db, "attendance");

  /* LOAD DATA ABSENSI */
  const loadData = async () => {
    const snapshot = await getDocs(attendanceRef);

    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setData(result);
    setFiltered(result);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* FILTER */
  const applyFilter = () => {
    let result = [...data];

    if (tanggal) {
      result = result.filter((d) => d.tanggal === tanggal);
    }

    if (cabang) {
      result = result.filter((d) => d.cabang === cabang);
    }

    setFiltered(result);
  };

  return (
    <div className="space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Rekap Absensi</h1>

        <p className="text-gray-500 text-sm">Laporan kehadiran guru</p>
      </div>

      {/* FILTER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full"
          />

          <input
            placeholder="Cabang"
            value={cabang}
            onChange={(e) => setCabang(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full"
          />

          <button
            onClick={applyFilter}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {/* TABLE */}
      {/* ================= DATA ABSENSI ================= */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-600">
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Cabang</th>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Jam Masuk</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-4">{d.nama}</td>
                  <td className="p-4">{d.cabang}</td>
                  <td className="p-4">{d.tanggal}</td>
                  <td className="p-4">{d.jamMasuk}</td>

                  <td className="p-4">
                    {d.status === "Hadir" && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                        Hadir
                      </span>
                    )}

                    {d.status === "Telat" && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded">
                        Telat
                      </span>
                    )}

                    {d.status === "Izin" && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded">
                        Izin
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD */}
        <div className="md:hidden p-4 space-y-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="border rounded-xl p-4 shadow-sm space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{d.nama}</h3>

                {d.status === "Hadir" && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded">
                    Hadir
                  </span>
                )}

                {d.status === "Telat" && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded">
                    Telat
                  </span>
                )}

                {d.status === "Izin" && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded">
                    Izin
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500">Cabang: {d.cabang}</p>

              <p className="text-sm text-gray-500">Tanggal: {d.tanggal}</p>

              <p className="text-sm text-gray-500">Jam Masuk: {d.jamMasuk}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
