import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState
} from "react";
import {
  getMyWorkspaces, createWorkspace, getPeriod, ensureDefaultCategories, centToEuro
} from "../../firebase/firestore-service.js";
import { useAuth } from "./AuthContext";

const WorkspaceContext = createContext(null);
const ACTIVE_KEY = "moneto.activeWorkspace";

export function WorkspaceProvider({ children }) {
  const { user, ready } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem(ACTIVE_KEY) || null);
  // uid, deren Haushalte geladen sind. Daraus wird `loading` abgeleitet:
  // ein eigener Zustand hinkte einen Render hinterher, und in genau diesem
  // Moment sah die Seite "kein Haushalt gewählt" und sprang nach /start.
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState("");
  const loading = !ready || (Boolean(user) && loadedFor !== user.uid);
  // 0 = aktueller Zeitraum, -1 = voriger, +1 = nächster.
  // Liegt hier, damit Startseite und Liste denselben Zeitraum zeigen.
  const [offset, setOffset] = useState(0);

  const reload = useCallback(async () => {
    setError("");
    try {
      const list = await getMyWorkspaces();
      // Feste Reihenfolge: ältester Haushalt zuerst. Danach richtet sich auch,
      // welcher ausgewählt wird, wenn noch keiner gemerkt ist.
      list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setWorkspaces(list);
      return list;
    } catch (err) {
      console.error(err);
      setError("Haushalte konnten nicht geladen werden.");
      return null;
    }
  }, []);

  // Beim Anmelden laden, beim Abmelden alles zurücksetzen.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setWorkspaces([]);
      setActiveId(null);
      setLoadedFor(null);
      localStorage.removeItem(ACTIVE_KEY);
      return () => { cancelled = true; };
    }
    reload().then((list) => {
      if (cancelled) return;
      if (list) {
        setActiveId((current) => {
          // Gemerkter Haushalt existiert nicht mehr (z. B. verlassen)
          if (current && list.some((w) => w.id === current)) return current;
          // Wer mindestens einen Haushalt hat, landet direkt in der Übersicht.
          return list.length ? list[0].id : null;
        });
      }
      // Auch nach einem Fehler beenden, sonst dreht sich der Spinner ewig.
      setLoadedFor(user.uid);
    });
    return () => { cancelled = true; };
  }, [user, reload]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
    setOffset(0);
  }, [activeId]);

  // Fehlende Standard-Kategorien im gewählten Haushalt nachlegen.
  useEffect(() => {
    if (!activeId) return;
    ensureDefaultCategories(activeId).catch((err) => console.error(err));
  }, [activeId]);

  const workspace = useMemo(
    () => workspaces.find((w) => w.id === activeId) || null,
    [workspaces, activeId]
  );

  const startDay = workspace?.periodStartDay ?? 28;
  const currency = workspace?.currency || "EUR";
  const period = useMemo(() => getPeriod(startDay, offset), [startDay, offset]);

  const value = useMemo(() => ({
    workspaces,
    activeId,
    workspace,
    loading,
    error,
    reload,
    select: setActiveId,
    offset,
    setOffset,
    period,
    currency,
    // Beträge immer hierüber ausgeben – dann stimmt die Währung des Haushalts.
    formatMoney: (cent) => centToEuro(cent, currency),
    async createNew(name) {
      const id = await createWorkspace(name.trim());
      await reload();
      setActiveId(id);
      return id;
    }
  }), [workspaces, activeId, workspace, loading, error, reload, offset, period, currency]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace muss innerhalb von <WorkspaceProvider> benutzt werden.");
  return ctx;
}
