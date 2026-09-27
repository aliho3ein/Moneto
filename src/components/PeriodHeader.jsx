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
// `onTap` wird bei einem einfachen Tipp/Klick ausgelöst – nach einem
// Wischen aber nicht, sonst löste jede Wischgeste zusätzlich den Klick aus.
export function usePeriodSwipe(onTap) {
  const { setOffset } = useWorkspace();
  const startX = useRef(null);
  const swiped = useRef(false);

  return {
    onTouchStart(e) {
      startX.current = e.changedTouches[0].clientX;
      swiped.current = false;
    },
    onTouchEnd(e) {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      startX.current = null;
      if (Math.abs(dx) < 45) return;
      swiped.current = true;
      setOffset((o) => o + (dx < 0 ? 1 : -1));
    },
    onClick(e) {
      if (swiped.current) {
        swiped.current = false;
        return;
      }
      if (onTap) onTap(e);
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
