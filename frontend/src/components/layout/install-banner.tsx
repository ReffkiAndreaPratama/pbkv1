import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => e.preventDefault();
    const onInstall = (e: BeforeInstallPromptEvent) => setDeferred(e);
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("beforeinstallprompt", onInstall as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("beforeinstallprompt", onInstall as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed || dismissed || !deferred) return null;

  const handleInstall = async () => {
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
    } catch {
      /* aborted by user */
    }
    setDeferred(null);
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Pasang aplikasi TechTutor">
      <button className="install-banner-close" onClick={() => setDismissed(true)} type="button" aria-label="Tutup banner pasang aplikasi">
        <X size={16} />
      </button>
      <span className="install-banner-icon"><Download size={18} /></span>
      <div className="install-banner-copy">
        <strong>Pasang TechTutor</strong>
        <span>Akses lebih cepat seperti aplikasi biasa, tanpa browser tab.</span>
      </div>
      <button className="install-banner-cta" onClick={handleInstall} type="button">Install</button>
    </div>
  );
}