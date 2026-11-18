import React from 'react';
import SearchFiles from './SearchFiles';
import UserMenu from './UserMenu';
import '../../styles/TopNavbar.css';

function TopNavbar() {
  const token = localStorage.getItem("token");

  // Don't show navbar on login/register pages
  if (!token) {
    return null;
  }

  return (
    <nav className="top-navbar">
      <div className="navbar-content-topnav">
        <SearchFiles />
        <UserMenu />
      </div>
    </nav>
  );
}

export default TopNavbar;
