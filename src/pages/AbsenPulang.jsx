import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function AbsenPulang() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showResult, setShowResult] = useState(false);

  /* ABSEN PULANG */

  const handleAbsenPulang = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("User tidak ditemukan");
      return;
    }

    setLoading(true);

    const now = new Date();
    const today = now.toLocaleDateString("en-CA");

    /* CARI ABSEN MASUK HARI INI */

    const attendanceId = `${user.uid}_${today}`;

    const attendanceRef = doc(db, "attendance", attendanceId);

    const docSnap = await getDoc(attendanceRef);

    if (!docSnap.exists()) {
      setMessage("Anda belum melakukan absensi masuk hari ini.");
      setShowResult(true);
      setLoading(false);
      return;
    }

    if (docSnap.data().jamPulang) {
      setMessage("Anda sudah melakukan absensi pulang hari ini.");
      setShowResult(true);
      setLoading(false);
      return;
    }

    /* AMBIL GPS */

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const now = new Date();

          const jamPulang = now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          /* UPDATE FIRESTORE */

          await updateDoc(attendanceRef, {
            jamPulang,
            latitudePulang: lat,
            longitudePulang: lon,
          });

          setMessage("Absensi pulang berhasil");
          setShowResult(true);
          setLoading(false);
        } catch (err) {
          alert(err.message);
          setLoading(false);
        }
      },
      (error) => {
        alert("Gagal mendapatkan lokasi");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
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
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold"
          >
            {loading ? "Memproses..." : "Absen Pulang"}
          </button>

          {showResult && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 animate-fade-in">
              <div className="text-4xl">🏠</div>

              <h2 className="text-lg font-semibold text-gray-800">
                Absensi Pulang
              </h2>

              <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
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
      </div>
    </div>
  );
}
