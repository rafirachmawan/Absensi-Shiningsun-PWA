import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail, // ✅ TAMBAH INI
} from "firebase/auth";

import { auth, db, secondaryAuth } from "../firebase";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  deleteDoc, // ✅ TAMBAHKAN INI
} from "firebase/firestore";
import { FiEye, FiEyeOff, FiCamera, FiX } from "react-icons/fi";

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
  const [jabatan, setJabatan] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const usersRef = collection(db, "users");
  const branchesRef = collection(db, "branches");

  const [showPassword, setShowPassword] = useState(false);

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

  /* UPLOAD FOTO KE CLOUDINARY */
  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "absensi_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dbefoaekm/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    return data.secure_url;
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoURL("");
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
    if (!namaLengkap || !username || !password || !cabang || !email) {
      alert("Lengkapi data");
      return;
    }

    try {
      setLoading(true);

      // pakai email langsung dari input

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );

      const uid = userCredential.user.uid;

      // Upload foto jika ada
      let finalPhotoURL = photoURL;
      if (photoFile) {
        setUploadingPhoto(true);
        finalPhotoURL = await uploadPhoto(photoFile);
        setUploadingPhoto(false);
      }

      await setDoc(doc(db, "users", uid), {
        uid,
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        alamat,
        noHp,
        cabang,
        jabatan,
        photoURL: finalPhotoURL,
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
      setJabatan("");
      setPhotoURL("");
      setPhotoFile(null);
      setPhotoPreview("");
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
      setEmail("");

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
    setJabatan(g.jabatan || "");
    setPhotoURL(g.photoURL || "");
    setPhotoFile(null);
    setPhotoPreview(g.photoURL || "");

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
    setEmail(g.email || "");
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
    if (!namaLengkap || !username || !cabang || !email) {
      alert("Lengkapi data");
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim();
      const cleanUsername = username.trim();

      const ref = doc(db, "users", editId);

      // Upload foto baru jika ada
      let finalPhotoURL = photoURL;
      if (photoFile) {
        setUploadingPhoto(true);
        finalPhotoURL = await uploadPhoto(photoFile);
        setUploadingPhoto(false);
      }

      await updateDoc(ref, {
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        alamat,
        noHp,
        cabang,
        jabatan,
        photoURL: finalPhotoURL,
        tglMasuk,
        jamMasuk,
        jamPulang,
        jamMulaiAbsen,
        batasTelat,
        gajiPokok: getNumber(gajiPokok),
        insentif: getNumber(insentif),
        bonusKehadiran: getNumber(bonusKehadiran),
        username: cleanUsername,
        email: cleanEmail,
      });

      // 🔥 Sinkronkan ke Firebase Auth menggunakan secondaryAuth jika password diisi
      if (password) {
        try {
          await createUserWithEmailAndPassword(
            secondaryAuth,
            cleanEmail,
            password,
          );
        } catch (authErr) {
          console.log("Status sync Firebase Auth:", authErr.code);
        }
      }

      alert("Data guru berhasil diupdate");

      setEditMode(false);
      setShowForm(false);
      setPassword("");
      setPhotoFile(null);
      setPhotoPreview("");

      loadGuru();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Yakin ingin menghapus guru ini?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", id));

      alert("Guru berhasil dihapus");

      loadGuru(); // refresh data
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus guru");
    }
  };

  const handleResetPassword = async (g) => {
    const confirmReset = confirm(
      `Kirim reset password untuk ${g.namaLengkap}?`,
    );

    if (!confirmReset) return;

    try {
      await sendPasswordResetEmail(auth, g.email);

      alert(
        `Reset password dikirim ke ${g.email}\n\nSuruh guru cek inbox / spam`,
      );
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        alert("Email tidak ditemukan di Firebase Auth");
      } else {
        alert("Gagal reset password: " + error.message);
      }
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
            setJabatan("");
            setPhotoURL("");
            setPhotoFile(null);
            setPhotoPreview("");
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
            setEmail("");
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

      {showForm &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
            className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          >
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
              {/* MODAL HEADER */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editMode ? "Edit Data Guru" : "Tambah Guru Baru"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editMode
                      ? "Perbarui informasi profil dan kredensial guru"
                      : "Isi formulir untuk menambahkan akun guru baru"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE FORM CONTENT) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* FOTO PROFIL UPLOAD */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-100 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={clearPhoto}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md transition-colors"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50 transition-colors">
                        <FiCamera className="w-6 h-6 text-gray-400" />
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">Upload Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handlePhotoSelect}
                        />
                      </label>
                    )}
                  </div>
                  {photoPreview && (
                    <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer hover:underline">
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handlePhotoSelect}
                      />
                    </label>
                  )}
                  {uploadingPhoto && (
                    <p className="text-xs text-gray-400 animate-pulse">Mengupload foto...</p>
                  )}
                </div>

                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tempat Lahir</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tanggal Lahir</label>
                    <input
                      type="date"
                      className={`border rounded-lg px-3 py-2 w-full text-sm appearance-none ${
                        !tanggalLahir ? "text-gray-400" : "text-gray-800"
                      }`}
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Alamat</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">No HP</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Cabang</label>
                    <select
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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
                    <label className="text-sm font-semibold text-gray-700">Jabatan</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="Contoh: Guru Kelas / Koordinator"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tanggal Masuk</label>
                    <input
                      type="date"
                      className={`border rounded-lg px-3 py-2 w-full text-sm appearance-none ${
                        !tglMasuk ? "text-gray-400" : "text-gray-800"
                      }`}
                      value={tglMasuk}
                      onChange={(e) => setTglMasuk(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Jam Masuk</label>
                      <input
                        type="time"
                        className={`border rounded-lg px-3 py-2 w-full text-sm appearance-none ${
                          !jamMasuk ? "text-gray-400" : "text-gray-800"
                        }`}
                        value={jamMasuk}
                        onChange={(e) => setJamMasuk(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">Jam Mulai Absen</label>
                      <input
                        type="time"
                        className={`border rounded-lg px-3 py-2 w-full text-sm appearance-none ${
                          !jamMulaiAbsen ? "text-gray-400" : "text-gray-800"
                        }`}
                        value={jamMulaiAbsen}
                        onChange={(e) => setJamMulaiAbsen(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Jam Pulang</label>
                      <input
                        type="time"
                        className={`border rounded-lg px-3 py-2 w-full text-sm appearance-none ${
                          !jamPulang ? "text-gray-400" : "text-gray-800"
                        }`}
                        value={jamPulang}
                        onChange={(e) => setJamPulang(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Batas Telat (menit)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 15"
                        className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={batasTelat}
                        onChange={(e) => setBatasTelat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Gaji Pokok</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={gajiPokok}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setGajiPokok)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Insentif</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={insentif}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setInsentif)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Bonus Kehadiran</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={bonusKehadiran}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setBonusKehadiran)
                      }
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      placeholder="contoh: guru@gmail.com"
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* USERNAME */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nama Login (Username)</label>
                    <input
                      className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <label className="text-sm font-semibold text-gray-700">
                      Password {editMode && "(Opsional)"}
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none pr-10 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={editMode ? updateGuru : tambahGuru}
                  disabled={loading || uploadingPhoto}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : editMode ? "Simpan Perubahan" : "Simpan Guru"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* TABLE + MOBILE CARD */}

      <div className="bg-white border rounded-2xl shadow-sm">
        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
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
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          g.photoURL ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=EEF2FF&color=4F46E5&bold=true`
                        }
                        alt={g.namaLengkap}
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 shadow-sm"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{g.namaLengkap}</p>
                        {g.jabatan && (
                          <p className="text-xs text-gray-400">{g.jabatan}</p>
                        )}
                      </div>
                    </div>
                  </td>
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

                  <td className="p-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEdit(g)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleStatus(g)}
                      className="bg-gray-700 text-white px-3 py-1 rounded text-xs"
                    >
                      {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>

                    <button
                      onClick={() => handleDelete(g.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Hapus
                    </button>

                    <button
                      onClick={() => handleResetPassword(g)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE CARD ================= */}
        <div className="md:hidden divide-y">
          {filteredGuru.map((g) => (
            <div key={g.id} className="p-4 space-y-3">
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      g.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=EEF2FF&color=4F46E5&bold=true`
                    }
                    alt={g.namaLengkap}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-sm"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{g.namaLengkap}</h3>
                    {g.jabatan && (
                      <p className="text-xs text-gray-400">{g.jabatan}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded ${
                    g.aktif
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {g.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              {/* CABANG */}
              <p className="text-sm text-gray-500">Cabang: {g.cabang}</p>

              {/* ACTION */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  className="bg-yellow-500 text-white py-2 rounded text-xs"
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleStatus(g)}
                  className="bg-gray-700 text-white py-2 rounded text-xs"
                >
                  {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                </button>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="bg-red-600 text-white py-2 rounded text-xs"
                >
                  Hapus
                </button>

                <button
                  onClick={() => handleResetPassword(g)}
                  className="bg-blue-500 text-white py-2 rounded text-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
