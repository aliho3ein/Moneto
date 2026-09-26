import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Home, LogOut, Plus, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";

function memberLabel(count) {
  return count > 1 ? `${count} Mitglieder` : "Nur du";
}

export default function StartPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspaces, activeId, loading, error, select, createNew } = useWorkspace();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Ohne Haushalt gibt es nichts auszuwählen – dann steht hier das Formular.
  // Weitere Haushalte werden in den Einstellungen angelegt.
  const isFirst = !loading && workspaces.length === 0;

  function open(wsId) {
    select(wsId);
    navigate("/", { replace: true });
  }

  async function handleCreate(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Bitte einen Namen eingeben.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await createNew(trimmed);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setFormError("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  return (
    <div className="screen start">
      <header className="page-head">
        {isFirst ? (
          <div>
            <p className="page-head__eyebrow">Angemeldet als {user?.displayName || "Unbekannt"}</p>
            <h1 className="page-head__title">Willkommen</h1>
          </div>
        ) : (
          <>
            <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Zurück">
              <ArrowLeft size={20} />
            </button>
            <h1 className="page-head__title form-screen__title">Haushalt wählen</h1>
          </>
        )}
        <button type="button" className="icon-btn" onClick={logout} title="Abmelden" aria-label="Abmelden">
          <LogOut size={20} />
        </button>
      </header>

      {error && <p className="error-box" role="alert">{error}</p>}

      {isFirst ? (
        <>
          <form className="card create-form" onSubmit={handleCreate}>
            <h2 className="create-form__title">Ersten Haushalt anlegen</h2>
            <label className="field">
              <span className="field__label">Name des Haushalts</span>
              <input
                className="input"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Familie Mustermann"
                maxLength={50}
                autoComplete="off"
                autoFocus
              />
            </label>

            {formError && <p className="error-box" role="alert">{formError}</p>}

            <button type="submit" className="btn" disabled={saving}>
              {saving ? <span className="spinner" /> : <Plus size={20} />}
              {saving ? "Wird angelegt …" : "Erstellen"}
            </button>
          </form>

          <p className="hint">
            Ein Haushalt ist euer gemeinsamer Bereich. Deinen Partner kannst du
            später in den Einstellungen per Link einladen.
          </p>
        </>
      ) : (
        <>
          <ul className="ws-list">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <button
                  type="button"
                  className={ws.id === activeId ? "ws-item is-active" : "ws-item"}
                  onClick={() => open(ws.id)}
                >
                  <span className="ws-item__icon"><Home size={22} strokeWidth={1.8} /></span>
                  <span className="ws-item__text">
                    <span className="ws-item__name">{ws.name}</span>
                    <span className="ws-item__meta">
                      <Users size={14} /> {memberLabel(ws.members?.length || 1)}
                    </span>
                  </span>
                  <ChevronRight size={20} className="ws-item__chevron" />
                </button>
              </li>
            ))}
          </ul>

          <p className="hint">
            Weitere Haushalte legst du in den Einstellungen an.
          </p>
        </>
      )}
    </div>
  );
}
