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
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Kelola Cabang</h1>

        <p className="text-gray-500 text-sm">
          Atur lokasi cabang untuk verifikasi absensi guru
        </p>
      </div>

      {/* FORM TAMBAH */}

      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Tambah Cabang</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input
            className="border rounded-lg px-4 py-2 text-sm"
            placeholder="Nama Cabang"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2 text-sm"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2 text-sm"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />

          <input
            type="number"
            className="border rounded-lg px-4 py-2 text-sm"
            placeholder="Radius (meter)"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
          <button
            onClick={tambahCabang}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium px-4 py-2 w-full md:w-auto"
          >
            {loading ? "Menyimpan..." : "Tambah Cabang"}
          </button>
        </div>
      </div>

      {/* DATA CABANG */}

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
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

            <div className="space-y-3 mt-4">
              <input
                className="border rounded-lg px-4 py-2 w-full text-sm"
                value={editData.nama}
                onChange={(e) =>
                  setEditData({ ...editData, nama: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full text-sm"
                value={editData.latitude}
                onChange={(e) =>
                  setEditData({ ...editData, latitude: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full text-sm"
                value={editData.longitude}
                onChange={(e) =>
                  setEditData({ ...editData, longitude: e.target.value })
                }
              />

              <input
                className="border rounded-lg px-4 py-2 w-full text-sm"
                value={editData.radius}
                onChange={(e) =>
                  setEditData({ ...editData, radius: e.target.value })
                }
              />
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
