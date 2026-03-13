import { useState, useRef } from "react";

import { auth, db } from "../firebase";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Absen() {
  const navigate = useNavigate(); // <-- TAMBAHKAN INI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showResult, setShowResult] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });

    setCameraOpen(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        handleAbsen(blob);
      },
      "image/jpeg",
      0.8,
    );
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        const MAX_WIDTH = 480;

        const scale = Math.min(MAX_WIDTH / img.width, 1);

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.5,
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

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

  const handleAbsen = async (photoFile) => {
    if (!photoFile) {
      alert("Foto wajib diambil untuk absensi.");
      return;
    }

    if (!navigator.geolocation) {
      alert("GPS tidak tersedia");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        alert("Izin lokasi ditolak di browser");
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log("Permission API tidak tersedia");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          console.log("Latitude:", lat);
          console.log("Longitude:", lon);

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

          let photoURL = null;

          if (photoFile) {
            const compressedPhoto = await compressImage(photoFile);

            const photoRef = ref(
              storage,
              `attendance/${user.uid}/${Date.now()}.jpg`,
            );

            await uploadBytes(photoRef, compressedPhoto);

            photoURL = await getDownloadURL(photoRef);
          }

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

            console.log("Distance:", distance);

            if (distance > branch.radius) {
              setMessage("Anda berada di luar radius cabang");
              setLoading(false);
              return;
            }
          }

          const now = new Date();

          const settingsRef = doc(db, "settings", "attendance");
          const settingsSnap = await getDoc(settingsRef);

          let jamMasuk = "07:00";
          let batasTelat = 15;
          let jamBuka = "06:00";
          let jamTutup = "12:00";

          if (settingsSnap.exists()) {
            const settings = settingsSnap.data();

            jamMasuk = settings.jamMasuk || "07:00";
            batasTelat = settings.batasTelat || 15;
            jamBuka = settings.jamBuka || "06:00";
            jamTutup = settings.jamTutup || "12:00";
          }
          // jam masuk
          const [jam, menit] = jamMasuk.split(":");
          const jamMasukMinutes = parseInt(jam, 10) * 60 + parseInt(menit, 10);

          // waktu sekarang
          const nowMinutes = now.getHours() * 60 + now.getMinutes();

          // selisih
          const selisihMenit = nowMinutes - jamMasukMinutes;

          // jam buka
          const [bukaJam, bukaMenit] = jamBuka.split(":");
          const startAbsensi =
            parseInt(bukaJam, 10) * 60 + parseInt(bukaMenit, 10);

          // jam tutup
          const [tutupJam, tutupMenit] = jamTutup.split(":");
          const endAbsensi =
            parseInt(tutupJam, 10) * 60 + parseInt(tutupMenit, 10);

          console.log("Jam buka:", jamBuka);
          console.log("Jam masuk:", jamMasuk);
          console.log("Jam tutup:", jamTutup);
          console.log("Now minutes:", nowMinutes);
          console.log("Start absensi:", startAbsensi);
          console.log("End absensi:", endAbsensi);

          if (nowMinutes < startAbsensi) {
            setMessage("Absensi belum dibuka.");
            setShowResult(true);
            setLoading(false);
            return;
          }

          if (nowMinutes > endAbsensi) {
            setMessage("Waktu absensi sudah ditutup.");
            setShowResult(true);
            setLoading(false);
            return;
          }

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

          await addDoc(collection(db, "attendance"), {
            uid: user.uid,
            nama: userData.nama,
            cabang: userData.cabang,

            tanggal: now.toISOString().split("T")[0],
            waktu: now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),

            status,
            terlambatMenit,

            latitude: lat,
            longitude: lon,

            photoURL,

            createdAt: serverTimestamp(),
          });

          setMessage(attention);

          setShowResult(true);
          setLoading(false);
        } catch (err) {
          alert(err.message);
        }

        setLoading(false);
      },

      (error) => {
        console.log("GPS ERROR:", error);

        if (error.code === 1) {
          alert("Izin lokasi ditolak");
        } else if (error.code === 2) {
          alert("Lokasi tidak tersedia");
        } else if (error.code === 3) {
          alert("Timeout mendapatkan lokasi");
        } else {
          alert("Error GPS: " + error.message);
        }

        setLoading(false);
      },

      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          {/* HEADER */}
          <div className="text-center">
            <div className="text-4xl mb-2">📍</div>

            <h1 className="text-xl font-bold text-gray-800">Absensi Guru</h1>

            <p className="text-sm text-gray-500 mt-1">
              Tekan tombol untuk melakukan absensi hari ini
            </p>
          </div>

          {/* INFO BOX */}
          <div className="bg-gray-50 rounded-xl p-4 text-center border">
            <p className="text-xs text-gray-500">
              Sistem akan mendeteksi lokasi Anda
            </p>

            <p className="text-xs text-gray-400 mt-1">Pastikan GPS aktif</p>
          </div>

          {/* BUTTON */}

          <button
            onClick={startCamera}
            className="w-full block bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-md"
          >
            {loading ? "Mengambil lokasi..." : "Absen Sekarang"}
          </button>

          {cameraOpen && (
            <div className="space-y-4">
              <video ref={videoRef} autoPlay className="rounded-xl w-full" />

              <button
                onClick={takePhoto}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
              >
                Ambil Foto
              </button>

              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          {/* RESULT CARD */}

          {showResult && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 animate-fade-in">
              <div className="text-4xl">✅</div>

              <h2 className="text-lg font-semibold text-gray-800">
                Absensi Berhasil
              </h2>

              <div
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  message.includes("Terlambat Berat")
                    ? "bg-red-100 text-red-700"
                    : message.includes("Terlambat")
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {message}
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <p className="text-center text-white text-xs mt-4 opacity-80">
          Shining Sun Attendance System
        </p>
      </div>
    </div>
  );
}
