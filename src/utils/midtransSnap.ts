const SNAP_SRC = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_DATA_KEY_ATTR = 'data-client-key';

let loadingPromise: Promise<void> | null = null;

export async function loadMidtransSnap(
  clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string | undefined,
) {
  if (typeof window === 'undefined') return;
  if (window.snap) return;

  if (!clientKey) {
    throw new Error('Midtrans client key is missing. Set VITE_MIDTRANS_CLIENT_KEY.');
  }

  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SNAP_SRC}"]`,
    );
    if (existing) {
      if (!existing.getAttribute(SNAP_DATA_KEY_ATTR)) {
        existing.setAttribute(SNAP_DATA_KEY_ATTR, clientKey);
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Midtrans Snap SDK')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = SNAP_SRC;
    script.async = true;
    script.setAttribute(SNAP_DATA_KEY_ATTR, clientKey);
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Midtrans Snap SDK'));
    document.body.appendChild(script);
  });

  return loadingPromise;
}
