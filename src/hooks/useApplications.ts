import { useState, useEffect, useCallback } from 'react';
import { Application } from '../domain/entities/TestSession';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Utiliser l'API existante depuis services/api
      const { applicationsAPI } = await import('../services/api');
      const data = await applicationsAPI.getAll();
      setApplications(data);
    } catch (err) {
      setError('Erreur lors du chargement des applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    clearError: () => setError(null)
  };
}
