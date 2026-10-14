import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownNarrowWide, ArrowLeft, ArrowUpDown, ArrowUpNarrowWide,
  Check, Circle, Minus, Plus, Trash2, X
} from "lucide-react";
import {
  listenShoppingList, addShoppingItem, setShoppingDone,
  deleteShoppingItem, clearShoppingList
} from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import TabBar from "../components/TabBar";
import { titleCase } from "../format";
import { suggestGroceries } from "../groceries";

// Ab dieser Strecke nach links gilt ein Wischen als "löschen".
const SWIPE_TRIGGER = 88;
// Erst ab hier wird aus einer Berührung ein Wischen – darunter darf die
// Liste noch senkrecht scrollen.
const SWIPE_START = 10;

// "Nicht mehr nachfragen" gilt nur für die laufende Sitzung. Deshalb eine
// Modul-Variable und kein localStorage: beim nächsten Start der App ist der
// Haken wieder leer, so wie gewünscht.
let skipDeleteConfirm = false;

const emptyForm = { title: "", note: "", qty: "1" };

// Firestore-Fehler lesbar machen. "permission-denied" heisst bei dieser Liste
// fast immer: die Regeln fuer /shopping liegen noch nicht auf dem Server.
// Der Code haengt mit dran, sonst steht man bei allem anderen im Dunkeln.
function errorText(err, fallback) {
  if (err?.code === "permission-denied") {
    return "Keine Berechtigung fuer die Einkaufsliste. Sind die Firestore-Regeln deployt?";
  }
  return `${fallback} (${err?.code || err?.message || "unbekannt"})`;
}

// Eine Zeile, die sich nach links wegziehen lässt. Funktioniert mit Finger
// und Maus (Pointer Events). `onSwipe` entscheidet, was dann passiert –
// gelöscht wird erst nach der Rückfrage.
function SwipeRow({ onSwipe, children }) {
  const [dx, setDx] = useState(0);
  const start = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const horizontal = useRef(false);
  // Nach einem Wischen den darauf folgenden Klick schlucken, sonst öffnet
  // sich beim Loslassen zusätzlich das Bearbeiten-Formular.
  const swallowClick = useRef(false);

  function down(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY };
    dragging.current = true;
    horizontal.current = false;
    swallowClick.current = false;
  }

  function move(e) {
    if (!dragging.current) return;
    const moveX = e.clientX - start.current.x;
    const moveY = e.clientY - start.current.y;
    if (!horizontal.current) {
      // Senkrechte Geste? Dann gehört sie dem Scrollen, nicht uns.
      if (Math.abs(moveX) < SWIPE_START || Math.abs(moveX) <= Math.abs(moveY)) return;
      horizontal.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(Math.min(0, moveX));   // nur nach links
  }

  function up() {
    if (!dragging.current) return;
    dragging.current = false;
    const reached = dx <= -SWIPE_TRIGGER;
    swallowClick.current = horizontal.current;
    horizontal.current = false;
    setDx(0);
    if (reached) onSwipe();
  }

  function clickCapture(e) {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.stopPropagation();
    e.preventDefault();
  }

  return (
    <li
      className={dx < 0 ? "swipe is-sliding" : "swipe"}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onClickCapture={clickCapture}
    >
      <span className="swipe__bg" aria-hidden="true">
        <Trash2 size={20} />
      </span>
      <div
        className="swipe__fg"
        style={{ transform: `translateX(${dx}px)`, transition: dx ? "none" : undefined }}
      >
        {children}
      </div>
    </li>
  );
}

