import { useState, useRef, useEffect } from "react";
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

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (cameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraOpen, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setStream(mediaStream);
      setCameraOpen(true);
    } catch (err) {
      alert("Kamera tidak bisa diakses");
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
      async (blob) => {
        setLoading(true);

        await handleAbsen(blob);

        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        setCameraOpen(false);
      },
      "image/jpeg",
      0.8,
    );
  };

  const uploadToCloudinary = async (file) => {
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

    if (!data.secure_url) {
      throw new Error("Upload foto gagal");
    }

    return data.secure_url;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        const MAX_WIDTH = 480;

        const scale = Math.min(MAX_WIDTH / img.width, 1);

        canvas.width = img.width * scale;
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
    } catch (e) {}

    try {
      /* ================= AMBIL LOKASI ================= */

      const position = await getLocation();

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

        console.log("Distance:", distance);

        if (distance > branch.radius) {
          setMessage("Anda berada di luar radius cabang");
          setLoading(false);
          return;
        }
      }

      const attendanceId = `${user.uid}_${today}`;
      const attendanceRef = doc(db, "attendance", attendanceId);

      const existing = await getDoc(attendanceRef);

      if (existing.exists()) {
        setMessage("Anda sudah melakukan absensi hari ini.");
        setShowResult(true);
        setLoading(false);
        return;
      }

      let photoURL = null;

      const compressedPhoto = await compressImage(photoFile);
      photoURL = await uploadToCloudinary(compressedPhoto);

      await setDoc(attendanceRef, {
        uid: user.uid,
        nama: userData.nama,
        cabang: userData.cabang,
        tanggal: today,

        waktu: now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),

        latitude: lat,
        longitude: lon,
        photoURL,
        createdAt: serverTimestamp(),
      });

      setMessage("Absensi berhasil");
      setShowResult(true);
    } catch (err) {
      console.log(err);

      if (err.code === 1) {
        alert("Izin lokasi ditolak");
      } else if (err.code === 2) {
        alert("Lokasi tidak tersedia");
      } else if (err.code === 3) {
        alert("GPS terlalu lama mendapatkan lokasi");
      } else {
        alert("Gagal mendapatkan lokasi");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-2">📍</div>
            <h1 className="text-xl font-bold text-gray-800">Absensi Guru</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tekan tombol untuk melakukan absensi hari ini
            </p>
          </div>

          <button
            onClick={startCamera}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? "Memproses..." : "Absen Sekarang"}
          </button>

          {cameraOpen && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="rounded-xl w-full"
              />

              <button
                onClick={takePhoto}
                className="w-full bg-blue-600 text-white py-3 rounded-xl"
              >
                Ambil Foto
              </button>

              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          {showResult && (
            <div className="text-center">
              <p className="text-green-600 font-semibold">{message}</p>

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
