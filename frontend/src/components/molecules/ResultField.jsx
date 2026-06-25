import React from 'react';
import Typography from '../atoms/Typography';
import './ResultField.css';

const ResultField = ({ label, value }) => {
  if (!value) return null;
  
  // Format array values like skills
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="result-field">
      <Typography variant="small" className="result-label">{label}</Typography>
      <Typography variant="body" className="result-value">{displayValue}</Typography>
    </div>
  );
};

export default ResultField;
