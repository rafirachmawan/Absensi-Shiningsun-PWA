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
    <button
      type="button"
      onClick={handleInstall}
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
    >
      <FiSmartphone className="h-4 w-4 shrink-0" />
      <span className="leading-snug">Install App</span>
    </button>
  );
}
