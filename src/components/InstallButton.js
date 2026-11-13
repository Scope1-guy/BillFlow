import { useEffect, useState } from "react";

// Chrome and Edge tell the page when the app can be installed.
// We keep that message and show our own "Install app" button.
// (Safari on iPhone has no such button: use Share, then "Add to Home Screen".)
export default function InstallButton() {
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    function handleBeforeInstall(event) {
      event.preventDefault();
      setInstallEvent(event);
    }
    function handleInstalled() {
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!installEvent) return null;

  async function handleInstall() {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-block install-button"
      onClick={handleInstall}
    >
      Install app
    </button>
  );
}
