import { auth, db } from "./firebase.js";
import {
  doc, setDoc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, orderBy, limit, writeBatch, serverTimestamp,
  Timestamp, arrayRemove, onSnapshot
} from "firebase/firestore";

// =====================================================================
// 1. USERS – nach jedem Login aufrufen
// =====================================================================
export async function saveUserProfile(user) {
  await setDoc(doc(db, "users", user.uid), {
    displayName: (user.displayName || "Unbekannt").slice(0, 50),
    photoURL: user.photoURL || null,
    lastLogin: serverTimestamp()
  }, { merge: true });   // merge: bestehende Felder nicht überschreiben
}

export async function getUserNames(uids) {
  const names = {};
  for (const uid of uids) {
    const snap = await getDoc(doc(db, "users", uid));
    names[uid] = snap.exists() ? snap.data().displayName : "Unbekannt";
  }
  return names;
}

// =====================================================================
// 2. WORKSPACES – der gemeinsame Account
// =====================================================================
// Standard-Kategorien. Die IDs sind fest vergeben (Präfix std-), damit die App
// sie wiedererkennen und vor dem Löschen schützen kann. Ein eigenes Feld dafür
// wäre nicht möglich: die Rules erlauben in categories nur
// name, icon, color, type, archived, order.
export const DEFAULT_CATEGORIES = [
  { id: "std-lebensmittel", name: "Lebensmittel", icon: "basket",  color: "#52a31b", type: "expense" },
  { id: "std-mobilitaet",   name: "Mobilität",    icon: "car",     color: "#616e83", type: "expense" },
  { id: "std-haushalt",     name: "Haushalt",     icon: "house",   color: "#6FA8DC", type: "expense" },
  { id: "std-freizeit",     name: "Freizeit",     icon: "game",    color: "#15c6cc", type: "expense" },
  { id: "std-kleidung",     name: "Kleidung",     icon: "shirt",   color: "#e65cdf", type: "expense" },
  { id: "std-sparen",       name: "Sparen",       icon: "savings", color: "#cce79f", type: "expense" },
  { id: "std-gehalt",       name: "Gehalt",       icon: "money",   color: "#5CA36E", type: "income"  }
];

// true = Standard-Kategorie, darf nicht gelöscht werden.
export function isDefaultCategory(catId) {
  return DEFAULT_CATEGORIES.some(c => c.id === catId);
}

export async function createWorkspace(name) {
  const uid = auth.currentUser.uid;
  const wsRef = doc(collection(db, "workspaces"));   // neue ID erzeugen

  // Schritt 1: Workspace anlegen (muss VOR den Kategorien existieren,
  // weil die Rules für categories per get() die Mitgliedschaft prüfen)
  await setDoc(wsRef, {
    name,
    ownerId: uid,
    members: [uid],
    shareToken: crypto.randomUUID(),
    currency: "EUR",
    periodStartDay: 28,
    createdAt: serverTimestamp()
  });

  // Schritt 2: Standard-Kategorien in einem Batch anlegen
  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach(({ id, ...cat }, i) => {
    batch.set(doc(collection(db, "workspaces", wsRef.id, "categories"), id), {
      ...cat, archived: false, order: i
    });
  });
  await batch.commit();

  return wsRef.id;
}

