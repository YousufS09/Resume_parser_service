import React from 'react';
import Typography from '../atoms/Typography';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <Typography variant="h2" className="gradient-text">Resume AI</Typography>
      </div>
      <div className="header-nav">
        <Typography variant="small">Advanced Parsing Service</Typography>
      </div>
    </header>
  );
};

export default Header;