// Gemeinsame Einkaufsliste des Haushalts.
export default function ShoppingPage() {
  const navigate = useNavigate();
  const { activeId } = useWorkspace();

  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  // null = Reihenfolge wie eingetragen, "open" = Offene oben, "done" = Erledigte oben
  const [sort, setSort] = useState(null);
  // null = zu, sonst das Formular zum Anlegen oder Bearbeiten
  const [form, setForm] = useState(null);
  // Beschreibung und Menge stecken hinter "Mehr" – wie im Eintrags-Formular
  const [showMore, setShowMore] = useState(false);
  // Eintrag, dessen Löschen nachgefragt wird
  const [pending, setPending] = useState(null);
  // Haken in der Rückfrage. Startet bei jedem Öffnen der App leer.
  const [dontAsk, setDontAsk] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeId) return undefined;
    setList(null);
    return listenShoppingList(activeId, (result) => {
      setError("");
      setList(result);
    }, (err) => {
      console.error(err);
      setError(errorText(err, "Die Einkaufsliste konnte nicht geladen werden."));
      setList([]);
    });
  }, [activeId]);

  if (!list) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  async function toggleDone(item) {
    try {
      await setShoppingDone(activeId, item.id, !item.done);
    } catch (err) {
      console.error(err);
      setError(errorText(err, "Das konnte nicht gespeichert werden."));
    }
  }

  // Wischen: entweder direkt löschen oder erst nachfragen.
  function requestDelete(item) {
    if (skipDeleteConfirm) remove(item);
    else {
      setDontAsk(false);
      setPending(item);
    }
  }

  async function remove(item) {
    try {
      await deleteShoppingItem(activeId, item.id);
    } catch (err) {
      console.error(err);
      setError(errorText(err, "Der Eintrag konnte nicht gelöscht werden."));
    }
  }

  async function confirmDelete() {
    const item = pending;
    // Haken gesetzt heißt: bis zum nächsten Start der App nicht mehr fragen.
    if (dontAsk) skipDeleteConfirm = true;
    setPending(null);
    await remove(item);
  }

  async function handleClear() {
    setBusy(true);
    try {
      await clearShoppingList(activeId);
      setConfirmClear(false);
    } catch (err) {
      console.error(err);
      setError(errorText(err, "Die Liste konnte nicht gelöscht werden."));
    } finally {
      setBusy(false);
    }
  }

  // Eintraege lassen sich nur anlegen, abhaken und wischend loeschen –
  // ein Tipp auf die Zeile soll nichts ausloesen.
  function openForm() {
    setForm(emptyForm);
    setShowMore(false);
  }

  function changeQty(step) {
    setForm((f) => ({ ...f, qty: String(Math.max(1, (Number(f.qty) || 1) + step)) }));
  }

  async function submitForm(e) {
    e.preventDefault();
    const data = { title: titleCase(form.title), note: form.note, qty: form.qty };
    if (!data.title.trim()) return;
    setBusy(true);
    try {
      await addShoppingItem(activeId, data);
      setForm(null);
    } catch (err) {
      console.error(err);
      setError(errorText(err, "Der Eintrag konnte nicht gespeichert werden."));
    } finally {
      setBusy(false);
    }
  }

  const open = list.filter((i) => !i.done).length;

  // Ohne Sortierung bleibt die Reihenfolge, in der eingetragen wurde.
  // sort() ist stabil, innerhalb einer Gruppe aendert sich also nichts.
  const shown = sort
    ? [...list].sort((a, b) => {
        const rank = (i) => (i.done ? 1 : 0);
        return (rank(a) - rank(b)) * (sort === "open" ? 1 : -1);
      })
    : list;

  // Erster Tipp: Offene nach oben. Jeder weitere dreht die Richtung um.
  const sortIcon = {
    open: <ArrowDownNarrowWide size={20} />,
    done: <ArrowUpNarrowWide size={20} />
  }[sort] || <ArrowUpDown size={20} />;
  const sortLabel = {
    open: "Sortierung umdrehen: Erledigte oben",
    done: "Sortierung umdrehen: Offene oben"
  }[sort] || "Erledigte nach unten sortieren";
  // Passende Lebensmittel zum Getippten. Leer, solange nichts im Feld steht.
  const suggestions = form ? suggestGroceries(form.title) : [];

  // Steht etwas hinter "Mehr"? Dann in der zugeklappten Zeile andeuten.
  const formExtras = form
    ? [
        Number(form.qty) > 1 ? `${Number(form.qty)}×` : null,
        form.note.trim() ? "Beschreibung" : null
      ].filter(Boolean).join(" · ")
    : "";

  return (
    <div className="screen shopping-screen">
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title form-screen__title">Einkaufsliste</h1>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={() => setConfirmClear(true)}
          disabled={!list.length}
          aria-label="Liste löschen"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {error && <p className="error-box" role="alert">{error}</p>}

      {list.length > 0 && (
        <div className="total-box">
          <div className="total-row">
            <span className="total-row__label">
              {open} von {list.length} offen
            </span>
            <button
              type="button"
              className={sort ? "sort-btn is-active" : "sort-btn"}
              onClick={() => setSort((s) => (s === "open" ? "done" : "open"))}
              aria-label={sortLabel}
              title={sortLabel}
            >
              {sortIcon}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">
          <p className="hint">
            Die Liste ist leer. Was ihr hier eintragt, sieht auch der Partner sofort.
          </p>
          <button type="button" className="btn" onClick={() => openForm()}>
            <Plus size={20} /> Eintrag hinzufügen
          </button>
        </div>
      ) : (
        <>
          <ul className="item-list shop-list">
            {shown.map((item) => (
              <SwipeRow key={item.id} onSwipe={() => requestDelete(item)}>
                <div className={item.done ? "shop-row is-done" : "shop-row"}>
                  {/* Linkes Symbol: hakt ab und streicht den Titel durch. */}
                  <button
                    type="button"
                    className="shop-row__check"
                    onClick={() => toggleDone(item)}
                    aria-pressed={Boolean(item.done)}
                    aria-label={item.done ? `${titleCase(item.title)} wieder offen` : `${titleCase(item.title)} als gekauft markieren`}
                  >
                    {item.done ? <Check size={20} /> : <Circle size={20} />}
                  </button>

                  <span className="shop-row__text">
                    <span className="shop-row__title">{titleCase(item.title)}</span>
                    {item.note && <span className="shop-row__meta">{item.note}</span>}
                  </span>

                  {item.qty > 1 && <span className="shop-row__qty">{item.qty}×</span>}
                </div>
              </SwipeRow>
            ))}
          </ul>
          <p className="hint shop-hint">
            Nach links wischen löscht einen Eintrag.
          </p>
        </>
      )}

      {/* Anlegen und Bearbeiten teilen sich ein Formular. Sichtbar sind nur
          Titel, "Mehr" und Speichern – geschlossen wird oben rechts. */}
      {form && (
        <div className="confirm" role="dialog" aria-modal="true">
          <form className="confirm__box" onSubmit={submitForm}>
            <div className="sheet-head">
              <p className="confirm__text sheet-head__title">Neuer Eintrag</p>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setForm(null)}
                aria-label="Schließen"
              >
                <X size={20} />
              </button>
            </div>

            <label className="field">
              <span className="field__label">Titel</span>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={60}
                autoFocus
                required
                autoComplete="off"
              />
            </label>

            {/* Steht ausserhalb des <label>: darin wuerde ein Tipp nur das
                Eingabefeld fokussieren statt den Vorschlag zu uebernehmen. */}
            {suggestions.length > 0 && (
              <ul className="suggest">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="suggest__chip"
                      onClick={() => setForm((f) => ({ ...f, title: name }))}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Im Alltag reicht der Titel – der Rest bleibt eingeklappt. */}
            <button
              type="button"
              className="more-row"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              <span>
                Mehr
                {!showMore && formExtras && ` · ${formExtras}`}
              </span>
              {showMore ? <Minus size={18} /> : <Plus size={18} />}
            </button>

            {showMore && (
              <>
                <label className="field">
                  <span className="field__label">Beschreibung (optional)</span>
                  <input
                    className="input"
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    maxLength={200}
                  />
                </label>

                <div className="field">
                  <span className="field__label">Menge</span>
                  <div className="qty">
                    <button type="button" className="qty__btn" onClick={() => changeQty(-1)} aria-label="Weniger">
                      <Minus size={18} />
                    </button>
                    <input
                      className="input qty__field"
                      value={form.qty}
                      inputMode="numeric"
                      onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value.replace(/\D/g, "") }))}
                      onBlur={() => setForm((f) => ({ ...f, qty: String(Math.max(1, Number(f.qty) || 1)) }))}
                      aria-label="Menge"
                    />
                    <button type="button" className="qty__btn" onClick={() => changeQty(1)} aria-label="Mehr">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn" disabled={busy || !form.title.trim()}>
              {busy ? "Wird gespeichert …" : "Speichern"}
            </button>
          </form>
        </div>
      )}

      {/* Rückfrage nach dem Wischen. Der Haken gilt nur für diese Sitzung. */}
      {pending && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">„{titleCase(pending.title)}“ löschen?</p>

            <label className="check">
              <input
                type="checkbox"
                checked={dontAsk}
                onChange={(e) => setDontAsk(e.target.checked)}
              />
              <span>Nicht mehr nachfragen</span>
            </label>
            <p className="confirm__note">
              Die Nachfrage kommt beim nächsten Start der App wieder.
            </p>

            <button type="button" className="btn btn--danger" onClick={confirmDelete}>
              Löschen
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {confirmClear && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">Ganze Liste löschen?</p>
            <p className="confirm__note">
              Alle {list.length} {list.length === 1 ? "Eintrag" : "Einträge"} werden
              entfernt – auch beim Partner. Das lässt sich nicht rückgängig machen.
            </p>
            <button type="button" className="btn btn--danger" onClick={handleClear} disabled={busy}>
              {busy ? "Wird gelöscht …" : "Liste löschen"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Der runde Knopf unten legt hier einen Eintrag an. */}
      <TabBar
        fab={{
          icon: <Plus size={28} strokeWidth={2.4} />,
          label: "Eintrag hinzufügen",
          onClick: () => openForm()
        }}
      />
    </div>
  );
}
