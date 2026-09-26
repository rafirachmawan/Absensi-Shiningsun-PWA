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
import { FiEye, FiEyeOff, FiCamera, FiX, FiSearch } from "react-icons/fi";

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

    // HANYA AMBIL USER ROLE GURU (NON-SUPERADMIN)
    const onlyGuru = data.filter(
      (u) => (u.role || "guru").toLowerCase().trim() !== "superadmin",
    );

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
    <div className="w-full min-w-0 max-w-full space-y-5 sm:space-y-6">
      {/* HEADER CARD */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Manajemen Guru
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Kelola Data Guru
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan, sunting, dan atur akun tenaga pengajar
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] sm:w-auto"
        >
          <span>+ Tambah Guru Baru</span>
        </button>
      </div>

      {/* SEARCH BAR CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pencarian Guru
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
            {filteredGuru.length} guru
          </span>
        </div>

        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, username, cabang, atau no hp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      {/* FORM */}

      {showForm &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
            className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm animate-fadeIn sm:p-6"
          >
            <div className="my-auto flex max-h-[90vh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex shrink-0 items-center justify-between gap-3 bg-black px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold tracking-tight text-white">
                    {editMode ? "Edit Data Guru" : "Tambah Guru Baru"}
                  </h2>
                  <p className="truncate text-xs text-stone-400">
                    {editMode
                      ? "Perbarui informasi profil dan kredensial guru"
                      : "Isi formulir untuk menambahkan akun guru baru"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  aria-label="Tutup"
                  className="shrink-0 rounded-xl p-2 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE FORM CONTENT) */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-w-0">
                {/* FOTO PROFIL UPLOAD */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-md"
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
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <FiCamera className="w-6 h-6 text-slate-400" />
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">Upload Foto</span>
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
                    <label className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer hover:underline">
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
                    <p className="text-xs text-slate-400 animate-pulse">Mengupload foto...</p>
                  )}
                </div>

                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tempat Lahir</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tanggal Lahir</label>
                    <input
                      type="date"
                      className={`border border-slate-200 rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-slate-500 appearance-none ${
                        !tanggalLahir ? "text-slate-400" : "text-slate-800"
                      }`}
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Alamat</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">No HP</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Cabang</label>
                    <select
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
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
                    <label className="text-sm font-semibold text-slate-700">Jabatan</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      placeholder="Contoh: Guru Kelas / Koordinator"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Tanggal Masuk</label>
                    <input
                      type="date"
                      className={`border border-slate-200 rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-slate-500 appearance-none ${
                        !tglMasuk ? "text-slate-400" : "text-slate-800"
                      }`}
                      value={tglMasuk}
                      onChange={(e) => setTglMasuk(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Jam Masuk</label>
                      <input
                        type="time"
                        className={`border border-slate-200 rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-slate-500 appearance-none ${
                          !jamMasuk ? "text-slate-400" : "text-slate-800"
                        }`}
                        value={jamMasuk}
                        onChange={(e) => setJamMasuk(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Jam Mulai Absen</label>
                      <input
                        type="time"
                        className={`border border-slate-200 rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-slate-500 appearance-none ${
                          !jamMulaiAbsen ? "text-slate-400" : "text-slate-800"
                        }`}
                        value={jamMulaiAbsen}
                        onChange={(e) => setJamMulaiAbsen(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Jam Pulang</label>
                      <input
                        type="time"
                        className={`border border-slate-200 rounded-lg px-3 py-2 w-full text-sm outline-none focus:border-slate-500 appearance-none ${
                          !jamPulang ? "text-slate-400" : "text-slate-800"
                        }`}
                        value={jamPulang}
                        onChange={(e) => setJamPulang(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Batas Telat (menit)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 15"
                        className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                        value={batasTelat}
                        onChange={(e) => setBatasTelat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Gaji Pokok</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={gajiPokok}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setGajiPokok)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Insentif</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={insentif}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setInsentif)
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Bonus Kehadiran</label>
                    <input
                      inputMode="numeric"
                      placeholder="Contoh: 2.000.000"
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={bonusKehadiran}
                      onChange={(e) =>
                        handleCurrencyInput(e.target.value, setBonusKehadiran)
                      }
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      placeholder="contoh: guru@gmail.com"
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* USERNAME */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Nama Login (Username)</label>
                    <input
                      className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 text-sm"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <label className="text-sm font-semibold text-slate-700">
                      Password {editMode && "(Opsional)"}
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="border border-slate-200 rounded-lg px-3 py-2 w-full outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 pr-10 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex shrink-0 flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer w-full sm:w-auto rounded-xl border border-slate-200 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={editMode ? updateGuru : tambahGuru}
                  disabled={loading || uploadingPhoto}
                  className="cursor-pointer w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-2.5 min-h-[44px] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : editMode ? "Simpan Perubahan" : "Simpan Guru"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* TABLE + MOBILE CARD LIST */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full max-w-full">
        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase font-extrabold tracking-wider">
              <tr>
                <th className="py-4 px-6 text-left">Nama & Profil Guru</th>
                <th className="py-4 px-6 text-left">Cabang Sekolah</th>
                <th className="py-4 px-6 text-left">Status Akun</th>
                <th className="py-4 px-6 text-right">Tindakan Admin</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 text-sm">
                    Tidak ada data guru ditemukan
                  </td>
                </tr>
              ) : (
                filteredGuru.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            g.photoURL ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=F1F5F9&color=0F172A&bold=true`
                          }
                          alt={g.namaLengkap}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shadow-sm shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{g.namaLengkap}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            <span>@{g.username || "guru"}</span>
                            {g.jabatan && <span className="text-slate-300">•</span>}
                            {g.jabatan && <span>{g.jabatan}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {g.cabang || "Tanpa Cabang"}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {g.aktif ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(g)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(g)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetPassword(g)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Reset
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(g.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE CARD LIST ================= */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredGuru.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Tidak ada data guru ditemukan
            </div>
          ) : (
            filteredGuru.map((g) => (
              <div key={g.id} className="p-4 space-y-3">
                {/* HEADER */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        g.photoURL ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(g.namaLengkap || "G")}&background=F1F5F9&color=0F172A&bold=true`
                      }
                      alt={g.namaLengkap}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200/80 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {g.namaLengkap}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        @{g.username || "guru"} {g.jabatan ? `• ${g.jabatan}` : ""}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      g.aktif
                        ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                        : "border-rose-200/80 bg-rose-50 text-rose-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        g.aktif ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {g.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                {/* INFO PILLS */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 border border-slate-200/60 break-words">
                    Cabang: {g.cabang || "-"}
                  </span>
                  {g.noHp && (
                    <span className="text-slate-500 font-mono text-[11px] break-all">HP: {g.noHp}</span>
                  )}
                </div>

                {/* ACTION BUTTONS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(g)}
                    className="min-h-[44px] px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Edit Data
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStatus(g)}
                    className="min-h-[44px] px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    {g.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResetPassword(g)}
                    className="min-h-[44px] px-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Reset Pass
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    className="min-h-[44px] px-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
