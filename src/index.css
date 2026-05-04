/* CSS Variables for theming */
:root {
  /* Light theme (default) */
  --bg-primary: #f0f2f5;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --border-light: #eee;
  --input-bg: #fafafa;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --shadow-strong: rgba(0, 0, 0, 0.15);
  --header-bg: #ffffff;
  --header-text: #333333;
  --nav-button-bg: transparent;
  --nav-button-color: #555555;
  --nav-button-border: #ddd;
  --nav-button-active-bg: #3498db;
  --nav-button-active-color: #ffffff;
  --danger-color: #ff6b6b;
  --success-color: #27ae60;
  --info-color: #3498db;
  --warning-color: #f39c12;
  --hover-bg: #f8f9fa;
  --table-stripe: #fafafa;
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-card: #21262d;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --border-color: #30363d;
  --border-light: #21262d;
  --input-bg: #0d1117;
  --shadow-color: rgba(0, 0, 0, 0.4);
  --shadow-strong: rgba(0, 0, 0, 0.6);
  --header-bg: #161b22;
  --header-text: #c9d1d9;
  --nav-button-bg: transparent;
  --nav-button-color: #8b949e;
  --nav-button-border: #30363d;
  --nav-button-active-bg: #238636;
  --nav-button-active-color: #ffffff;
  --danger-color: #da3633;
  --success-color: #238636;
  --info-color: #58a6ff;
  --warning-color: #d29922;
  --hover-bg: #30363d;
  --table-stripe: #161b22;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: background-color 0.3s ease, color 0.3s ease;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

table {
  border-collapse: collapse;
  width: 100%;
  background: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

th {
  background-color: var(--bg-primary);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

tr:hover {
  background-color: var(--hover-bg);
}

input, select, textarea {
  font-family: inherit;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  background-color: var(--input-bg);
  color: var(--text-primary);
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--info-color);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--shadow-strong);
}

button:active {
  transform: translateY(0);
}

/* Touch feedback for mobile */
@media (hover: none) and (pointer: coarse) {
  button:active {
    transform: scale(0.98);
    opacity: 0.8;
  }
  
  .card:active {
    transform: scale(0.99);
  }
  
  a:active {
    opacity: 0.7;
  }
}

/* Card styling for web look */
.card {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 12px;
  margin-bottom: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--shadow-strong);
}

/* Modern form groups */
.form-group {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 12px;
}

/* Responsive container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Badge styles */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background-color: var(--success-color);
  color: white;
}

.badge-danger {
  background-color: var(--danger-color);
  color: white;
}

.badge-warning {
  background-color: var(--warning-color);
  color: #333;
}

.badge-info {
  background-color: var(--info-color);
  color: white;
}

/* Theme toggle button */
.theme-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: 0 4px 12px var(--shadow-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  z-index: 9999;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
}

/* ==================== RESPONSIVE STYLES ==================== */

