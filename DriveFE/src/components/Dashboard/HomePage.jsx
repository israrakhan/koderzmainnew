import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/HomePage.css';
import '../../styles/ContextMenu.css';
import ContextMenu from './ContextMenu';
import NewModal from '../SideBar/NewModal';
import { SkeletonGrid } from '../Skeleton/SkeletonLoader';
import { Folder, File, Image, Video, Music, FileText, Settings, ChevronLeft, ChevronRight, Plus} from 'lucide-react';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: []
  });
  const [renamingItem, setRenamingItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [ownedFileIds, setOwnedFileIds] = useState(new Set());


  // For session-based auth, assume not admin
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole && (
    userRole.includes('ADMIN') ||
    userRole === 'ROLE_ADMIN' ||
    userRole === 'admin' ||
    userRole.toUpperCase().includes('ADMIN')
  );

  // For session-based auth, no user data stored locally
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

      const isMatch = userCandidates.some(c => 
        c === folderOwner || 
        c.replace(/[^a-z0-9]/g, '') === folderOwner.replace(/[^a-z0-9]/g, '')
      );

      return isMatch;
    }

    // For files: check if the file ID is in the ownedFileIds set
    const fileId = getApiId(item);
    return ownedFileIds.has(String(fileId));
  };

  const findFileByAnyId = (id) => {
    if (!id && id !== 0) return null;
    const normalizedId = String(id);
    return files.find((file) => {
      const fId = getFileId(file);
      const aId = getApiId(file);
      return String(fId) === normalizedId || String(aId) === normalizedId;
    }) || null;
  };

  const getCurrentFolderId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('uuid') || params.get('folderId') || params.get('parentId') || params.get('folder') || null;
  };

  // Load files and folders on mount and whenever folder context changes
  useEffect(() => {
    loadFiles();
    loadFolders();
    fetchOwnedFileIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Check URL params to open modal if needed
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('modal') === 'new') {
      setNewModalOpen(true);
    }
  }, [location.search]);

  // Reset selection when pagination, folder, or filters change
  useEffect(() => {
    setSelectedItem(null);
  }, [location.search, filter, currentPage]);

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

      const currentFilteredFolders = getFilteredFolders();
      const currentFilteredFiles = getFilteredFiles();
      const currentAllItems = [...currentFilteredFolders, ...currentFilteredFiles];
      const currentStartIndex = (currentPage - 1) * itemsPerPage;
      const currentPaginatedItems = currentAllItems.slice(currentStartIndex, currentStartIndex + itemsPerPage);

      if (!selectedItem) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && currentPaginatedItems.length > 0) {
          e.preventDefault();
          const firstItem = currentPaginatedItems[0];
          const isFolder = currentFilteredFolders.includes(firstItem);
          setSelectedItem({ item: firstItem, type: isFolder ? 'folder' : 'file' });
        }
        return;
      }

      const { item, type } = selectedItem;
      const apiId = getApiId(item);
      const fileId = getFileId(item);

      if (e.key === 'F2') {
        e.preventDefault();
        openRenameModal(item, type);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (type === 'folder') {
          deleteFolder(apiId);
        } else {
          deleteFile(apiId);
        }
      } else if (e.key === 'Enter') {
        if (type === 'folder') {
          e.preventDefault();
          navigateToFolder(fileId, getFolderName(item));
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        if (type === 'file') {
          e.preventDefault();
          downloadFile(apiId);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const selectedIndex = currentPaginatedItems.findIndex(i => {
          const isFolder = currentFilteredFolders.includes(i);
          const selectedIsFolder = type === 'folder';
          if (isFolder !== selectedIsFolder) return false;
          return getFileId(i) === fileId || getApiId(i) === apiId;
        });

        if (selectedIndex === -1) {
          if (currentPaginatedItems.length > 0) {
            const firstItem = currentPaginatedItems[0];
            const isFolder = currentFilteredFolders.includes(firstItem);
            setSelectedItem({ item: firstItem, type: isFolder ? 'folder' : 'file' });
          }
          return;
        }

        let newIndex = selectedIndex;
        if (e.key === 'ArrowRight') {
          newIndex = Math.min(currentPaginatedItems.length - 1, selectedIndex + 1);
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
            newIndex = Math.min(currentPaginatedItems.length - 1, selectedIndex + cols);
          }
        }

        if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < currentPaginatedItems.length) {
          const newItem = currentPaginatedItems[newIndex];
          const isFolder = currentFilteredFolders.includes(newItem);
          setSelectedItem({ item: newItem, type: isFolder ? 'folder' : 'file' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, folders, files, currentPage, filter]);

  const loadFiles = async () => {
    try {
      setLoadError(false);
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams(location.search);
      const searchQuery = queryParams.get('search');
      const folderId = getCurrentFolderId();

      const getResponseArray = (res) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.files)) return res.data.files;
        if (Array.isArray(res.data.data)) return res.data.data;
        if (Array.isArray(res.data.content)) return res.data.content;
        return [];
      };

      let fileArray = [];
      if (searchQuery) {
        const res = await api.get(`/files/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        fileArray = getResponseArray(res);
      } else {
        const tryEndpoints = [];
        if (folderId) {
          tryEndpoints.push(
            `/files?folderId=${encodeURIComponent(folderId)}`,
            `/files/folder/${encodeURIComponent(folderId)}`
          );
        } else {
          tryEndpoints.push('/files', '/files/my');
        }

        for (const endpoint of tryEndpoints) {
          try {
            const res = await api.get(endpoint, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = getResponseArray(res);
            if (data && data.length > 0) {
              fileArray = data;
              break;
            }
          } catch {
            // ignore
          }
        }

        // Filter out files that belong to folders when showing root-level files
        if (!folderId) {
          fileArray = fileArray.filter(file => {
            const hasFolderId = file.folderId || file.parentFolder || file.parentFolderId || file.folder;
            return !hasFolderId;
          });
        }
      }

      setFiles(fileArray);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      setLoadError(false);
      const token = localStorage.getItem("token");

      const res = await api.get('/folder/tree', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let folderArray = [];
      if (Array.isArray(res.data)) {
        folderArray = res.data;
      } else if (res.data && Array.isArray(res.data.folders)) {
        folderArray = res.data.folders;
      }
      setFolders(folderArray);
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
      f.totalSize;
     

    const num = typeof candidate === 'string' ? parseInt(candidate, 10) : candidate;
    return Number.isNaN(num) ? 0 : num;
  };

  
  const getFileId = (f) => {
    if (!f) return null;
    let id = f.uuid || f.id || f._id || f.key;
    if (!id) return null;
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

  // Find a folder anywhere in the nested tree
  const findFolderInTree = (nodes, uuid) => {
    if (!nodes || !uuid) return null;
    const normalizedId = String(uuid);
    for (const node of nodes) {
      if (String(getFileId(node)) === normalizedId || String(getApiId(node)) === normalizedId) {
        return node;
      }
      if (node.subFolders && Array.isArray(node.subFolders)) {
        const found = findFolderInTree(node.subFolders, uuid);
        if (found) return found;
      }
    }
    return null;
  };

  // Recursively check if a folder or any of its subfolders contains a file matching the type filter
  const folderContainsType = (folder, type) => {
    if (!folder) return false;
    if (folder.files && Array.isArray(folder.files)) {
      const match = folder.files.some(file => {
        const fileType = (file.fileType || '').toLowerCase();
        if (type === 'images') return fileType.includes('image');
        if (type === 'video') return fileType.includes('video');
        if (type === 'audio') return fileType.includes('audio');
        if (type === 'documents') {
          return fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document') ||
                 fileType.includes('sheet') || fileType.includes('spreadsheet') || fileType.includes('text');
        }
        return false;
      });
      if (match) return true;
    }
    if (folder.subFolders && Array.isArray(folder.subFolders)) {
      return folder.subFolders.some(sub => folderContainsType(sub, type));
    }
    return false;
  };

  // Get the subfolders of the folder currently opened
  const getCurrentFolders = () => {
    const folderId = getCurrentFolderId();
    if (!folderId) return folders;
    const currentFolderNode = findFolderInTree(folders, folderId);
    return currentFolderNode ? (currentFolderNode.subFolders || []) : [];
  };

  // Filter the current subfolders based on the active tab type
  const getFilteredFolders = () => {
    const currentFolders = getCurrentFolders();
    if (filter === 'all') return currentFolders;
    return currentFolders.filter(folder => folderContainsType(folder, filter));
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
    return f.fileName ;
  };

  // Get folder name
  const getFolderName = (f) => {
    if (!f) return '';
    return f.folderName;
         
  };

  // Navigate into folder view
  const navigateToFolder = (folderId, folderName) => {
    const folder = findFolderInTree(folders, folderId);
    const apiId = folder ? getApiId(folder) : null;
    const url = `/home?uuid=${encodeURIComponent(folderId)}${apiId ? `&id=${encodeURIComponent(apiId)}` : ''}&folderName=${encodeURIComponent(folderName || '')}`;
    navigate(url);
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    if (!folderId) {
      toast.error("Invalid folder ID");
      return;
    }
    const folder = findFolderInTree(folders, folderId);
    if (!isAdmin && !isOwnedByCurrentUser(folder)) {
      toast.error("Access denied. You can only delete your own folders.");
      return;
    }
    const folderName = folder ? getFolderName(folder) : 'Unknown Folder';
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete the folder "${folderName}" and all its contents?`)) {
      return;
    }

    setIsDeleting(true);
    setDeletingFileName(folderName);

    try {
      const token = localStorage.getItem("token");
      const deleteId = folder ? getApiId(folder) : folderId;
      await api.delete(`/folder/delete/${deleteId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      // Keep loader visible for 1 second for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadFolders();
      toast.success("Folder deleted successfully");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Failed to delete folder";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Failed to delete folder");
    } finally {
      setIsDeleting(false);
      setDeletingFileName('');
    }
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
      
      await loadFiles();
      toast.success("File deleted successfully");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "Failed to delete file";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Failed to delete file");
    } finally {
      setIsDeleting(false);
      setDeletingFileName('');
    }
  };

  
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
        filename = match[1].trim()
          .replace(/UTF-8''/, '')
          .replace(/"/g, '');
      }
    }

    // Better UX delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // FIXED HERE
    const url = window.URL.createObjectURL(response.data);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();

    link.remove();

    // cleanup
    window.URL.revokeObjectURL(url);

  } catch {
    // ignore
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

      await loadFiles();
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

  // Rename folder
  const renameFolder = async (folderId, newName) => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (newName.trim().length > 50) {
      toast.error("Name cannot exceed 50 characters");
      return;
    }
    const specialChars = /[\\/:*?"<>|]/;
    if (specialChars.test(newName)) {
      toast.error("Name cannot contain special characters (\\ / : * ? \" < > |)");
      return;
    }

    const folder = findFolderInTree(folders, folderId);
    if (!isAdmin && !isOwnedByCurrentUser(folder)) {
      toast.error("Access denied. You can only rename your own folders.");
      return;
    }

    setIsDeleting(true);
    setDeletingFileName(newName);

    try {
      const token = localStorage.getItem("token");
      const apiId = folder ? getApiId(folder) : folderId;
      await api.put(
        `/folder/${apiId}/rename`,
        { name: newName.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      await loadFolders();
      toast.success("Folder renamed successfully");
    } catch {
      toast.error("Failed to rename folder");
    } finally {
      setIsDeleting(false);
      setDeletingFileName('');
      setRenamingItem(null);
      setNewName('');
    }
  };

  // Context menu helpers
  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, items: [] });
  };

  const openRenameModal = (item, type) => {
    setRenamingItem({ ...item, type });
    if (type === 'file') {
      const fileName = getFileName(item) || '';
      const dotIndex = fileName.lastIndexOf('.');
      if (dotIndex <= 0) {
        setNewName(fileName);
      } else {
        setNewName(fileName.slice(0, dotIndex));
      }
    } else {
      setNewName(getFolderName(item) || '');
    }
  };

  const getContextMenuItems = (item, type) => {
    const baseItems = [];
    const canModify = isAdmin || isOwnedByCurrentUser(item);

    if (type === 'folder') {
      baseItems.push(
        {
          label: 'Open',
          icon: 'folder',
          onClick: () => navigateToFolder(getFileId(item), getFolderName(item)),
          shortcut: 'Enter'
        },
        {
          label: 'Rename',
          icon: 'edit',
          onClick: () => openRenameModal(item, 'folder'),
          disabled: !canModify,
          shortcut: 'F2'
        },
        {
          label: 'Delete',
          icon: 'trash',
          onClick: () => deleteFolder(getApiId(item)),
          danger: true,
          disabled: !canModify,
          shortcut: 'Del'
        }
      );
    }

    if (type === 'file') {
      baseItems.push(
        {
          label: 'Download',
          icon: 'download',
          onClick: () => downloadFile(getApiId(item)),
          shortcut: 'Ctrl+D'
        },
        {
          label: 'Rename',
          icon: 'edit',
          onClick: () => openRenameModal(item, 'file'),
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
      );
    }

    return baseItems;
  };

  const handleContextMenu = (event, item, type) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      items: getContextMenuItems(item, type)
    });
  };

  // Filter files and folders
  const getFilteredFiles = () => {
    // Show all files (including files inside folders) on HomePage
    const allFiles = files;
    if (filter === 'all') return allFiles;
    if (filter === 'images') return allFiles.filter(f => f.fileType && f.fileType.includes('image'));
    if (filter === 'video') return allFiles.filter(f => f.fileType && f.fileType.includes('video'));
    if (filter === 'audio') return allFiles.filter(f => f.fileType && f.fileType.includes('audio'));
    if (filter === 'documents') return allFiles.filter(f => {
      const type = f.fileType || '';
      return type.includes('pdf') || type.includes('word') || type.includes('document') ||
             type.includes('sheet') || type.includes('spreadsheet') || type.includes('text');
    });
    return allFiles;
  };

  const filteredFolders = getFilteredFolders();
  const filteredFiles = getFilteredFiles();
  const totalItems = filteredFiles.length + filteredFolders.length;

  // Pagination logic
  const allItems = [...filteredFolders, ...filteredFiles];
  const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = allItems.slice(startIndex, endIndex);
  const paginatedFolders = paginatedItems.filter(item => filteredFolders.includes(item));
  const paginatedFiles = paginatedItems.filter(item => filteredFiles.includes(item));

  const goToPrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goToPage = (page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)));


  return (
    <div className="homepage">
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
            <h3>Rename {renamingItem.type === 'folder' ? 'Folder' : 'File'}</h3>
            {renamingItem.type === 'folder' ? (
              <input
                className="rename-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                autoFocus
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    renameFolder(getApiId(renamingItem), newName);
                  } else if (e.key === 'Escape') {
                    setRenamingItem(null);
                    setNewName('');
                  }
                }}
              />
            ) : (
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
            )}
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
                onClick={() => {
                  if (renamingItem.type === 'folder') {
                    renameFolder(getApiId(renamingItem), newName);
                  } else {
                    renameFile(getApiId(renamingItem), newName);
                  }
                }}
                disabled={!newName.trim()}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="homepage-content" style={{ marginTop: '10px', marginLeft: '45px' }} onClick={() => setSelectedItem(null)}>
       

        {/* Header */}
        <div className="page-header">
          <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              {getCurrentFolderId() && (
                <button
                  className="cancel-btn"
                  onClick={() => {
                    const currentId = getCurrentFolderId();
                    const currentFolder = findFolderInTree(folders, currentId);
                    const parentFolderId = currentFolder?.parentId || currentFolder?.parentFolderId;
                    if (parentFolderId) {
                      const parentFolder = findFolderInTree(folders, parentFolderId);
                      navigateToFolder(parentFolderId, parentFolder?.folderName || '');
                    } else {
                      navigate('/home');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <Folder size={24} style={{marginRight: '8px'}} />
                {getCurrentFolderId() ? `Folder: ${new URLSearchParams(location.search).get('folderName') || 'Folder'}` : 'All Files'}
              </h1>
            </div>

            {getCurrentFolderId() && (
              <button
                className="cancel-btn"
                onClick={() => {
                  setNewModalOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
              >
                <Plus size={16} /> Upload to Folder
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="filter-section">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilter('all');
              setCurrentPage(1);
            }}
          >
            All Files
          </button>
          <button
            className={`filter-btn ${filter === 'images' ? 'active' : ''}`}
            onClick={() => {
              setFilter('images');
              setCurrentPage(1);
            }}
          >
            <Image size={16} style={{marginRight: '4px'}} /> Images
          </button>
          <button
            className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
            onClick={() => {
              setFilter('video');
              setCurrentPage(1);
            }}
          >
            <Video size={16} style={{marginRight: '4px'}} /> Videos
          </button>
          <button
            className={`filter-btn ${filter === 'audio' ? 'active' : ''}`}
            onClick={() => {
              setFilter('audio');
              setCurrentPage(1);
            }}
          >
            <Music size={16} style={{marginRight: '4px'}} /> Audio
          </button>
          <button
            className={`filter-btn ${filter === 'documents' ? 'active' : ''}`}
            onClick={() => {
              setFilter('documents');
              setCurrentPage(1);
            }}
          >
            <FileText size={16} style={{marginRight: '4px'}} /> Documents
          </button>
        </div>

        {/* Files Gallery */}
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          menuItems={contextMenu.items}
          onClose={closeContextMenu}
        />

        <div className="files-section">          <h2 className="section-title">Your Files & Folders ({totalItems})</h2>

          {(isLoading || loadError) ? (
            <>
              <SkeletonGrid count={12} />
              {loadError && !isLoading && (
                <div className="empty-state">
                  <h3>Unable to load files right now.</h3>
                  <p>Server error occurred while fetching files.</p>
                  <button
                    className="retry-btn"
                    onClick={() => {
                      setLoadError(false);
                      setIsLoading(true);
                      loadFiles();
                      loadFolders();
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </>
          ) : totalItems === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Folder size={48} /></div>
              <h3>No files or folders yet</h3>
              <p>Upload files or create folders to get started</p>
            </div>
          ) : (
            <>
              <div className="files-grid">
                {/* Render Folders First */}
                {paginatedFolders.map((folder) => {
                  const folderName = getFolderName(folder);
                  const folderId = getFileId(folder);

                  return (
                    <div
                      key={`folder-${folderId}`}
                      className={`file-card folder-card ${selectedItem && selectedItem.type === 'folder' && getFileId(selectedItem.item) === folderId ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({ item: folder, type: 'folder' });
                      }}
                      onContextMenu={(e) => {
                        setSelectedItem({ item: folder, type: 'folder' });
                        handleContextMenu(e, folder, 'folder');
                      }}
                      onDoubleClick={() => navigateToFolder(folderId, folderName)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="file-card-header">
                        <div className="file-icon-large"><Folder size={32} /></div>

                      </div>
                      <div className="file-card-body">
                        <h3 className="file-name" title={folderName}>{folderName}</h3>
                        <p className="file-size">Folder</p>
                      </div>

                    </div>
                  );
                })}

                {/* Render Files */}
                {paginatedFiles.map((file) => {
                  const fileIcon = getFileIcon(file.fileType);
                  const fileSize = getFileSize(file);
                  const fileName = getFileName(file);
                  const fileId = getFileId(file);

                  return (
                    <div
                      key={`file-${fileId}`}
                      className={`file-card ${selectedItem && selectedItem.type === 'file' && getFileId(selectedItem.item) === fileId ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem({ item: file, type: 'file' });
                      }}
                      onContextMenu={(e) => {
                        setSelectedItem({ item: file, type: 'file' });
                        handleContextMenu(e, file, 'file');
                      }}
                    >
                      <div className="file-card-header">
                        <div className="file-icon-large">{fileIcon}</div>

                      </div>
                      <div className="file-card-body">
                        <h3 className="file-name" title={fileName}>{fileName}</h3>
                        <p className="file-size">{formatBytes(fileSize)}</p>
                      </div>

                    </div>
                  );
                })}
              </div>

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
            </>
          )}
        </div>
      </div>

      <NewModal
        isOpen={newModalOpen}
        onClose={() => {
          setNewModalOpen(false);
          const params = new URLSearchParams(location.search);
          params.delete('modal');
          const searchStr = params.toString();
          navigate(searchStr ? `/home?${searchStr}` : '/home');
        }}
        uploadFolderId={getCurrentFolderId() || undefined}
        existingFolders={getCurrentFolders()}
        onFolderCreated={() => {
          loadFiles();
          loadFolders();
        }}
      />

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}

export default HomePage;
