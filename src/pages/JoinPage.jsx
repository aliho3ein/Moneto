import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Users } from "lucide-react";
import { joinWorkspace } from "../../firebase/firestore-service.js";
import { useWorkspace } from "../context/WorkspaceContext";
import { readJoinParams, clearJoinParams } from "../joinParams";

export default function JoinPage() {
  const navigate = useNavigate();
  const { reload, select } = useWorkspace();

  const [params] = useState(readJoinParams);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    setError("");
    setBusy(true);
    try {
      await joinWorkspace(params.ws, params.token);
      clearJoinParams();
      // Erst nach dem Beitritt darf gelesen werden – jetzt passt die Liste.
      const list = await reload();
      if (list?.some((w) => w.id === params.ws)) select(params.ws);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err?.code === "permission-denied"
          ? "Dieser Einladungslink ist nicht mehr gültig. Bitte lass dir einen neuen schicken."
          : "Beitreten fehlgeschlagen. Bitte noch einmal versuchen."
      );
      setBusy(false);
    }
  }

  if (!params) {
    return (
      <div className="screen join">
        <div className="card join__card">
          <h1 className="join__title">Einladung unvollständig</h1>
          <p className="join__text">
            Dem Link fehlen die nötigen Angaben. Bitte lass dir die Einladung
            noch einmal schicken.
          </p>
          <button type="button" className="btn" onClick={() => navigate("/", { replace: true })}>
            Weiter zur App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen join">
      <div className="card join__card">
        <span className="join__icon"><Home size={30} strokeWidth={1.7} /></span>

        <h1 className="join__title">
          Möchtest du dem Haushalt {params.name ? `„${params.name}“` : "diesem Haushalt"} beitreten?
        </h1>
        <p className="join__text">
          <Users size={15} /> Danach seht ihr eure Einnahmen und Ausgaben gemeinsam.
        </p>

        {error && <p className="error-box" role="alert">{error}</p>}

        <button type="button" className="btn" onClick={handleJoin} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          {busy ? "Trete bei …" : "Beitreten"}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => { clearJoinParams(); navigate("/", { replace: true }); }}
          disabled={busy}
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
