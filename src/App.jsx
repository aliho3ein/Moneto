import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import LoginPage from "./pages/LoginPage";
import StartPage from "./pages/StartPage";
import HomePage from "./pages/HomePage";
import ItemFormPage from "./pages/ItemFormPage";
import ItemsPage from "./pages/ItemsPage";
import CategoriesPage from "./pages/CategoriesPage";
import SettingsPage from "./pages/SettingsPage";

function Loading() {
  return (
    <div className="center-state">
      <span className="spinner spinner--dark" />
    </div>
  );
}

// Schützt alle Seiten, die eine Anmeldung brauchen.
function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loading />;
  if (!user) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  return children;
}

// Seiten, die ohne gewählten Haushalt keinen Sinn ergeben.
function RequireWorkspace({ children }) {
  const { activeId, loading } = useWorkspace();

  if (loading) return <Loading />;
  if (!activeId) return <Navigate to="/start" replace />;
  return children;
}

// Platzhalter für die Bildschirme, die noch gebaut werden.
function Placeholder({ title, children }) {
  return (
    <div className="screen">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Dieser Bildschirm wird im nächsten Schritt gebaut.
        </p>
        {children}
      </div>
    </div>
  );
}

function protectedPage(element, { needsWorkspace = true } = {}) {
  return (
    <RequireAuth>
      {needsWorkspace ? <RequireWorkspace>{element}</RequireWorkspace> : element}
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/start" element={protectedPage(<StartPage />, { needsWorkspace: false })} />
            <Route path="/join" element={protectedPage(<Placeholder title="Haushalt beitreten" />, { needsWorkspace: false })} />

            <Route path="/" element={protectedPage(<HomePage />)} />
            <Route path="/items" element={protectedPage(<ItemsPage />)} />
            <Route path="/item/new" element={protectedPage(<ItemFormPage />)} />
            <Route path="/item/:id" element={protectedPage(<ItemFormPage />)} />
            <Route path="/categories" element={protectedPage(<CategoriesPage />)} />
            <Route path="/settings" element={protectedPage(<SettingsPage />)} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
