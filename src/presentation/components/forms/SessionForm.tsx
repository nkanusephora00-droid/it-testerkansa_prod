import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { CreateTestSessionRequest, Application } from '../../../domain/entities/TestSession';
// import { useApplications } from '../../../hooks/useApplications';

interface SessionFormProps {
  onSubmit: (data: CreateTestSessionRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateTestSessionRequest>;
  mode?: 'modal' | 'inline';
}

export const SessionForm: React.FC<SessionFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {},
  mode = 'modal'
}) => {
  const [formData, setFormData] = useState<CreateTestSessionRequest>({
    nom: '',
    description: '',
    nom_document: '',
    applicationId: 0,
    statut: 'En cours',
    ...initialData
  });

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateTestSessionRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formContent = (
    <>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nom de la session *</label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            className="form-input"
            required
            placeholder="Ex: Test Release v1.0"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Application</label>
          <select
            value={formData.applicationId || ''}
            onChange={(e) => handleChange('applicationId', parseInt(e.target.value) || 0)}
            className="form-select"
          >
            <option value="">Sélectionnez une application</option>
            {applications.map((app: Application) => (
              <option key={app.id} value={app.id}>{app.nom}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="form-textarea"
          placeholder="Description de la session..."
          rows={3}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Nom du document</label>
        <input
          type="text"
          value={formData.nom_document}
          onChange={(e) => handleChange('nom_document', e.target.value)}
          className="form-input"
          placeholder="Ex: Test_Document.pdf"
        />
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !formData.nom.trim()}
        >
          {loading ? 'Création...' : 'Créer la session'}
        </button>
      </div>
    </>
  );

  if (mode === 'inline') {
    return (
      <div className="inline-form-container">
        <div className="inline-form-header">
          <h3 className="inline-form-title">Nouvelle session de test</h3>
          <button className="inline-close-button" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="inline-form">
          {formContent}
        </form>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <button className="modal-close" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <h3 className="modal-title">Nouvelle session de test</h3>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {formContent}
        </form>
      </div>
    </div>
  );
};