// Alle Workspaces, in denen ich Mitglied bin
export async function getMyWorkspaces() {
  const q = query(collection(db, "workspaces"),
    where("members", "array-contains", auth.currentUser.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Einladungslink erzeugen (nur Owner kann shareToken lesen/ändern)
export async function getShareLink(wsId) {
  const snap = await getDoc(doc(db, "workspaces", wsId));
  const { shareToken, name } = snap.data();
  const n = encodeURIComponent(name);
  return `${location.origin}/join?ws=${wsId}&token=${shareToken}&name=${n}`;
}

// Neuen Token erzeugen → alter Link wird ungültig
export async function resetShareLink(wsId) {
  await updateDoc(doc(db, "workspaces", wsId), { shareToken: crypto.randomUUID() });
}

export async function renameWorkspace(wsId, name) {
  await updateDoc(doc(db, "workspaces", wsId), { name: name.trim().slice(0, 50) });
}

// Löscht erst die Unterordner, dann den Haushalt selbst. Die Reihenfolge
// ist wichtig: die Rules prüfen die Mitgliedschaft für items/categories per
// get() auf das Workspace-Dokument - ist das weg, kommt niemand mehr an die
// Reste heran. Nur der Besitzer darf löschen (Rules).
export async function deleteWorkspace(wsId) {
  for (const sub of ["items", "categories"]) {
    // In Häppchen löschen, ein Batch fasst höchstens 500 Schreibvorgänge.
    for (;;) {
      const snap = await getDocs(query(collection(db, "workspaces", wsId, sub), limit(300)));
      if (snap.empty) break;
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      if (snap.size < 300) break;
    }
  }
  await deleteDoc(doc(db, "workspaces", wsId));
}

// Zeitraum-Start und Währung ändern. Laut Rules darf das nur der Besitzer:
// Mitglieder dürfen am Workspace-Dokument nur das Feld name anfassen.
export async function updateWorkspaceSettings(wsId, { periodStartDay, currency }) {
  const data = {};
  if (periodStartDay !== undefined) data.periodStartDay = Number(periodStartDay);
  if (currency !== undefined) data.currency = currency;
  await updateDoc(doc(db, "workspaces", wsId), data);
}

export async function leaveWorkspace(wsId) {
  await updateDoc(doc(db, "workspaces", wsId), {
    members: arrayRemove(auth.currentUser.uid)
  });
}

// =====================================================================
// 3. CATEGORIES
// =====================================================================
const catCol = (wsId) => collection(db, "workspaces", wsId, "categories");

export async function addCategory(wsId, { name, icon, color, type }) {
  const existing = await getDocs(catCol(wsId));
  return addDoc(catCol(wsId), {
    name: name.trim().slice(0, 30),
    icon, color,
    type,                    // "expense" oder "income"
    archived: false,
    order: existing.size
  });
}

// Legt fehlende Standard-Kategorien in einem bestehenden Haushalt nach.
// Läuft über feste IDs, legt also nichts doppelt an.
export async function ensureDefaultCategories(wsId) {
  const snap = await getDocs(catCol(wsId));
  const existing = new Map(snap.docs.map(d => [d.id, d.data()]));

  const batch = writeBatch(db);
  let changes = 0;

  DEFAULT_CATEGORIES.forEach(({ id, ...cat }, order) => {
    const current = existing.get(id);

    if (!current) {
      batch.set(doc(catCol(wsId), id), { ...cat, archived: false, order });
      changes++;
      return;
    }

    // Farbe und Symbol aus der Tabelle oben nachziehen, falls sie dort
    // geändert wurden. Der Name bleibt unangetastet – den darf jeder
    // Haushalt selbst umbenennen.
    if (current.color !== cat.color || current.icon !== cat.icon) {
      batch.update(doc(catCol(wsId), id), { color: cat.color, icon: cat.icon });
      changes++;
    }
  });

  if (!changes) return 0;
  await batch.commit();
  return changes;
}

export async function renameCategory(wsId, catId, newName) {
  await updateDoc(doc(catCol(wsId), catId), { name: newName.trim().slice(0, 30) });
}

// "Löschen" = archivieren, damit alte Einkäufe ihre Kategorie behalten
export async function archiveCategory(wsId, catId) {
  await updateDoc(doc(catCol(wsId), catId), { archived: true });
}

// Live-Liste der aktiven Kategorien (aktualisiert sich automatisch,
// wenn der Partner etwas ändert)
export function listenCategories(wsId, callback, onError) {
  const q = query(catCol(wsId), where("archived", "==", false));
  return onSnapshot(q, snap => {
    const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cats.sort((a, b) => a.order - b.order);
    callback(cats);
  }, onError);
}

// =====================================================================
// 4. ITEMS – Einkäufe und Einnahmen
// =====================================================================
const itemCol = (wsId) => collection(db, "workspaces", wsId, "items");

// "45,99" → 4599
export function euroToCent(input) {
  return Math.round(parseFloat(String(input).replace(/\./g, "").replace(",", ".")) * 100);
}
// 4599 → "45,99 €" (Währung kommt aus dem Workspace, Standard EUR)
export function centToEuro(cent, currency = "EUR") {
  return (cent / 100).toLocaleString("de-DE", { style: "currency", currency });
}

export async function addItem(wsId, { amountEuro, type, categoryId, date, note, articles }) {
  const data = {
    amount: euroToCent(amountEuro),
    type,                                   // "expense" oder "income"
    categoryId,
    date: Timestamp.fromDate(date || new Date()),
    createdBy: auth.currentUser.uid,
    createdAt: serverTimestamp()
  };
  if (note) data.note = note.slice(0, 200);
  // articles optional, z. B. [{ name: "Milch", price: 119, qty: 2 }]
  if (articles?.length) data.articles = articles;
  return addDoc(itemCol(wsId), data);
}

// Einen einzelnen Eintrag laden (für den Bearbeiten-Bildschirm)
export async function getItem(wsId, itemId) {
  const snap = await getDoc(doc(itemCol(wsId), itemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateItem(wsId, itemId, changes) {
  // createdBy darf laut Rules nicht geändert werden → nicht mitschicken
  const data = { ...changes };
  if (data.amountEuro !== undefined) {
    data.amount = euroToCent(data.amountEuro);
    delete data.amountEuro;
  }
  if (data.date instanceof Date) data.date = Timestamp.fromDate(data.date);
  await updateDoc(doc(itemCol(wsId), itemId), data);
}

export async function deleteItem(wsId, itemId) {
  await deleteDoc(doc(itemCol(wsId), itemId));
}

// Wie viele Einträge hängen an einer Kategorie? Für die Rückfrage
// vor dem Archivieren einer Kategorie.
export async function countCategoryItems(wsId, catId) {
  const snap = await getDocs(query(itemCol(wsId), where("categoryId", "==", catId)));
  return snap.size;
}

// =====================================================================
// 5. ZEITRAUM (28. bis 27.) und AUSWERTUNG für das Diagramm
// =====================================================================
// offset 0 = aktueller Zeitraum, -1 = vorheriger, +1 = nächster
export function getPeriod(startDay, offset = 0, today = new Date()) {
  let y = today.getFullYear();
  let m = today.getMonth();
  if (today.getDate() < startDay) m -= 1;   // wir sind noch im Zeitraum vom Vormonat
  m += offset;
  const start = new Date(y, m, startDay);
  const end = new Date(y, m + 1, startDay); // exklusiv
  return { start, end };
}

// Live-Auswertung eines Zeitraums
export function listenPeriod(wsId, start, end, callback, onError) {
  const q = query(itemCol(wsId),
    where("date", ">=", Timestamp.fromDate(start)),
    where("date", "<", Timestamp.fromDate(end)),
    orderBy("date", "desc"));

  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    let income = 0, expense = 0;
    const byCategory = {};

    for (const it of items) {
      if (it.type === "income") income += it.amount;
      else {
        expense += it.amount;
        byCategory[it.categoryId] = (byCategory[it.categoryId] || 0) + it.amount;
      }
    }

    // Prozente für das Donut-Diagramm
    const percentages = Object.entries(byCategory).map(([categoryId, sum]) => ({
      categoryId, sum,
      percent: expense ? Math.round((sum / expense) * 100) : 0
    })).sort((a, b) => b.sum - a.sum);

    callback({
      items,
      income,                     // 117700 → 1.177,00 €
      expense,                    // 122471 → 1.224,71 €
      balance: income - expense,  // Kontostand -47,71 €
      percentages
    });
  }, onError);
}