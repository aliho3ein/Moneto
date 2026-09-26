import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  listenCategories, addCategory, renameCategory, archiveCategory, isDefaultCategory,
  countCategoryItems
} from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import { ICON_LIST, Icon } from "../icons";
import { PALETTE } from "../palette";

const emptyForm = { name: "", icon: "basket", color: PALETTE[0], type: "expense" };

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { activeId } = useWorkspace();

  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [affected, setAffected] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeId) return undefined;
    return listenCategories(activeId, setCategories, (err) => {
      console.error(err);
      setCategories([]);
      setError("Kategorien konnten nicht geladen werden.");
    });
  }, [activeId]);

  const groups = useMemo(() => ({
    expense: (categories || []).filter((c) => c.type === "expense"),
    income: (categories || []).filter((c) => c.type === "income")
  }), [categories]);

  // Für die Rückfrage: wie viele Einträge hängen an dieser Kategorie?
  // -1 = Anzahl konnte nicht ermittelt werden.
  function askDelete(cat) {
    setConfirm(cat);
    setAffected(null);
    countCategoryItems(activeId, cat.id)
      .then(setAffected)
      .catch((err) => { console.error(err); setAffected(-1); });
  }

  async function saveName(catId) {
    const name = editName.trim();
    if (!name) return;
    setBusyId(catId);
    try {
      await renameCategory(activeId, catId, name);
      setEditId(null);
    } catch (err) {
      console.error(err);
      setError("Umbenennen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeCategory(cat) {
    setBusyId(cat.id);
    try {
      await archiveCategory(activeId, cat.id);
      setConfirm(null);
    } catch (err) {
      console.error(err);
      setError("Löschen fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await addCategory(activeId, { ...form, name });
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  if (!categories) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  function renderGroup(title, list) {
    if (!list.length) return null;
    return (
      <section className="cat-group">
        <h2 className="cat-group__title">{title}</h2>
        <ul className="cat-list">
          {list.map((cat) => {
            const locked = isDefaultCategory(cat.id);
            const editing = editId === cat.id;
            return (
              <li key={cat.id} className="cat-row">
                <span className="cat-row__icon" style={{ background: cat.color }}>
                  <Icon name={cat.icon} size={18} color="#fff" />
                </span>

                {editing ? (
                  <>
                    <input
                      className="input cat-row__input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={30}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="icon-btn icon-btn--flat"
                      onClick={() => saveName(cat.id)}
                      disabled={busyId === cat.id}
                      aria-label="Namen speichern"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--flat"
                      onClick={() => setEditId(null)}
                      aria-label="Abbrechen"
                    >
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="cat-row__name">{cat.name}</span>
                    {locked && (
                      <span className="cat-row__badge" title="Standard-Kategorie">
                        <Lock size={12} /> Standard
                      </span>
                    )}
                    <button
                      type="button"
                      className="icon-btn icon-btn--flat"
                      onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                      aria-label={`${cat.name} umbenennen`}
                    >
                      <Pencil size={18} />
                    </button>
                    {!locked && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--flat icon-btn--danger"
                        onClick={() => askDelete(cat)}
                        aria-label={`${cat.name} löschen`}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <div className="screen cat-screen">
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title form-screen__title">Kategorien</h1>
        <span className="icon-btn-placeholder" />
      </header>

      {error && <p className="error-box" role="alert">{error}</p>}

      {renderGroup("Ausgaben", groups.expense)}
      {renderGroup("Einnahmen", groups.income)}

      {showForm ? (
        <form className="card create-form" onSubmit={handleAdd}>
          <h2 className="create-form__title">Neue Kategorie</h2>

          <div className="toggle" role="group" aria-label="Art der Kategorie">
            <button
              type="button"
              className={form.type === "expense" ? "toggle__btn is-active is-expense" : "toggle__btn"}
              onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
            >
              Ausgabe
            </button>
            <button
              type="button"
              className={form.type === "income" ? "toggle__btn is-active is-income" : "toggle__btn"}
              onClick={() => setForm((f) => ({ ...f, type: "income" }))}
            >
              Einnahme
            </button>
          </div>

          <label className="field">
            <span className="field__label">Name</span>
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={30}
              placeholder="z. B. Urlaub"
              autoComplete="off"
            />
          </label>

          <div className="field">
            <span className="field__label">Symbol</span>
            <div className="icon-picker">
              {ICON_LIST.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={form.icon === name ? "icon-picker__btn is-active" : "icon-picker__btn"}
                  style={form.icon === name ? { background: form.color, color: "#fff" } : undefined}
                  onClick={() => setForm((f) => ({ ...f, icon: name }))}
                  aria-label={name}
                >
                  <Icon name={name} size={20} />
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Farbe</span>
            <div className="color-picker">
              {PALETTE.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={form.color === color ? "color-dot is-active" : "color-dot"}
                  style={{ background: color }}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  aria-label={`Farbe ${color}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn" disabled={saving}>
            {saving ? <span className="spinner" /> : <Plus size={20} />}
            {saving ? "Wird angelegt …" : "Kategorie anlegen"}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => { setShowForm(false); setForm(emptyForm); }}
          >
            Abbrechen
          </button>
        </form>
      ) : (
        <button type="button" className="btn" onClick={() => setShowForm(true)}>
          <Plus size={20} /> Neue Kategorie
        </button>
      )}

      <p className="hint">
        Standard-Kategorien lassen sich umbenennen, aber nicht löschen. Gelöschte
        Kategorien werden nur archiviert – alte Einträge behalten ihre Kategorie.
      </p>

      {confirm && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">„{confirm.name}“ wirklich löschen?</p>
            <p className="confirm__note">
              {affected === null && "Einträge werden gezählt …"}
              {affected === 0 && "Diese Kategorie hat keine Einträge."}
              {affected === -1 && "Anzahl der Einträge konnte nicht geprüft werden."}
              {affected > 0 && (
                <>
                  {affected === 1
                    ? "1 Eintrag bleibt erhalten, wird"
                    : `${affected} Einträge bleiben erhalten, werden`}
                  {" aber ab dann als „Ohne Kategorie“ angezeigt."}
                </>
              )}
            </p>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => removeCategory(confirm)}
              disabled={busyId === confirm.id}
            >
              {busyId === confirm.id ? "Wird gelöscht …" : "Löschen"}
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