/* Mobile phones (small screens) */
@media screen and (max-width: 768px) {
  body {
    font-size: 14px;
    -webkit-tap-highlight-color: transparent;
  }

  /* Container full width on mobile */
  .container {
    padding: 16px;
    max-width: 100%;
    width: 100%;
  }

  h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  /* Smaller inputs for mobile with better touch targets */
  input, select, textarea {
    padding: 14px 16px;
    font-size: 16px;
    min-height: 48px;
    border-radius: 12px;
  }

  button {
    padding: 14px 20px;
    font-size: 16px;
    min-height: 48px;
    border-radius: 12px;
    font-weight: 600;
  }

  /* Enhanced card design for mobile */
  .card {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 16px;
    box-shadow: 0 2px 12px var(--shadow-color);
    border: 1px solid var(--border-light);
  }

  /* Form group adjustments */
  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  /* Theme toggle position on mobile */
  .theme-toggle {
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    font-size: 24px;
    box-shadow: 0 4px 20px var(--shadow-strong);
  }

  /* Main content adjustments for mobile */
  main {
    margin-left: 0 !important;
    padding: 16px !important;
    width: 100% !important;
  }

  /* Header mobile */
  header {
    padding: 0 16px !important;
    height: 64px !important;
    box-shadow: 0 2px 8px var(--shadow-color);
  }

  header h1 {
    font-size: 18px !important;
    font-weight: 700;
  }

  /* Form section full width */
  .form-section {
    padding: 20px;
    border-radius: 16px;
  }

  .form-section form {
    gap: 16px;
  }

  .form-section input,
  .form-section select,
  .form-section textarea {
    width: 100%;
  }

  /* ==================== TABLE TO CARD TRANSFORMATION ==================== */
  /* Hide tables on mobile, show card view */
  table {
    display: none;
  }

  /* Table container for card view */
  .table-container,
  div[style*="overflowX"],
  div[style*="overflow-x"] {
    display: block;
    overflow: visible;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }

  /* Card view for table data */
  .table-container::before,
  div[style*="overflowX"]::before {
    content: '';
    display: block;
  }

  /* Modal full screen on mobile */
  .modal {
    padding: 0 !important;
    align-items: flex-end !important;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 24px !important;
    border-radius: 24px 24px 0 0 !important;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  /* Form rows - stack on mobile */
  .form-row,
  div[style*="flexWrap"] {
    flex-direction: column !important;
    gap: 16px !important;
  }

  .form-row > div {
    flex: 1 1 100% !important;
    min-width: 100% !important;
  }

  /* Page header mobile */
  .page-header,
  div[style*="justifyContent"],
  header > div:first-child {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 16px !important;
  }

  header .primaryButton {
    width: 100%;
    justify-content: center;
  }

  /* Button groups on mobile */
  .button-group,
  div[style*="gap"] {
    flex-direction: column !important;
    gap: 12px !important;
  }

  .button-group button,
  div[style*="gap"] button {
    width: 100%;
  }

  /* Stat cards on mobile */
  .stat-card,
  div[style*="background"][style*="padding"] {
    padding: 20px !important;
    border-radius: 16px !important;
    margin-bottom: 12px !important;
  }

  /* Quick actions on mobile */
  .quick-actions,
  div[style*="grid"] {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
  }

  .quick-action-button {
    padding: 20px !important;
    min-height: 100px;
    font-size: 14px;
  }

  /* Dashboard specific mobile styles */
  .welcomeSection,
  div[style*="linear-gradient"] {
    padding: 20px !important;
    margin-bottom: 20px !important;
  }

  .welcomeTitle,
  div[style*="32px"] {
    font-size: 24px !important;
  }

  .welcomeSubtitle,
  div[style*="16px"] {
    font-size: 14px !important;
  }

  .statsGrid,
  div[style*="gridTemplateColumns"] {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }

  .statCard,
  div[style*="borderRadius: 16px"] {
    padding: 20px !important;
  }

  .statNumber,
  div[style*="36px"] {
    font-size: 28px !important;
  }

  .detailsGrid,
  div[style*="minmax(300px"] {
    grid-template-columns: 1fr !important;
  }

  .actionsGrid,
  div[style*="gridTemplateColumns"][style*="repeat"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .actionButton {
    padding: 16px !important;
    min-height: 80px;
  }
}

/* Tablets (medium screens) */
@media screen and (min-width: 481px) and (max-width: 768px) {
  .container {
    padding: 16px;
  }

  table {
    font-size: 14px;
  }

  th, td {
    padding: 12px 10px;
  }
}

/* Large tablets and small laptops */
@media screen and (min-width: 769px) and (max-width: 1024px) {
  .container {
    max-width: 95%;
  }
}

/* Very large screens */
@media screen and (min-width: 1400px) {
  .container {
    max-width: 1400px;
  }

  body {
    font-size: 16px;
  }

  table {
    font-size: 15px;
  }

  th, td {
    padding: 16px 20px;
  }
}

/* Print styles */
@media print {
  .theme-toggle {
    display: none;
  }

  body {
    background: white;
    color: black;
  }

  .card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
}

/* Login page mobile styles */
@media screen and (max-width: 480px) {
  .login-card {
    padding: 24px 16px !important;
    margin: 16px !important;
    border-radius: 12px !important;
  }
  
  .login-title {
    font-size: 24px !important;
  }
}

/* Comptes page - card view on mobile */
@media screen and (max-width: 768px) {
  .comptes-cards {
    display: block !important;
  }
  
  .comptes-table {
    display: none !important;
  }
}

@media screen and (min-width: 769px) {
  .comptes-cards {
    display: none !important;
  }
  
  .comptes-table {
    display: block !important;
  }
}

/* Hide sidebar on mobile, show hamburger menu */
@media screen and (max-width: 768px) {
  /* Hide the sidebar by default */
  .sidebar, aside {
    position: fixed !important;
    left: -280px !important;
    width: 260px !important;
    z-index: 1000 !important;
    transition: left 0.3s ease !important;
    height: 100vh !important;
  }

  /* Show sidebar when opened */
  .sidebar.sidebar-open, aside.sidebar-open {
    left: 0 !important;
  }

  /* Main wrapper should not have margin on mobile */
  .main-wrapper, div[style*="marginLeft"] {
    margin-left: 0 !important;
    width: 100% !important;
  }

  /* Mobile menu toggle - show on mobile */
  .mobile-menu-toggle {
    display: flex !important;
  }

  /* Show overlay when mobile menu is open */
  .mobile-overlay {
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999 !important;
  }
}
