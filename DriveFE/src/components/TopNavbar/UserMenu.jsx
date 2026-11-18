import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {LogOut} from 'lucide-react';
import api from '../../api/axiosInstance';

const parseStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

const parseTokenPayload = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    return JSON.parse(atob(payload));
  } catch (error) {
    return null;
  }
};

function UserMenu() {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(() => parseStoredUser());
  const [tokenPayload, setTokenPayload] = useState(() => parseTokenPayload());

  useEffect(() => {
    const syncUserState = () => {
      setStoredUser(parseStoredUser());
      setTokenPayload(parseTokenPayload());
    };

    syncUserState();
    window.addEventListener('storage', syncUserState);
    window.addEventListener('focus', syncUserState);

    return () => {
      window.removeEventListener('storage', syncUserState);
      window.removeEventListener('focus', syncUserState);
    };
  }, []);

  const username = useMemo(() => {
    const name =
      storedUser?.name;
    

    if (name) {
      return name;
    }

    if (storedUser?.email) {
      return storedUser.email.split('@')[0];
    }

    if (tokenPayload?.sub) {
      return tokenPayload.sub.split('@')[0];
    }

    return 'User';
  }, [storedUser, tokenPayload]);

  const userEmail = useMemo(() => {
    return (
      storedUser?.email

    );
  }, [storedUser]);

  const userInitial = useMemo(() => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  }, [username]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-wrapper')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await api.post('/logout', { refreshToken });
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      navigate("/");
      setUserMenuOpen(false);
    }
  };

  return (
    <div className="user-menu-wrapper">
      <button
        className="user-avatar-btn-topnav"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        title={userEmail}
      >
        <span className="avatar-circle-topnav">{userInitial}</span>
      </button>

      {userMenuOpen && (
        <div className="user-dropdown-topnav">
          <div className="user-dropdown-header-topnav">
            <div className="user-info-topnav">
              <div className="user-name-topnav">{username}</div>
              <div className="user-email-topnav">{userEmail}</div>
            </div>
          </div>
          <div className="user-dropdown-divider-topnav"></div>
          <button className="user-dropdown-item-topnav logout-item-topnav" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
