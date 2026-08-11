import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

/** In-app "Install AquaServe" bottom-sheet prompt.
 * - Chrome/Android: uses the beforeinstallprompt event
 * - iOS Safari: shows manual "Add to Home Screen" instructions
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Already installed / opened standalone → skip
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) return;
    if (localStorage.getItem("aq_install_dismissed") === "1") return;

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari does NOT fire beforeinstallprompt — show iOS hint after a small delay
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIOS && isSafari) {
      const t = setTimeout(() => { setIosHint(true); setVisible(true); }, 4000);
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", handler); };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") localStorage.setItem("aq_install_dismissed", "1");
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem("aq_install_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[416px] z-[60] animate-slide-up" data-testid="install-prompt">
      <div className="bg-white rounded-2xl shadow-floating border border-primary/20 p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
          <Download size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-charcoal">Install AquaServe</div>
          {iosHint ? (
            <div className="text-xs text-slate mt-0.5">
              Tap <Share size={12} className="inline mx-0.5" /> in Safari, then <b>Add to Home Screen</b> to open AquaServe like a real app.
            </div>
          ) : (
            <div className="text-xs text-slate mt-0.5">Add to your home screen for a faster, full-screen experience.</div>
          )}
          <div className="flex gap-2 mt-3">
            {!iosHint && (
              <button onClick={install} className="chip !bg-primary !text-white hover:!bg-primary-dark" data-testid="install-accept-btn">
                Install now
              </button>
            )}
            <button onClick={dismiss} className="chip !bg-transparent !text-slate hover:!bg-mist" data-testid="install-dismiss-btn">
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="w-8 h-8 rounded-full hover:bg-mist flex items-center justify-center text-slate">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
