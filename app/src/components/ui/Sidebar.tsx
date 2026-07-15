import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sidebar({ isOpen, onClose, title, children }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="sidebar-body">
          {children}
        </div>
      </div>
    </>
  );
}
