import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import NotificationBell from "./NotificationBell";
import "./Layout.css";

// Hook pour détecter la taille d'écran
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px est la limite commune pour mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useResponsive();

  const currentPath = location.pathname;

  // Vérifier le token au chargement
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (process.env.NODE_ENV === 'development') {
      console.log("Layout: Checking token on load");
      console.log("Layout: Token in localStorage:", token ? token.substring(0, 20) + "..." : "NO TOKEN");
    }
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Layout: No token found, redirecting to login");
      }
      navigate("/login");
      return;
    }

    // Vérifier si le token est valide
    const validateToken = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Layout: Validating token with /auth/me");
      }
      try {
        const response = await authAPI.me();
        if (process.env.NODE_ENV === 'development') {
          console.log("Layout: Token validation successful:", response);
        }
      } catch (error: unknown) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Layout: Token validation error:", error);
          console.error("Layout: Token validation response:", (error as { response?: { status?: number; data?: unknown } })?.response?.status, (error as { response?: { data?: unknown } })?.response?.data);
        }
        
        // Ne déconnecter que si c'est une vraie erreur 401 (token invalide/expiré)
        // Ne pas déconnecter pour 429 (rate limiting) ou autres erreurs temporaires
        const err = error as { response?: { status?: number } };
        if (err?.response?.status === 401) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Layout: Token invalid (401), redirecting to login");
          }
          localStorage.removeItem("access_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("user_role");
          localStorage.removeItem("user_id");
          localStorage.removeItem("username");
          localStorage.removeItem("email");
          navigate("/login");
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log("Layout: Token validation failed but not 401, keeping user logged in");
          }
        }
      }
    };

    validateToken();
  }, [navigate]);

  // Récupérer le rôle de l'utilisateur depuis le localStorage
  const userRole = localStorage.getItem("user_role");
  const isAdmin = userRole === "admin";

  const mainMenuItems = [
    { path: "/dashboard", label: "Tableau de bord", icon: "fa-home" },
    { path: "/applications", label: "Applications", icon: "fa-mobile-alt" },
    { path: "/comptes", label: "Comptes", icon: "fa-user" },
    { path: "/tests", label: "Tests", icon: "fa-check-square" },
    { path: "/test-sessions", label: "Sessions", icon: "fa-folder-open" },
    { path: "/todos", label: "Tâches", icon: "fa-tasks" },
    { path: "/messages", label: "Messages", icon: "fa-comments" },
    { path: "/reports", label: "Rapports", icon: "fa-chart-bar" },
    ...(isAdmin
      ? [{ path: "/users", label: "Utilisateurs", icon: "fa-users" }]
      : []),
    { path: "/profile", label: "Mon Profil", icon: "fa-user-circle" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.classList.toggle('menu-open', !mobileMenuOpen);
  };

  const handleNavClick = (itemPath: string) => {
    navigate(itemPath);
    setMobileMenuOpen(false);
  };

  return (
    <div style={styles.container}>
      {/* Mobile Menu Toggle */}
      <button
        className="mobileMenuToggle"
        style={styles.mobileMenuToggle}
        onClick={toggleMobileMenu}
        aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}
        style={styles.sidebar}
      >
        <div style={styles.logo}>
          <h2>
            <i className="fas fa-shield-alt"></i> IT Access
          </h2>
          <p>Manager</p>
        </div>

        <nav style={styles.nav}>
          {mainMenuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              style={{
                ...styles.navItem,
                ...(currentPath === item.path ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>
                <i className={`fas ${item.icon}`}></i>
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          style={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div style={styles.mainWrapper} className="main-wrapper">
       {/* Header */}
       <header
         style={{
           ...styles.header,
           ...(isMobile ? { 
             left: 0, 
             padding: "0 16px",
             height: "60px",
             backgroundColor: "var(--bg-card)",
             backdropFilter: "blur(10px)",
             WebkitBackdropFilter: "blur(10px)"
           } : {}),
         }}
       >
         <div style={styles.headerTitle}>
           <h1 style={{
             ...styles.headerTitleText,
             ...(isMobile ? { fontSize: "18px" } : {})
           }}>
             {isMobile ? "IT Access" : "Gestion des Accès IT"}
           </h1>
         </div>
         <div style={{
           ...styles.headerActions,
           ...(isMobile ? { 
             gap: "8px",
             display: "flex",
             alignItems: "center",
             justifyContent: "flex-end",
             flexShrink: 0,
             flexDirection: "row"
           } : {})
         }}>
           <NotificationBell />
           <button
            onClick={handleLogout}
            style={{
              ...styles.logoutButton,
              ...(isMobile ? {
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "var(--danger-color)",
                color: "white",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                padding: "0"
              } : {})
            }}
            title="Se déconnecter"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
         </div>
       </header>

        {/* Content */}
        <main style={styles.content}>{children}</main>

        {/* Bottom Navigation for Mobile */}
        <div style={styles.bottomNav}>
          <button
            onClick={() => handleNavClick('/dashboard')}
            style={{
              ...styles.bottomNavItem,
              ...(currentPath === '/dashboard' ? styles.bottomNavItemActive : {}),
            }}
          >
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => handleNavClick('/applications')}
            style={{
              ...styles.bottomNavItem,
              ...(currentPath === '/applications' ? styles.bottomNavItemActive : {}),
            }}
          >
            <i className="fas fa-mobile-alt"></i>
            <span>Applications</span>
          </button>
          <button
            onClick={() => handleNavClick('/tests')}
            style={{
              ...styles.bottomNavItem,
              ...(currentPath === '/tests' ? styles.bottomNavItemActive : {}),
            }}
          >
            <i className="fas fa-check-square"></i>
            <span>Tests</span>
          </button>
          <button
            onClick={() => handleNavClick('/messages')}
            style={{
              ...styles.bottomNavItem,
              ...(currentPath === '/messages' ? styles.bottomNavItemActive : {}),
            }}
          >
            <i className="fas fa-comments"></i>
            <span>Messages</span>
          </button>
          <button
            onClick={() => handleNavClick('/profile')}
            style={{
              ...styles.bottomNavItem,
              ...(currentPath === '/profile' ? styles.bottomNavItemActive : {}),
            }}
          >
            <i className="fas fa-user-circle"></i>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "var(--bg-primary)",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "var(--bg-card)",
    borderRight: "1px solid var(--border-color)",
    display: "flex",
    flexDirection: "column" as const,
    position: "fixed" as const,
    height: "100vh",
    left: 0,
    top: 0,
    boxShadow: "2px 0 8px var(--shadow-color)",
    transition: "transform 0.3s ease, left 0.3s ease",
  },
  logo: {
    padding: "24px 20px",
    borderBottom: "1px solid var(--border-light)",
    background: "linear-gradient(135deg, var(--info-color), #5b7fd3)",
    color: "white",
  },
  logoTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
  },
  nav: {
    flex: 1,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "left" as const,
    transition: "all 0.2s ease",
    width: "100%",
  },
  navItemActive: {
    backgroundColor: "var(--info-color)",
    color: "white",
    boxShadow: "0 4px 12px rgba(52, 152, 219, 0.3)",
  },
  navIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center" as const,
  },
  sidebarFooter: {
    padding: "16px",
    borderTop: "1px solid var(--border-light)",
  },
  mainWrapper: {
    flex: 1,
    marginLeft: "260px",
    display: "flex",
    flexDirection: "column" as const,
    transition: "margin-left 0.3s ease",
  },
  header: {
    height: "70px",
    backgroundColor: "var(--bg-card)",
    borderBottom: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    boxShadow: "0 2px 8px var(--shadow-color)",
    position: "fixed" as const,
    top: 0,
    left: "260px",
    right: 0,
    zIndex: 100,
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
  },
  headerTitleText: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "flex-end",
    flexShrink: 0,
    flexDirection: "row" as const
  },
  notifBellButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "var(--hover-bg)",
    color: "var(--text-secondary)",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  logoutIconButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "var(--danger-color)",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  logoutButton: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--danger-color)",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  userBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    backgroundColor: "var(--info-color)",
    color: "white",
    fontSize: "12px",
    fontWeight: "600",
  },
  userBadgeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  onlineIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#27ae60",
    boxShadow: "0 0 0 2px rgba(39, 174, 96, 0.2)",
  },
  content: {
    flex: 1,
    padding: "90px 30px 30px 30px",
    overflowY: "auto" as const,
    backgroundColor: "var(--bg-primary)",
    overflow: "auto",
    '@media (max-width: 768px)': {
      paddingTop: "80px", 
    }
  },
  bottomNav: {
    display: "none",
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "var(--bg-card)",
    borderTop: "1px solid var(--border-color)",
    padding: "12px 0",
    boxShadow: "0 -2px 8px var(--shadow-color)",
    zIndex: 1000,
  },
  bottomNavItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    padding: "8px 4px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "10px",
    fontWeight: "500",
    cursor: "pointer",
    flex: 1,
    transition: "all 0.2s ease",
  },
  bottomNavItemActive: {
    color: "var(--info-color)",
  },
  mobileMenuToggle: {
    display: "none",
    position: "fixed" as const,
    top: "8px",
    left: "8px",
    zIndex: 1001,
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    border: "2px solid var(--border-color)",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: "20px",
    cursor: "pointer",
    boxShadow: "0 4px 12px var(--shadow-strong)",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileMenuHidden: {
    opacity: 0,
    pointerEvents: "none" as const,
  },
  mobileOverlay: {
    display: "none",
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 199,
  },
  sidebarMobileOpen: {
    left: 0,
  },
};

export default Layout;
