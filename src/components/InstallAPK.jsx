import { FiDownload } from "react-icons/fi";

// Ganti dengan lokasi file APK.
// Opsi 1 — file lokal: taruh APK di "public/apk/nama-file.apk"
//         sehingga bisa diunduh dari "/apk/nama-file.apk".
// Opsi 2 — link luar: isi dengan URL penuh, mis. link Google Drive / Firebase Storage.
const APK_URL = "/apk/absensi-shiningsun.apk";

export default function InstallAPK() {
  return (
    <a
      href={APK_URL}
      download
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
    >
      <FiDownload className="h-4 w-4 shrink-0" />
      <span className="leading-snug">Install APK</span>
    </a>
  );
}
