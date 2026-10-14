import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, ShoppingCart } from "lucide-react";

// Untere Leiste. Links führt der Einkaufswagen zur gemeinsamen Einkaufsliste,
// in der Mitte sitzt ein einziger runder Knopf: auf der Übersicht legt er
// einen Eintrag an, in der Einträge-Liste führt er zurück zur Übersicht.
// Zur Liste kommt man von der Übersicht aus über den Donut.
//
// `fab` überschreibt den runden Knopf. Die Einkaufsliste hängt darüber ihr
// eigenes "+" hinein, das dort einen Listeneintrag anlegt.
export default function TabBar({ fab }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onItems = pathname === "/items";
  const onShopping = pathname === "/shopping";

  const center = fab || {
    icon: onItems ? <Home size={26} strokeWidth={2} /> : <Plus size={28} strokeWidth={2.4} />,
    label: onItems ? "Zur Übersicht" : "Eintrag hinzufügen",
    onClick: () => navigate(onItems ? "/" : "/item/new")
  };

  return (
    <nav className="tabbar">
      <div className="tabbar__side">
        <button
          type="button"
          className={onShopping ? "tabbar__icon is-active" : "tabbar__icon"}
          onClick={() => navigate(onShopping ? "/" : "/shopping")}
          aria-label={onShopping ? "Zur Übersicht" : "Einkaufsliste"}
        >
          <ShoppingCart size={24} />
        </button>
      </div>

      <button type="button" className="fab" onClick={center.onClick} aria-label={center.label}>
        {center.icon}
      </button>

      {/* Hält den runden Knopf mittig, auch wenn rechts nichts steht. */}
      <div className="tabbar__side" aria-hidden="true" />
    </nav>
  );
}
