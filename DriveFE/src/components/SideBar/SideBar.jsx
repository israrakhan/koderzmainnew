import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosInstance';
import '../../styles/SideBar.css';
import { Home, FolderOpen, BarChart3, Plus } from 'lucide-react';


function SideBar() {
  const logo = '/logo.png';
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  
  // Initialize navbar state
  useEffect(() => {
    document.body.classList.remove('sidebar-hidden');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-hidden');
    };
  }, []);

  // Mouse hover detection removed - navbar is always visible
  
  // Check for token and role changes (login/logout)
  useEffect(() => {
    const checkAuth = () => {
      setToken(localStorage.getItem("token"));
      setUserRole(localStorage.getItem("userRole"));
    };
    
    // Check immediately
    checkAuth();
    
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkAuth);
    
    // Also check periodically (for same-tab login)
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);
  
  const username = 'User';

  useEffect(() => {
    // Component mounted - role should already be set from login
  }, []);

  const isActive = useCallback((path) => location.pathname === path ? 'active' : '', [location.pathname]);

  const isAdmin = useMemo(() => {
    return !!userRole && userRole.toString().toUpperCase().includes('ADMIN');
  }, [userRole]);

  // Helper functions for file display
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
    if (fileType.includes('text')) return '📃';
    if (fileType.includes('executable') || fileType.includes('x-msdownload')) return '⚙️';
    return '📄';
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileSize = (f) => {
    if (!f) return 0;
    const candidate =
      f.totalSize;
    
    const num = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
    return Number.isNaN(num) ? 0 : num;
  };

  // Don't show navbar on login/register pages
  if (!token || location.pathname === '/' || location.pathname === '/register') {
    return null;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/home')}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{width: '24px', height: '24px', objectFit: 'contain'}}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="logo-text">Koderz Drive</span>
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <button
            className="google-drive-new-btn"
            onClick={() => navigate('/home?modal=new')}
          >
            <Plus size={20} /> <span>New</span>
          </button>
        </div>

        <nav className="nav-menu-wrapper">
          <ul className="nav-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${isActive('/home')}`}
                onClick={() => navigate('/home')}
              >
               <Home size={20} /> <span>Home</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${isActive('/myfiles')}`}
                onClick={() => navigate('/myfiles')}
              >
                <FolderOpen size={20} /> <span>My Files</span>
              </button>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <button
                  className={`nav-link ${isActive('/dashboard')}`}
                  onClick={() => navigate('/dashboard')}
                >
                  <BarChart3 size={20} /> <span>Dashboard</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default SideBar;
