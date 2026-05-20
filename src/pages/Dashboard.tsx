import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, applicationsAPI, comptesAPI, usersAPI, testsAPI, testSessionsAPI, todosAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Test {
  id: number;
  statut: string;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
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
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await authAPI.me();
        setUser(userData);
        localStorage.setItem('user_role', userData.role);
        
        const [apps, comptes, tests, sessions, todos] = await Promise.all([
          applicationsAPI.getAll(),
          comptesAPI.getAll(),
          testsAPI.getAll(),
          testSessionsAPI.getAll(),
          todosAPI.getAll(),
        ]);
        
        setTodos(todos.filter((t: Todo) => !t.completed).slice(0, 5));
        
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
    };
    
    fetchData();
  }, [navigate]);

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
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        {/* En-tête de bienvenue */}
        <div style={isMobile ? { ...styles.welcomeSection, ...styles.welcomeSectionMobile } : styles.welcomeSection}>
          <div style={styles.welcomeContent}>
            <h1 style={isMobile ? { ...styles.welcomeTitle, fontSize: '24px' } : styles.welcomeTitle}>{getGreeting()}, <span style={styles.userName}>{user?.username}</span></h1>
            <p style={styles.welcomeSubtitle}>{dateFormatted}</p>
            <p style={styles.welcomeRole}>
              <span style={styles.roleBadge}>{user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
            </p>
          </div>
          <div style={isMobile ? { ...styles.welcomeIcon, fontSize: '50px' } : styles.welcomeIcon}>
            <i className={`fas ${user?.role === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div style={isMobile ? { ...styles.statsGrid, gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } : styles.statsGrid}>
          <div
            style={{
              ...styles.statCard,
              ...(isMobile ? styles.statCardMobile : {}),
              ...(hoveredCard === 'applications' ? styles.statCardHover : null),
            }}
            onMouseEnter={() => setHoveredCard('applications')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/applications')}
          >
            <div style={{ ...styles.statIcon, ...styles.statIconInfo }}>
              <i className="fas fa-mobile-alt"></i>
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Applications</h3>
              <p style={styles.statNumber}>{stats.applications}</p>
              <span style={styles.statFooter}>Gérer les applications</span>
            </div>
          </div>
          
          <div
            style={{
              ...styles.statCard,
              ...(isMobile ? styles.statCardMobile : {}),
              ...(hoveredCard === 'comptes' ? styles.statCardHover : null),
            }}
            onMouseEnter={() => setHoveredCard('comptes')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/comptes')}
          >
            <div style={{ ...styles.statIcon, ...styles.statIconPrimary }}>
              <i className="fas fa-user-cog"></i>
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Comptes</h3>
              <p style={styles.statNumber}>{stats.comptes}</p>
              <span style={styles.statFooter}>Gérer les comptes</span>
            </div>
          </div>
          
          <div
            style={{
              ...styles.statCard,
              ...(isMobile ? styles.statCardMobile : {}),
              ...(hoveredCard === 'tests' ? styles.statCardHover : null),
            }}
            onMouseEnter={() => setHoveredCard('tests')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/tests')}
          >
            <div style={{ ...styles.statIcon, ...styles.statIconSuccess }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Tests</h3>
              <p style={styles.statNumber}>{stats.tests}</p>
              <span style={styles.statFooter}>Voir les tests</span>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              ...(isMobile ? styles.statCardMobile : {}),
              ...(hoveredCard === 'users' ? styles.statCardHover : null),
            }}
            onMouseEnter={() => setHoveredCard('users')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/users')}
          >
            <div style={{ ...styles.statIcon, ...styles.statIconWarning }}>
              <i className="fas fa-users"></i>
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Utilisateurs</h3>
              <p style={styles.statNumber}>{stats.users}</p>
              <span style={styles.statFooter}>{stats.usersActive} actifs</span>
            </div>
          </div>

          <div
            style={{
              ...styles.statCard,
              ...(isMobile ? styles.statCardMobile : {}),
              ...(hoveredCard === 'sessions' ? styles.statCardHover : null),
            }}
            onMouseEnter={() => setHoveredCard('sessions')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate('/tests')}
          >
            <div style={{ ...styles.statIcon, ...styles.statIconPrimary }}>
              <i className="fas fa-play-circle"></i>
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statLabel}>Sessions</h3>
              <p style={styles.statNumber}>{stats.sessions}</p>
              <span style={styles.statFooter}>Sessions de test</span>
            </div>
          </div>
        </div>

        {/* Section des statistiques détaillées */}
        <div style={styles.detailsSection}>
          <h2 style={styles.sectionTitle}>Aperçu des performances</h2>
          <div style={styles.detailsGrid}>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <i className="fas fa-chart-pie" style={styles.detailIcon}></i>
                <span style={styles.detailTitle}>Taux de réussite des tests</span>
              </div>
              <div style={styles.detailContent}>
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: stats.tests > 0 ? `${(stats.testsReussis / stats.tests) * 100}%` : '0%',
                      backgroundColor: '#27ae60'
                    }}></div>
                  </div>
                  <span style={styles.progressText}>
                    {stats.tests > 0 ? Math.round((stats.testsReussis / stats.tests) * 100) : 0}%
                  </span>
                </div>
                <div style={styles.detailStats}>
                  <span style={styles.detailStat}><i className="fas fa-check" style={{color: '#27ae60'}}></i> {stats.testsReussis} réussis</span>
                  <span style={styles.detailStat}><i className="fas fa-times" style={{color: '#e74c3c'}}></i> {stats.testsEchoues} échoués</span>
                </div>
              </div>
            </div>

            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <i className="fas fa-user-check" style={styles.detailIcon}></i>
                <span style={styles.detailTitle}>État des utilisateurs</span>
              </div>
              <div style={styles.detailContent}>
                {user?.role === 'admin' ? (
                  <>
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: stats.users > 0 ? `${(stats.usersActive / stats.users) * 100}%` : '0%',
                          backgroundColor: '#3498db'
                        }}></div>
                      </div>
                      <span style={styles.progressText}>
                        {stats.users > 0 ? Math.round((stats.usersActive / stats.users) * 100) : 0}%
                      </span>
                    </div>
                    <div style={styles.detailStats}>
                      <span style={styles.detailStat}><i className="fas fa-user-check" style={{color: '#27ae60'}}></i> {stats.usersActive} actifs</span>
                      <span style={styles.detailStat}><i className="fas fa-user-slash" style={{color: '#95a5a6'}}></i> {stats.users - stats.usersActive} inactifs</span>
                    </div>
                  </>
                ) : (
                  <p style={styles.noAccess}>Vous n'avez pas accès à cette information</p>
                )}
              </div>
            </div>

            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <i className="fas fa-clipboard-list" style={styles.detailIcon}></i>
                <span style={styles.detailTitle}>Résumé</span>
              </div>
              <div style={styles.detailContent}>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{stats.applications}</span>
                    <span style={styles.summaryLabel}>Apps</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{stats.comptes}</span>
                    <span style={styles.summaryLabel}>Comptes</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{stats.tests}</span>
                    <span style={styles.summaryLabel}>Tests</span>
                  </div>
                  {user?.role === 'admin' && (
                    <div style={styles.summaryItem}>
                      <span style={styles.summaryValue}>{stats.users}</span>
                      <span style={styles.summaryLabel}>Utilisateurs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>Actions rapides</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionButton} onClick={() => navigate('/applications')}>
              <span style={{ ...styles.actionIcon, ...styles.actionIconInfo }}>
                <i className="fas fa-plus-circle"></i>
              </span>
              <span style={styles.actionText}>Nouvelle application</span>
            </button>
            <button style={styles.actionButton} onClick={() => navigate('/comptes')}>
              <span style={{ ...styles.actionIcon, ...styles.actionIconPrimary }}>
                <i className="fas fa-user-plus"></i>
              </span>
              <span style={styles.actionText}>Nouveau compte</span>
            </button>
            <button style={styles.actionButton} onClick={() => navigate('/tests')}>
              <span style={{ ...styles.actionIcon, ...styles.actionIconSuccess }}>
                <i className="fas fa-play-circle"></i>
              </span>
              <span style={styles.actionText}>Nouveau test</span>
            </button>
            <button style={styles.actionButton} onClick={() => navigate('/todos')}>
              <span style={{ ...styles.actionIcon, ...styles.actionIconSuccess }}>
                <i className="fas fa-tasks"></i>
              </span>
              <span style={styles.actionText}>Nouvelle tâche</span>
            </button>
            {user?.role === 'admin' && (
              <button style={styles.actionButton} onClick={() => navigate('/users')}>
                <span style={{ ...styles.actionIcon, ...styles.actionIconWarning }}>
                  <i className="fas fa-user-shield"></i>
                </span>
                <span style={styles.actionText}>Gérer les utilisateurs</span>
              </button>
            )}
          </div>
        </div>

        {/* Section tâches */}
        {todos.length > 0 && (
          <div style={styles.tasksSection}>
            <div style={styles.tasksHeader}>
              <h2 style={styles.sectionTitle}>
                <i className="fas fa-tasks" style={{ color: 'var(--success-color)' }}></i> Tâches en attente
              </h2>
              <button style={styles.voirToutButton} onClick={() => navigate('/todos')}>
                Voir tout
              </button>
            </div>
            <div style={styles.tasksList}>
              {todos.map((todo) => (
                <div key={todo.id} style={styles.taskItem}>
                  <i className="fas fa-circle" style={styles.taskBullet}></i>
                  <span style={styles.taskTitle}>{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <p>&copy; 2026 IT Access Manager - Gestion des accès pour systèmes internes</p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  main: {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    minHeight: 'calc(100vh - 70px)',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: 'var(--text-secondary)',
  },
  welcomeSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, var(--info-color) 0%, #7c3aed 100%)',
    borderRadius: '16px',
    padding: '30px 40px',
    marginBottom: '30px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
  },
  welcomeSectionMobile: {
    padding: '20px',
    marginBottom: '20px',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    color: 'white',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  userName: {
    fontWeight: '800',
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '16px',
    margin: '0 0 12px 0',
  },
  welcomeRole: {
    margin: 0,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },
  welcomeIcon: {
    fontSize: '80px',
    color: 'rgba(255, 255, 255, 0.2)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  statCard: {
    borderRadius: '16px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 14px var(--shadow-color)',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
  },
  statCardMobile: {
    padding: '16px',
    gap: '12px',
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 28px var(--shadow-strong)',
    borderColor: 'var(--border-light)',
  },
  statIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  statIconPrimary: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    color: '#7c3aed',
  },
  statIconInfo: {
    backgroundColor: 'rgba(52, 152, 219, 0.14)',
    color: 'var(--info-color)',
  },
  statIconSuccess: {
    backgroundColor: 'rgba(39, 174, 96, 0.14)',
    color: 'var(--success-color)',
  },
  statIconWarning: {
    backgroundColor: 'rgba(243, 156, 18, 0.16)',
    color: 'var(--warning-color)',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statNumber: {
    margin: '0 0 8px 0',
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statFooter: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  detailsSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    color: 'var(--text-primary)',
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  detailCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px var(--shadow-color)',
    border: '1px solid var(--border-color)',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-light)',
  },
  detailIcon: {
    fontSize: '20px',
    color: 'var(--info-color)',
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  progressBar: {
    flex: 1,
    height: '10px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    minWidth: '50px',
  },
  detailStats: {
    display: 'flex',
    gap: '20px',
  },
  detailStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  noAccess: {
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--info-color)',
  },
  summaryLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionsSection: {
    marginBottom: '30px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px var(--shadow-color)',
  },
  actionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    color: '#7c3aed',
  },
  actionIconInfo: {
    backgroundColor: 'rgba(52, 152, 219, 0.14)',
    color: 'var(--info-color)',
  },
  actionIconSuccess: {
    backgroundColor: 'rgba(39, 174, 96, 0.14)',
    color: 'var(--success-color)',
  },
  actionIconWarning: {
    backgroundColor: 'rgba(243, 156, 18, 0.16)',
    color: 'var(--warning-color)',
  },
  actionText: {
    textAlign: 'left',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#9ca3af',
    fontSize: '14px',
  },
  tasksSection: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 15px var(--shadow-color)',
    marginBottom: '30px',
  },
  tasksHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  voirToutButton: {
    padding: '8px 16px',
    backgroundColor: 'var(--success-color)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '10px',
  },
  taskBullet: {
    color: 'var(--success-color)',
    fontSize: '8px',
  },
  taskTitle: {
    color: 'var(--text-primary)',
    fontSize: '14px',
  },
};

export default Dashboard;
