import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  testsAPI, 
  applicationsAPI, 
  comptesAPI, 
  usersAPI, 
  authAPI, 
  testSessionsAPI, 
  User,
  Test
} from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMobileAlt, 
  faKey, 
  faUsers, 
  faVial, 
  faSyncAlt, 
  faCheckCircle, 
  faExclamationTriangle,
  faCalendarAlt,
  faUserShield,
  faUser,
  faArrowRight,
  faHistory,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Dashboard.css';

interface Stats {
  applications: number;
  comptes: number;
  users: number;
  usersActive: number;
  tests: number;
  testsReussis: number;
  testsEchoues: number;
  sessions: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    applications: 0,
    comptes: 0,
    users: 0,
    usersActive: 0,
    tests: 0,
    testsReussis: 0,
    testsEchoues: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      localStorage.setItem('user_role', userData.role);

      const [apps, comptes, tests, sessions] = await Promise.all([
        applicationsAPI.getAll(),
        comptesAPI.getAll(),
        testsAPI.getAll(),
        testSessionsAPI.getAll(),
      ]);

      let usersCount = 0;
      let usersActiveCount = 0;
      try {
        const users = await usersAPI.getAll();
        usersCount = users.length;
        usersActiveCount = users.filter((u: User) => u.isActive).length;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Users list not accessible');
        }
      }

      // Calculer les statistiques des tests
      const testsReussis = tests.filter((t: any) => t.statut === 'OK').length;
      const testsEchoues = tests.filter((t: Test) => t.statut === 'BUG').length;

      setStats({
        applications: apps.length,
        comptes: comptes.length,
        users: usersCount,
        usersActive: usersActiveCount,
        tests: tests.length,
        testsReussis,
        testsEchoues,
        sessions: sessions.length,
      });
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Dashboard auth error:', err);
        const error = err as { response?: { status?: number; data?: unknown } };
        console.error('Dashboard auth response:', error?.response?.status, error?.response?.data);
      }
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obtenir la date actuelle formatée
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return <div className="dashboard-loading">Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-main">
        <div className="welcome-block">
          <h1>{getGreeting()}, <span className="name">{user?.username}</span></h1>
          <p><FontAwesomeIcon icon={faCalendarAlt} /> {dateFormatted}</p>
        </div>
        <div className="top-actions">
          <button className="btn-refresh" onClick={fetchData}><FontAwesomeIcon icon={faSyncAlt} /></button>
          <span className="badge-role">
            <FontAwesomeIcon icon={user?.role === 'admin' ? faUserShield : faUser} style={{ marginRight: '8px' }} />
            {user?.role}
          </span>
        </div>
      </header>

      <div className="dashboard-grid-pro">
        <div className="stats-row">
          <div className="stat-card" onClick={() => navigate('/applications')}>
            <FontAwesomeIcon icon={faMobileAlt} className="icon-blue" />
            <div className="stat-val">{stats.applications}</div>
            <div className="stat-label">Applications</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/comptes')}>
            <FontAwesomeIcon icon={faKey} className="icon-green" />
            <div className="stat-val">{stats.comptes}</div>
            <div className="stat-label">Comptes</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/users')}>
            <FontAwesomeIcon icon={faUsers} className="icon-orange" />
            <div className="stat-val">{stats.users}</div>
            <div className="stat-label">Équipe</div>
          </div>
          <div className="stat-card" onClick={() => navigate('/tests')}>
            <FontAwesomeIcon icon={faVial} className="icon-red" />
            <div className="stat-val">{stats.tests}</div>
            <div className="stat-label">Tests</div>
          </div>
        </div>

        <div className="pro-layout-content">
          <div className="main-cards">
            <div className="card-pro health-check">
              <div className="card-pro-title">
                <h3><FontAwesomeIcon icon={faChartLine} /> État des Tests</h3>
                <button onClick={() => navigate('/reports')}>
                  Rapport Complet <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: '8px' }} />
                </button>
              </div>
              <div className="health-bar-container">
                <div className="health-bar-label">
                  <span>Succès global</span>
                  <span>{stats.tests > 0 ? Math.round((stats.testsReussis / stats.tests) * 100) : 0}%</span>
                </div>
                <div className="health-bar-bg">
                  <div className="health-bar-fill" style={{ width: `${stats.tests > 0 ? (stats.testsReussis / stats.tests) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="mini-stats">
                <div className="mini-item"><span className="dot ok"></span> OK: {stats.testsReussis}</div>
                <div className="mini-item"><span className="dot bug"></span> Bugs: {stats.testsEchoues}</div>
                <div className="mini-item"><span className="dot session"></span> Sessions: {stats.sessions}</div>
              </div>
            </div>

            <div className="card-pro timeline">
              <div className="card-pro-title"><h3><FontAwesomeIcon icon={faHistory} /> Flux d'activité</h3></div>
              <div className="timeline-list">
                {stats.testsReussis > 0 && (
                  <div className="event ok">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <div><strong>{stats.testsReussis} tests validés</strong> avec succès ce jour.</div>
                  </div>
                )}
                {stats.testsEchoues > 0 && (
                  <div className="event bug">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <div><strong>{stats.testsEchoues} anomalies</strong> détectées nécessitant action.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="side-cards">
            <div className="card-pro planning">
              <div className="card-pro-title"><h3><FontAwesomeIcon icon={faCalendarAlt} /> Calendrier</h3></div>
              <div className="calendar-grid-pro">
                {['L','M','M','J','V','S','D'].map(d => <div key={d} className="day-h">{d}</div>)}
                {/* Logique de génération des jours similaire mais avec classes pro */}
                {Array.from({length: 31}, (_, i) => (
                  <div key={i} className={`day-n ${i+1 === today.getDate() ? 'today' : ''}`}>{i+1}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
