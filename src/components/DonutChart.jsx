import React, { useEffect, useState } from "react";
import { Icon } from "../icons";
import { categoryTotal, fmt } from "../format";
import { buildLayout, COMPACT, WIDE } from "./donutLayout";

function useCompact(query = "(max-width: 980px)") {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = (event) => setCompact(event.matches);
    setCompact(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return compact;
}

export default function DonutChart({ categories, expenses, balance, budget, onSelect }) {
  const compact = useCompact();
  const [hovered, setHovered] = useState(null);
  const cfg = compact ? COMPACT : WIDE;

  const items = categories
    .map((c) => ({ ...c, total: categoryTotal(c.id, expenses) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const { cx, cy, total, segments } = buildLayout(items, cfg);

  const summary = segments.length
    ? `Kontostand ${fmt.format(balance)}. Ausgaben nach Kategorie: ${segments
        .map((s) => `${s.name} ${fmt.format(s.total)}`)
        .join(", ")}.`
    : `Kontostand ${fmt.format(balance)}. Noch keine Ausgaben erfasst.`;

  return (
    <div className={compact ? "donut-figure is-compact" : "donut-figure"}>
      <svg
        className="donut-svg"
        viewBox={`0 0 ${cfg.width} ${cfg.height}`}
        role="img"
        aria-label={summary}
      >
        {segments.length === 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={(cfg.rOuter + cfg.rInner) / 2}
            fill="none"
            stroke="#e3efea"
            strokeWidth={cfg.rOuter - cfg.rInner}
          />
        )}

        {segments.map((seg) => {
          const dimmed = hovered && hovered !== seg.id;
          const pct = Math.round((seg.total / total) * 100);
          return (
            <g
              key={seg.id}
              className={dimmed ? "donut-seg is-dimmed" : "donut-seg"}
              role="button"
              tabIndex={0}
              aria-label={`${seg.name}: ${fmt.format(seg.total)}, ${pct} Prozent`}
              onClick={() => onSelect(seg.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(seg.id);
                }
              }}
              onMouseEnter={() => setHovered(seg.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(seg.id)}
              onBlur={() => setHovered(null)}
            >
              <title>{`${seg.name}: ${fmt.format(seg.total)}`}</title>

              <polyline
                className="donut-leader"
                points={seg.points}
                stroke={hovered === seg.id ? seg.color : "#c6d5d0"}
              />
              <path className="donut-slice" d={seg.path} fill={seg.color} />

              <circle
                className="donut-chip"
                cx={seg.chipX}
                cy={seg.labelY}
                r={cfg.chipR}
                fill={`${seg.color}24`}
                stroke={hovered === seg.id ? seg.color : "transparent"}
              />
              <g style={{ color: seg.color }}>
                <Icon
                  name={seg.icon}
                  size={cfg.iconSize}
                  strokeWidth={2}
                  x={seg.chipX - cfg.iconSize / 2}
                  y={seg.labelY - cfg.iconSize / 2}
                />
              </g>

              {cfg.showText && (
                <>
                  <text
                    className="donut-label-name"
                    x={seg.textX}
                    y={seg.labelY - 3}
                    textAnchor={seg.anchor}
                  >
                    {seg.name}
                  </text>
                  <text
                    className="donut-label-value"
                    x={seg.textX}
                    y={seg.labelY + 13}
                    textAnchor={seg.anchor}
                  >
                    {fmt.format(seg.total)} · {pct}%
                  </text>
                </>
              )}
            </g>
          );
        })}

        <text className="donut-center-label" x={cx} y={cy + cfg.labelDy} textAnchor="middle">
          KONTOSTAND
        </text>
        <text
          className={balance < 0 ? "donut-center-value is-negative" : "donut-center-value"}
          x={cx}
          y={cy + cfg.valueDy}
          textAnchor="middle"
        >
          {fmt.format(balance)}
        </text>
        <text className="donut-center-sub" x={cx} y={cy + cfg.subDy} textAnchor="middle">
          von {fmt.format(budget)}
        </text>
      </svg>

      {compact && segments.length > 0 && (
        <ul className="donut-key">
          {segments.map((seg) => (
            <li key={seg.id}>
              <button onClick={() => onSelect(seg.id)}>
                <span className="donut-key-dot" style={{ background: seg.color }} />
                <span className="donut-key-name">{seg.name}</span>
                <span className="donut-key-value">{fmt.format(seg.total)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {segments.length === 0 && (
        <p className="muted donut-empty">Noch keine Ausgaben vorhanden.</p>
      )}
    </div>
  );
}
