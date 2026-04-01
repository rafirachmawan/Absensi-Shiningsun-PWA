import { useState } from "react";
import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";

export default function AbsenPulang() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [statusType, setStatusType] = useState("success");

  const [progress, setProgress] = useState("");

  /* ================= HITUNG JARAK ================= */

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /* ================= GPS FUNCTION ================= */

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),

        (error) => {
          console.log("GPS gagal, mencoba ulang...");

          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            },
          );
        },

        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  };

  /* ================= ABSEN PULANG ================= */

  const handleAbsenPulang = async () => {
    if (!navigator.geolocation) {
      alert("GPS tidak tersedia");
      return;
    }

    setLoading(true);
    setMessage("");
    setProgress("Mengambil lokasi GPS...");

    try {
      const position = await getLocation();

      setProgress("Memeriksa lokasi cabang...");

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const user = auth.currentUser;

      if (!user) {
        alert("User tidak ditemukan");
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        alert("Data user tidak ditemukan");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      // 🔥 TAMBAHAN JAM PULANG DARI DATABASE
      const jamPulangSetting = userData.jamPulang || "16:00";

      const now = new Date();
      // 🔥 KONVERSI JAM PULANG KE MENIT
      const [jamP, menitP] = jamPulangSetting.split(":");
      const jamPulangMinutes = parseInt(jamP) * 60 + parseInt(menitP);

      // 🔥 WAKTU SEKARANG DALAM MENIT
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // 🔥 SELISIH MENIT
      const selisihPulang = nowMinutes - jamPulangMinutes;
      const today = now.toLocaleDateString("en-CA");

      const q = query(
        collection(db, "branches"),
        where("nama", "==", userData.cabang),
      );

      const branchSnap = await getDocs(q);

      if (branchSnap.empty) {
        alert("Cabang tidak ditemukan");
        setLoading(false);
        return;
      }

      const branch = branchSnap.docs[0].data();

      let distance = null;

      if (
        typeof branch.latitude === "number" &&
        typeof branch.longitude === "number" &&
        typeof branch.radius === "number"
      ) {
        distance = getDistance(lat, lon, branch.latitude, branch.longitude);

        setProgress("Memverifikasi radius lokasi...");

        if (distance > branch.radius) {
          setStatusType("error");
          setMessage("❌ Anda berada di luar radius cabang sekolah.");
          setShowResult(true);
          setLoading(false);
          return;
        }
      }

      /* ================= CEK ABSEN MASUK ================= */

      const attendanceId = `${user.uid}_${today}`;
      const attendanceRef = doc(db, "attendance", attendanceId);

      const existing = await getDoc(attendanceRef);

      if (!existing.exists()) {
        setStatusType("warning");
        setMessage("⚠ Anda belum melakukan absensi masuk hari ini.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      if (existing.data().jamPulang) {
        setStatusType("warning");
        setMessage("⚠ Anda sudah melakukan absensi pulang.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      // 🔥 STATUS PULANG
      let statusPulang = "";
      let keteranganPulang = "";

      if (selisihPulang < 0) {
        statusPulang = "Pulang Cepat";
        keteranganPulang = `⚠ Anda pulang ${Math.abs(selisihPulang)} menit lebih awal.`;
      } else if (selisihPulang === 0) {
        statusPulang = "Tepat Waktu";
        keteranganPulang = "✅ Anda pulang tepat waktu.";
      } else {
        statusPulang = "Lembur";
        keteranganPulang = `🔥 Anda lembur ${selisihPulang} menit.`;
      }

      setProgress("Menyimpan data absensi pulang...");

      const jamPulang = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await updateDoc(attendanceRef, {
        jamPulang,
        latitudePulang: lat,
        longitudePulang: lon,

        // 🔥 TAMBAHAN BARU
        statusPulang,
        keteranganPulang,
        selisihPulang,
      });

      setStatusType("success");
      setMessage(keteranganPulang);
      setShowResult(true);
    } catch (err) {
      console.log(err);

      setShowResult(true);
      setStatusType("error");

      if (err.code === 1) {
        setMessage("❌ Izin lokasi ditolak. Aktifkan GPS di browser.");
      } else if (err.code === 2) {
        setMessage("❌ Lokasi tidak tersedia.");
      } else if (err.code === 3) {
        setMessage("❌ GPS terlalu lama mendapatkan lokasi.");
      } else {
        setMessage("❌ Gagal mendapatkan lokasi.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🏠</div>
            <h1 className="text-xl font-bold text-gray-800">Absensi Pulang</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tekan tombol untuk melakukan absensi pulang
            </p>
          </div>

          <button
            onClick={handleAbsenPulang}
            disabled={loading}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}

            {loading ? "Memproses..." : "Absen Pulang"}
          </button>

          {loading && (
            <div className="text-center text-sm text-gray-500">{progress}</div>
          )}

          {showResult && (
            <div className="text-center p-4 rounded-xl bg-gray-50 border">
              <div className="text-3xl mb-2">
                {statusType === "success" && "✅"}
                {statusType === "warning" && "⚠️"}
                {statusType === "error" && "❌"}
              </div>

              <p
                className={`font-semibold text-center ${
                  statusType === "success"
                    ? "text-green-600"
                    : statusType === "warning"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {message}
              </p>

              <button
                onClick={() => navigate("/dashboard")}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white text-xs mt-4 opacity-80">
          Shining Sun Attendance System
        </p>
      </div>
    </div>
  );
}
