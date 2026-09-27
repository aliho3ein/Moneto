import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Plus } from "lucide-react";

// Untere Leiste mit einem einzigen runden Knopf: auf der Übersicht legt er
// einen Eintrag an, in der Einträge-Liste führt er zurück zur Übersicht.
// Zur Liste kommt man von der Übersicht aus über den Donut.
export default function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onItems = pathname === "/items";

  return (
    <nav className="tabbar">
      <button
        type="button"
        className="fab"
        onClick={() => navigate(onItems ? "/" : "/item/new")}
        aria-label={onItems ? "Zur Übersicht" : "Eintrag hinzufügen"}
      >
        {onItems ? <Home size={26} strokeWidth={2} /> : <Plus size={28} strokeWidth={2.4} />}
      </button>
    </nav>
  );
}
