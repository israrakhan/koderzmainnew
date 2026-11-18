import React, { useEffect, useRef } from 'react';
import { Download, Edit, Trash2, Folder } from 'lucide-react';
import '../../styles/ContextMenu.css';

const getIconComponent = (iconName) => {
  const iconMap = {
    'download': <Download size={14} />,
    'edit': <Edit size={14} />,
    'trash': <Trash2 size={14} />,
    'folder': <Folder size={14} />
  };
  return iconMap[iconName] || iconName;
};

const ContextMenu = ({ isOpen, position, menuItems, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          <span className="context-menu-icon">{getIconComponent(item.icon)}</span>
          <span className="context-menu-text">{item.label}</span>
          {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
