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

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUser(snap.data());
      }

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

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          {/* ROW 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center font-bold text-lg">
                S
              </div>

              <div className="leading-tight">
                <h1 className="text-sm md:text-lg font-semibold tracking-wide">
                  SHININGSUN
                </h1>

                <p className="text-[11px] md:text-xs text-blue-100">
                  Sistem Absensi Guru
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition"
            >
              Logout
            </button>
          </div>

          {/* ROW 2 */}

          <div className="flex items-center justify-between mt-3">
            <div className="leading-tight">
              <p className="text-sm font-semibold">{user?.nama || "Guru"}</p>

              <p className="text-xs text-blue-200">{user?.cabang || ""}</p>

              <p className="text-[11px] text-blue-200 mt-1">{time}</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center font-semibold shadow">
              {user?.nama?.charAt(0) || "G"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6">
        {/* MENU ABSENSI */}

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => navigate("/absen")}
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition text-left"
          >
            <h2 className="text-lg font-semibold mb-1">Absen Masuk</h2>

            <p className="text-sm opacity-90">
              Catat kehadiran saat datang ke sekolah
            </p>
          </button>

          <button
            onClick={() => navigate("/absen-pulang")}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition text-left"
          >
            <h2 className="text-lg font-semibold mb-1">Absen Pulang</h2>

            <p className="text-sm opacity-90">
              Catat waktu pulang setelah selesai mengajar
            </p>
          </button>
        </div>

        {/* RIWAYAT */}

        <div className="bg-white rounded-2xl shadow-sm p-5 mt-6">
          <h2 className="font-semibold text-gray-700 mb-4">Riwayat Absensi</h2>

          {riwayat.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat absensi</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-4 bg-gray-50 text-xs font-semibold text-gray-600 px-4 py-3">
                <div>Tanggal</div>
                <div className="text-center">Datang</div>
                <div className="text-center">Pulang</div>
                <div className="text-right">Status</div>
              </div>

              {riwayat.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-4 items-center px-4 py-3 text-sm border-t hover:bg-gray-50 transition"
                >
                  <div className="text-gray-700">
                    {new Date(item.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  <div className="text-center font-semibold">{item.waktu}</div>

                  <div className="text-center font-semibold">
                    {item.jamPulang ? item.jamPulang : "-"}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        item.status === "Tepat Waktu" ||
                        item.status === "Lebih Awal"
                          ? "text-green-600"
                          : item.status === "Terlambat"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
