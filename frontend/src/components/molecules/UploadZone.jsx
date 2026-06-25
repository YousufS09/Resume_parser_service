import React, { useCallback, useRef } from 'react';
import Typography from '../atoms/Typography';
import './UploadZone.css';

const UploadZone = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`upload-zone glass-panel ${selectedFile ? 'has-file' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx"
        className="hidden-input"
      />
      <div className="upload-content">
        <Typography variant="h3">
          {selectedFile ? selectedFile.name : 'Drag & Drop Resume'}
        </Typography>
        <Typography variant="body">
          {selectedFile ? 'Click to change file' : 'or click to browse (.pdf, .docx)'}
        </Typography>
      </div>
    </div>
  );
};

export default UploadZone;
