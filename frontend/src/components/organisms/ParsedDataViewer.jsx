import React from 'react';
import Typography from '../atoms/Typography';
import ResultField from '../molecules/ResultField';
import './ParsedDataViewer.css';

const ParsedDataViewer = ({ data }) => {
  if (!data) return null;

  // Function to recursively render object keys if data is complex
  // For this basic setup, we'll assume a flat or moderately nested structure
  const renderFields = (obj, prefix = '') => {
    return Object.entries(obj).map(([key, value]) => {
      // Handle nulls and empty values
      if (value === null || value === undefined || value === '') return null;

      // Skip the raw text if it exists to keep UI clean, unless there's nothing else
      if (key === 'rawText' || key === 'fullText') return null;

      const label = prefix ? `${prefix} - ${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        return <div key={label} className="nested-section">{renderFields(value, label)}</div>;
      }

      return <ResultField key={label} label={label} value={value} />;
    });
  };

  return (
    <div className="parsed-data-viewer glass-panel fade-in">
      <div className="viewer-header">
        <Typography variant="h3">Parsed Results</Typography>
      </div>
      <div className="viewer-content">
        {renderFields(data)}
      </div>
    </div>
  );
};

export default ParsedDataViewer;
