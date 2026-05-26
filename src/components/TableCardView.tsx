import React from 'react';
import '../styles/components/TableCardView.css';

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
      <div className="table-card-view-empty">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="table-card-view-container">
      {data.map((item, index) => (
        <div key={index} className="table-card-view-card">
          {columns.map((column) => (
            <div key={column.key} className="table-card-view-card-row">
              <span className="table-card-view-card-label">{column.label}:</span>
              <span className="table-card-view-card-value">
                {item[column.key] !== undefined && item[column.key] !== null 
                  ? String(item[column.key]) 
                  : '-'}
              </span>
            </div>
          ))}
          {(onEdit || onDelete || onView) && (
            <div className="table-card-view-card-actions">
              {onView && (
                <button 
                  onClick={() => onView(item)}
                  className="table-card-view-action-button"
                  title="Voir"
                >
                  <i className="fas fa-eye"></i>
                </button>
              )}
              {onEdit && (
                <button 
                  onClick={() => onEdit(item)}
                  className="table-card-view-action-button"
                  title="Modifier"
                >
                  <i className="fas fa-edit"></i>
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(item.id)}
                  className="table-card-view-action-button table-card-view-delete-button"
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

export default TableCardView;
