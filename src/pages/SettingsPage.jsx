import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, Copy, Crown, LogOut, Pencil, Plus, RefreshCw, Repeat, Share2, Shapes,
  Trash2, UserPlus, X
} from "lucide-react";
import {
  getShareLink, resetShareLink, leaveWorkspace, getUserNames, renameWorkspace, deleteWorkspace,
  updateWorkspaceSettings
} from "../../firebase/firestore-service.js";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { CURRENCIES } from "../currencies";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { workspace, workspaces, activeId, reload, select, createNew } = useWorkspace();

  const [names, setNames] = useState({});
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [startDay, setStartDay] = useState(28);
  const [currency, setCurrency] = useState("EUR");
  const [saved, setSaved] = useState(false);

  const isOwner = workspace?.ownerId === user?.uid;
  const members = workspace?.members || [];

  // Namen der Mitglieder laden
  useEffect(() => {
    if (!members.length) return;
    let cancelled = false;
    getUserNames(members)
      .then((result) => { if (!cancelled) setNames(result); })
      .catch((err) => console.error(err));
    return () => { cancelled = true; };
  }, [members.join(",")]);

  // Werte aus dem Haushalt übernehmen, sobald er geladen oder gewechselt ist.
  useEffect(() => {
    if (!workspace) return;
    setStartDay(workspace.periodStartDay ?? 28);
    setCurrency(workspace.currency || "EUR");
  }, [workspace?.id, workspace?.periodStartDay, workspace?.currency]);

  async function handlePeriodSettings(event) {
    event.preventDefault();
    setError("");
    setBusy("period");
    try {
      await updateWorkspaceSettings(activeId, { periodStartDay: startDay, currency });
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      setError("Einstellungen konnten nicht gespeichert werden.");
    } finally {
      setBusy("");
    }
  }

  async function handleRename(event) {
    event.preventDefault();
    const trimmed = draftName.trim();
    if (!trimmed) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    setError("");
    setBusy("rename");
    try {
      await renameWorkspace(activeId, trimmed);
      await reload();
      setEditingName(false);
    } catch (err) {
      console.error(err);
      setError("Umbenennen fehlgeschlagen.");
    } finally {
      setBusy("");
    }
  }

  // Nach Löschen oder Verlassen: nächsten Haushalt wählen, sonst zur Auswahl.
  async function goToRemaining() {
    select(null);
    const list = await reload();
    if (list?.length) {
      select(list[0].id);
      navigate("/", { replace: true });
    } else {
      navigate("/start", { replace: true });
    }
  }

  async function handleDelete() {
    setBusy("delete");
    try {
      await deleteWorkspace(activeId);
      setConfirm(null);
      await goToRemaining();
    } catch (err) {
      console.error(err);
      setError("Löschen fehlgeschlagen.");
      setBusy("");
      setConfirm(null);
    }
  }

  // Weiteren Haushalt anlegen; danach ist er direkt der aktive.
  async function handleCreateWorkspace(event) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    setError("");
    setBusy("create");
    try {
      await createNew(trimmed);
      setNewName("");
      setShowCreate(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Haushalt konnte nicht angelegt werden.");
    } finally {
      setBusy("");
    }
  }

  async function createLink() {
    setError("");
    setBusy("link");
    try {
      setLink(await getShareLink(activeId));
    } catch (err) {
      console.error(err);
      setError("Einladungslink konnte nicht erstellt werden.");
    } finally {
      setBusy("");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      setError("Kopieren hat nicht geklappt – bitte den Link von Hand markieren.");
    }
  }

  async function shareLink() {
    try {
      await navigator.share({
        title: workspace.name,
        text: `Tritt unserem Haushalt „${workspace.name}“ in Moneto bei:`,
        url: link
      });
    } catch (err) {
      if (err?.name !== "AbortError") console.error(err);
    }
  }

  async function handleReset() {
    setBusy("reset");
    try {
      await resetShareLink(activeId);
      setLink("");
      setConfirm(null);
    } catch (err) {
      console.error(err);
      setError("Der Link konnte nicht zurückgesetzt werden.");
    } finally {
      setBusy("");
    }
  }

  async function handleLeave() {
    setBusy("leave");
    try {
      await leaveWorkspace(activeId);
      setConfirm(null);
      await goToRemaining();
    } catch (err) {
      console.error(err);
      setError("Verlassen fehlgeschlagen.");
      setBusy("");
      setConfirm(null);
    }
  }

  if (!workspace) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  return (
    <div className="screen settings">
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title form-screen__title">Einstellungen</h1>
        <span className="icon-btn-placeholder" />
      </header>

      {error && <p className="error-box" role="alert">{error}</p>}

      {/* Haushalt */}
      <section className="card settings__card">
        <h2 className="settings__title">Haushalt</h2>

        {editingName ? (
          <form className="name-edit" onSubmit={handleRename}>
            <input
              className="input"
              name="name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={50}
              autoFocus
            />
            <button
              type="submit"
              className="icon-btn icon-btn--flat"
              disabled={busy === "rename"}
              aria-label="Namen speichern"
            >
              <Check size={20} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--flat"
              onClick={() => setEditingName(false)}
              aria-label="Abbrechen"
            >
              <X size={20} />
            </button>
          </form>
        ) : (
          <div className="name-row">
            <p className="settings__value">{workspace.name}</p>
            <button
              type="button"
              className="icon-btn icon-btn--flat"
              onClick={() => { setDraftName(workspace.name); setEditingName(true); }}
              aria-label="Haushalt umbenennen"
            >
              <Pencil size={18} />
            </button>
          </div>
        )}
        {workspaces.length > 1 && (
          <button type="button" className="row-btn" onClick={() => navigate("/start")}>
            <Repeat size={18} /> Haushalt wechseln
          </button>
        )}
        <button type="button" className="row-btn" onClick={() => navigate("/categories")}>
          <Shapes size={18} /> Kategorien verwalten
        </button>

        {showCreate ? (
          <form className="settings__form" onSubmit={handleCreateWorkspace}>
            <label className="field">
              <span className="field__label">Name des neuen Haushalts</span>
              <input
                className="input"
                name="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z. B. Wohnung Berlin"
                maxLength={50}
                autoComplete="off"
                autoFocus
              />
            </label>
            <button type="submit" className="btn" disabled={busy === "create"}>
              {busy === "create" ? <span className="spinner" /> : <Plus size={18} />}
              {busy === "create" ? "Wird angelegt …" : "Anlegen"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => { setShowCreate(false); setNewName(""); }}
            >
              Abbrechen
            </button>
          </form>
        ) : (
          <button type="button" className="row-btn" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Neuen Haushalt anlegen
          </button>
        )}
      </section>

      {/* Zeitraum und Währung */}
      <section className="card settings__card">
        <h2 className="settings__title">Zeitraum &amp; Währung</h2>

        {isOwner ? (
          <form className="settings__form settings__form--plain" onSubmit={handlePeriodSettings}>
            <label className="field">
              <span className="field__label">Zeitraum beginnt am</span>
              <select
                className="input"
                name="periodStartDay"
                value={startDay}
                onChange={(e) => setStartDay(Number(e.target.value))}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>{day}. des Monats</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Währung</span>
              <select
                className="input"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} ({c.symbol})
                  </option>
                ))}
              </select>
            </label>

            <p className="settings__hint">
              Der Zeitraum läuft vom {startDay}. bis zum Vortag im Folgemonat.
              Nur Tage bis 28 stehen zur Wahl – den 29. bis 31. gibt es nicht in
              jedem Monat.
            </p>

            <button type="submit" className="btn" disabled={busy === "period"}>
              {busy === "period" ? <span className="spinner" /> : null}
              {busy === "period" ? "Speichern …" : saved ? "Gespeichert" : "Speichern"}
            </button>
          </form>
        ) : (
          <>
            <p className="settings__value settings__value--small">
              Ab dem {startDay}. · {currency}
            </p>
            <p className="settings__hint">
              Zeitraum und Währung kann nur der Besitzer des Haushalts ändern.
            </p>
          </>
        )}
      </section>

      {/* Mitglieder */}
      <section className="card settings__card">
        <h2 className="settings__title">
          Mitglieder <span className="settings__count">{members.length}</span>
        </h2>
        <ul className="member-list">
          {members.map((uid) => (
            <li key={uid} className="member">
              <span className="member__avatar">
                {(names[uid] || "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="member__name">
                {names[uid] || "…"}
                {uid === user?.uid && <span className="member__you"> (du)</span>}
              </span>
              {uid === workspace.ownerId && (
                <span className="cat-row__badge"><Crown size={12} /> Besitzer</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Einladung */}
      <section className="card settings__card">
        <h2 className="settings__title">Partner einladen</h2>
        <p className="settings__hint">
          Wer den Link öffnet und sich anmeldet, wird Mitglied dieses Haushalts.
        </p>

        {link ? (
          <>
            <p className="share-link">{link}</p>
            <div className="share-actions">
              <button type="button" className="btn" onClick={copyLink}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>
              {typeof navigator !== "undefined" && navigator.share && (
                <button type="button" className="btn btn--ghost" onClick={shareLink}>
                  <Share2 size={18} /> Teilen
                </button>
              )}
            </div>
          </>
        ) : (
          <button type="button" className="btn" onClick={createLink} disabled={busy === "link"}>
            {busy === "link" ? <span className="spinner" /> : <UserPlus size={18} />}
            {busy === "link" ? "Link wird erstellt …" : "Einladungslink erzeugen"}
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            className="row-btn row-btn--danger"
            onClick={() => setConfirm("reset")}
          >
            <RefreshCw size={18} /> Link zurücksetzen
          </button>
        )}
      </section>

      {/* Konto */}
      <section className="card settings__card">
        <h2 className="settings__title">Konto</h2>
        <p className="settings__value settings__value--small">
          {user?.displayName || "Unbekannt"}
        </p>
        {isOwner ? (
          <button
            type="button"
            className="row-btn row-btn--danger"
            onClick={() => setConfirm("delete")}
          >
            <Trash2 size={18} /> Haushalt löschen
          </button>
        ) : (
          <button
            type="button"
            className="row-btn row-btn--danger"
            onClick={() => setConfirm("leave")}
          >
            <LogOut size={18} /> Haushalt verlassen
          </button>
        )}
        <button type="button" className="row-btn" onClick={logout}>
          <LogOut size={18} /> Abmelden
        </button>
      </section>

      {confirm === "reset" && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">Einladungslink zurücksetzen?</p>
            <p className="confirm__note">
              Der bisherige Link funktioniert danach nicht mehr. Wer schon Mitglied
              ist, bleibt es.
            </p>
            <button type="button" className="btn btn--danger" onClick={handleReset} disabled={busy === "reset"}>
              {busy === "reset" ? "Wird zurückgesetzt …" : "Zurücksetzen"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {confirm === "delete" && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">Haushalt „{workspace.name}“ löschen?</p>
            <p className="confirm__note">
              Alle Einträge und Kategorien dieses Haushalts werden dabei endgültig
              gelöscht – auch für {members.length > 1 ? "die anderen Mitglieder" : "dich"}.
              Das lässt sich nicht rückgängig machen.
            </p>
            <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={busy === "delete"}>
              {busy === "delete" ? "Wird gelöscht …" : "Endgültig löschen"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {confirm === "leave" && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">Haushalt „{workspace.name}“ verlassen?</p>
            <p className="confirm__note">
              Du siehst die Einträge danach nicht mehr. Über einen neuen
              Einladungslink kommst du wieder hinein.
            </p>
            <button type="button" className="btn btn--danger" onClick={handleLeave} disabled={busy === "leave"}>
              {busy === "leave" ? "Wird verlassen …" : "Verlassen"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
