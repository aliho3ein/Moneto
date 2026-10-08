import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Store, Trash2, X } from "lucide-react";
import {
  addItem, updateItem, deleteItem, getItem, listenCategories, euroToCent
} from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import { Icon } from "../icons";
import { currencySymbol } from "../currencies";
import { shopGroupsFor, faviconUrl } from "../shops";
import Money from "../components/Money";

// Eingabe auf deutsches Format begrenzen: Ziffern und genau ein Komma.
// Ein getippter Punkt wird zum Komma, damit euroToCent ihn nicht als
// Tausendertrennzeichen liest ("45.99" wäre sonst 4599 €).
function sanitizeAmount(value) {
  let s = value.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const first = s.indexOf(",");
  if (first === -1) return s;
  const whole = s.slice(0, first);
  const dec = s.slice(first + 1).replace(/,/g, "").slice(0, 2);
  return `${whole},${dec}`;
}

// Gehört die Notiz zu dieser Gruppe? ("Tanken - Aral" → Gruppe "Tanken")
function noteStartsWith(note, group) {
  return note.trim().toLowerCase().startsWith(`${group.toLowerCase()} -`);
}

// 4599 → "45,99" für das Eingabefeld
function centToInput(cent) {
  return (cent / 100).toFixed(2).replace(".", ",");
}

function toDateInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 12 Uhr statt Mitternacht: so kippt der Eintrag bei Zeitumstellungen
// nicht in den Nachbartag und damit in den falschen Zeitraum.
function fromDateInput(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// Vorauswahl bei einem neuen Eintrag – zuerst über die feste ID der
// Standard-Kategorie, ersatzweise über den Namen (ältere Haushalte haben
// für diese Kategorien noch zufällige IDs).
const DEFAULT_CATEGORY = { expense: "std-lebensmittel", income: "std-gehalt" };
const DEFAULT_NAME = { expense: "lebensmittel", income: "gehalt" };

const emptyArticle = () => ({ name: "", price: "", qty: "1" });

export default function ItemFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeId, currency } = useWorkspace();
  // /item/new und /item/:id teilen sich diese Seite
  const isEdit = Boolean(id) && id !== "new";

  const [type, setType] = useState("expense");
  const [amountEuro, setAmountEuro] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [note, setNote] = useState("");
  const [articles, setArticles] = useState([]);
  // Datum und Artikel sind hinter "Mehr" eingeklappt
  const [showMore, setShowMore] = useState(false);
  // Domains, deren Favicon nicht geladen werden konnte -> dann das eigene Symbol
  const [brokenIcons, setBrokenIcons] = useState({});

  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeId) return undefined;
    return listenCategories(activeId, setCategories, (err) => {
      console.error(err);
      setCategories([]);
      setError("Kategorien konnten nicht geladen werden.");
    });
  }, [activeId]);

  // Bestehenden Eintrag laden
  useEffect(() => {
    if (!isEdit || !activeId) return;
    let cancelled = false;
    setLoading(true);
    getItem(activeId, id)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          setError("Dieser Eintrag existiert nicht mehr.");
          return;
        }
        setType(item.type);
        setAmountEuro(centToInput(item.amount));
        setCategoryId(item.categoryId);
        const itemDate = toDateInput(item.date.toDate());
        setDate(itemDate);
        setNote(item.note || "");
        // Weicht das Datum von heute ab, gleich aufgeklappt zeigen.
        if (itemDate !== toDateInput(new Date())) setShowMore(true);
        if (item.articles?.length) {
          setArticles(item.articles.map((a) => ({
            name: a.name || "",
            price: a.price ? centToInput(a.price) : "",
            qty: String(a.qty || 1)
          })));
          setShowMore(true);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Eintrag konnte nicht geladen werden.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isEdit, activeId, id]);

  const visibleCategories = useMemo(
    () => (categories || []).filter((c) => c.type === type),
    [categories, type]
  );

  // Beim Umschalten Ausgabe/Einnahme passt die gewählte Kategorie evtl. nicht
  // mehr. Erst prüfen, wenn die Kategorien wirklich da sind – sonst würde beim
  // Bearbeiten die geladene Kategorie gelöscht, falls der Eintrag vor der
  // Kategorie-Liste ankommt.
  useEffect(() => {
    if (!categories) return;
    if (categoryId && !visibleCategories.some((c) => c.id === categoryId)) {
      setCategoryId("");
      setNote("");
      return;
    }
    // Bei einem neuen Eintrag die übliche Kategorie vorauswählen. Beim
    // Bearbeiten absichtlich nicht – sonst bekäme ein Eintrag, dessen
    // Kategorie archiviert wurde, beim Speichern still eine neue.
    if (!isEdit && !categoryId) {
      const preset = visibleCategories.find((c) => c.id === DEFAULT_CATEGORY[type])
        || visibleCategories.find((c) => c.name.trim().toLowerCase() === DEFAULT_NAME[type]);
      if (preset) setCategoryId(preset.id);
    }
  }, [categories, visibleCategories, categoryId, type, isEdit]);

  // Vorschläge für die Notiz, passend zur gewählten Kategorie. Manche
  // Kategorien haben Untergruppen (Mobilität: Tanken / Laden / Reparieren).
  const shopGroups = useMemo(
    () => shopGroupsFor(visibleCategories.find((c) => c.id === categoryId)),
    [visibleCategories, categoryId]
  );
  const [shopGroup, setShopGroup] = useState(0);

  // Beim Kategoriewechsel (und beim Laden eines Eintrags) die Gruppe wählen,
  // die zur Notiz passt – sonst die erste.
  useEffect(() => {
    const index = shopGroups.findIndex((g) => g.name && noteStartsWith(note, g.name));
    setShopGroup(index >= 0 ? index : 0);
  }, [categoryId, shopGroups]);

  const shops = shopGroups[shopGroup]?.shops || [];
  const hasGroups = shopGroups.length > 1;

  // Notiz-Text eines Chips: mit Gruppe davor, z. B. "Tanken - Aral".
  function noteForShop(shop) {
    const group = shopGroups[shopGroup]?.name;
    return group ? `${group} - ${shop.name}` : shop.name;
  }

  const articleSum = useMemo(() => articles.reduce((sum, a) => {
    const price = a.price ? euroToCent(a.price) : 0;
    const qty = Number(a.qty) || 0;
    return sum + (Number.isFinite(price) ? price * qty : 0);
  }, 0), [articles]);

  function updateArticle(index, field, value) {
    setArticles((rows) => rows.map((row, i) => (
      i === index ? { ...row, [field]: field === "price" ? sanitizeAmount(value) : value } : row
    )));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cents = amountEuro ? euroToCent(amountEuro) : NaN;
    if (!Number.isFinite(cents) || cents <= 0) {
      setError("Bitte einen Betrag größer als 0 eingeben.");
      return;
    }
    if (!categoryId) {
      setError("Bitte eine Kategorie wählen.");
      return;
    }

    const cleanArticles = articles
      .filter((a) => a.name.trim())
      .slice(0, 100)
      .map((a) => ({
        name: a.name.trim().slice(0, 60),
        price: a.price ? euroToCent(a.price) : 0,
        qty: Number(a.qty) || 1
      }));

    setError("");
    setSaving(true);
    try {
      const payload = {
        amountEuro,
        type,
        categoryId,
        date: fromDateInput(date),
        note: note.trim(),
        articles: cleanArticles
      };
      if (isEdit) await updateItem(activeId, id, payload);
      else await addItem(activeId, payload);
      navigate(-1);
    } catch (err) {
      console.error(err);
      setError("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteItem(activeId, id);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Löschen fehlgeschlagen.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading || !categories) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  return (
    <form className="screen form-screen" onSubmit={handleSubmit}>
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title form-screen__title">
          {isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"}
        </h1>
        {isEdit ? (
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={() => setConfirmDelete(true)}
            aria-label="Eintrag löschen"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          <span className="icon-btn-placeholder" />
        )}
      </header>

      {/* type */}
      <div className="toggle" role="group" aria-label="Art des Eintrags">
        <button
          type="button"
          className={type === "expense" ? "toggle__btn is-active is-expense" : "toggle__btn"}
          onClick={() => setType("expense")}
        >
          Ausgabe
        </button>
        <button
          type="button"
          className={type === "income" ? "toggle__btn is-active is-income" : "toggle__btn"}
          onClick={() => setType("income")}
        >
          Einnahme
        </button>
      </div>

      {/* amountEuro */}
      <label className="field amount-field">
        <span className="field__label">Betrag</span>
        <div className={type === "income" ? "amount-input is-income" : "amount-input is-expense"}>
          <input
            className="amount-input__field"
            name="amountEuro"
            value={amountEuro}
            onChange={(e) => setAmountEuro(sanitizeAmount(e.target.value))}
            inputMode="decimal"
            placeholder="0,00"
            required
            autoComplete="off"
          />
          <span className="amount-input__currency">{currencySymbol(currency)}</span>
        </div>
      </label>

      {/* categoryId */}
      <div className="field">
        <span className="field__label">Kategorie</span>
        {visibleCategories.length === 0 ? (
          <p className="hint">
            Keine {type === "income" ? "Einnahme" : "Ausgabe"}-Kategorie vorhanden.{" "}
            <button type="button" className="link" onClick={() => navigate("/categories")}>
              Kategorie anlegen
            </button>
          </p>
        ) : (
          <div className="cat-grid">
            {visibleCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={cat.id === categoryId ? "cat-tile is-active" : "cat-tile"}
                // Gewählt: Kachel in der Kategorie-Farbe, Symbol-Feld grau,
                // Symbol selbst farbig. Die Farbe kommt aus der Datenbank,
                // deshalb hier als Inline-Stil.
                style={cat.id === categoryId
                  ? { background: cat.color, borderColor: cat.color }
                  : undefined}
                onClick={() => { setCategoryId(cat.id); setNote(""); }}
              >
                <span
                  className="cat-tile__icon"
                  style={{ background: cat.id === categoryId ? "#eef2f8" : cat.color }}
                >
                  <Icon
                    name={cat.icon}
                    size={20}
                    color={cat.id === categoryId ? cat.color : "#fff"}
                  />
                </span>
                <span className="cat-tile__name">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* note */}
      <div className="field">
        <label className="field">
          <span className="field__label">Notiz (optional)</span>
          <div className="input-wrap">
            <input
              className="input input--with-clear"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="z. B. Wocheneinkauf"
              autoComplete="off"
            />
            {note && (
              <button
                type="button"
                className="input-clear"
                onClick={() => setNote("")}
                aria-label="Notiz löschen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </label>

        {/* Schnellauswahl passend zur Kategorie, z. B. Märkte bei Lebensmitteln */}
        {hasGroups && (
          <div className="shop-tabs" role="group" aria-label="Art der Ausgabe">
            {shopGroups.map((group, index) => (
              <button
                type="button"
                key={group.name}
                className={index === shopGroup ? "shop-tab is-active" : "shop-tab"}
                onClick={() => setShopGroup(index)}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}

        {shops.length > 0 && (
          <div className="shops">
            {shops.map((shop) => {
              const label = noteForShop(shop);
              const active = note.trim().toLowerCase() === label.toLowerCase();
              return (
                <button
                  type="button"
                  key={shop.name}
                  className={active ? "shop-chip is-active" : "shop-chip"}
                  style={active
                    ? { background: shop.color, borderColor: shop.color, color: shop.dark ? "#1f2a24" : "#fff" }
                    : { borderColor: shop.color, color: shop.dark ? "#8a7300" : shop.color }}
                  onClick={() => setNote(active ? "" : label)}
                >
                  {brokenIcons[shop.domain] ? (
                    <Store size={15} />
                  ) : (
                    <img
                      className="shop-chip__icon"
                      src={faviconUrl(shop.domain)}
                      alt=""
                      width={18}
                      height={18}
                      loading="lazy"
                      onError={() => setBrokenIcons((prev) => ({ ...prev, [shop.domain]: true }))}
                    />
                  )}
                  {}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Datum und Artikel stehen hinter "Mehr" – im Alltag reichen
          Betrag, Kategorie und Notiz. */}
      <button
        type="button"
        className="more-row"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
      >
        <span>
          Mehr
          {!showMore && articles.length > 0 && ` · ${articles.length} Artikel`}
        </span>
        {showMore ? <Minus size={18} /> : <Plus size={18} />}
      </button>

      {showMore && (
        <>
          {/* date */}
          <label className="field">
            <span className="field__label">Datum</span>
            <input
              className="input"
              type="date"
              name="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          {/* articles */}
          <div className="field">
            <span className="field__label">Artikel (optional)</span>
            <div className="articles">
            {articles.map((article, index) => (
              <div className="article-row" key={index}>
                <input
                  className="input article-row__name"
                  value={article.name}
                  onChange={(e) => updateArticle(index, "name", e.target.value)}
                  placeholder="Name"
                  maxLength={60}
                  autoComplete="off"
                />
                <input
                  className="input article-row__price"
                  value={article.price}
                  onChange={(e) => updateArticle(index, "price", e.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                  autoComplete="off"
                />
                <input
                  className="input article-row__qty"
                  value={article.qty}
                  onChange={(e) => updateArticle(index, "qty", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="1"
                />
                <button
                  type="button"
                  className="article-row__remove"
                  onClick={() => setArticles((rows) => rows.filter((_, i) => i !== index))}
                  aria-label="Artikel entfernen"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setArticles((rows) => [...rows, emptyArticle()])}
              disabled={articles.length >= 100}
            >
              <Plus size={18} /> Artikel hinzufügen
            </button>

            {articleSum > 0 && (
              <p className="articles__sum">
                Summe <Money cents={articleSum} />
                <button
                  type="button"
                  className="link"
                  onClick={() => setAmountEuro(centToInput(articleSum))}
                >
                  als Betrag übernehmen
                </button>
              </p>
            )}
            </div>
          </div>
        </>
      )}

      {error && <p className="error-box" role="alert">{error}</p>}

      {/* Speichern liegt fest am unteren Rand, damit es bei langem
          Formular immer erreichbar bleibt. */}
      <div className="form-bar">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? <span className="spinner" /> : null}
          {saving ? "Speichern …" : "Speichern"}
        </button>
      </div>

      {confirmDelete && (
        <div className="confirm" role="dialog" aria-modal="true">
          <div className="confirm__box">
            <p className="confirm__text">Diesen Eintrag wirklich löschen?</p>
            <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Wird gelöscht …" : "Löschen"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
