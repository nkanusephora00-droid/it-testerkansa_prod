import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { testsAPI, applicationsAPI, comptesAPI, usersAPI, authAPI, testSessionsAPI, User } from '../services/api';
import '../styles/pages/Dashboard.css';

interface Test {
  id: number;
  statut: string;
}

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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        usersActiveCount = users.filter((u: any) => u.isActive).length;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Users list not accessible');
        }
      }

      // Calculer les statistiques des tests
      const testsReussis = tests.filter((t: Test) => t.statut === 'Réussi' || t.statut === 'réussi' || t.statut === 'OK').length;
      const testsEchoues = tests.filter((t: Test) => t.statut === 'Échoué' || t.statut === 'echoué' || t.statut === 'Failed').length;

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
      <main className="dashboard-main">
        {/* En-tête de bienvenue */}
        <div className={isMobile ? 'dashboard-welcome-section dashboard-welcome-section-mobile' : 'dashboard-welcome-section'}>
          <div className="dashboard-welcome-content">
            <h1 className={isMobile ? 'dashboard-welcome-title dashboard-welcome-title-mobile' : 'dashboard-welcome-title'}>{getGreeting()}, <span className="dashboard-user-name">{user?.username}</span></h1>
            <p className="dashboard-welcome-subtitle">{dateFormatted}</p>
            <p className="dashboard-welcome-role">
              <span className="dashboard-role-badge">{user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
            </p>
          </div>
          <div className={isMobile ? 'dashboard-welcome-icon dashboard-welcome-icon-mobile' : 'dashboard-welcome-icon'}>
            <i className={`fas ${user?.role === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div className={isMobile ? 'dashboard-stats-grid dashboard-stats-grid-mobile' : 'dashboard-stats-grid'}>
          <div
            className={`dashboard-stat-card ${isMobile ? 'dashboard-stat-card-mobile' : ''} ${hoveredCard === 'applications' ? 'dashboard-stat-card-hover' : ''}`}
            onMouseEnter={() => setHoveredCard('applications')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/applications')}
          >
            <div className={`dashboard-stat-icon dashboard-stat-icon-info ${isMobile ? 'dashboard-stat-icon-mobile' : ''}`}>
              <i className="fas fa-mobile-alt"></i>
            </div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-label">Applications</h3>
              <p className="dashboard-stat-number">{stats.applications}</p>
              <span className="dashboard-stat-footer">Gérer les applications</span>
            </div>
          </div>
          
          <div
            className={`dashboard-stat-card ${isMobile ? 'dashboard-stat-card-mobile' : ''} ${hoveredCard === 'comptes' ? 'dashboard-stat-card-hover' : ''}`}
            onMouseEnter={() => setHoveredCard('comptes')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/comptes')}
          >
            <div className={`dashboard-stat-icon dashboard-stat-icon-success ${isMobile ? 'dashboard-stat-icon-mobile' : ''}`}>
              <i className="fas fa-key"></i>
            </div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-label">Comptes</h3>
              <p className="dashboard-stat-number">{stats.comptes}</p>
              <span className="dashboard-stat-footer">Gérer les comptes</span>
            </div>
          </div>
          
          <div
            className={`dashboard-stat-card ${isMobile ? 'dashboard-stat-card-mobile' : ''} ${hoveredCard === 'users' ? 'dashboard-stat-card-hover' : ''}`}
            onMouseEnter={() => setHoveredCard('users')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/users')}
          >
            <div className={`dashboard-stat-icon dashboard-stat-icon-warning ${isMobile ? 'dashboard-stat-icon-mobile' : ''}`}>
              <i className="fas fa-users"></i>
            </div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-label">Utilisateurs</h3>
              <p className="dashboard-stat-number">{stats.users}</p>
              <span className="dashboard-stat-footer">Gérer les utilisateurs</span>
            </div>
          </div>
          
          <div
            className={`dashboard-stat-card ${isMobile ? 'dashboard-stat-card-mobile' : ''} ${hoveredCard === 'tests' ? 'dashboard-stat-card-hover' : ''}`}
            onMouseEnter={() => setHoveredCard('tests')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/tests')}
          >
            <div className={`dashboard-stat-icon dashboard-stat-icon-danger ${isMobile ? 'dashboard-stat-icon-mobile' : ''}`}>
              <i className="fas fa-vial"></i>
            </div>
            <div className="dashboard-stat-content">
              <h3 className="dashboard-stat-label">Tests</h3>
              <p className="dashboard-stat-number">{stats.tests}</p>
              <span className="dashboard-stat-footer">Voir les tests</span>
            </div>
          </div>
        </div>

        {/* Section des détails */}
        <div className={isMobile ? 'dashboard-details-section dashboard-details-section-mobile' : 'dashboard-details-section'}>
          <div className="dashboard-details-header">
            <h2 className="dashboard-details-title">Vue d'ensemble</h2>
            <button className="dashboard-refresh-button" onClick={fetchData} title="Actualiser">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
          
          <div className={isMobile ? 'dashboard-details-grid dashboard-details-grid-mobile' : 'dashboard-details-grid'}>
            {/* Applications récentes */}
            <div className="dashboard-detail-card">
              <div className="dashboard-detail-card-header">
                <h3 className="dashboard-detail-card-title">Applications</h3>
                <span className="dashboard-detail-card-badge">{stats.applications}</span>
              </div>
              <div className="dashboard-detail-card-content">
                <p className="dashboard-detail-card-text">
                  {stats.applications} application{stats.applications > 1 ? 's' : ''} enregistrée{stats.applications > 1 ? 's' : ''}
                </p>
                <button className="dashboard-detail-button" onClick={() => navigate('/applications')}>
                  Voir toutes
                </button>
              </div>
            </div>
            
            {/* Comptes récents */}
            <div className="dashboard-detail-card">
              <div className="dashboard-detail-card-header">
                <h3 className="dashboard-detail-card-title">Comptes</h3>
                <span className="dashboard-detail-card-badge">{stats.comptes}</span>
              </div>
              <div className="dashboard-detail-card-content">
                <p className="dashboard-detail-card-text">
                  {stats.comptes} compte{stats.comptes > 1 ? 's' : ''} enregistré{stats.comptes > 1 ? 's' : ''}
                </p>
                <button className="dashboard-detail-button" onClick={() => navigate('/comptes')}>
                  Voir tous
                </button>
              </div>
            </div>
            
            {/* Tests */}
            <div className="dashboard-detail-card">
              <div className="dashboard-detail-card-header">
                <h3 className="dashboard-detail-card-title">Tests</h3>
                <span className="dashboard-detail-card-badge">{stats.tests}</span>
              </div>
              <div className="dashboard-detail-card-content">
                <p className="dashboard-detail-card-text">
                  {stats.testsReussis} réussi{stats.testsReussis > 1 ? 's' : ''} / {stats.testsEchoues} échec{stats.testsEchoues > 1 ? 's' : ''}
                </p>
                <button className="dashboard-detail-button" onClick={() => navigate('/tests')}>
                  Voir tous
                </button>
              </div>
            </div>
            
            {/* Sessions */}
            <div className="dashboard-detail-card">
              <div className="dashboard-detail-card-header">
                <h3 className="dashboard-detail-card-title">Sessions</h3>
                <span className="dashboard-detail-card-badge">{stats.sessions}</span>
              </div>
              <div className="dashboard-detail-card-content">
                <p className="dashboard-detail-card-text">
                  {stats.sessions} session{stats.sessions > 1 ? 's' : ''} de test{stats.sessions > 1 ? 's' : ''}
                </p>
                <button className="dashboard-detail-button" onClick={() => navigate('/tests')}>
                  Voir toutes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section progression des tests */}
        <div className="dashboard-progress-section">
          <h2 className="dashboard-section-title">
            <i className="fas fa-chart-line"></i>
            Progression des tests
          </h2>
          <div className="dashboard-details-grid">
            <div className="dashboard-detail-card">
              <div className="dashboard-progress-header">
                <span className="dashboard-progress-label">Taux de réussite</span>
                <span className="dashboard-progress-value">
                  {stats.tests > 0 ? Math.round((stats.testsReussis / stats.tests) * 100) : 0}%
                </span>
              </div>
              <div className="dashboard-progress-bar-container">
                <div 
                  className="dashboard-progress-bar dashboard-progress-bar-success"
                  style={{ width: `${stats.tests > 0 ? (stats.testsReussis / stats.tests) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="dashboard-detail-card">
              <div className="dashboard-progress-header">
                <span className="dashboard-progress-label">Utilisateurs actifs</span>
                <span className="dashboard-progress-value">
                  {stats.users > 0 ? Math.round((stats.usersActive / stats.users) * 100) : 0}%
                </span>
              </div>
              <div className="dashboard-progress-bar-container">
                <div 
                  className="dashboard-progress-bar dashboard-progress-bar-info"
                  style={{ width: `${stats.users > 0 ? (stats.usersActive / stats.users) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section activité récente */}
        <div className="dashboard-activity-section">
          <div className="dashboard-activity-header">
            <h2 className="dashboard-activity-title">Activité récente</h2>
          </div>
          <div className="dashboard-activity-list">
            {stats.testsReussis > 0 && (
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-icon dashboard-activity-icon-success">
                  <i className="fas fa-check"></i>
                </div>
                <div className="dashboard-activity-content">
                  <p className="dashboard-activity-text">{stats.testsReussis} test{stats.testsReussis > 1 ? 's' : ''} réussi{stats.testsReussis > 1 ? 's' : ''}</p>
                  <p className="dashboard-activity-time">Dernière mise à jour</p>
                </div>
              </div>
            )}
            {stats.testsEchoues > 0 && (
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-icon dashboard-activity-icon-warning">
                  <i className="fas fa-times"></i>
                </div>
                <div className="dashboard-activity-content">
                  <p className="dashboard-activity-text">{stats.testsEchoues} test{stats.testsEchoues > 1 ? 's' : ''} échoué{stats.testsEchoues > 1 ? 's' : ''}</p>
                  <p className="dashboard-activity-time">À vérifier</p>
                </div>
              </div>
            )}
            {stats.sessions > 0 && (
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-icon dashboard-activity-icon-info">
                  <i className="fas fa-play-circle"></i>
                </div>
                <div className="dashboard-activity-content">
                  <p className="dashboard-activity-text">{stats.sessions} session{stats.sessions > 1 ? 's' : ''} de test enregistrée{stats.sessions > 1 ? 's' : ''}</p>
                  <p className="dashboard-activity-time">Test en cours ou terminé</p>
                </div>
              </div>
            )}
            {stats.applications > 0 && (
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-icon dashboard-activity-icon-info">
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <div className="dashboard-activity-content">
                  <p className="dashboard-activity-text">{stats.applications} application{stats.applications > 1 ? 's' : ''} disponible{stats.applications > 1 ? 's' : ''}</p>
                  <p className="dashboard-activity-time">Prête à tester</p>
                </div>
              </div>
            )}
            {stats.tests === 0 && stats.applications === 0 && stats.sessions === 0 && (
              <div className="dashboard-activity-item">
                <div className="dashboard-activity-icon dashboard-activity-icon-info">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="dashboard-activity-content">
                  <p className="dashboard-activity-text">Aucune activité pour le moment</p>
                  <p className="dashboard-activity-time">Commencez par créer des tests</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Widget Calendrier */}
        <div className="dashboard-calendar-section">
          <div className="dashboard-calendar-header">
            <h2 className="dashboard-calendar-title">
              <i className="fas fa-calendar-alt"></i>
              Calendrier
            </h2>
          </div>
          <div className="dashboard-calendar">
            <div className="dashboard-calendar-weekdays">
              {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
                <div key={day} className="dashboard-calendar-weekday">{day}</div>
              ))}
            </div>
<div className="dashboard-calendar-days">
               {(() => {
                 const now = new Date();
                 const year = now.getFullYear();
                 const month = now.getMonth();
                 const firstDay = new Date(year, month, 1);
                 const startDate = new Date(firstDay);
                 startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
                
                const days = [];
                const currentDate = new Date(startDate);
                
                for (let i = 0; i < 42; i++) {
                  const isCurrentMonth = currentDate.getMonth() === month;
                  const isToday = currentDate.getDate() === now.getDate() && 
                                   currentDate.getMonth() === now.getMonth() && 
                                   currentDate.getFullYear() === now.getFullYear();
                  
                  days.push(
                    <div 
                      key={i} 
                      className={`dashboard-calendar-day ${isCurrentMonth ? '' : 'dashboard-calendar-day-disabled'} ${isToday ? 'dashboard-calendar-day-today' : ''}`}
                    >
                      {currentDate.getDate()}
                    </div>
                  );
                  currentDate.setDate(currentDate.getDate() + 1);
                }
                return days;
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
