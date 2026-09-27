import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Settings } from "lucide-react";
import {
  listenPeriod, listenCategories, getUserNames
} from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import PeriodHeader, { usePeriodSwipe } from "../components/PeriodHeader";
import TabBar from "../components/TabBar";
import { Icon } from "../icons";
import Money from "../components/Money";

const UNKNOWN_CATEGORY = { name: "Ohne Kategorie", color: "#b9c7bf", icon: "basket" };

const dayFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" });
const dayTitleFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "short", day: "numeric", month: "long"
});

// yyyy-mm-dd als Schlüssel, damit sich Tage sortieren lassen
function dayKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayTitle(date) {
  const key = dayKey(date);
  if (key === dayKey(new Date())) return "Heute";
  if (key === dayKey(new Date(Date.now() - 86400000))) return "Gestern";
  return dayTitleFormat.format(date);
}

// Einnahmen zählen positiv, Ausgaben negativ – wie beim Kontostand.
function signedAmount(item) {
  return item.type === "income" ? item.amount : -item.amount;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeId, period } = useWorkspace();
  const swipe = usePeriodSwipe();

  const [categories, setCategories] = useState(null);
  const [data, setData] = useState(null);
  const [names, setNames] = useState({});
  const [error, setError] = useState("");
  const [groupBy, setGroupBy] = useState("date");
  // Eingeklappte Gruppen, Schlüssel ist der Gruppenschlüssel (Tag oder Kategorie)
  const [collapsed, setCollapsed] = useState({});
  // Kontostand aufgeklappt: zeigt Einnahmen und Ausgaben getrennt
  const [showTotals, setShowTotals] = useState(false);
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

  // Namen der Mitglieder nachladen – jede uid nur einmal.
  const items = data?.items;
  useEffect(() => {
    if (!items?.length) return;
    const missing = [...new Set(items.map((i) => i.createdBy).filter(Boolean))]
      .filter((uid) => !requested.current.has(uid));
    if (!missing.length) return;
    missing.forEach((uid) => requested.current.add(uid));
    getUserNames(missing)
      .then((result) => setNames((prev) => ({ ...prev, ...result })))
      .catch((err) => console.error(err));
  }, [items]);

  const byId = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  // Gruppen mit eigener Summe: entweder pro Tag oder pro Kategorie.
  // Die Einträge kommen bereits nach Datum absteigend aus listenPeriod.
  const groups = useMemo(() => {
    const list = data?.items || [];
    const map = new Map();

    for (const item of list) {
      const date = item.date.toDate();
      const key = groupBy === "category" ? item.categoryId : dayKey(date);

      if (!map.has(key)) {
        const cat = byId[item.categoryId] || UNKNOWN_CATEGORY;
        map.set(key, {
          key,
          title: groupBy === "category" ? cat.name : dayTitle(date),
          icon: groupBy === "category" ? cat.icon : null,
          color: groupBy === "category" ? cat.color : null,
          items: [],
          sum: 0
        });
      }

      const group = map.get(key);
      group.items.push(item);
      group.sum += signedAmount(item);
    }

    const result = [...map.values()];
    // Kategorien nach Größe, Tage nach Datum (neueste zuerst)
    return groupBy === "category"
      ? result.sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum))
      : result.sort((a, b) => b.key.localeCompare(a.key));
  }, [data, groupBy, byId]);

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

  function toggleGroup(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const amountClass = (cents) => (cents >= 0 ? "is-income" : "is-expense");

  return (
    <div className="screen items-screen" {...swipe}>
      <header className="page-head">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Zurück">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-head__title form-screen__title">Einträge</h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate("/settings")}
          aria-label="Einstellungen"
        >
          <Settings size={20} />
        </button>
      </header>

      <PeriodHeader />

      {error && <p className="error-box" role="alert">{error}</p>}

      {data.items.length === 0 ? (
        <div className="empty">
          <p className="hint">Noch keine Einträge in diesem Zeitraum.</p>
          <button type="button" className="btn" onClick={() => navigate("/item/new")}>
            <Plus size={20} /> Eintrag hinzufügen
          </button>
        </div>
      ) : (
        <>
          <div className="toggle" role="group" aria-label="Sortierung">
            <button
              type="button"
              className={groupBy === "date" ? "toggle__btn is-active" : "toggle__btn"}
              onClick={() => { setGroupBy("date"); setCollapsed({}); }}
            >
              Nach Datum
            </button>
            <button
              type="button"
              className={groupBy === "category" ? "toggle__btn is-active" : "toggle__btn"}
              onClick={() => { setGroupBy("category"); setCollapsed({}); }}
            >
              Nach Kategorie
            </button>
          </div>

          {/* Kontostand des Zeitraums – aufklappbar für Einnahmen/Ausgaben */}
          <div className="total-box">
            <button
              type="button"
              className="total-row"
              onClick={() => setShowTotals((v) => !v)}
              aria-expanded={showTotals}
            >
              <span className="total-row__label">
                {showTotals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Kontostand · {data.items.length} {data.items.length === 1 ? "Eintrag" : "Einträge"}
              </span>
              <strong className={amountClass(data.balance)}>
                <Money cents={data.balance} sign={data.balance >= 0 ? "+" : "−"} />
              </strong>
            </button>

            {showTotals && (
              <dl className="totals">
                <div className="totals__row">
                  <dt>Einnahmen</dt>
                  <dd className="is-income"><Money cents={data.income} sign="+" /></dd>
                </div>
                <div className="totals__row">
                  <dt>Ausgaben</dt>
                  <dd className="is-expense"><Money cents={data.expense} sign="−" /></dd>
                </div>
              </dl>
            )}
          </div>

          {groups.map((group) => (
            <section className="item-group" key={group.key}>
              <h2 className="group-head">
                <button
                  type="button"
                  className="group-toggle"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={!collapsed[group.key]}
                  aria-label={`${group.title} ${collapsed[group.key] ? "einblenden" : "ausblenden"}`}
                >
                  {collapsed[group.key] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>

                {group.icon && (
                  <span className="group-head__icon" style={{ background: group.color }}>
                    <Icon name={group.icon} size={14} color="#fff" />
                  </span>
                )}
                <span className="group-head__title">{group.title}</span>
                <span className={`group-head__sum ${amountClass(group.sum)}`}>
                  <Money cents={group.sum} sign={group.sum >= 0 ? "+" : "−"} />
                </span>
              </h2>

              {!collapsed[group.key] && (
              <ul className="item-list">
                {group.items.map((item) => {
                  const cat = byId[item.categoryId] || UNKNOWN_CATEGORY;
                  const income = item.type === "income";
                  // In der Kategorie-Ansicht steht der Name schon in der
                  // Überschrift – dort ist die Notiz die nützlichere Zeile.
                  const byCategory = groupBy === "category";
                  const author = authorName(item.createdBy);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="item-row"
                        onClick={() => navigate(`/item/${item.id}`)}
                      >
                        <span className="item-row__icon" style={{ background: cat.color }}>
                          <Icon name={cat.icon} size={18} color="#fff" />
                        </span>
                        <span className="item-row__text">
                          {byCategory ? (
                            <>
                              <span className="item-row__name">{item.note || cat.name}</span>
                              <span className="item-row__meta">
                                {dayFormat.format(item.date.toDate())} · {author}
                              </span>
                            </>
                          ) : (
                            <>
                              {/* Nach Datum gruppiert steht der Tag schon in der
                                  Überschrift – hier Notiz und Name in einer Zeile. */}
                              <span className="item-row__name">{cat.name}</span>
                              <span className="item-row__note">
                                {item.note && `${item.note} · `}
                                <span className="item-row__author">{author}</span>
                              </span>
                            </>
                          )}
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
            </section>
          ))}
        </>
      )}

      <TabBar />
    </div>
  );
}
