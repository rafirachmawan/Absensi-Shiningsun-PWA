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
} from "firebase/firestore";

export default function Dashboard() {
  const navigate = useNavigate();

  const [time, setTime] = useState("");
  const [user, setUser] = useState(null);
  const [riwayat, setRiwayat] = useState([]);

  /* CLOCK */

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

  /* LOAD USER */

  useEffect(() => {
    let unsubRiwayat = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      /* LOAD USER */

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUser(snap.data());
      }

      /* LISTEN RIWAYAT */

      const q = query(
        collection(db, "attendance"),
        where("uid", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(5),
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

  /* LOGOUT */

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          {/* ROW 1 */}
          <div className="flex items-center justify-between">
            {/* BRAND */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
                S
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-wide">
                  SHININGSUN
                </h1>

                <p className="text-blue-100 text-xs">Sistem Absensi Guru</p>

                <p className="text-blue-100 text-xs">{time}</p>
              </div>
            </div>

            {/* USER (WEB ONLY) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.nama || "Guru"}</p>

                <p className="text-xs text-blue-200">{user?.cabang || ""}</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-semibold">
                {user?.nama?.charAt(0) || "G"}
              </div>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* MOBILE USER */}
          <div className="flex md:hidden items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center font-semibold">
                {user?.nama?.charAt(0) || "G"}
              </div>

              <div className="text-sm">{user?.nama || "Guru"}</div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/20 text-white text-xs px-3 py-1 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="flex-1 w-full max-w-md md:max-w-lg mx-auto p-4 md:p-6">
        {/* MENU ABSENSI */}

        <div className="bg-white rounded-2xl shadow-sm p-5 mt-4">
          <h2 className="font-semibold text-gray-700 mb-4">Menu Absensi</h2>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/absen")}
              className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition"
            >
              Absen Masuk
            </button>

            <button
              onClick={() => navigate("/absen-pulang")}
              className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition"
            >
              Absen Pulang
            </button>
          </div>
        </div>

        {/* RIWAYAT */}

        <div className="bg-white rounded-2xl shadow-sm p-5 mt-5">
          <h2 className="font-semibold text-gray-700 mb-4">Riwayat Absensi</h2>

          {riwayat.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat absensi</p>
          ) : (
            <div className="space-y-3">
              {riwayat.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-700">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </span>

                    <span className="text-xs text-gray-500">
                      🕒 {item.waktu}
                    </span>
                  </div>

                  <span
                    className={`font-medium ${
                      item.status === "Tepat Waktu" ||
                      item.status === "Lebih Awal"
                        ? "text-green-600"
                        : item.status === "Terlambat"
                          ? "text-yellow-600"
                          : "text-red-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
