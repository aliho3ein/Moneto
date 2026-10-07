import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  listenPeriod, listenCategories
} from "../../firebase/firestore-service.js";
import { Settings } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import PeriodHeader, { usePeriodSwipe } from "../components/PeriodHeader";
import TabBar from "../components/TabBar";
import { Icon } from "../icons";
import Money from "../components/Money";
import { useDarkMode, lighten } from "../theme";
import iconMark from "../assets/logo/moneto-icon.svg";

const RING_EMPTY = "#e2efe7";
const RING_EMPTY_DARK = "#27324b";
// Im Dunkelmodus sind die Kategorie-Farben aufgehellt – darauf ist ein
// dunkles Symbol besser zu erkennen als ein weißes.
const ICON_ON_COLOR_DARK = "#17223a";
const UNKNOWN_CATEGORY = { name: "Ohne Kategorie", color: "#b9c7bf", icon: "basket" };

export default function HomePage() {
  const navigate = useNavigate();
  const { activeId, workspace, period } = useWorkspace();
  // Tipp auf den Donut öffnet die Einträge, Wischen bleibt der Zeitraumwechsel.
  const swipe = usePeriodSwipe(() => navigate("/items"));
  const dark = useDarkMode();

  const [categories, setCategories] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Live-Kategorien; die Rückgabe beendet den Listener beim Verlassen.
  useEffect(() => {
    if (!activeId) return undefined;
    return listenCategories(activeId, setCategories, (err) => {
      console.error(err);
      setCategories([]);
      setError("Kategorien konnten nicht geladen werden.");
    });
  }, [activeId]);

  // Live-Auswertung des gewählten Zeitraums.
  useEffect(() => {
    if (!activeId) return undefined;
    setData(null);
    return listenPeriod(activeId, period.start, period.end, (result) => {
      setError("");
      setData(result);
    }, (err) => {
      console.error(err);
      setError("Daten konnten nicht geladen werden.");
      setData({ items: [], income: 0, expense: 0, balance: 0, percentages: [] });
    });
  }, [activeId, period]);

  const byId = useMemo(() => {
    const map = {};
    (categories || []).forEach((c) => { map[c.id] = c; });
    return map;
  }, [categories]);

  const slices = useMemo(() => (data?.percentages || []).map((p) => {
    const cat = byId[p.categoryId] || UNKNOWN_CATEGORY;
    return {
      ...p,
      name: cat.name,
      icon: cat.icon,
      color: dark ? lighten(cat.color, 0.22) : cat.color
    };
  }), [data, byId, dark]);

  if (!categories || !data) {
    return (
      <div className="center-state">
        <span className="spinner spinner--dark" />
      </div>
    );
  }

  // Icon auf dem Ring, Prozentzahl außerhalb – nur wenn das Stück groß genug ist.
  function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, index }) {
    const slice = slices[index];
    if (!slice) return null;
    const rad = (-midAngle * Math.PI) / 180;
    const mid = (innerRadius + outerRadius) / 2;
    const ix = cx + mid * Math.cos(rad);
    const iy = cy + mid * Math.sin(rad);
    const tx = cx + (outerRadius + 16) * Math.cos(rad);
    const ty = cy + (outerRadius + 16) * Math.sin(rad);
    return (
      <g key={slice.categoryId}>
        {slice.percent >= 9 && (
          <Icon
            name={slice.icon}
            size={18}
            x={ix - 9}
            y={iy - 9}
            color={dark ? ICON_ON_COLOR_DARK : "#fff"}
            strokeWidth={2}
          />
        )}
        {slice.percent >= 4 && (
          <text
            x={tx}
            y={ty}
            fill={dark ? "#93a0bb" : "#6b7c72"}
            fontSize="12"
            fontWeight="500"
            textAnchor={Math.cos(rad) >= 0 ? "start" : "end"}
            dominantBaseline="middle"
          >
            {slice.percent} %
          </text>
        )}
      </g>
    );
  }

  const ringData = slices.length
    ? slices
    : [{ categoryId: "leer", sum: 1, color: dark ? RING_EMPTY_DARK : RING_EMPTY }];

  return (
    <div className="screen home">
      <div className="home__top">
        <img src={iconMark} alt="Moneto" className="home__mark" />
        <span className="home__ws">{workspace?.name}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate("/settings")}
          aria-label="Einstellungen"
        >
          <Settings size={20} />
        </button>
      </div>

      <PeriodHeader />

      {error && <p className="error-box" role="alert">{error}</p>}

      {/* Fest bleiben nur Kopfzeile, Zeitraum und die untere Leiste –
          Donut und Kategorien scrollen gemeinsam. */}
      <div className="home__scroll">
        <section
        className="donut"
        role="button"
        tabIndex={0}
        aria-label="Einträge anzeigen"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/items"); }}
        {...swipe}
      >
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={ringData}
              dataKey="sum"
              cx="50%"
              cy="50%"
              innerRadius={76}
              outerRadius={108}
              paddingAngle={slices.length > 1 ? 2 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
              labelLine={false}
              label={slices.length ? renderLabel : undefined}
            >
              {ringData.map((s) => (
                <Cell key={s.categoryId} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="donut__center">
          <span className="donut__label">Kontostand</span>
          <strong className={data.balance >= 0 ? "donut__balance is-income" : "donut__balance is-expense"}>
            <Money cents={data.balance} />
          </strong>
        </div>
      </section>

        {slices.length > 0 ? (
          <ul className="legend">
            {slices.map((s) => (
              <li key={s.categoryId} className="legend__row">
                <span className="legend__icon" style={{ background: s.color }}>
                  <Icon name={s.icon} size={16} color={dark ? ICON_ON_COLOR_DARK : "#fff"} />
                </span>
                <span className="legend__name">{s.name}</span>
                <span className="legend__percent">{s.percent} %</span>
                <span className="legend__sum"><Money cents={s.sum} /></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">Noch keine Ausgaben in diesem Zeitraum.</p>
        )}
      </div>

      <TabBar />
    </div>
  );
}
