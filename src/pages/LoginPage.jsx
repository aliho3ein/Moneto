import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, authErrorMessage } from "../context/AuthContext";
import wordmark from "../assets/logo/moneto-logo.svg";
import iconMark from "../assets/logo/moneto-logo.svg";

// Offizielles Google-Logo (vierfarbiges G) für den Anmelde-Button.
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4.1 6.8-10.1 6.8-17.3z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Wer schon angemeldet ist, landet direkt auf der Zielseite. /start ist
  // dabei kein Ziel: wohin es nach dem Login geht, entscheidet sich danach,
  // ob schon ein Haushalt da ist.
  if (user) {
    const from = location.state?.from;
    const target = from && !from.startsWith("/start") && !from.startsWith("/login") ? from : "/";
    return <Navigate to={target} replace />;
  }

  async function handleLogin() {
    setError("");
    setBusy(true);
    try {
      await signIn();
      // Die Weiterleitung übernimmt das <Navigate> oben, sobald der
      // Auth-Status im Context ankommt.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen login">
      <div className="login__brand">
        <div className="login__logo">
          <img src={iconMark} alt="" className="login__mark" />
        </div>
        <p className="login__subtitle">
          Eure gemeinsame Haushaltskasse – Ausgaben und Einnahmen an einem Ort.
        </p>
      </div>

      <div>
        <button
          type="button"
          className="btn btn--google"
          onClick={handleLogin}
          disabled={busy}
        >
          {busy ? <span className="spinner spinner--dark" /> : <GoogleLogo />}
          {busy ? "Anmelden …" : "Mit Google anmelden"}
        </button>

        {error && <p className="error-box" role="alert">{error}</p>}

        <p className="login__hint">
          Es wird nur dein Name und dein Profilbild gespeichert.
        </p>
      </div>
    </div>
  );
}
