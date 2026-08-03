import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function KelolaCabang() {
  const [branches, setBranches] = useState([]);

  const [nama, setNama] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(100);

  const [loading, setLoading] = useState(false);

  const [editData, setEditData] = useState(null);

  const branchesRef = collection(db, "branches");

  /* LOAD DATA */

  const loadBranches = async () => {
    const snapshot = await getDocs(branchesRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // URUTKAN BERDASARKAN NAMA CABANG A-Z
    const sortedBranches = data.sort((a, b) =>
      (a.nama || "").localeCompare(b.nama || "", "id", {
        sensitivity: "base",
      }),
    );

    setBranches(sortedBranches);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  /* TAMBAH CABANG */

  const tambahCabang = async () => {
    if (!nama) {
      alert("Nama cabang wajib diisi");
      return;
    }

    try {
      setLoading(true);

      await addDoc(branchesRef, {
        nama,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radius: radius ? parseInt(radius) : null,
        createdAt: new Date(),
      });

      setNama("");
      setLatitude("");
      setLongitude("");
      setRadius("");

      loadBranches();

      alert("Cabang berhasil ditambahkan");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  /* UPDATE CABANG */

  const updateCabang = async () => {
    try {
      const ref = doc(db, "branches", editData.id);

      await updateDoc(ref, {
        nama: editData.nama,
        latitude: parseFloat(editData.latitude),
        longitude: parseFloat(editData.longitude),
        radius: parseInt(editData.radius),
      });

      setEditData(null);

      loadBranches();

      alert("Cabang berhasil diupdate");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider">
              Lokasi Presensi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Kelola Cabang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur lokasi & koordinat cabang untuk verifikasi absensi guru
          </p>
        </div>
      </div>

      {/* FORM TAMBAH */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Tambah Cabang Baru
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* NAMA CABANG */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Nama Cabang</label>
            <input
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
              placeholder="Contoh: Cabang Gragalan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          {/* LATITUDE */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Latitude</label>
            <input
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
              placeholder="-6.200000"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 font-normal">
              Dari Google Maps
            </p>
          </div>

          {/* LONGITUDE */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Longitude</label>
            <input
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
              placeholder="106.816666"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>

          {/* RADIUS */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Radius (meter)</label>
            <input
              type="number"
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
              placeholder="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 font-normal">
              Kosongkan = Bebas Lokasi
            </p>
          </div>

          {/* BUTTON */}
          <div className="flex items-start pt-[25px]">
            <button
              onClick={tambahCabang}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-sm px-4 py-2.5 w-full shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Tambah Cabang"}
            </button>
          </div>
        </div>
      </div>

      {/* DATA CABANG */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        {/* DESKTOP TABLE */}

        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 text-left">Nama Cabang</th>
                <th className="p-4 text-left">Latitude</th>
                <th className="p-4 text-left">Longitude</th>
                <th className="p-4 text-left">Radius</th>
                <th className="p-4 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-4 font-medium">{b.nama}</td>

                  <td className="p-4 text-gray-500">{b.latitude ?? "-"}</td>

                  <td className="p-4 text-gray-500">{b.longitude ?? "-"}</td>

                  <td className="p-4">
                    {b.radius ? `${b.radius} meter` : "Bebas Lokasi"}
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => setEditData(b)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD */}

        <div className="md:hidden p-4 space-y-4">
          {branches.map((b) => (
            <div key={b.id} className="border rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800">{b.nama}</h3>

              <p className="text-sm text-gray-500 break-all mt-1">
                Latitude: {b.latitude ?? "-"}
              </p>

              <p className="text-sm text-gray-500 break-all">
                Longitude: {b.longitude ?? "-"}
              </p>

              <p className="text-sm mt-1">
                Radius: {b.radius ? `${b.radius} meter` : "Bebas Lokasi"}
              </p>

              <button
                onClick={() => setEditData(b)}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm mt-3"
              >
                Edit Cabang
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL EDIT */}

      {editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-800">Edit Cabang</h2>

            <div className="space-y-4 mt-4">
              {/* NAMA CABANG */}
              <div>
                <label className="text-xs text-gray-600">Nama Cabang</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full text-sm mt-1"
                  value={editData.nama}
                  onChange={(e) =>
                    setEditData({ ...editData, nama: e.target.value })
                  }
                />
              </div>

              {/* LATITUDE */}
              <div>
                <label className="text-xs text-gray-600">Latitude</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full text-sm mt-1"
                  value={editData.latitude}
                  onChange={(e) =>
                    setEditData({ ...editData, latitude: e.target.value })
                  }
                />
              </div>

              {/* LONGITUDE */}
              <div>
                <label className="text-xs text-gray-600">Longitude</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full text-sm mt-1"
                  value={editData.longitude}
                  onChange={(e) =>
                    setEditData({ ...editData, longitude: e.target.value })
                  }
                />
              </div>

              {/* RADIUS */}
              <div>
                <label className="text-xs text-gray-600">Radius (meter)</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full text-sm mt-1"
                  value={editData.radius}
                  onChange={(e) =>
                    setEditData({ ...editData, radius: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditData(null)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Batal
              </button>

              <button
                onClick={updateCabang}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
