import { useState, useEffect } from "react";
import { db } from "../firebase";

import { collection, getDocs } from "firebase/firestore";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function RekapAbsensi() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [cabangList, setCabangList] = useState([]);

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [cabang, setCabang] = useState("");
  const [search, setSearch] = useState("");

  /* LOAD DATA ABSENSI */

  const loadData = async () => {
    const snapshot = await getDocs(collection(db, "attendance"));

    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setData(result);
    setFiltered([]);
  };

  /* LOAD CABANG */

  const loadCabang = async () => {
    const snapshot = await getDocs(collection(db, "branches"));

    const result = snapshot.docs.map((doc) => doc.data().nama);

    setCabangList(result);
  };

  useEffect(() => {
    loadData();
    loadCabang();
  }, []);

  /* FILTER */

  const applyFilter = () => {
    let result = [...data];

    if (tanggalMulai && tanggalSelesai) {
      result = result.filter(
        (d) => d.tanggal >= tanggalMulai && d.tanggal <= tanggalSelesai,
      );
    }

    if (cabang) {
      result = result.filter((d) => d.cabang === cabang);
    }

    if (search) {
      result = result.filter((d) =>
        d.nama.toLowerCase().includes(search.toLowerCase()),
      );
    }

    result.sort((a, b) => a.waktu.localeCompare(b.waktu));

    setFiltered(result);
  };

  /* EXPORT EXCEL */

  const exportExcel = () => {
    const exportData = filtered.map((d) => ({
      Nama: d.nama,
      Cabang: d.cabang,
      Tanggal: d.tanggal,
      JamMasuk: d.waktu,
      JamPulang: d.jamPulang || "-",
      Status: d.status,
      Foto: d.photoURL,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataFile = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(dataFile, "rekap-absensi.xlsx");
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Rekap Absensi</h1>

        <p className="text-gray-500 text-sm">
          Laporan kehadiran guru berdasarkan tanggal dan cabang
        </p>
      </div>

      {/* FILTER */}

      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="date"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={tanggalSelesai}
            onChange={(e) => setTanggalSelesai(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <select
            value={cabang}
            onChange={(e) => setCabang(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Cabang</option>

            {cabangList.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            placeholder="Cari nama guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={applyFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Filter
          </button>
        </div>
      </div>

      {/* EXPORT */}

      {filtered.length > 0 && (
        <button
          onClick={exportExcel}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Export Excel
        </button>
      )}

      {/* TABLE */}

      {filtered.length === 0 ? (
        <div className="bg-white border rounded-2xl shadow-sm p-12 text-center text-gray-400">
          Silakan pilih filter tanggal terlebih dahulu
        </div>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
          <table className="min-w-[750px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Cabang</th>
                <th className="p-4 text-left">Tanggal</th>
                <th className="p-4 text-left">Masuk</th>
                <th className="p-4 text-left">Pulang</th>
                <th className="p-4 text-left">Foto</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-4 font-medium">{d.nama}</td>

                  <td className="p-4">{d.cabang}</td>

                  <td className="p-4">{d.tanggal}</td>

                  <td className="p-4 font-semibold text-green-700">
                    {d.waktu}
                  </td>

                  <td className="p-4 font-semibold text-red-600">
                    {d.jamPulang || "-"}
                  </td>

                  <td className="p-4">
                    {d.photoURL ? (
                      <a
                        href={d.photoURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        Lihat Foto
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-700">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
