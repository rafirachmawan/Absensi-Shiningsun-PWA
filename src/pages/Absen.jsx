import { useState } from "react";
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

export default function Absen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleAbsen = async () => {
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

          const userData = userSnap.data();

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

          // Jika cabang memiliki lokasi
          if (branch.latitude && branch.longitude && branch.radius) {
            distance = getDistance(lat, lon, branch.latitude, branch.longitude);

            if (distance > branch.radius) {
              setMessage("Anda berada di luar radius cabang");
              setLoading(false);
              return;
            }
          }

          const now = new Date();

          await addDoc(collection(db, "attendance"), {
            uid: user.uid,
            nama: userData.nama,
            cabang: userData.cabang,

            tanggal: now.toISOString().split("T")[0],
            waktu: now.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),

            status: "Hadir",

            latitude: lat,
            longitude: lon,

            createdAt: serverTimestamp(),
          });

          setMessage("Absensi berhasil");
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
        enableHighAccuracy: true,
        timeout: 20000,
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
            onClick={handleAbsen}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-95 transition text-white py-3 rounded-xl font-semibold shadow-md"
          >
            {loading ? "Mengambil lokasi..." : "Absen Sekarang"}
          </button>

          {/* STATUS MESSAGE */}
          {message && (
            <div className="text-center">
              {message === "Absensi berhasil" && (
                <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
                  ✅ {message}
                </div>
              )}

              {message !== "Absensi berhasil" && (
                <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  ⚠️ {message}
                </div>
              )}
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
