import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import NewModal from '../SideBar/NewModal';
import ContextMenu from './ContextMenu';
import { SkeletonGrid } from '../Skeleton/SkeletonLoader';
import '../../styles/MyFiles.css';
import '../../styles/ContextMenu.css';
import { File, Image, Video, Music, FileText, Settings, Folder, ChevronLeft, ChevronRight } from 'lucide-react';

function MyFiles() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const uuidParam = queryParams.get('uuid');
  const idParam = queryParams.get('id');
  const folderId = uuidParam || idParam || queryParams.get('folderId') || queryParams.get('parentId') || queryParams.get('folder');
  const folderName = queryParams.get('folderName');
  const searchQuery = queryParams.get('search');

  const [files, setFiles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // adjust this to your preferred number
  const [renamingItem, setRenamingItem] = useState(null);
  const [ownedFileIds, setOwnedFileIds] = useState(new Set());
  const [newName, setNewName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: []
  });

  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole && (
    userRole.includes('ADMIN') ||
    userRole === 'ROLE_ADMIN' ||
    userRole === 'admin' ||
    userRole.toUpperCase().includes('ADMIN')
  );

  const getCurrentUserInfo = () => {
    let user = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        user = JSON.parse(raw);
      }
    } catch {
      // ignore parse errors
    }

    const token = localStorage.getItem('token');
    let jwtPayload = null;
    try {
      if (token) {
        jwtPayload = JSON.parse(atob(token.split('.')[1]));
      }
    } catch {
      // ignore invalid JWT
    }

    const id = user?.id || user?._id || user?.userId || jwtPayload?.sub || jwtPayload?.id || jwtPayload?.userId;
    const email = (user?.email || jwtPayload?.email || jwtPayload?.sub || '').toString().toLowerCase();
    const name = (user?.name || user?.username || jwtPayload?.name || jwtPayload?.username || '').toString().toLowerCase();

    return { id: id ? String(id) : null, email: email || null, name: name || null };
  };

  const isOwnedByCurrentUser = (item) => {
    if (!item) return false;

    // For folders: check the userName property
    if (item.folderName) {
      let userObj = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw) userObj = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      const { email: currentEmail, name: currentName } = getCurrentUserInfo();
      const folderOwner = String(item.userName || '').toLowerCase().trim();
      if (!folderOwner) return false;

      const getEmailLocalPart = (emailStr) => {
        if (!emailStr || !emailStr.includes('@')) return null;
        return emailStr.split('@')[0];
      };

      const userCandidates = [
        currentEmail,
        getEmailLocalPart(currentEmail),
        currentName,
        getEmailLocalPart(currentName),
        userObj?.name,
        getEmailLocalPart(userObj?.name),
        userObj?.username,
        getEmailLocalPart(userObj?.username),
        userObj?.userName,
        getEmailLocalPart(userObj?.userName),
        userObj?.email,
        getEmailLocalPart(userObj?.email),
        userObj?.id,
        userObj?.userId,
        userObj?.uuid,
      ].map(v => String(v || '').toLowerCase().trim()).filter(Boolean);

      return userCandidates.some(c => 
        c === folderOwner || 
        c.replace(/[^a-z0-9]/g, '') === folderOwner.replace(/[^a-z0-9]/g, '')
      );
    }

    // For files: check if the file ID is in the ownedFileIds set
    const fileId = getApiId(item);
    return ownedFileIds.has(String(fileId));
  };

  // Load user's files (or folder contents) on mount & when folder changes
  useEffect(() => {
    loadMyFiles();
    fetchOwnedFileIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, searchQuery]);

  // Reset selection when pagination, folder context, or search query changes
  useEffect(() => {
    setSelectedItem(null);
  }, [folderId, searchQuery, currentPage]);

  // Auto-focus window on mount and selection to ensure shortcut keys work immediately
  useEffect(() => {
    window.focus();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      window.focus();
    }
  }, [selectedItem]);

  // Global keydown listener for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if focus is inside an input, textarea or contenteditable element
      const targetTag = e.target.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const currentDisplayedFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

      if (!selectedItem) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && currentDisplayedFiles.length > 0) {
          e.preventDefault();
          setSelectedItem(currentDisplayedFiles[0]);
        }
        return;
      }

      const apiId = getApiId(selectedItem);
      const fileId = getFileId(selectedItem);

      if (e.key === 'F2') {
        e.preventDefault();
        openRenameModal(selectedItem);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        deleteFile(apiId);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        downloadFile(apiId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selectedIndex = currentDisplayedFiles.findIndex(i => getFileId(i) === fileId || getApiId(i) === apiId);

        if (selectedIndex === -1) {
          if (currentDisplayedFiles.length > 0) {
            setSelectedItem(currentDisplayedFiles[0]);
          }
          return;
        }

        let newIndex = selectedIndex;
        if (e.key === 'ArrowRight') {
          newIndex = Math.min(currentDisplayedFiles.length - 1, selectedIndex + 1);
        } else if (e.key === 'ArrowLeft') {
          newIndex = Math.max(0, selectedIndex - 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const grid = document.querySelector('.files-grid');
          let cols = 1;
          if (grid) {
            cols = window.getComputedStyle(grid).getPropertyValue("grid-template-columns").split(" ").length;
          } else {
            cols = window.innerWidth >= 1200 ? 5 : window.innerWidth >= 992 ? 4 : window.innerWidth >= 768 ? 3 : 2;
          }
          if (e.key === 'ArrowUp') {
            newIndex = Math.max(0, selectedIndex - cols);
          } else {
            newIndex = Math.min(currentDisplayedFiles.length - 1, selectedIndex + cols);
          }
        }

        if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < currentDisplayedFiles.length) {
          setSelectedItem(currentDisplayedFiles[newIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, files, currentPage]);

  const loadMyFiles = async () => {
    try {
      setLoadError(false);
      setIsLoading(true);
      const token = localStorage.getItem("token");

      // If search query is present, search files instead
      let res;
      if (searchQuery) {
        res = await api.get(`/files/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } else if (folderId) {
        try {
          res = await api.get(`/files?folderId=${encodeURIComponent(folderId)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch (e) {
          // Fallback to path-based endpoint if query param is not supported
          if (e.response?.status === 404 || e.response?.status === 400) {
            res = await api.get(`/files/folder/${encodeURIComponent(folderId)}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
          } else {
            throw e;
          }
        }
      } else {
        res = await api.get(`/files/my`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      let fileArray = [];
      if (Array.isArray(res.data)) {
        fileArray = res.data;
      } else if (res.data && Array.isArray(res.data.files)) {
        fileArray = res.data.files;
      } else if (res.data && Array.isArray(res.data.data)) {
        fileArray = res.data.data;
      } else if (res.data && Array.isArray(res.data.content)) {
        fileArray = res.data.content;
      }

      // Keep all owned files for the MyFiles page, including files stored in folders.
      // This ensures logged-in users see their uploads even when they are inside folders.
      setFiles(fileArray);
      setCurrentPage(1); // reset to first page after every fetch
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
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

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Get file size from different property names
  const getFileSize = (f) => {
    if (!f) return 0;
    const candidate =
      f.totalSize ??
      f.totalsize ??
      f.size ??
      f.length ??
      f.fileSize ??
      f.byteSize ??
      f.bytes ??
      f.file_size ??
      f.sizeInBytes ??
      (f.stats && f.stats.size) ??
      0;

    const num = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
    return Number.isNaN(num) ? 0 : num;
  };

  // Get unique identifier (uuid, id, _id, or key) - for URLs/navigation
 
  const getFileId = (f) => {
    if (!f) return null;
    let id = f.uuid || f.id || f._id || f.key;
    if (!id) return null;
    // If the ID has a composite format like "uuid:1", extract only the UUID part
    if (typeof id === 'string' && id.includes(':')) {
      id = id.split(':')[0];
    }
    return id || null;
  };

  // Get API identifier (id field) - for backend operations
  const getApiId = (f) => {
    if (!f) return null;
    let id = f.id || f._id || f.key;
    // For files, fall back to uuid if id is not available
    if (!id && (f.fileName || f.fileType || f.size)) {
      id = f.uuid;
    }
    if (!id) return null;
    // If the ID has a composite format like "uuid:1", extract only the UUID part
    if (typeof id === 'string' && id.includes(':')) {
      id = id.split(':')[0];
    }
    return id || null;
  };

  const fetchOwnedFileIds = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get('/files/my', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let fileArray = [];
      if (Array.isArray(res.data)) {
        fileArray = res.data;
      } else if (res.data && Array.isArray(res.data.files)) {
        fileArray = res.data.files;
      } else if (res.data && Array.isArray(res.data.data)) {
        fileArray = res.data.data;
      } else if (res.data && Array.isArray(res.data.content)) {
        fileArray = res.data.content;
      }
      const ids = new Set(fileArray.map(f => String(getApiId(f))));
      setOwnedFileIds(ids);
    } catch (err) {
      console.error("Failed to fetch owned file IDs", err);
    }
  };

  // Get file name
  const getFileName = (f) => {
    if (!f) return '';
    return f.fileName ||
           f.name ||
           f.filename ||
           f.originalname ||
           f.key ||
           f.uuid ||
           f.id ||
           f._id ||
           '[unknown]';
  };

  const findFileByAnyId = (id) => {
    if (!id && id !== 0) return null;
    const normalizedId = String(id);
    return files.find((file) => {
      const fileId = getFileId(file);
      const apiId = getApiId(file);
      return String(fileId) === normalizedId || String(apiId) === normalizedId;
    }) || null;
  };

  // Delete file
  const deleteFile = async (fileId) => {
    if (!fileId) {
      toast.error("Invalid file ID");
      return;
    }
    const file = findFileByAnyId(fileId);
    if (!isAdmin && !isOwnedByCurrentUser(file)) {
      toast.error("Access denied. You can only delete your own files.");
      return;
    }
    const deleteId = file ? getApiId(file) : fileId;

    if (!deleteId) {
      toast.error("Unable to determine file ID for delete");
      return;
    }

    const fileName = file ? getFileName(file) : 'Unknown File';
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setIsDeleting(true);
    setDeletingFileName(fileName);

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/delete/${deleteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Keep loader visible for 1 second for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadMyFiles();
      toast.success("File deleted successfully");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Failed to delete file";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Failed to delete file");
    } finally {
      setIsDeleting(false);
      setDeletingFileName('');
    }
  };

  // Download file
  const downloadFile = async (fileId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("You must be logged in to download files");
      return;
    }

    if (!fileId) {
      toast.error("Invalid file ID");
      return;
    }

    const fileObj = findFileByAnyId(fileId);
    const downloadId = fileObj ? getApiId(fileObj) || getFileId(fileObj) : fileId;

    if (!downloadId) {
      toast.error("Unable to determine file ID for download");
      return;
    }

    const fileName = getFileName(fileObj) || 'file';
    
    setIsDownloading(true);
    setDownloadingFileName(fileName);

    try {
      const response = await api.get(
        `/download/${downloadId}`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let filename = fileName;
      const disposition = response.headers['content-disposition'];
      if (disposition) {
        const match = /filename\*?=([^;]+)/i.exec(disposition);
        if (match) {
          filename = match[1].trim();
          filename = filename.replace(/UTF-8''/, '').replace(/"/g, '');
        }
      }

      // Keep loader visible for 1 second for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
      setDownloadingFileName('');
    }
  };

  // Rename file
  const renameFile = async (fileId, newBaseName) => {
    const trimmedBase = newBaseName.trim();
    if (!trimmedBase) {
      toast.error("Name cannot be empty");
      return;
    }
    const specialChars = /[\\/:*?"<>|]/;
    if (specialChars.test(trimmedBase)) {
      toast.error("Name cannot contain special characters (\\ / : * ? \" < > |)");
      return;
    }

    const file = findFileByAnyId(fileId);
    if (!isAdmin && !isOwnedByCurrentUser(file)) {
      toast.error("Access denied. You can only rename your own files.");
      return;
    }

    const originalName = getFileName(file) || '';
    const dotIndex = originalName.lastIndexOf('.');
    const ext = dotIndex <= 0 ? '' : originalName.slice(dotIndex);
    const finalName = trimmedBase + ext;

    if (finalName.length > 50) {
      toast.error("Name cannot exceed 50 characters");
      return;
    }

    setIsDeleting(true);
    setDeletingFileName(finalName);

    try {
      const token = localStorage.getItem("token");
      const apiId = file ? getApiId(file) : fileId;
      await api.put(
        `/files/rename/${apiId}`,
        {},
        {
          params: { fileName: finalName },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      await loadMyFiles();
      toast.success("File renamed successfully");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Rename own file only allowed";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Rename own file only allowed");
    } finally {
      setIsDeleting(false);
      setDeletingFileName('');
      setRenamingItem(null);
      setNewName('');
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, items: [] });
  };

  const openRenameModal = (item) => {
    setRenamingItem(item);
    const fileName = getFileName(item) || '';
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0) {
      setNewName(fileName);
    } else {
      setNewName(fileName.slice(0, dotIndex));
    }
  };

  const getContextMenuItems = (item) => {
    // MyFiles only shows files uploaded by the logged-in user, so allow modifications.
    const canModify = true;
    return [
      {
        label: 'Download',
        icon: 'download',
        onClick: () => downloadFile(getApiId(item)),
        shortcut: 'Ctrl+D'
      },
      {
        label: 'Rename',
        icon: 'edit',
        onClick: () => openRenameModal(item),
        disabled: !canModify,
        shortcut: 'F2'
      },
      {
        label: 'Delete',
        icon: 'trash',
        onClick: () => deleteFile(getApiId(item)),
        danger: true,
        disabled: !canModify,
        shortcut: 'Del'
      }
    ];
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      items: getContextMenuItems(item)
    });
  };

  const totalPages = Math.max(1, Math.ceil(files.length / itemsPerPage));
  const displayedFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goToPage = (page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)));

  return (
    <div className="myfiles">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Delete Loading Modal */}
      {isDeleting && !renamingItem && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }}></div>
            <h3 className="deleting-title">Deleting...</h3>
            <p className="deleting-filename">{deletingFileName}</p>
          </div>
        </div>
      )}

      {/* Download Loading Modal */}
      {isDownloading && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem auto' }}></div>
            <h3 className="downloading-title">Downloading...</h3>
            <p className="downloading-filename">{downloadingFileName}</p>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingItem && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <h3>Rename File</h3>
            <div className="rename-input-container">
              <input
                className="rename-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    renameFile(getApiId(renamingItem), newName);
                  } else if (e.key === 'Escape') {
                    setRenamingItem(null);
                    setNewName('');
                  }
                }}
              />
              {(() => {
                const fileName = getFileName(renamingItem) || '';
                const dotIndex = fileName.lastIndexOf('.');
                const ext = dotIndex <= 0 ? '' : fileName.slice(dotIndex);
                return ext ? <span className="rename-ext-badge">{ext}</span> : null;
              })()}
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setRenamingItem(null);
                  setNewName('');
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => renameFile(getApiId(renamingItem), newName)}
                disabled={!newName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="myfiles-header">
        <div>
          <h1><Folder size={24} style={{marginRight: '8px'}} /> {folderId ? `Folder: ${folderName || folderId}` : 'My Files'}</h1>
          <p className="subtitle">
            {folderId
              ? 'Viewing contents of this folder'
              : 'View and manage your uploaded files'}
          </p>
        </div>

        {folderId && (
          <button
            className="new-action-btn"
            onClick={() => setUploadModalOpen(true)}
          >
            ➕ Upload to Folder
          </button>
        )}
      </div>

      {/* Loading / Error State */}
      {(isLoading || loadError) && (
        <>
          <SkeletonGrid count={12} />
          {loadError && !isLoading && (
            <div className="empty-state">
              <h3>Unable to load files.</h3>
              <p>There was a network or server error.</p>
              <button
                className="retry-btn"
                onClick={() => {
                  setLoadError(false);
                  loadMyFiles();
                }}
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !loadError && files.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Folder size={48} /></div>
          <h2>No Files Yet</h2>
          <p>You haven't uploaded any files. Start by uploading your first file!</p>
        </div>
      )}

      {/* Upload Modal (folder context) */}
      <NewModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        uploadFolderId={folderId}
        onFolderCreated={() => {
          loadMyFiles();
        }}
      />

      {/* Files List */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        menuItems={contextMenu.items}
        onClose={closeContextMenu}
      />

      {!isLoading && files.length > 0 && (
        <div className="myfiles-container" onClick={() => setSelectedItem(null)}>
          <div className="files-info">
            <p className="total-files">Total Files: <strong>{files.length}</strong></p>
          </div>

          <div className="files-grid">
            {displayedFiles.map((file) => {
              const fileId = getFileId(file);
              const fileName = getFileName(file);
              const fileSize = getFileSize(file);
              const fileIcon = getFileIcon(file.fileType);
              
              return (
                  <div
                    key={fileId}
                    className={`file-card ${selectedItem && getFileId(selectedItem) === fileId ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(file);
                    }}
                    onContextMenu={(e) => {
                      setSelectedItem(file);
                      handleContextMenu(e, file);
                    }}
                  >
                  <div className="file-icon">{fileIcon}</div>
                  
                  <div className="file-info">
                    <h3 className="file-name" title={fileName}>
                      {fileName}
                    </h3>
                    <p className="file-size">{formatBytes(fileSize)}</p>
                  </div>

                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button onClick={goToPrevPage} disabled={currentPage === 1}>
                <ChevronLeft />Prev
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
                Next <ChevronRight />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyFiles;
