import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";

import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";

export default function Dashboard() {
  const navigate = useNavigate();

  const [time, setTime] = useState("");
  const [user, setUser] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalAdmin, setTotalAdmin] = useState(0);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Lebih Awal":
        return "bg-green-100 text-green-700";

      case "Tepat Waktu":
        return "bg-blue-100 text-blue-700";

      case "Terlambat":
        return "bg-yellow-100 text-yellow-700";

      case "Terlambat Berat":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Lebih Awal":
        return "🟢";

      case "Tepat Waktu":
        return "🔵";

      case "Terlambat":
        return "🟡";

      case "Terlambat Berat":
        return "🔴";

      default:
        return "⚪";
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();

      const timeString = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const dateString = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setTime(`${dateString} • ${timeString}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubRiwayat = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUser(snap.data());
      }

      const q = query(
        collection(db, "attendance"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      );

      unsubRiwayat = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRiwayat(data);
      });
    });

    return () => {
      if (unsubRiwayat) unsubRiwayat();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());

      // 🔥 FILTER ROLE
      const guru = data.filter((u) => u.role === "guru");
      const admin = data.filter(
        (u) => u.role === "admin" || u.role === "superadmin",
      );

      setTotalGuru(guru.length);
      setTotalAdmin(admin.length);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const uploadProfile = async (file) => {
    try {
      setUploading(true);

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

      const userRef = doc(db, "users", auth.currentUser.uid);

      await updateDoc(userRef, {
        photoURL: data.secure_url,
      });

      setUser((prev) => ({
        ...prev,
        photoURL: data.secure_url,
      }));
    } catch (err) {
      alert("Upload gagal");
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex justify-between">
          <div>
            <h1 className="text-lg font-semibold">SHININGSUN</h1>
            <p className="text-xs opacity-80">Sistem Absensi Guru</p>
            <p className="text-xs opacity-80">{time}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <img
              onClick={() => setPreview(true)}
              src={
                user?.photoURL ||
                "https://ui-avatars.com/api/?name=" +
                  (user?.namaLengkap || "Guru")
              }
              className="w-10 h-10 rounded-full object-cover border cursor-pointer"
            />

            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs"
            >
              Logout{" "}
            </button>
          </div>
        </div>
      </div>

      {/* PREVIEW FOTO */}

      {preview && (
        <div
          onClick={() => setPreview(false)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <img
            src={
              user?.photoURL ||
              "https://ui-avatars.com/api/?name=" +
                (user?.namaLengkap || "Guru")
            }
            className="max-h-[80%] rounded-lg"
          />
        </div>
      )}

      {/* CONTENT */}

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 pt-6 pb-[160px]">
        {/* DASHBOARD */}

        {tab === "dashboard" && (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/absen")}
              className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl shadow text-left"
            >
              <h2 className="text-lg font-semibold mb-1">Absen Masuk</h2>

              <p className="text-sm opacity-90">
                Catat kehadiran saat datang ke sekolah
              </p>
            </button>

            <button
              onClick={() => navigate("/absen-pulang")}
              className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-2xl shadow text-left"
            >
              <h2 className="text-lg font-semibold mb-1">Absen Pulang</h2>

              <p className="text-sm opacity-90">
                Catat waktu pulang setelah selesai mengajar
              </p>
            </button>
          </div>
        )}

        {/* REKAP */}

        {tab === "rekap" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold mb-4">Riwayat Absensi</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="border px-3 py-2 rounded text-sm"
              />

              <input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="border px-3 py-2 rounded text-sm"
              />
            </div>

            {riwayat.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada riwayat absensi</p>
            ) : (
              <div className="overflow-x-auto">
                {(() => {
                  const filtered = riwayat.filter((d) => {
                    if (!tanggalMulai || !tanggalSelesai) return true;

                    return (
                      d.tanggal >= tanggalMulai && d.tanggal <= tanggalSelesai
                    );
                  });

                  const grouped = {};
                  filtered.forEach((d) => {
                    if (!grouped[d.tanggal]) grouped[d.tanggal] = [];
                    grouped[d.tanggal].push(d);
                  });

                  const tanggalList = Object.keys(grouped).sort(
                    (a, b) => new Date(b) - new Date(a),
                  );

                  return (
                    <table className="min-w-[800px] w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border p-2 text-left">Tanggal</th>
                          <th className="border p-2 text-center">Masuk</th>
                          <th className="border p-2 text-center">Status</th>
                          <th className="border p-2 text-center">Keterangan</th>
                          <th className="border p-2 text-center">Pulang</th>
                          <th className="border p-2 text-center">Status</th>
                          <th className="border p-2 text-center">Keterangan</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tanggalList.map((tgl, i) => {
                          const dataHari = grouped[tgl][0];

                          return (
                            <tr key={i}>
                              <td className="border p-2">
                                {new Date(tgl).toLocaleDateString("id-ID")}
                              </td>

                              <td className="border p-2 text-center text-green-700">
                                {dataHari?.waktu || "-"}
                              </td>

                              <td className="border p-2 text-center">
                                {dataHari?.status || "-"}
                              </td>

                              <td className="border p-2">
                                {dataHari?.keterangan || "-"}
                              </td>

                              <td className="border p-2 text-center text-red-600">
                                {dataHari?.jamPulang || "-"}
                              </td>

                              <td className="border p-2 text-center">
                                {dataHari?.statusPulang || "-"}
                              </td>

                              <td className="border p-2">
                                {dataHari?.keteranganPulang || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}

        {tab === "profile" && (
          <div className="bg-white rounded-2xl shadow p-6 max-w-4xl mx-auto w-full">
            <div className="flex flex-col items-center mb-6">
              <img
                onClick={() => setPreview(true)}
                src={
                  user?.photoURL ||
                  "https://ui-avatars.com/api/?name=" +
                    (user?.namaLengkap || "Guru")
                }
                className="w-24 h-24 rounded-full object-cover border mb-3 cursor-pointer"
              />

              <label className="bg-blue-600 text-white px-4 py-1 text-sm rounded cursor-pointer">
                Ganti Foto
                <input
                  type="file"
                  hidden
                  onChange={(e) => uploadProfile(e.target.files[0])}
                />
              </label>

              {uploading && (
                <p className="text-xs text-gray-500 mt-1">Uploading...</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 text-sm">
              <div>
                <b>Nama</b>
                <br />
                {user?.namaLengkap}
              </div>

              <div>
                <b>Username</b>
                <br />
                {user?.username}
              </div>

              <div>
                <b>No HP</b>
                <br />
                {user?.noHp}
              </div>

              <div>
                <b>Cabang</b>
                <br />
                {user?.cabang}
              </div>

              <div>
                <b>Tempat Lahir</b>
                <br />
                {user?.tempatLahir}
              </div>

              <div>
                <b>Tanggal Lahir</b>
                <br />
                {user?.tanggalLahir}
              </div>

              <div className="md:col-span-2">
                <b>Alamat</b>
                <br />
                {user?.alamat}
              </div>

              <div>
                <b>Tanggal Masuk</b>
                <br />
                {user?.tglMasuk}
              </div>

              <div>
                <b>Jam Masuk</b>
                <br />
                {user?.jamMasuk}
              </div>

              <div>
                <b>Jam Pulang</b>
                <br />
                {user?.jamPulang}
              </div>

              <div>
                <b>Jam Mulai Absen</b>
                <br />
                {user?.jamMulaiAbsen}
              </div>

              <div>
                <b>Batas Telat</b>
                <br />
                {user?.batasTelat} menit
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow z-50">
        <div
          className="grid grid-cols-3 text-xs text-center"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
          }}
        >
          <button
            onClick={() => setTab("dashboard")}
            className={`flex flex-col items-center justify-center py-2 ${
              tab === "dashboard" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-xl leading-none">🏠</span>
            Dashboard
          </button>

          <button
            onClick={() => setTab("rekap")}
            className={`flex flex-col items-center justify-center py-2 ${
              tab === "rekap" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-lg">📊</span>
            Rekapan
          </button>

          <button
            onClick={() => setTab("profile")}
            className={`flex flex-col items-center justify-center py-2 ${
              tab === "profile" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-lg">👤</span>
            Profile
          </button>
        </div>
      </div>
    </div>
  );
}
