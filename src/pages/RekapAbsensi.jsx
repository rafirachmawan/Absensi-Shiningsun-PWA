import { useState, useEffect } from "react";
import { db } from "../firebase";

import { Fragment } from "react";

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

  //
  const parseDateTime = (tanggal, jam) => {
    if (!tanggal) return new Date(0);

    const safeJam = (jam || "00.00").replace(".", ":"); // 🔥 FIX DISINI
    return new Date(`${tanggal}T${safeJam}`);
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";

    const [year, month, day] = tanggal.split("-");
    return `${day}/${month}/${year}`;
  };

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

    result.sort((a, b) => {
      return (
        parseDateTime(a.tanggal, a.waktu) - parseDateTime(b.tanggal, b.waktu)
      );
    });

    setFiltered(result);
  };

  /* EXPORT EXCEL */

  const exportExcel = () => {
    // 🔥 ambil nama unik
    const namaList = [...new Set(filtered.map((d) => d.nama))];

    // 🔥 group per tanggal
    const grouped = {};
    filtered.forEach((d) => {
      if (!grouped[d.tanggal]) grouped[d.tanggal] = [];
      grouped[d.tanggal].push(d);
    });

    const tanggalList = Object.keys(grouped).sort();

    // =========================
    // 🔥 HEADER 1 (NAMA)
    // =========================
    const header1 = ["Tanggal"];

    namaList.forEach((nama) => {
      header1.push(nama, "", "", "", "", ""); // 6 kolom
    });

    // =========================
    // 🔥 HEADER 2 (SUB KOLOM)
    // =========================
    const header2 = [""];

    namaList.forEach(() => {
      header2.push(
        "Masuk",
        "Status",
        "Keterangan",
        "Pulang",
        "Status",
        "Keterangan",
      );
    });

    // =========================
    // 🔥 DATA
    // =========================
    const rows = tanggalList.map((tgl) => {
      const row = [formatTanggal(tgl)];

      namaList.forEach((nama) => {
        const dataHari = grouped[tgl].find((d) => d.nama === nama);

        row.push(
          dataHari?.waktu || "-",
          dataHari?.status || "-",
          dataHari?.keterangan || "-",
          dataHari?.jamPulang || "-",
          dataHari?.statusPulang || "-",
          dataHari?.keteranganPulang || "-",
        );
      });

      return row;
    });

    const sheetData = [header1, header2, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // =========================
    // 🔥 MERGE HEADER (BIAR KAYAK WEB)
    // =========================
    const merges = [];

    let col = 1;
    namaList.forEach(() => {
      merges.push({
        s: { r: 0, c: col },
        e: { r: 0, c: col + 5 },
      });
      col += 6;
    });

    // merge tanggal
    merges.push({
      s: { r: 0, c: 0 },
      e: { r: 1, c: 0 },
    });

    worksheet["!merges"] = merges;

    // =========================
    // 🔥 AUTO WIDTH
    // =========================
    worksheet["!cols"] = [
      { wch: 12 },
      ...Array(namaList.length * 6).fill({ wch: 18 }),
    ];

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
      <div className="bg-white border rounded-2xl shadow-sm p-5 md:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Filter Absensi</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-0.5">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-0.5">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-0.5 invisible">
              Cabang
            </label>
            <select
              value={cabang}
              onChange={(e) => setCabang(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full"
            >
              <option value="">Semua Cabang</option>
              {cabangList.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-0.5 invisible">
              Search
            </label>
            <input
              placeholder="Cari nama guru..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>

          <button
            onClick={applyFilter}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm w-full"
          >
            Filter
          </button>
        </div>
      </div>

      {/* EXPORT */}
      {filtered.length > 0 && (
        <button
          onClick={exportExcel}
          className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm"
        >
          Export Excel
        </button>
      )}

      {/* TABLE */}
      {filtered.length > 0 && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-x-auto">
          {(() => {
            // 🔥 ambil nama unik
            const namaList = [...new Set(filtered.map((d) => d.nama))];

            // 🔥 group berdasarkan tanggal
            const grouped = {};
            filtered.forEach((d) => {
              if (!grouped[d.tanggal]) grouped[d.tanggal] = [];
              grouped[d.tanggal].push(d);
            });

            const tanggalList = Object.keys(grouped).sort();

            return (
              <table className="min-w-[800px] w-full text-sm border">
                <thead className="bg-gray-50 text-gray-700">
                  {/* HEADER 1 */}
                  <tr>
                    <th
                      className="border border-gray-300 border-r-2 p-2 text-left"
                      rowSpan={2}
                    >
                      Tanggal
                    </th>

                    {namaList.map((nama, i) => (
                      <th
                        key={i}
                        colSpan={6}
                        className="border border-gray-300 border-r-2 p-2 text-center bg-gray-100"
                      >
                        {nama}
                      </th>
                    ))}
                  </tr>

                  {/* HEADER 2 */}
                  <tr>
                    {namaList.map((_, i) => (
                      <Fragment key={i}>
                        <th className="border border-gray-300 p-2 text-center text-green-700">
                          Masuk
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          Status
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          Keterangan
                        </th>

                        <th className="border border-gray-300 p-2 text-center text-red-600">
                          Pulang
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          Status
                        </th>
                        <th className="border border-gray-300 border-r-2 p-2 text-center">
                          Keterangan
                        </th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tanggalList.map((tgl, i) => (
                    <tr key={i}>
                      {/* TANGGAL */}
                      <td className="border border-gray-300 border-r-2 p-2 font-medium">
                        {formatTanggal(tgl)}
                      </td>

                      {namaList.map((nama, j) => {
                        const dataHari = grouped[tgl].find(
                          (d) => d.nama === nama,
                        );

                        return (
                          <Fragment key={j}>
                            <td className="border border-gray-300 p-2 text-center text-green-700 font-semibold">
                              {dataHari?.waktu || "-"}
                            </td>

                            <td className="border border-gray-300 p-2 text-center text-blue-600 text-xs">
                              {dataHari?.status || "-"}
                            </td>

                            <td className="border border-gray-300 p-2 text-xs text-gray-500">
                              {dataHari?.keterangan || "-"}
                            </td>

                            <td className="border border-gray-300 p-2 text-center text-red-600 font-semibold">
                              {dataHari?.jamPulang || "-"}
                            </td>

                            <td className="border border-gray-300 p-2 text-center text-blue-600 text-xs">
                              {dataHari?.statusPulang || "-"}
                            </td>

                            {/* 🔥 KOLOM TERAKHIR TIAP GURU */}
                            <td className="border border-gray-300 border-r-2 p-2 text-xs text-gray-500">
                              {dataHari?.keteranganPulang || "-"}
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
    </div>
  );
}
