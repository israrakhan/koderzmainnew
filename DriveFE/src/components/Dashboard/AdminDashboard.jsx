import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/AdminDashboard.css';
import '../../styles/UploadPage.css'; // For loading spinner styles
import { SkeletonTable } from '../Skeleton/SkeletonLoader';
import { BarChart3, Folder, Trash2, Upload, Download, File, Image, Video, Music, FileText, Settings, Users, HardDrive, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

function AdminDashboard() {
  const [files, setFiles] = useState([]);
  const [deleteHistory, setDeleteHistory] = useState([]);
  const [folderActivities, setFolderActivities] = useState([]);
  const [uniqueFiles, setUniqueFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'deletions', 'folders'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

   const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole && (
    userRole.includes('ADMIN') ||
    userRole === 'ROLE_ADMIN' ||
    userRole.toUpperCase().includes('ADMIN')
  );

  // Load files on mount
  useEffect(() => {
    if (isAdmin) {
      loadFiles();
    } else {
      toast.error("Access denied. Admin privileges required.");
    }
  }, [isAdmin]);

  const loadFiles = async () => {
    try {
      setLoadError(false);
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get(`/activities`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // FileActivityEntity array from backend
      let activities = [];
      if (Array.isArray(res.data)) {
        activities = res.data;
      } else if (res.data && Array.isArray(res.data.activities)) {
        activities = res.data.activities;
      } else if (res.data && Array.isArray(res.data.content)) {
        // Handle paginated response
        activities = res.data.content;
      }
      
      // Get unique files for stats
      const uniqueFileMap = new Map();
      activities.forEach(activity => {
        const fileId = activity.file?.id || activity.fileId;
        if (!uniqueFileMap.has(fileId)) {
          uniqueFileMap.set(fileId, activity);
        }
      });
      
      setFiles(activities);
      setUniqueFiles(Array.from(uniqueFileMap.values()));
    } catch (err) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadDeleteHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get(`/deleteActivity`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let deleteRecords = [];
      if (Array.isArray(res.data)) {
        deleteRecords = res.data;
      } else if (res.data && Array.isArray(res.data.deleteActivity)) {
        deleteRecords = res.data.deleteActivity;
      } else if (res.data && Array.isArray(res.data.content)) {
        deleteRecords = res.data.content;
      }
      
      setDeleteHistory(deleteRecords);
    } catch (err) {
      toast.error("Failed to load delete history");
    } finally {
      setLoading(false);
    }
  };

  const loadFolderActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get(`/folder-activities`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let folderRecords = [];
      if (Array.isArray(res.data)) {
        folderRecords = res.data;
      } else if (res.data && Array.isArray(res.data.folderActivities)) {
        folderRecords = res.data.folderActivities;
      } else if (res.data && Array.isArray(res.data.content)) {
        folderRecords = res.data.content;
      }
      
      setFolderActivities(folderRecords);
    } catch (err) {
      toast.error("Failed to load folder activities");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setCurrentPage(1); // Reset to first page on tab change
    if (newTab === 'deletions') {
      loadDeleteHistory();
    } else if (newTab === 'folders') {
      loadFolderActivities();
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return <File size={20} />;
    if (fileType.includes('image')) return <Image size={20} />;
    if (fileType.includes('video')) return <Video size={20} />;
    if (fileType.includes('audio')) return <Music size={20} />;
    if (fileType.includes('pdf')) return <FileText size={20} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText size={20} />;
    if (fileType.includes('sheet') || fileType.includes('spreadsheet')) return <FileText size={20} />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <File size={20} />;
    if (fileType.includes('text')) return <FileText size={20} />;
    if (fileType.includes('executable') || fileType.includes('x-msdownload')) return <Settings size={20} />;
    return <File size={20} />;
  };

  // Get file size from FileEntity
  const getFileSize = (activity) => {
    return  activity.file?.size || 
           activity.fileSize || 
           activity.totalSize ||
           activity.size ||
           activity.bytes ||
           0;
  };

  // Get file name
  const getFileName = (activity) => {
    return activity.fileName || 
           activity.file?.fileName || 
           activity.name ||
           activity.filename ||
           '[unknown]';
  };

  // Get file type for icon
  const getFileType = (activity) => {
    return activity.file?.fileType || 
           activity.fileType || 
           activity.mimeType ||
           '';
  };

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format date time helper
  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'Unknown';

    try {
      let date;
      
      // Handle Spring LocalDateTime array format: [year, month, day, hour, minute, second]
      if (Array.isArray(dateValue)) {
        const [year, month, day, hour = 0, minute = 0, second = 0, ...rest] = dateValue;
        date = new Date(year, month - 1, day, hour, minute, second);
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };


  // Filter files based on active tab
  const getDisplayFiles = () => {
    if (activeTab === 'deletions') {
      return deleteHistory;
    } else if (activeTab === 'folders') {
      return folderActivities;
    }
    return files;
  };

  const displayFiles = getDisplayFiles();

  // Pagination calculations
  const totalPages = Math.ceil(displayFiles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayFiles.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToPage = (pageNumber) => setCurrentPage(pageNumber);

  if (!isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (

      

    <div className="admin-dashboard">

      <div className="dashboard-header">
        <h1><BarChart3 size={24} style={{marginRight: '8px'}} /> Admin Dashboard</h1>
        <p>Manage all uploaded files across the system</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon"><Folder size={24} /></div>
          <div className="stat-info">
            <h3>{files.length}</h3>
            <p>Total Activities</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{new Set(files.map(f => f.userEmail).filter(email => email)).size}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><HardDrive size={24} /></div>
          <div className="stat-info">
            <h3>{formatBytes(uniqueFiles.reduce((total, f) => total + getFileSize(f), 0))}</h3>
            <p>Total File Sizes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Trash2 size={24} /></div>
          <div className="stat-info">
            <h3>{deleteHistory.length}</h3>
            <p>Files Deleted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Folder size={24} /></div>
          <div className="stat-info">
            <h3>{folderActivities.length}</h3>
            <p>Folder Activities</p>
          </div>
        </div>
      </div>

      <div className="files-table-container">
        <div className="table-header">
          <h2>
            {activeTab === 'deletions' ? <><Trash2 size={20} style={{marginRight: '8px'}} /> Delete History</> :
             activeTab === 'folders' ? <><Folder size={20} style={{marginRight: '8px'}} /> Folder Activities</> :
             'All Activities'} ({displayFiles.length})
          </h2>
          <button className="refresh-btn" onClick={loadFiles} disabled={loading}>
            <RefreshCw size={16} style={{marginRight: '4px'}} /> Refresh
          </button>
        </div>

        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <BarChart3 size={16} style={{marginRight: '4px'}} /> All Activities
          </button>
          <button 
            className={`tab-btn ${activeTab === 'deletions' ? 'active' : ''}`}
            onClick={() => handleTabChange('deletions')}
          >
            <Trash2 size={16} style={{marginRight: '4px'}} /> Delete History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'folders' ? 'active' : ''}`}
            onClick={() => handleTabChange('folders')}
          >
            <Folder size={16} style={{marginRight: '4px'}} /> Folder Activities
          </button>
        </div>

        {loading || loadError ? (
          <>
            <SkeletonTable rows={5} cols={activeTab === 'folders' ? 4 : 5} />
            {loadError && !loading && (
              <div className="empty-state">
                <h3>Unable to load activities.</h3>
                <p>There was a network/server error.</p>
                <button
                  className="retry-btn"
                  onClick={() => {
                    setLoadError(false);
                    loadFiles();
                    loadDeleteHistory();
                    loadFolderActivities();
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </>
        ) : displayFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'deletions' ? <Trash2 size={48} /> : 
               activeTab === 'folders' ? <Folder size={48} /> : 
               <Folder size={48} />}
            </div>
            <h3>
              {activeTab === 'deletions' ? 'No files deleted yet' :
               activeTab === 'folders' ? 'No folder activities yet' :
               'No files uploaded yet'}
            </h3>
            <p>
              {activeTab === 'deletions' ? 'Deleted files will appear here' :
               activeTab === 'folders' ? 'Folder activities will appear here' :
               'Files uploaded by users will appear here'}
            </p>
          </div>
        ) : (
          <div className="files-table-wrapper">
            <table className="files-table">
              <thead>
                <tr>
                  <th>{activeTab === 'folders' ? 'Folder' : 'File'}</th>
                  <th>{activeTab === 'deletions' ? 'Uploaded by' : 'User Name'}</th>
                  <th>Activity Type</th>
                  <th>Activity Time</th>
                  {activeTab !== 'folders' && <th>Size</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((activity) => {
                  const fileType = getFileType(activity);
                  const fileIcon = getFileIcon(fileType);
                  const fileSize = getFileSize(activity);
                  const fileName = getFileName(activity);

                  const actionTypeDisplay = activeTab === 'deletions' ? <><Trash2 size={14} style={{marginRight: '4px'}} /> Deleted</> :
                                            activeTab === 'folders' ? (activity.actionType === 'CREATE' ? <><Folder size={14} style={{marginRight: '4px'}} /> Created</> :
                                                                       activity.actionType === 'DELETE' ? <><Trash2 size={14} style={{marginRight: '4px'}} /> Deleted</> :
                                                                       activity.actionType === 'RENAME' ? <><Settings size={14} style={{marginRight: '4px'}} /> Renamed</> :
                                                                       activity.actionType) :
                                            activity.actionType === 'UPLOAD' ? <><Upload size={14} style={{marginRight: '4px'}} /> Upload</> : 
                                            activity.actionType === 'DOWNLOAD' ? <><Download size={14} style={{marginRight: '4px'}} /> Download</> :
                                            activity.actionType === 'DELETE' ? <><Trash2 size={14} style={{marginRight: '4px'}} /> Delete</> : 
                                            activity.actionType;
                  
                  const displayEmail = activity.userEmail || activity.email || activity.userName || 'Unknown';
                  const displayTime = formatDateTime(activity.actionTime || activity.deleteTime || activity.deletedAt || activity.createdAt);
                  
                  // For folder activities, show folder name instead of file name
                  const displayName = activeTab === 'folders' ? 
                    (activity.folderName || activity.name || activity.folder?.name || '[unknown folder]') : 
                    fileName;

                  return (
                    <tr key={activity.id}>
                      <td className="file-cell">
                        <div className="file-info">
                          <span className="file-icon">
                            {activeTab === 'folders' ? <Folder size={20} /> : fileIcon}
                          </span>
                          <span className="file-name" title={displayName}>{displayName}</span>
                        </div>
                      </td>
                      <td className="email-cell">
                        <span className="email-text" title={displayEmail}>{displayEmail}</span>
                      </td>
                      <td className="activity-cell">
                        <span className="activity-text" title={actionTypeDisplay}>{actionTypeDisplay}</span>
                      </td>
                      <td className="time-cell">
                        <span className="upload-time">{displayTime}</span>
                      </td>
                      {activeTab !== 'folders' && (
                        <td className="size-cell">
                          <span className="file-size">{formatBytes(fileSize)}</span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button onClick={goToPrevPage} disabled={currentPage === 1}>
              <ChevronLeft size={20} /> Prev
            </button>

            <div className="page-buttons">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={page === currentPage ? 'active' : ''}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button onClick={goToNextPage} disabled={currentPage === totalPages}>
              Next <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}

export default AdminDashboard;