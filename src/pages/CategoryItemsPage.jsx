import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  listenPeriod, listenCategories, getUserNames
} from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import PeriodHeader, { usePeriodSwipe } from "../components/PeriodHeader";
import TabBar from "../components/TabBar";
import Money from "../components/Money";
import { Icon } from "../icons";

const UNKNOWN_CATEGORY = { name: "Ohne Kategorie", color: "#b9c7bf", icon: "basket" };
const dayFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });

// Alle Einträge einer Kategorie im gewählten Zeitraum.
export default function CategoryItemsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { activeId, period } = useWorkspace();
  const swipe = usePeriodSwipe();

  const [categories, setCategories] = useState(null);
  const [data, setData] = useState(null);
  const [names, setNames] = useState({});
  const [error, setError] = useState("");
  const requested = useRef(new Set());

  useEffect(() => {
    if (!activeId) return undefined;
    return listenCategories(activeId, setCategories, (err) => {
      console.error(err);
      setCategories([]);
    });
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return undefined;
    setData(null);
    return listenPeriod(activeId, period.start, period.end, (result) => {
      setError("");
      setData(result);
    }, (err) => {
      console.error(err);
      setError("Einträge konnten nicht geladen werden.");
      setData({ items: [], income: 0, expense: 0, balance: 0, percentages: [] });
    });
  }, [activeId, period]);

  // Nur die Einträge dieser Kategorie, nach Datum sortiert (neueste zuerst).
  const items = useMemo(
    () => (data?.items || [])
      .filter((item) => item.categoryId === id)
      .sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [data, id]
  );

  useEffect(() => {
    if (!items.length) return;
    const missing = [...new Set(items.map((i) => i.createdBy).filter(Boolean))]
      .filter((uid) => !requested.current.has(uid));
    if (!missing.length) return;
    missing.forEach((uid) => requested.current.add(uid));
    getUserNames(missing)
      .then((result) => setNames((prev) => ({ ...prev, ...result })))
      .catch((err) => console.error(err));
  }, [items]);

  const category = (categories || []).find((c) => c.id === id) || UNKNOWN_CATEGORY;
  const sum = items.reduce(
    (total, item) => total + (item.type === "income" ? item.amount : -item.amount),
    0
  );

  if (!categories || !data) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  function authorName(uid) {
    if (uid === user?.uid) return "du";
    return names[uid] || "…";
  }

  return (
    <div className="screen items-screen" {...swipe}>
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title cat-page__title">
          <span className="cat-page__icon" style={{ background: category.color }}>
            <Icon name={category.icon} size={16} color="#fff" />
          </span>
          {category.name}
        </h1>
        <span className="icon-btn-placeholder" />
      </header>

      <PeriodHeader />

      {error && <p className="error-box" role="alert">{error}</p>}

      <div className="total-box">
        <div className="total-row">
          <span className="total-row__label">
            {items.length} {items.length === 1 ? "Eintrag" : "Einträge"}
          </span>
          <strong className={sum >= 0 ? "is-income" : "is-expense"}>
            <Money cents={sum} sign={sum >= 0 ? "+" : "−"} />
          </strong>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="hint">In diesem Zeitraum gibt es hier keine Einträge.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => {
            const income = item.type === "income";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="item-row"
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  {/* Statt des Kategorie-Symbols – das steht oben in der
                      Überschrift – führt hier das Datum die Zeile an. */}
                  <span className="item-row__date">{dayFormat.format(item.date.toDate())}</span>
                  <span className="item-row__text">
                    <span className="item-row__name">{item.note || "Ohne Notiz"}</span>
                    <span className="item-row__meta">{authorName(item.createdBy)}</span>
                  </span>
                  <span className={income ? "item-row__amount is-income" : "item-row__amount is-expense"}>
                    <Money cents={item.amount} sign={income ? "+" : "−"} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <TabBar />
    </div>
  );
}
