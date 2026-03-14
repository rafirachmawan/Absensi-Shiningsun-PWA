import { useState } from "react";
import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Absen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [statusType, setStatusType] = useState("success");

  const [progress, setProgress] = useState("");

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

  /* ================= ABSEN ================= */

  const handleAbsen = async () => {
    if (!navigator.geolocation) {
      alert("GPS tidak tersedia");
      return;
    }

    setLoading(true);
    setMessage("");
    setProgress("Mengambil lokasi GPS...");

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        alert("Izin lokasi ditolak di browser");
        setLoading(false);
        return;
      }
    } catch (e) {}

    try {
      /* ================= AMBIL LOKASI ================= */

      const position = await getLocation();

      setProgress("Memeriksa lokasi cabang...");

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      console.log("Latitude:", lat);
      console.log("Longitude:", lon);
      console.log("Accuracy:", position.coords.accuracy);

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

      /* ================= JAM DARI DATA GURU ================= */

      const jamMasuk = userData.jamMasuk || "07:00";
      const batasTelat = parseInt(userData.batasTelat || 15);
      const jamMulaiAbsen = userData.jamMulaiAbsen || "06:00";
      const jamPulang = userData.jamPulang || "16:00";

      const now = new Date();
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

        console.log("Distance:", distance);

        if (distance > branch.radius) {
          setStatusType("error");
          setMessage("❌ Anda berada di luar radius cabang sekolah.");
          setShowResult(true);
          setLoading(false);
          return;
        }
      }
      /* ================= CEK JAM ABSENSI ================= */

      setProgress("Memeriksa waktu absensi...");

      /* ===== KONVERSI JAM ===== */

      const [jam, menit] = jamMasuk.split(":");
      const jamMasukMinutes = parseInt(jam) * 60 + parseInt(menit);

      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const selisihMenit = nowMinutes - jamMasukMinutes;

      const [bukaJam, bukaMenit] = jamMulaiAbsen.split(":");
      const startAbsensi = parseInt(bukaJam) * 60 + parseInt(bukaMenit);

      const [pulangJam, pulangMenit] = jamPulang.split(":");
      const endAbsensi = parseInt(pulangJam) * 60 + parseInt(pulangMenit);

      /* ===== CEK JAM ===== */

      if (nowMinutes < startAbsensi) {
        setStatusType("warning");
        setMessage("⏰ Absensi belum dibuka. Silakan kembali nanti.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      if (nowMinutes > endAbsensi) {
        setStatusType("error");
        setMessage("❌ Waktu absensi sudah ditutup.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      /* ===== HITUNG STATUS ===== */

      let status = "Hadir";
      let attention = "";
      let terlambatMenit = 0;

      if (selisihMenit < 0) {
        const lebihAwal = Math.abs(selisihMenit);

        status = "Lebih Awal";

        attention = `🌅 Anda datang ${lebihAwal} menit lebih awal.`;
      } else if (selisihMenit === 0) {
        status = "Tepat Waktu";

        attention =
          "🎉 Hadir tepat waktu. Terima kasih atas kedisiplinan Anda.";
      } else if (selisihMenit <= batasTelat) {
        status = "Terlambat";

        terlambatMenit = selisihMenit;

        attention = `⏱ Anda terlambat ${selisihMenit} menit.`;
      } else {
        status = "Terlambat Berat";

        terlambatMenit = selisihMenit;

        attention = `⚠ Anda terlambat ${selisihMenit} menit dan melewati batas toleransi.`;
      }

      const attendanceId = `${user.uid}_${today}`;
      const attendanceRef = doc(db, "attendance", attendanceId);

      const existing = await getDoc(attendanceRef);

      if (existing.exists()) {
        setStatusType("warning");
        setMessage("⚠ Anda sudah melakukan absensi hari ini.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      setProgress("Menyimpan data absensi...");

      await setDoc(attendanceRef, {
        uid: user.uid,
        nama: userData.namaLengkap,
        cabang: userData.cabang,

        tanggal: today,

        waktu: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),

        status,
        terlambatMenit,

        latitude: lat,
        longitude: lon,

        createdAt: serverTimestamp(),
      });

      setStatusType("success");
      setMessage(attention);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-2 animate-bounce">📍</div>
            <h1 className="text-xl font-bold text-gray-800">Absensi Guru</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tekan tombol untuk melakukan absensi hari ini
            </p>
          </div>

          <button
            onClick={handleAbsen}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}

            {loading ? "Memproses..." : "Absen Sekarang"}
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
