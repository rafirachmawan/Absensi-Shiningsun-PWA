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

    setBranches(data);
  };

  useEffect(() => {
    loadBranches();
  }, []);

  /* TAMBAH CABANG */
  const tambahCabang = async () => {
    if (!nama || !latitude || !longitude) {
      alert("Lengkapi data cabang");
      return;
    }

    try {
      setLoading(true);

      await addDoc(branchesRef, {
        nama,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        createdAt: new Date(),
      });

      setNama("");
      setLatitude("");
      setLongitude("");
      setRadius(100);

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
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Kelola Cabang</h1>

        <p className="text-gray-500 text-sm">
          Atur lokasi cabang untuk verifikasi absensi guru
        </p>
      </div>

      {/* FORM TAMBAH */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="font-semibold mb-4">Tambah Cabang</h2>

        <div className="grid md:grid-cols-5 gap-4">
          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Nama Cabang"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />

          <input
            type="number"
            className="border rounded-lg px-4 py-2"
            placeholder="Radius (meter)"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />

          <button
            onClick={tambahCabang}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
          >
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-sm text-gray-600">
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
                <td className="p-4">{b.nama}</td>

                <td className="p-4">{b.latitude}</td>

                <td className="p-4">{b.longitude}</td>

                <td className="p-4">{b.radius} m</td>

                <td className="p-4">
                  <button
                    onClick={() => setEditData(b)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
      {editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px]">
            <h2 className="font-semibold text-lg mb-4">Edit Cabang</h2>

            <div className="space-y-3">
              <input
                className="border rounded-lg px-4 py-2 w-full"
                value={editData.nama}
                onChange={(e) =>
                  setEditData({ ...editData, nama: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full"
                value={editData.latitude}
                onChange={(e) =>
                  setEditData({ ...editData, latitude: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full"
                value={editData.longitude}
                onChange={(e) =>
                  setEditData({ ...editData, longitude: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full"
                value={editData.radius}
                onChange={(e) =>
                  setEditData({ ...editData, radius: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditData(null)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>

              <button
                onClick={updateCabang}
                className="bg-blue-600 text-white px-4 py-2 rounded"
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
