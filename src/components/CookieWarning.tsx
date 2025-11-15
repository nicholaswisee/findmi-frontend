import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function CookieWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-100 mx-auto max-w-2xl">
      <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center h-fit gap-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <h3 className="font-bold text-yellow-900">
                Cookies Diperlukan
              </h3>
            </div>
            <p className="mt-1 text-sm text-yellow-800">
              Website ini memerlukan cookies untuk login dan autentikasi. 
              Silakan aktifkan cookies di browser Anda untuk melanjutkan.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold text-yellow-900 hover:underline">
                Cara mengaktifkan cookies
              </summary>
              <div className="mt-2 space-y-2 text-sm text-yellow-800">
                <p className="text-sm"><strong className="text-sm">Chrome/Edge: </strong> Settings → Privacy and security → Cookies and other site data → Allow all cookies</p>
                <p className="text-sm"><strong className="text-sm">Firefox: </strong> Settings → Privacy & Security → Cookies and Site Data → Accept cookies</p>
                <p className="text-sm"><strong className="text-sm">Safari: </strong> Preferences → Privacy → Uncheck "Block all cookies"</p>
              </div>
            </details>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-1 text-yellow-600 hover:bg-yellow-100"
            aria-label="Dismiss warning"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
