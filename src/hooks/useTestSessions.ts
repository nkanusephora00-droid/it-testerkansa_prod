import { useState, useEffect, useCallback } from 'react';
import { TestSession, Test, CreateTestSessionRequest, CreateTestRequest } from '../domain/entities/TestSession';
import { TestSessionUseCases } from '../domain/usecases/TestSessionUseCases';
import { TestSessionAPI, TestAPI } from '../infrastructure/api/TestSessionAPI';

export function useTestSessions() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  // Initialize use cases
  const sessionAPI = new TestSessionAPI();
  const testAPI = new TestAPI();
  const useCases = new TestSessionUseCases(sessionAPI, testAPI);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionsData = await useCases.getAllSessions();
      setSessions(sessionsData);
    } catch (err) {
      setError('Erreur lors du chargement des sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [useCases]);

  const fetchTests = useCallback(async () => {
    try {
      const testsData = await testAPI.getAll();
      setTests(testsData);
    } catch (err) {
      setError('Erreur lors du chargement des tests');
      console.error('Error fetching tests:', err);
    }
  }, []);

  const createSession = useCallback(async (data: CreateTestSessionRequest) => {
    try {
      const newSession = await useCases.createSession(data);
      await fetchSessions();
      return newSession;
    } catch (err) {
      setError('Erreur lors de la création de la session');
      throw err;
    }
  }, [useCases, fetchSessions]);

  const deleteSession = useCallback(async (id: number) => {
    try {
      await useCases.deleteSession(id);
      await fetchSessions();
      if (selectedSession === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la session');
      throw err;
    }
  }, [useCases, fetchSessions, selectedSession]);

  const getSessionWithTests = useCallback(async (sessionId: number) => {
    try {
      return await useCases.getSessionWithTests(sessionId);
    } catch (err) {
      setError('Erreur lors du chargement de la session');
      throw err;
    }
  }, [useCases]);

  const createTest = useCallback(async (data: CreateTestRequest) => {
    try {
      const newTest = await useCases.createTest(data);
      await fetchTests();
      await fetchSessions(); // Refresh session stats
      return newTest;
    } catch (err) {
      setError('Erreur lors de la création du test');
      throw err;
    }
  }, [useCases, fetchTests, fetchSessions]);

  const updateTest = useCallback(async (id: number, data: Partial<Test>) => {
    try {
      const updatedTest = await useCases.updateTest(id, data);
      await fetchTests();
      await fetchSessions(); // Refresh session stats
      return updatedTest;
    } catch (err) {
      setError('Erreur lors de la mise à jour du test');
      throw err;
    }
  }, [useCases, fetchTests, fetchSessions]);

  const deleteTest = useCallback(async (id: number) => {
    try {
      await useCases.deleteTest(id);
      await fetchTests();
      await fetchSessions(); // Refresh session stats
    } catch (err) {
      setError('Erreur lors de la suppression du test');
      throw err;
    }
  }, [useCases, fetchTests, fetchSessions]);

  const exportSessionToPDF = useCallback(async (sessionId: number) => {
    try {
      await useCases.exportSessionToPDF(sessionId);
    } catch (err) {
      setError('Erreur lors de l\'export PDF');
      throw err;
    }
  }, [useCases]);

  useEffect(() => {
    fetchSessions();
    fetchTests();
  }, [fetchSessions, fetchTests]);

  const filteredTests = selectedSession 
    ? tests.filter(test => test.sessionId === selectedSession)
    : [];

  return {
    // Data
    sessions,
    tests,
    filteredTests,
    loading,
    error,
    selectedSession,
    
    // Actions
    fetchSessions,
    fetchTests,
    createSession,
    deleteSession,
    getSessionWithTests,
    createTest,
    updateTest,
    deleteTest,
    exportSessionToPDF,
    setSelectedSession,
    
    // Utilities
    clearError: () => setError(null)
  };
}
