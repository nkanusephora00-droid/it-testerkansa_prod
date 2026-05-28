import React, { useCallback, useEffect, useState } from "react";
import { bugsAPI, attachmentsAPI, Bug } from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBug,
  faPaperclip,
  faPlus,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/pages/Bugs.css";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"];
const SEVERITY_OPTIONS = ["CRITICAL", "MAJOR", "MINOR"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];

const Bugs: React.FC = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    testStepId: "",
    title: "",
    severity: "MAJOR",
    priority: "MEDIUM",
    reproducibility: "",
  });

  const fetchBugs = useCallback(async () => {
    try {
      const data = await bugsAPI.getAll();
      setBugs(data);
    } catch {
      setMessage({ type: "error", text: "Erreur lors du chargement des bugs" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bugsAPI.create({
        testStepId: form.testStepId ? Number(form.testStepId) : undefined,
        title: form.title,
        severity: form.severity,
        priority: form.priority,
        reproducibility: form.reproducibility || undefined,
        status: "OPEN",
      });
      setMessage({ type: "success", text: "Bug enregistré" });
      setShowForm(false);
      setForm({
        testStepId: "",
        title: "",
        severity: "MAJOR",
        priority: "MEDIUM",
        reproducibility: "",
      });
      fetchBugs();
    } catch {
      setMessage({ type: "error", text: "Impossible de créer le bug" });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await bugsAPI.updateStatus(id, status);
      setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      setMessage({ type: "error", text: "Mise à jour du statut impossible" });
    }
  };

  const handleUpload = async (bugId: number, file: File) => {
    setUploadingId(bugId);
    try {
      await attachmentsAPI.upload(file, { bugId });
      setMessage({ type: "success", text: "Pièce jointe ajoutée" });
    } catch {
      setMessage({ type: "error", text: "Échec de l'upload" });
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return <div className="bugs-loading">Chargement...</div>;
  }

  return (
    <div className="bugs-container">
      <main className="bugs-main">
        <div className="bugs-header">
          <div>
            <h2 className="bugs-title">
              <FontAwesomeIcon icon={faBug} /> Anomalies (Bugs)
            </h2>
            <p className="bugs-subtitle">{bugs.length} bug(s) enregistré(s)</p>
          </div>
          <div className="bugs-header-actions">
            <button type="button" className="bugs-btn-secondary" onClick={fetchBugs}>
              <FontAwesomeIcon icon={faSync} /> Actualiser
            </button>
            <button type="button" className="bugs-btn-primary" onClick={() => setShowForm(true)}>
              <FontAwesomeIcon icon={faPlus} /> Déclarer un bug
            </button>
          </div>
        </div>

        {message.text && (
          <div className={message.type === "success" ? "bugs-success" : "bugs-error"}>
            {message.text}
          </div>
        )}

        {bugs.length === 0 ? (
          <div className="bugs-empty">Aucun bug pour le moment.</div>
        ) : (
          <div className="bugs-table-wrap">
            <table className="bugs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Titre</th>
                  <th>Étape test</th>
                  <th>Sévérité</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Pièce jointe</th>
                </tr>
              </thead>
              <tbody>
                {bugs.map((bug) => (
                  <tr key={bug.id}>
                    <td>{bug.id}</td>
                    <td>{bug.title}</td>
                    <td>{bug.testStepId ?? "—"}</td>
                    <td>{bug.severity ?? "—"}</td>
                    <td>{bug.priority ?? "—"}</td>
                    <td>
                      <select
                        className="bugs-status-select"
                        value={bug.status}
                        onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="bugs-upload-label">
                        <FontAwesomeIcon icon={faPaperclip} />
                        <input
                          type="file"
                          hidden
                          disabled={uploadingId === bug.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(bug.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && (
        <div className="bugs-modal">
          <div className="bugs-modal-content">
            <h3>Nouveau bug</h3>
            <form onSubmit={handleCreate}>
              <label>
                ID étape de test (optionnel)
                <input
                  type="number"
                  min={1}
                  value={form.testStepId}
                  onChange={(e) => setForm({ ...form, testStepId: e.target.value })}
                />
              </label>
              <label>
                Titre *
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Sévérité
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priorité
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reproductibilité
                <textarea
                  rows={3}
                  value={form.reproducibility}
                  onChange={(e) => setForm({ ...form, reproducibility: e.target.value })}
                />
              </label>
              <div className="bugs-modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="bugs-btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bugs;
