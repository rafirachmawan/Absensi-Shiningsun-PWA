import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";

export default function Dashboard() {
  const navigate = useNavigate();

  const [time, setTime] = useState("");
  const [user, setUser] = useState(null);
  const [riwayat, setRiwayat] = useState([]);

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
    loadUser();

    const unsub = listenRiwayat();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const loadUser = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setUser(snap.data());
    }
  };

  const listenRiwayat = () => {
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    const q = query(
      collection(db, "attendance"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setRiwayat(data);
    });

    return unsubscribe;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-blue-600 text-white shadow-md">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-5xl mx-auto">
          {/* LEFT */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
                S
              </div>

              <div>
                <h1 className="text-lg md:text-xl font-semibold tracking-wide">
                  SHININGSUN
                </h1>

                <p className="text-blue-100 text-xs md:text-sm">
                  Sistem Absensi Guru
                </p>
              </div>
            </div>

            <p className="text-blue-100 text-xs mt-1">{time}</p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.nama || "Guru"}</p>
              <p className="text-xs text-blue-200">{user?.cabang || ""}</p>
            </div>

            <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-semibold shadow border border-white">
              {user?.nama?.charAt(0) || "G"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-4 md:p-6 max-w-md md:max-w-lg mx-auto w-full">
        {/* CARD ABSEN */}
        <div className="bg-white rounded-2xl shadow p-5 mt-4">
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

        {/* RIWAYAT ABSENSI */}
        <div className="bg-white rounded-2xl shadow p-5 mt-5">
          <h2 className="font-semibold text-gray-700 mb-4">Riwayat Absensi</h2>

          {riwayat.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat absensi</p>
          ) : (
            <div className="space-y-3">
              {riwayat.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span>
                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                  </span>

                  <span
                    className={`font-medium ${
                      item.status === "hadir"
                        ? "text-green-600"
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
