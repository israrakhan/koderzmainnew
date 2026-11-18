import React, { useState } from 'react';
import api from '../../api/axiosInstance';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../../styles/UploadPage.css';
import { Upload, Folder, CloudUpload, FileText, CheckCircle } from 'lucide-react';

function UploadPage() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileUpload = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    for (let file of filesToUpload) {
      if (!file || !file.name) {
        toast.error('Invalid file selected');
        continue;
      }

      setIsUploading(true);
      setUploadFileName(file.name);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('token');

        await api.post(`/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        });

        setUploadedFiles([...uploadedFiles, { name: file.name, size: file.size }]);
        setUploadProgress(0);
      } catch (error) {
        let errorMsg = `Failed to upload ${file.name}`;

        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            errorMsg = 'Authentication failed. Redirecting to login...';
            setTimeout(() => {
              localStorage.removeItem('token');
              navigate('/');
            }, 1500);
          } else if (error.response.data?.message) {
            errorMsg = `${error.response.data.message}`;
          } else if (error.response.status === 413) {
            errorMsg = `File too large: ${file.name}`;
          }
        } else if (error.request) {
          errorMsg = 'Cannot reach server';
        }

        toast.error(errorMsg);
      } finally {
        setIsUploading(false);
        setUploadFileName('');
      }
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  return (
    <div className="upload-page">
      {/* Loading Modal */}
      {isUploading && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="upload-spinner">
              <div className="spinner-circle"></div>
            </div>
            <h3 className="uploading-title">Uploading File</h3>
            <p className="uploading-filename">{uploadFileName}</p>

            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            

            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <div className="upload-container">
        <div className="upload-header">
          <h1><CloudUpload size={32} style={{marginRight: '0.5rem'}} /> Upload Files</h1>
          <p>Select files to upload them to your drive</p>
        </div>

        {/* Upload Area */}
        <div
          className={`upload-area ${isUploading ? 'uploading' : ''}`}
        >
          <div className="upload-content">
            <div className="upload-icon"><Upload size={48} /></div>
            <h2>Upload Your Files</h2>
            <p className="upload-description">Click the button below to choose files</p>

            <label className="upload-btn-label" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              Choose Files
            </label>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3><FileText size={24} style={{marginRight: '0.5rem'}} /> Recently Uploaded</h3>
            <div className="files-list">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon"><CheckCircle size={24} /></span>
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate('/home')} className="view-files-btn">
          <Folder size={16} style={{marginRight: '4px'}} /> View All Files
        </button>
      </div>

      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
}

export default UploadPage;
