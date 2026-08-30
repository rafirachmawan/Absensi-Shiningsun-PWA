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

      {/* FORM TAMBAH CABANG */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
            Tambah Cabang Baru
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* NAMA CABANG */}
          <div>
            <label className="text-xs font-bold text-slate-700">Nama Cabang</label>
            <input
              className="border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-sm w-full mt-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder="Contoh: Cabang Gragalan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          {/* LATITUDE */}
          <div>
            <label className="text-xs font-bold text-slate-700">Latitude</label>
            <input
              className="border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-sm w-full mt-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder="-6.200000"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Koordinat dari Google Maps
            </p>
          </div>

          {/* LONGITUDE */}
          <div>
            <label className="text-xs font-bold text-slate-700">Longitude</label>
            <input
              className="border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-sm w-full mt-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder="106.816666"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>

          {/* RADIUS */}
          <div>
            <label className="text-xs font-bold text-slate-700">Radius (meter)</label>
            <input
              type="number"
              className="border border-slate-200/80 rounded-2xl px-3.5 py-2.5 text-sm w-full mt-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
              placeholder="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Kosongkan = Bebas Lokasi
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={tambahCabang}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl text-sm px-6 py-3 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? "Menyimpan..." : "+ Tambah Cabang Baru"}
          </button>
        </div>
      </div>

      {/* DATA CABANG */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-4 px-6 text-left">Nama Cabang</th>
                <th className="py-4 px-6 text-left">Koordinat (Lat, Long)</th>
                <th className="py-4 px-6 text-left">Batas Radius</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 text-sm">
                    Belum ada data cabang
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800 text-sm">{b.nama}</p>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                      {b.latitude && b.longitude
                        ? `${b.latitude}, ${b.longitude}`
                        : "Tidak diatur"}
                    </td>

                    <td className="py-4 px-6">
                      {b.radius ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                          {b.radius} Meter
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          Bebas Lokasi
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setEditData(b)}
                        className="px-4 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Edit Cabang
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden divide-y divide-slate-100">
          {branches.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Belum ada data cabang
            </div>
          ) : (
            branches.map((b) => (
              <div key={b.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 text-base">{b.nama}</h3>
                  {b.radius ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      {b.radius}m
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Bebas
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 font-mono text-xs text-slate-600">
                  <p>Lat: {b.latitude ?? "-"}</p>
                  <p>Long: {b.longitude ?? "-"}</p>
                </div>

                <button
                  onClick={() => setEditData(b)}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 font-bold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer text-center"
                >
                  Edit Cabang
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL EDIT CABANG */}
      {editData && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Edit Data Cabang</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbarui koordinat dan batas radius cabang
              </p>
            </div>

            <div className="space-y-4">
              {/* NAMA CABANG */}
              <div>
                <label className="text-xs font-bold text-slate-700">Nama Cabang</label>
                <input
                  className="border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-sm mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                  value={editData.nama}
                  onChange={(e) =>
                    setEditData({ ...editData, nama: e.target.value })
                  }
                />
              </div>

              {/* LATITUDE */}
              <div>
                <label className="text-xs font-bold text-slate-700">Latitude</label>
                <input
                  className="border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-sm mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                  value={editData.latitude || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, latitude: e.target.value })
                  }
                />
              </div>

              {/* LONGITUDE */}
              <div>
                <label className="text-xs font-bold text-slate-700">Longitude</label>
                <input
                  className="border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-sm mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                  value={editData.longitude || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, longitude: e.target.value })
                  }
                />
              </div>

              {/* RADIUS */}
              <div>
                <label className="text-xs font-bold text-slate-700">Radius (meter)</label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-sm mt-1 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800"
                  value={editData.radius || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, radius: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditData(null)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={updateCabang}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
