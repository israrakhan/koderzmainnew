import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, File, Image, Video, Music, FileText, Settings, Folder } from 'lucide-react';
import api from '../../api/axiosInstance';

function SearchFiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getFileIcon = (fileType) => {
    if (!fileType) return <File size={16} />;
    if (fileType.includes('image')) return <Image size={16} />;
    if (fileType.includes('video')) return <Video size={16} />;
    if (fileType.includes('audio')) return <Music size={16} />;
    if (fileType.includes('pdf')) return <FileText size={16} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText size={16} />;
    if (fileType.includes('sheet') || fileType.includes('spreadsheet')) return <FileText size={16} />;
    if (fileType.includes('text')) return <FileText size={16} />;
    if (fileType.includes('executable')) return <Settings size={16} />;
    return <File size={16} />;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await api.get(`/files/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        let fileArray = [];
        if (Array.isArray(res.data)) fileArray = res.data;
        else if (res.data && Array.isArray(res.data.files)) fileArray = res.data.files;
        else if (res.data && Array.isArray(res.data.content)) fileArray = res.data.content;

        setSearchResults(fileArray.slice(0, 8)); // Limit dropdown results
        setShowDropdown(true);
      } catch (error) {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (query) => {
    const targetQuery = query || searchQuery;
    if (!targetQuery.trim()) return;

    setShowDropdown(false);
    const currentParams = new URLSearchParams(location.search);
    currentParams.set('search', targetQuery);
    navigate({
      pathname: location.pathname,
      search: currentParams.toString()
    });
    setSearchQuery('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleResultClick = (file) => {
    setShowDropdown(false);
    setSearchQuery('');
    // If it's a folder, navigate to it. Otherwise, search for the exact name.
    if (file.folderName) {
      const folderId = file.uuid || file.id;
      navigate(`/home?uuid=${encodeURIComponent(folderId)}&folderName=${encodeURIComponent(file.folderName)}`);
    } else {
      handleSearch(file.fileName || file.name);
    }
  };

  return (
    <div className="search-files-container" ref={dropdownRef}>
      <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
        />
        
        <div className="search-actions">
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button 
            className="search-submit-btn" 
            onClick={() => handleSearch()}
            title="Search"
          >
            <Search size={18} />
          </button>
        </div>

        {isSearching && <span className="search-spinner">⟳</span>}

        {showDropdown && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map((file, index) => (
              <div 
                key={file.id || index} 
                className="search-dropdown-item"
                onClick={() => handleResultClick(file)}
              >
                <span className="item-icon">
                  {file.folderName ? <Folder size={16} /> : getFileIcon(file.fileType)}
                </span>
                <span className="item-name">{file.fileName || file.folderName || file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchFiles;
