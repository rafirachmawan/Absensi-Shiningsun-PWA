import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { auth, db } from "../firebase";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc,
} from "firebase/firestore";

export default function KelolaGuru() {
  const [guru, setGuru] = useState([]);
  const [branches, setBranches] = useState([]);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cabang, setCabang] = useState("");

  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState(null);

  const usersRef = collection(db, "users");
  const branchesRef = collection(db, "branches");

  /* ================= LOAD GURU ================= */

  const loadGuru = async () => {
    const snapshot = await getDocs(usersRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setGuru(data);
  };

  /* ================= LOAD CABANG ================= */

  const loadBranches = async () => {
    const snapshot = await getDocs(branchesRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setBranches(data);
  };

  useEffect(() => {
    loadGuru();
    loadBranches();
  }, []);

  /* ================= TAMBAH GURU ================= */

  const tambahGuru = async () => {
    if (!nama || !email || !password || !cabang) {
      alert("Lengkapi data");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        nama,
        email,
        cabang,
        role: "guru",
        aktif: true,
        createdAt: new Date(),
      });

      await signOut(auth);

      setNama("");
      setEmail("");
      setPassword("");
      setCabang("");

      loadGuru();

      alert("Guru berhasil ditambahkan");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  /* ================= UPDATE GURU ================= */

  const updateGuru = async () => {
    try {
      const ref = doc(db, "users", editData.id);

      await updateDoc(ref, {
        nama: editData.nama,
        cabang: editData.cabang,
      });

      setEditData(null);

      loadGuru();

      alert("Data guru berhasil diupdate");
    } catch (err) {
      alert(err.message);
    }
  };

  /* ================= NONAKTIFKAN GURU ================= */

  const toggleStatus = async (user) => {
    const ref = doc(db, "users", user.id);

    await updateDoc(ref, {
      aktif: !user.aktif,
    });

    loadGuru();
  };

  return (
    <div className="space-y-6">
      {/* TITLE */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Kelola Guru</h1>

        <p className="text-gray-500 text-sm">Tambahkan dan kelola akun guru</p>
      </div>

      {/* FORM TAMBAH */}

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="font-semibold mb-4">Tambah Guru</h2>

        <div className="grid md:grid-cols-5 gap-4">
          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Nama Guru"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />

          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="border rounded-lg px-4 py-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            className="border rounded-lg px-4 py-2"
            value={cabang}
            onChange={(e) => setCabang(e.target.value)}
          >
            <option value="">Pilih Cabang</option>

            {branches.map((b) => (
              <option key={b.id} value={b.nama}>
                {b.nama}
              </option>
            ))}
          </select>

          <button
            onClick={tambahGuru}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
          >
            {loading ? "Menyimpan..." : "Tambah Guru"}
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-sm text-gray-600">
              <th className="p-4 text-left">Nama</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Cabang</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {guru.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="p-4">{g.nama}</td>
                <td className="p-4">{g.email}</td>
                <td className="p-4">{g.cabang}</td>

                <td className="p-4">
                  {g.aktif ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                      Aktif
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                      Nonaktif
                    </span>
                  )}
                </td>

                <td className="p-4 flex gap-2">
                  {g.role !== "superadmin" && (
                    <button
                      onClick={() => setEditData(g)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                  )}

                  {g.role !== "superadmin" && (
                    <button
                      onClick={() => toggleStatus(g)}
                      className="bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= MODAL EDIT (UI DIPERBAIKI) ================= */}

        {editData && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[480px] rounded-xl shadow-xl border p-7">
              <h2 className="text-xl font-semibold text-gray-800">
                Edit Data Guru
              </h2>

              <p className="text-sm text-gray-500 mt-1 mb-6">
                Ubah nama atau cabang guru jika diperlukan.
              </p>

              <div className="space-y-5">
                {/* NAMA GURU */}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nama Guru
                  </label>

                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-1"
                    value={editData.nama}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        nama: e.target.value,
                      })
                    }
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Nama yang digunakan guru saat login ke sistem.
                  </p>
                </div>

                {/* CABANG */}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Cabang Guru
                  </label>

                  <select
                    className="border rounded-lg px-4 py-2 w-full mt-1"
                    value={editData.cabang}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cabang: e.target.value,
                      })
                    }
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.nama}>
                        {b.nama}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-gray-500 mt-1">
                    Cabang menentukan lokasi absensi guru.
                  </p>
                </div>
              </div>

              {/* BUTTON */}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setEditData(null)}
                  className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  onClick={updateGuru}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
