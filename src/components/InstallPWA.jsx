import { useEffect, useState } from "react";

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
    <div className="mt-4">
      <button
        onClick={handleInstall}
        className="w-full border border-blue-600 text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50"
      >
        Install APP
      </button>
    </div>
  );
}
