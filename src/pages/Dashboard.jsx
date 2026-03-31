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
        limit(10),
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
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();

        console.log("USER:", d.namaLengkap, "| ROLE:", d.role);

        return d;
      });
      // 🔥 FILTER ROLE
      const guru = data.filter((u) => {
        const role = (u.role || "").toLowerCase().trim();

        if (role === "guru") {
          console.log("INI GURU:", u.namaLengkap, u.role);
          return true;
        }

        return false;
      });

      const admin = data.filter((u) => {
        const role = (u.role || "").toLowerCase().trim();
        return role === "admin" || role === "superadmin";
      });

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
          <div className="space-y-4">
            {/* 🔥 CARD TOTAL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow">
                <p className="text-sm text-gray-500">Total Guru</p>
                <h2 className="text-2xl font-bold">{totalGuru}</h2>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow">
                <p className="text-sm text-gray-500">Total Admin</p>
                <h2 className="text-2xl font-bold">{totalAdmin}</h2>
              </div>
            </div>

            {/* 🔥 MENU */}
            <div className="grid md:grid-cols-2 gap-4"></div>
          </div>
        )}
        {/* REKAP */}

        {tab === "rekap" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold mb-4">Riwayat Absensi</h2>

            {riwayat.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada riwayat absensi</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gray-500 text-xs">
                      <th className="text-left px-3">Tanggal</th>
                      <th className="text-center px-3">Datang</th>
                      <th className="text-center px-3">Pulang</th>
                      <th className="text-center px-3">Status</th>
                      <th className="text-left px-3">Keterangan</th>
                    </tr>
                  </thead>

                  <tbody>
                    {riwayat.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-gray-50 hover:bg-gray-100 transition rounded-xl shadow-sm"
                      >
                        {/* TANGGAL */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-800">
                            {new Date(item.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.tanggal).toLocaleDateString(
                              "id-ID",
                              {
                                weekday: "long",
                              },
                            )}
                          </div>
                        </td>

                        {/* DATANG */}
                        <td className="text-center px-3 py-3 font-medium">
                          {item.waktu || "-"}
                        </td>

                        {/* PULANG */}
                        <td className="text-center px-3 py-3 font-medium">
                          {item.jamPulang || "-"}
                        </td>

                        {/* STATUS */}
                        <td className="text-center px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                              item.status,
                            )}`}
                          >
                            <span>{getStatusIcon(item.status)}</span>
                            <span>{item.status}</span>
                          </span>
                        </td>

                        {/* KETERANGAN */}
                        <td className="px-3 py-3 text-xs text-gray-600 max-w-[200px] whitespace-normal break-words">
                          {item.keterangan || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
