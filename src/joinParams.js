// Die Parameter des Einladungslinks überleben den Google-Login in der
// sessionStorage. Gesichert wird schon beim Start der App, bevor die
// Anmelde-Weiche den Pfad wegwirft.
const KEY = "moneto.join";

export function captureJoinParams() {
  if (!window.location.pathname.startsWith("/join")) return;
  const params = new URLSearchParams(window.location.search);
  const ws = params.get("ws");
  const token = params.get("token");
  if (!ws || !token) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      ws, token, name: params.get("name") || ""
    }));
  } catch {
    // Privater Modus o. Ä. – dann bleibt nur der Weg über die URL.
  }
}

export function readJoinParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("ws") && params.get("token")) {
    return {
      ws: params.get("ws"),
      token: params.get("token"),
      name: params.get("name") || ""
    };
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearJoinParams() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}
