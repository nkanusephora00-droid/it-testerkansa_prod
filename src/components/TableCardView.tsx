import React from 'react';

interface TableCardViewProps {
  data: any[];
  columns: { key: string; label: string }[];
  onEdit?: (item: any) => void;
  onDelete?: (id: number) => void;
  onView?: (item: any) => void;
}

const TableCardView: React.FC<TableCardViewProps> = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={styles.empty}>
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {data.map((item, index) => (
        <div key={index} style={styles.card}>
          {columns.map((column) => (
            <div key={column.key} style={styles.cardRow}>
              <span style={styles.cardLabel}>{column.label}:</span>
              <span style={styles.cardValue}>
                {item[column.key] !== undefined && item[column.key] !== null 
                  ? String(item[column.key]) 
                  : '-'}
              </span>
            </div>
          ))}
          {(onEdit || onDelete || onView) && (
            <div style={styles.cardActions}>
              {onView && (
                <button 
                  onClick={() => onView(item)}
                  style={styles.actionButton}
                  title="Voir"
                >
                  <i className="fas fa-eye"></i>
                </button>
              )}
              {onEdit && (
                <button 
                  onClick={() => onEdit(item)}
                  style={styles.actionButton}
                  title="Modifier"
                >
                  <i className="fas fa-edit"></i>
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(item.id)}
                  style={{...styles.actionButton, ...styles.deleteButton}}
                  title="Supprimer"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px var(--shadow-color)',
  },
  cardRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-light)',
  },
  cardRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '4px',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: '16px',
    color: 'var(--text-primary)',
    wordBreak: 'break-word' as const,
  },
  cardActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-light)',
  },
  actionButton: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '48px',
  },
  deleteButton: {
    backgroundColor: 'var(--danger-color)',
    color: 'white',
    borderColor: 'var(--danger-color)',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'var(--text-secondary)',
  },
};

export default TableCardView;
