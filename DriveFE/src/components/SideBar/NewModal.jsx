import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import '../../styles/NewModal.css';
import { Folder, File, Upload } from 'lucide-react';

function NewModal({ isOpen, onClose, onFolderCreated, uploadFolderId, initialTab, existingFolders }) {
  const [activeTab, setActiveTab] = useState(initialTab || (uploadFolderId ? 'upload' : 'folder'));
  const [folderName, setFolderName] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setActiveTab(initialTab || (uploadFolderId ? 'upload' : 'folder'));
  }, [initialTab, uploadFolderId, isOpen]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const resetState = () => {
    setFolderName('');
    setSelectedFiles([]);
    setUploadProgress(0);
    setActiveTab(initialTab || (uploadFolderId ? 'upload' : 'folder'));
  };

  const extractFolderId = (data) =>
    data?.uuid;
   
  const uploadSingleFile = async (file, index, totalFiles, folderId) => {
    const formData = new FormData();
    formData.append('file', file);

    await api.post('/upload', formData, {
      params: folderId ? { folderId } : undefined,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) {
          return;
        }

        const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        const overallProgress = Math.round(((index + fileProgress / 100) / totalFiles) * 100);
        setUploadProgress(overallProgress);
      },
    });
  };

  const createFolder = async (name) => {
    const headers = getAuthHeaders();

    try {
      return await api.post(
        '/folders',
        { folderName: name },
        { headers }
      );
    } catch (primaryError) {
      return api.post('/folder/create', null, {
        params: { folderName: name },
        headers,
      });
    }
  };

  const handleCreateFolder = async () => {
    const trimmedFolderName = folderName.trim();

    if (!trimmedFolderName) {
      toast.error('Folder name cannot be empty');
      return;
    }

    const specialChars = /[\\/:*?"<>|]/;
    if (specialChars.test(trimmedFolderName)) {
      toast.error("Folder name cannot contain special characters (\\ / : * ? \" < > |)");
      return;
    }

    // Client-side duplicate name check (case-insensitive)
    if (existingFolders && Array.isArray(existingFolders)) {
      const nameLower = trimmedFolderName.toLowerCase();
      const duplicate = existingFolders.some((f) => {
        const candidate = (f.folderName || f.name || f.fileName || '').toString().trim().toLowerCase();
        return candidate && candidate === nameLower;
      });

      if (duplicate) {
        const msg = 'A folder with this name already exists';
        setNameError(msg);
        toast.error(msg);
        return;
      }
    }

    setNameError('');
    setIsCreating(true);
    setUploadProgress(0);

    try {
      const createResponse = await createFolder(trimmedFolderName);
      const createdFolderId = extractFolderId(createResponse?.data);

      if (!createdFolderId) {
        toast.error('Folder created but folder ID was missing in the response');
        return;
      }

      toast.success('Folder created successfully');

      for (let i = 0; i < selectedFiles.length; i += 1) {
        const file = selectedFiles[i];

        try {
          await uploadSingleFile(file, i, selectedFiles.length, createdFolderId);
          toast.success(`${file.name} uploaded to folder`);
        } catch (uploadError) {
          const errorMessage =
            uploadError.response?.data?.message ||
            uploadError.response?.data ||
            `Failed to upload ${file.name}`;
          toast.error(typeof errorMessage === 'string' ? errorMessage : `Failed to upload ${file.name}`);
        }
      }

      if (selectedFiles.length > 0) {
        setUploadProgress(100);
      }

      resetState();
      onFolderCreated && onFolderCreated();
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        'Failed to create folder';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i += 1) {
        const file = selectedFiles[i];

        try {
          await uploadSingleFile(file, i, selectedFiles.length, uploadFolderId);
          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          let errorMessage = `Failed to upload ${file.name}`;

          if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = 'Authentication failed';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response?.data === 'string') {
            errorMessage = error.response.data;
          }

          toast.error(errorMessage);
        }
      }

      resetState();
      onClose();
      onFolderCreated && onFolderCreated();
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="new-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{uploadFolderId ? 'Upload Files to Folder' : 'Create New Folder & Upload Files'}</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        {!uploadFolderId && (
          <div className="modal-tabs">
            <button
              className={`tab-btn ${activeTab === 'folder' ? 'active' : ''}`}
              onClick={() => setActiveTab('folder')}
            >
              <Folder size={16} style={{ marginRight: '4px' }} /> Create Folder
            </button>
            <button
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} style={{ marginRight: '4px' }} /> Upload Files Only
            </button>
          </div>
        )}

        <div className="modal-content">
          {!uploadFolderId && activeTab === 'folder' && (
            <div className="folder-section">
              <div className="input-group">
                <label>Folder Name</label>
                <input
                  type="text"
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFolderName(value);
                    // live validation
                    if (existingFolders && Array.isArray(existingFolders) && value.trim()) {
                      const lower = value.trim().toLowerCase();
                      const dup = existingFolders.some((f) => {
                        const candidate = (f.folderName || f.name || f.fileName || '').toString().trim().toLowerCase();
                        return candidate && candidate === lower;
                      });
                      setNameError(dup ? 'A folder with this name already exists' : '');
                    } else {
                      setNameError('');
                    }
                  }}
                  className="folder-input"
                />
                {nameError && <p className="input-error">{nameError}</p>}
              </div>

              <div className="input-group">
                <label>Add Files to Folder (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="file-input"
                  disabled={isCreating}
                />
                {selectedFiles.length > 0 && (
                  <div className="file-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-icon"><File size={14} /></span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isCreating && selectedFiles.length > 0 && (
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <p>Creating folder and uploading files... {uploadProgress}%</p>
                </div>
              )}

              <button
                className="action-btn create-btn"
                onClick={handleCreateFolder}
                disabled={isCreating || !folderName.trim()}
              >
                {isCreating
                  ? (selectedFiles.length > 0 ? 'Creating & Uploading...' : 'Creating...')
                  : (
                    <>
                      <Folder size={16} style={{ marginRight: '4px' }} /> Create Folder
                      {selectedFiles.length > 0 ? ` & Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}` : ''}
                    </>
                  )}
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="input-group">
                <label>Select Files</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="file-input"
                  disabled={isUploading}
                />
                {selectedFiles.length > 0 && (
                  <div className="file-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <span className="file-icon"><File size={14} /></span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <p>Uploading... {uploadProgress}%</p>
                </div>
              )}

              <button
                className="action-btn upload-btn"
                onClick={handleFileUpload}
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading
                  ? 'Uploading...'
                  : (
                    <>
                      <Upload size={16} style={{ marginRight: '4px' }} /> Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewModal;
