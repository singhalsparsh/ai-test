/**
 * Android & app-install detection helpers.
 *
 * DeepfakeGuard Android Package: com.example.deepfakeguard
 * Custom URL scheme: deepfakeguard://
 */

const APP_PACKAGE = 'com.example.deepfakeguard';
const APP_SCHEME = 'deepfakeguard';
const APK_URL =
  'https://archive.org/download/deepfakeguard-final/DEEPFAKEGUARD-FINAL.apk';
const VIRUSTOTAL_URL =
  'https://www.virustotal.com/gui/file/1d35e8f02c5c75877d1e7ec7ee737a5209ddd928798eb5fe3fbacad55c57639c/detection';

export const ANDROID_CONFIG = {
  appPackage: APP_PACKAGE,
  appScheme: APP_SCHEME,
  apkUrl: APK_URL,
  virustotalUrl: VIRUSTOTAL_URL,
  /** intent:// URI that Android uses to launch the installed app */
  intentUrl: `intent://scan/#Intent;scheme=${APP_SCHEME};package=${APP_PACKAGE};end`,
  /** Fallback direct-link URL if the app is installed */
  directLink: `${APP_SCHEME}://`,
} as const;

/**
 * Returns `true` when the User-Agent looks like an Android device.
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Attempt to detect whether the DeepfakeGuard app is installed.
 *
 * Technique: inject a hidden iframe pointing at the intent:// URI.
 *   • If the app is installed → the intent handler opens it and the
 *     iframe fires a `load` event (browser loses focus / frame navigates).
 *   • If the app is NOT installed → the intent handler fails silently,
 *     the iframe fires `error` or simply never completes.
 *
 * Resolves to `true` (installed) or `false` (not installed / unknown)
 * after a short timeout.
 */
export function detectAppInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }

    let settled = false;

    const done = (installed: boolean) => {
      if (settled) return;
      settled = true;
      try {
        iframe?.remove();
      } catch {
        /* swallow */
      }
      resolve(installed);
    };

    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;border:none;';
    iframe.src = ANDROID_CONFIG.intentUrl;

    iframe.onload = () => done(true);
    iframe.onerror = () => done(false);

    document.body.appendChild(iframe);

    // If nothing fires within 2 s, assume the app is not installed.
    setTimeout(() => done(false), 2000);
  });
}
