import { useEffect, useState } from "react";
import { FiSmartphone, FiX, FiCheck, FiShare, FiMoreVertical } from "react-icons/fi";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  // const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    // setIsAndroid(/android/i.test(ua));

    // Sudah jalan sebagai app standalone?
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleClick = async () => {
    // Kalau browser menyediakan prompt otomatis → pakai itu
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setIsInstalled(true);
      } else {
        // Ditolak → tetap kasih panduan manual
        setShowGuide(true);
      }
      setDeferredPrompt(null);
      return;
    }
    // Kalau tidak → tampilkan panduan manual (ini kasus di screenshot kamu)
    setShowGuide(true);
  };

  if (isInstalled) {
    return (
      <div className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
        <FiCheck className="h-4 w-4 shrink-0" />
        <span className="leading-snug">App sudah terinstall</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
      >
        <FiSmartphone className="h-4 w-4 shrink-0" />
        <span className="leading-snug">Install App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-stone-950/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:items-center sm:p-6"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="my-auto max-h-[90vh] w-full max-w-sm min-w-0 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-stone-900">
                  Pasang di layar utama HP
                </p>
                <p className="mt-0.5 text-[13px] text-stone-500">
                  Tanpa Play Store, langsung dari browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup panduan"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <FiX size={18} />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-stone-600">
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">1</span>
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    Buka situs ini di <b>Safari</b>, tap tombol
                    <FiShare className="inline h-4 w-4 shrink-0" /> Share
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">2</span>
                  <span>Pilih <b>“Add to Home Screen”</b> / Tambah ke Layar Utama</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">3</span>
                  <span>Tap <b>Add</b> — ikon ShiningSun muncul di home HP</span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-stone-600">
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">1</span>
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    Buka situs ini di <b>Chrome</b>, tap
                    <FiMoreVertical className="inline h-4 w-4 shrink-0" /> titik 3 kanan atas
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">2</span>
                  <span>Pilih <b>“Add to Home screen”</b> / “Install app”</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">3</span>
                  <span>Tap <b>Install / Add</b> — ikon ShiningSun muncul di home HP</span>
                </li>
              </ol>
            )}

            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200/70">
              Chrome baru memunculkan tombol otomatis setelah situs dibuka
              2–3 kali. Kalau belum muncul, pakai cara manual di atas —
              hasilnya sama.
            </p>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 flex h-[48px] w-full items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
