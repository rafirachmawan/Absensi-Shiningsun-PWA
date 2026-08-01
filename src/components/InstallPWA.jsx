import { useEffect, useState } from "react";
import { FiSmartphone } from "react-icons/fi";

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) {
      alert(
        "Install belum tersedia.\nGunakan menu browser → Install App / Add to Home Screen",
      );
      return;
    }

    prompt.prompt();

    const result = await prompt.userChoice;

    if (result.outcome === "accepted") {
      console.log("PWA Installed");
    }

    setPrompt(null);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 text-blue-700 font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200 group"
      >
        <FiSmartphone className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
        <span className="text-sm">Install App PWA</span>
      </button>
    </div>
  );
}

