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

          const distance = getDistance(
            lat,
            lon,
            branch.latitude,
            branch.longitude,
          );

          if (distance > branch.radius) {
            setMessage("Anda berada di luar radius cabang");
            setLoading(false);
            return;
          }

          const now = new Date();

          await addDoc(collection(db, "absensi"), {
            uid: user.uid,
            nama: userData.nama,
            cabang: userData.cabang,

            tanggal: now.toISOString(),
            waktu: now.toLocaleTimeString("id-ID"),

            status: "hadir",

            latitude: lat,
            longitude: lon,
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h1 className="text-lg font-semibold mb-4">Absensi Guru</h1>

        <button
          onClick={handleAbsen}
          className="bg-green-600 text-white w-full py-3 rounded-lg"
        >
          {loading ? "Memproses..." : "Absen Sekarang"}
        </button>

        {message && <p className="text-center mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}
