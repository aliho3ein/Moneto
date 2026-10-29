import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";

// "28. Juli – 27. Aug." (das Ende des Zeitraums ist exklusiv, daher -1 ms)
export function periodLabel({ start, end }) {
  const last = new Date(end.getTime() - 1);
  const fmt = (date, month) =>
    new Intl.DateTimeFormat("de-DE", { day: "numeric", month }).format(date);
  const showYear = last.getFullYear() !== new Date().getFullYear();
  return `${fmt(start, "long")} – ${fmt(last, "short")}${showYear ? ` ${last.getFullYear()}` : ""}`;
}

export default function PeriodHeader() {
  const { period, offset, setOffset } = useWorkspace();

  // Der Zeitraum wechselt nur über die beiden Pfeile, nicht durch Wischen.
  return (
    <header className="period">
      <button
        type="button"
        className="period__nav"
        onClick={() => setOffset((o) => o - 1)}
        aria-label="Vorheriger Zeitraum"
      >
        <ChevronLeft size={22} />
      </button>
      <div className="period__label">
        <span>{periodLabel(period)}</span>
        {offset !== 0 && (
          <button type="button" className="period__today" onClick={() => setOffset(0)}>
            zum aktuellen Zeitraum
          </button>
        )}
      </div>
      <button
        type="button"
        className="period__nav"
        onClick={() => setOffset((o) => o + 1)}
        aria-label="Nächster Zeitraum"
      >
        <ChevronRight size={22} />
      </button>
    </header>
  );
}
