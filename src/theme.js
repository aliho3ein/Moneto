import { useEffect, useState } from "react";

const QUERY = "(prefers-color-scheme: dark)";

// Folgt der Einstellung des Geräts und reagiert auch auf eine Umstellung
// bei geöffneter App.
export function useDarkMode() {
  const [dark, setDark] = useState(
    () => window.matchMedia?.(QUERY).matches ?? false
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setDark(e.matches);
    setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return dark;
}

// Mischt eine Farbe Richtung Weiß. Die Kategorie-Farben kommen aus der
// Datenbank und sind für hellen Grund gewählt – im dunklen Modus wirken
// sie sonst stumpf.
export function lighten(hex, amount = 0.2) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || "");
  if (!match) return hex;

  let value = match[1];
  if (value.length === 3) value = value.split("").map((c) => c + c).join("");

  const num = parseInt(value, 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  const r = mix((num >> 16) & 255);
  const g = mix((num >> 8) & 255);
  const b = mix(num & 255);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
