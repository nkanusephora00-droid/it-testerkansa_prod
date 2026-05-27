import React, { useEffect, useState } from 'react';
import { testsAPI, applicationsAPI, comptesAPI, usersAPI, todosAPI, Application, Test, User, Todo, Compte } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCheckCircle, faTimesCircle, faClock, faChartPie } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Reports.css';

interface Stats {
  totalTests: number;
  testsOK: number;
  testsBug: number;
  testsEnCours: number;
  tauxReussite: number;
  totalApps: number;
  totalComptes: number;
  totalUsers: number;
  usersActifs: number;
  pendingTodos: number;
  completedTodos: number;
}

const Reports: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [testsParApp, setTestsParApp] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupération en parallèle sécurisée grâce à l'intercepteur 429 dans api.ts
      // On demande une grande taille pour éviter que les stats ne soient basées que sur la première page
      const [apps, comptes, tests, users, todos] = await Promise.all([
        applicationsAPI.getAll(0, 1000),
        comptesAPI.getAll(0, 1000),
        testsAPI.getAll(),
        usersAPI.getAvailable(),
        todosAPI.getAll()
      ]);

      const testsOK = tests.filter((t: Test) => t.statut === 'OK').length;
      const testsBug = tests.filter((t: Test) => t.statut === 'BUG').length;
      const testsEnCours = tests.filter((t: Test) => t.statut === 'EN COURS').length;
      const totalTests = tests.length;
      const tauxReussite = totalTests > 0 ? Math.round((testsOK / totalTests) * 100) : 0;

      const usersActifs = users.filter((u: User) => u.isActive).length;
      const pendingTodos = todos.filter((t: Todo) => !t.completed).length;
      const completedTodos = todos.filter((t: Todo) => t.completed).length;

      // Calcul de la répartition par application
      const distribution = tests.reduce((acc: Record<string, number>, t: Test) => {
        const appNom = t.applicationNom || 'Autre';
        acc[appNom] = (acc[appNom] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalTests,
        testsOK,
        testsBug,
        testsEnCours,
        tauxReussite,
        totalApps: apps.length,
        totalComptes: comptes.length,
        totalUsers: users.length,
        usersActifs,
        pendingTodos,
        completedTodos
      });
      setTestsParApp(distribution);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching stats:', err);
      }
      if (err?.response?.status === 429) {
        setError('Trop de requêtes. Veuillez réessayer dans quelques secondes.');
      } else {
        setError('Erreur lors du chargement des statistiques. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="reports-loading">Chargement des statistiques...</div>;
  }

  if (error) {
    return (
      <div className="reports-error-container">
        <div className="reports-error">{error}</div>
        <button onClick={fetchStats} className="reports-retry-button">Réessayer</button>
      </div>
    );
  }

  if (!stats) {
    return <div className="reports-loading">Aucune donnée disponible</div>;
  }

  return (
    <div className="reports-container">
      <main className="reports-main">
        <div className="reports-header">
          <div>
            <h2 className="reports-page-title">
              <FontAwesomeIcon icon={faChartBar} /> Rapports & Statistiques
            </h2>
            <p className="reports-page-subtitle">Vue d'ensemble des performances</p>
          </div>
          <div className="reports-period-selector">
            <button
              className={`reports-period-button ${period === 'week' ? 'reports-period-button-active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              7 jours
            </button>
            <button
              className={`reports-period-button ${period === 'month' ? 'reports-period-button-active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              30 jours
            </button>
            <button
              className={`reports-period-button ${period === 'quarter' ? 'reports-period-button-active' : ''}`}
              onClick={() => setPeriod('quarter')}
            >
              90 jours
            </button>
          </div>
        </div>

        <div className="reports-stats-grid">
          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ backgroundColor: 'var(--success-color)' }}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="reports-stat-content">
              <h3 className="reports-stat-value">{stats.totalTests}</h3>
              <p className="reports-stat-label">Tests totaux</p>
            </div>
          </div>

          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ backgroundColor: 'var(--danger-color)' }}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <div className="reports-stat-content">
              <h3 className="reports-stat-value">{stats.testsBug}</h3>
              <p className="reports-stat-label">Bugs</p>
            </div>
          </div>

          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ backgroundColor: 'var(--warning-color)' }}>
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="reports-stat-content">
              <h3 className="reports-stat-value">{stats.testsEnCours}</h3>
              <p className="reports-stat-label">En cours</p>
            </div>
          </div>

          <div className="reports-stat-card">
            <div className="reports-stat-icon" style={{ backgroundColor: 'var(--info-color)' }}>
              <FontAwesomeIcon icon={faChartPie} />
            </div>
            <div className="reports-stat-content">
              <h3 className="reports-stat-value">{stats.tauxReussite}%</h3>
              <p className="reports-stat-label">Taux de réussite</p>
            </div>
          </div>
        </div>

        <div className="reports-charts-section">
          <h3 className="reports-section-title">Répartition par application</h3>
          <div className="reports-chart-container">
            {Object.keys(testsParApp).length > 0 ? (
              <div className="reports-app-distribution">
                {Object.entries(testsParApp).map(([name, count]) => (
                  <div key={name} className="reports-app-bar-item">
                    <div className="reports-app-info">
                      <span className="reports-app-name">{name}</span>
                      <span className="reports-app-count">{count} tests</span>
                    </div>
                    <div className="reports-app-bar-bg">
                      <div 
                        className="reports-app-bar-fill" 
                        style={{ width: `${(count / stats.totalTests) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="reports-chart-placeholder">
                <FontAwesomeIcon icon={faChartBar} className="reports-chart-icon" />
                <p>Aucune donnée de test disponible</p>
              </div>
            )}
          </div>
        </div>

        <div className="reports-table-section">
          <h3 className="reports-section-title">Utilisateurs Actifs</h3>
          <div className="reports-user-stats">
            <div className="reports-user-stat-item">
              <span className="reports-user-stat-value">{stats.usersActifs}</span>
              <span className="reports-user-stat-label">Actifs</span>
            </div>
            <div className="reports-user-stat-item">
              <span className="reports-user-stat-value">{stats.totalUsers - stats.usersActifs}</span>
              <span className="reports-user-stat-label">Inactifs</span>
            </div>
            <div className="reports-user-progress-container">
              <div className="reports-user-progress-bar">
                <div className="reports-user-progress-fill" style={{
                  width: stats.totalUsers > 0 ? `${(stats.usersActifs / stats.totalUsers) * 100}%` : '0%'
                }}></div>
              </div>
              <span className="reports-user-progress-percent">
                {stats.totalUsers > 0 ? Math.round((stats.usersActifs / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;