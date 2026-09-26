import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, ListOrdered, Plus } from "lucide-react";

// Untere Menüleiste: links die Einträge, in der Mitte der runde Plus-Button.
// Die Einstellungen sitzen oben rechts in der Kopfzeile.
export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onItems = pathname === "/items";

  return (
    <nav className="tabbar">
      <button
        type="button"
        className={onItems ? "tabbar__btn is-active" : "tabbar__btn"}
        onClick={() => navigate(onItems ? "/" : "/items")}
      >
        {onItems ? <Home size={22} /> : <ListOrdered size={22} />}
        <span>{onItems ? "Übersicht" : "Einträge"}</span>
      </button>

      <button
        type="button"
        className="fab"
        onClick={() => navigate("/item/new")}
        aria-label="Eintrag hinzufügen"
      >
        <Plus size={28} strokeWidth={2.4} />
      </button>

      {/* Platzhalter, damit der Plus-Knopf mittig bleibt. Die Einstellungen
          sitzen oben rechts auf der Übersicht. */}
      <span className="tabbar__btn" aria-hidden="true" />
    </nav>
  );
}
