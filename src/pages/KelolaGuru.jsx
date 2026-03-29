import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { auth, db, secondaryAuth } from "../firebase";

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

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [namaLengkap, setNamaLengkap] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noHp, setNoHp] = useState("");
  const [cabang, setCabang] = useState("");

  const [tglMasuk, setTglMasuk] = useState("");
  const [jamMasuk, setJamMasuk] = useState("");
  const [jamPulang, setJamPulang] = useState("");
  const [jamMulaiAbsen, setJamMulaiAbsen] = useState("");

  const [batasTelat, setBatasTelat] = useState("");

  const [gajiPokok, setGajiPokok] = useState("");
  const [insentif, setInsentif] = useState("");
  const [bonusKehadiran, setBonusKehadiran] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const usersRef = collection(db, "users");
  const branchesRef = collection(db, "branches");

  const handleCurrencyInput = (value, setter) => {
    const onlyNumber = value.replace(/[^\d]/g, "");
    const formatted = formatRupiah(onlyNumber);
    setter(formatted);
  };

  /* FORMAT RUPIAH */

  const formatRupiah = (value) => {
    const number = value.replace(/[^\d]/g, "");

    if (!number) return "";

    return "Rp" + new Intl.NumberFormat("id-ID").format(number);
  };

  const getNumber = (value) => {
    return value.replace(/[^\d]/g, "");
  };

  const loadGuru = async () => {
    const snapshot = await getDocs(usersRef);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // HANYA AMBIL USER ROLE GURU
    const onlyGuru = data.filter((u) => u.role === "guru");

    // SORT BERDASARKAN NAMA A-Z
    const sortedGuru = onlyGuru.sort((a, b) =>
      (a.namaLengkap || "").localeCompare(b.namaLengkap || "", "id", {
        sensitivity: "base",
      }),
    );

    setGuru(sortedGuru);
  };

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

  const tambahGuru = async () => {
    if (!namaLengkap || !username || !password || !cabang) {
      alert("Lengkapi data");
      return;
    }

    try {
      setLoading(true);

      const email = username + "@shiningsun.com";

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        alamat,
        noHp,
        cabang,
        tglMasuk,
        jamMasuk,
        jamPulang,
        jamMulaiAbsen,
        batasTelat,
        gajiPokok: getNumber(gajiPokok),
        insentif: getNumber(insentif),
        bonusKehadiran: getNumber(bonusKehadiran),
        username,
        email,
        role: "guru",
        aktif: true,
        createdAt: new Date(),
      });

      setShowForm(false);

      setNamaLengkap("");
      setTempatLahir("");
      setTanggalLahir("");
      setAlamat("");
      setNoHp("");
      setCabang("");
      setTglMasuk("");
      setJamMasuk("");
      setJamPulang("");
      setJamMulaiAbsen("");
      setGajiPokok("");
      setBatasTelat("");
      setInsentif("");
      setBonusKehadiran("");
      setUsername("");
      setPassword("");

      loadGuru();

      alert("Guru berhasil ditambahkan");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  const handleEdit = (g) => {
    setShowForm(true);
    setEditMode(true);
    setEditId(g.id);

    setNamaLengkap(g.namaLengkap || "");
    setTempatLahir(g.tempatLahir || "");
    setTanggalLahir(g.tanggalLahir || "");
    setAlamat(g.alamat || "");
    setNoHp(g.noHp || "");
    setCabang(g.cabang || "");

    setTglMasuk(g.tglMasuk || "");
    setJamMasuk(g.jamMasuk || "");
    setJamPulang(g.jamPulang || "");
    setBatasTelat(g.batasTelat || "");
    setJamMulaiAbsen(g.jamMulaiAbsen || "");

    setGajiPokok(g.gajiPokok ? formatRupiah(g.gajiPokok.toString()) : "");
    setInsentif(g.insentif ? formatRupiah(g.insentif.toString()) : "");
    setBonusKehadiran(
      g.bonusKehadiran ? formatRupiah(g.bonusKehadiran.toString()) : "",
    );

    setUsername(g.username || "");
  };

  const toggleStatus = async (user) => {
    try {
      const ref = doc(db, "users", user.id);

      const newStatus = user.aktif === true ? false : true;

      await updateDoc(ref, {
        aktif: newStatus,
      });

      await loadGuru();
    } catch (error) {
      console.error(error);
      alert("Gagal mengubah status");
    }
  };

  const updateGuru = async () => {
    try {
      const ref = doc(db, "users", editId);

      await updateDoc(ref, {
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        alamat,
        noHp,
        cabang,
        tglMasuk,
        jamMasuk,
        jamPulang,
        jamMulaiAbsen,
        batasTelat,
        gajiPokok: getNumber(gajiPokok),
        insentif: getNumber(insentif),
        bonusKehadiran: getNumber(bonusKehadiran),
        username,
      });

      alert("Data guru berhasil diupdate");

      setEditMode(false);
      setShowForm(false);

      loadGuru();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredGuru = guru.filter((g) => {
    const keyword = search.toLowerCase();

    return (
      (g.namaLengkap || "").toLowerCase().includes(keyword) ||
      (g.username || "").toLowerCase().includes(keyword) ||
      (g.cabang || "").toLowerCase().includes(keyword) ||
      (g.noHp || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Kelola Guru</h1>
          <p className="text-gray-500 text-sm">
            Tambahkan dan kelola akun guru
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditMode(false);
            setEditId(null);

            setNamaLengkap("");
            setTempatLahir("");
            setTanggalLahir("");
            setAlamat("");
            setNoHp("");
            setCabang("");
            setTglMasuk("");
            setJamMasuk("");
            setJamPulang("");
            setJamMulaiAbsen("");
            setBatasTelat("");
            setGajiPokok("");
            setInsentif("");
            setBonusKehadiran("");
            setUsername("");
            setPassword("");
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Tambah Guru
        </button>
      </div>

      {/* SEARCH */}

      <div className="bg-white border rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Pencarian Guru</h3>

        <input
          type="text"
          placeholder="Cari nama, username, cabang atau no hp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full text-sm"
        />
      </div>

      {/* FORM */}

      {showForm && (
        <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold">Tambah Guru</h2>

          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            <div>
              <label className="text-sm text-gray-600">Nama Lengkap</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Tempat Lahir</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Tanggal Lahir</label>
              <input
                type="date"
                className={`border rounded-lg px-3 py-2 w-full appearance-none ${
                  !tanggalLahir ? "text-gray-400" : "text-gray-800"
                }`}
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Alamat</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">No HP</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Cabang</label>
              <select
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
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
            </div>

            <div>
              <label className="text-sm text-gray-600">Tanggal Masuk</label>
              <input
                type="date"
                className={`border rounded-lg px-3 py-2 w-full appearance-none ${
                  !tglMasuk ? "text-gray-400" : "text-gray-800"
                }`}
                value={tglMasuk}
                onChange={(e) => setTglMasuk(e.target.value)}
              />
            </div>

            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="text-sm text-gray-600">Jam Masuk</label>
                <input
                  type="time"
                  className={`border rounded-lg px-3 py-2 w-full appearance-none ${
                    !jamMasuk ? "text-gray-400" : "text-gray-800"
                  }`}
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Jam Mulai Absen</label>
                <input
                  type="time"
                  className={`border rounded-lg px-3 py-2 w-full appearance-none ${
                    !jamMasuk ? "text-gray-400" : "text-gray-800"
                  }`}
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="text-sm text-gray-600">Jam Pulang</label>
                <input
                  type="time"
                  className={`border rounded-lg px-3 py-2 w-full appearance-none ${
                    !jamMasuk ? "text-gray-400" : "text-gray-800"
                  }`}
                  value={jamMasuk}
                  onChange={(e) => setJamMasuk(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Batas Keterlambatan (menit)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 15"
                  className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  value={batasTelat}
                  onChange={(e) => setBatasTelat(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Gaji Pokok</label>
              <input
                inputMode="numeric"
                placeholder="Contoh: 2.000.000"
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={gajiPokok}
                onChange={(e) =>
                  handleCurrencyInput(e.target.value, setGajiPokok)
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Insentif</label>
              <input
                inputMode="numeric"
                placeholder="Contoh: 2.000.000"
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={insentif}
                onChange={(e) =>
                  handleCurrencyInput(e.target.value, setInsentif)
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Bonus Kehadiran</label>
              <input
                inputMode="numeric"
                placeholder="Contoh: 2.000.000"
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={bonusKehadiran}
                onChange={(e) =>
                  handleCurrencyInput(e.target.value, setBonusKehadiran)
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Nama Login</label>
              <input
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                type="password"
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={editMode ? updateGuru : tambahGuru}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Simpan
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}

      <div className="bg-white border rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 text-left">Nama Lengkap</th>
                <th className="p-4 text-left">Cabang</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredGuru.map((g) => (
                <tr key={g.id} className="border-t">
                  <td className="p-4 font-medium">{g.namaLengkap}</td>
                  <td className="p-4">{g.cabang}</td>

                  <td className="p-4">
                    {g.aktif ? (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(g)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleStatus(g)}
                      className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded text-xs"
                    >
                      {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
