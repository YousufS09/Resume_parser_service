import React, { useState } from 'react';
import UploadZone from '../molecules/UploadZone';
import Button from '../atoms/Button';
import Spinner from '../atoms/Spinner';
import Typography from '../atoms/Typography';
import { parseResume } from '../../services/api';
import './ResumeUploader.css';

const ResumeUploader = ({ onParseSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await parseResume(file);
      onParseSuccess(result.data || result);
    } catch (err) {
      setError(err.message || 'An error occurred during parsing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-uploader">
      <UploadZone onFileSelect={handleFileSelect} selectedFile={file} />
      
      {error && (
        <div className="error-message fade-in">
          <Typography variant="small" className="error-text">{error}</Typography>
        </div>
      )}

      <div className="uploader-actions">
        <Button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="upload-btn"
        >
          {loading ? <Spinner /> : 'Parse Resume'}
        </Button>
      </div>
    </div>
  );
};

export default ResumeUploader;
