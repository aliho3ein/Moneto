import React, { useRef } from "react";
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

// Wischen nach links = nächster Zeitraum, nach rechts = voriger.
export function usePeriodSwipe() {
  const { setOffset } = useWorkspace();
  const startX = useRef(null);
  return {
    onTouchStart(e) {
      startX.current = e.changedTouches[0].clientX;
    },
    onTouchEnd(e) {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      startX.current = null;
      if (Math.abs(dx) < 45) return;
      setOffset((o) => o + (dx < 0 ? 1 : -1));
    }
  };
}

export default function PeriodHeader() {
  const { period, offset, setOffset } = useWorkspace();
  const swipe = usePeriodSwipe();

  return (
    <header className="period" {...swipe}>
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
