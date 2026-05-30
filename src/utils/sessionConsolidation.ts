import { TestSession, Test } from '../services/api';

export interface ConsolidatedSession {
  id: number;
  userId: number;
  username: string;
  nom: string;
  description: string;
  dateCreation: string;
  statut: string;
  originalSessions: TestSession[];
  consolidatedTests: Test[];
  totalTests: number;
  testsOk: number;
  testsBug: number;
  testsEnCours: number;
}

export function consolidateSessionsByUser(sessions: TestSession[]): ConsolidatedSession[] {
  // Grouper les sessions par utilisateur
  const sessionsByUser = sessions.reduce((acc, session) => {
    const userId = session.createdBy || 0;
    const username = session.createdByUsername || 'Utilisateur inconnu';
    
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        username,
        originalSessions: [],
        consolidatedTests: []
      };
    }
    
    acc[userId].originalSessions.push(session);
    // Fusionner tous les tests
    acc[userId].consolidatedTests.push(...(session.tests || []));
    
    return acc;
  }, {} as Record<number, any>);

  // Créer les sessions consolidées
  return Object.values(sessionsByUser).map((userGroup: any) => {
    const allTests = userGroup.consolidatedTests;
    const totalTests = allTests.length;
    const testsOk = allTests.filter((test: Test) => test.statut === 'OK').length;
    const testsBug = allTests.filter((test: Test) => test.statut === 'BUG').length;
    const testsEnCours = allTests.filter((test: Test) => test.statut === 'En cours').length;
    
    // Déterminer le statut global
    let globalStatut = 'En cours';
    if (testsBug > 0) {
      globalStatut = 'BUG';
    } else if (testsOk === totalTests && totalTests > 0) {
      globalStatut = 'Terminé';
    }

    return {
      id: userGroup.userId, // Utiliser l'ID utilisateur comme ID de session consolidée
      userId: userGroup.userId,
      username: userGroup.username,
      nom: `Session consolidée - ${userGroup.username}`,
      description: `Consolidation de ${userGroup.originalSessions.length} session(s) avec ${totalTests} test(s) au total`,
      dateCreation: userGroup.originalSessions[0]?.dateCreation || new Date().toISOString(),
      statut: globalStatut,
      originalSessions: userGroup.originalSessions,
      consolidatedTests: allTests,
      totalTests: totalTests,
      testsOk: testsOk,
      testsBug: testsBug,
      testsEnCours: testsEnCours
    } as ConsolidatedSession;
  });
}

export function consolidateAllSessions(sessions: TestSession[]): ConsolidatedSession {
  // Fusionner TOUTES les sessions en une seule
  const allTests = sessions.flatMap(session => session.tests || []);
  const totalTests = allTests.length;
  const testsOk = allTests.filter((test: Test) => test.statut === 'OK').length;
  const testsBug = allTests.filter((test: Test) => test.statut === 'BUG').length;
  const testsEnCours = allTests.filter((test: Test) => test.statut === 'En cours').length;
  
  // Déterminer le statut global
  let globalStatut = 'En cours';
  if (testsBug > 0) {
    globalStatut = 'BUG';
  } else if (testsOk === totalTests && totalTests > 0) {
    globalStatut = 'Terminé';
  }

  return {
    id: 0, // ID spécial pour la session globale
    userId: 0,
    username: 'Global',
    nom: 'Session Globale Consolidée',
    description: `Consolidation de ${sessions.length} session(s) avec ${totalTests} test(s) au total`,
    dateCreation: sessions[0]?.dateCreation || new Date().toISOString(),
    statut: globalStatut,
    originalSessions: sessions,
    consolidatedTests: allTests,
    totalTests: totalTests,
    testsOk: testsOk,
    testsBug: testsBug,
    testsEnCours: testsEnCours
  };
}
