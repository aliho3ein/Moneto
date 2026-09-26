import React from "react";
import {
  Baby, Banknote, BookOpen, Bus, Car, Coffee, Dumbbell, Fuel, Gamepad2, Gift,
  GraduationCap, HeartPulse, House, PawPrint, PiggyBank, Plane, Receipt, Shirt,
  ShoppingBasket, Smartphone, Thermometer, UtensilsCrossed, Wallet, Wrench
} from "lucide-react";

// Schlüssel = Wert im Firestore-Feld `icon` einer Kategorie.
// Die Standard-Kategorien aus firestore-service.js benutzen die ersten acht.
export const ICONS = {
  basket: ShoppingBasket,
  car: Car,
  house: House,
  restaurant: UtensilsCrossed,
  shirt: Shirt,
  thermometer: Thermometer,
  football: Dumbbell,
  money: Banknote,
  fuel: Fuel,
  bus: Bus,
  plane: Plane,
  phone: Smartphone,
  coffee: Coffee,
  gift: Gift,
  pet: PawPrint,
  book: BookOpen,
  school: GraduationCap,
  baby: Baby,
  health: HeartPulse,
  tools: Wrench,
  game: Gamepad2,
  savings: PiggyBank,
  bill: Receipt,
  wallet: Wallet
};

// Feste Auswahl für den Kategorie-Bildschirm.
export const ICON_LIST = Object.keys(ICONS);

// `rest` geht an das <svg> weiter – so lässt sich ein Icon per x/y auch
// direkt im SVG des Diagramms platzieren.
export function Icon({ name, size = 24, strokeWidth = 1.8, ...rest }) {
  const Component = ICONS[name] || ShoppingBasket;
  return <Component size={size} strokeWidth={strokeWidth} {...rest} />;
}
