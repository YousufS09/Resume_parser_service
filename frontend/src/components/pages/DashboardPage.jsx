import React, { useState, useEffect } from 'react';
import Header from '../organisms/Header';
import ResumeUploader from '../organisms/ResumeUploader';
import ParsedDataViewer from '../organisms/ParsedDataViewer';
import Typography from '../atoms/Typography';
import './DashboardPage.css';

const DashboardPage = () => {
  const [parsedData, setParsedData] = useState(null);

  const handleParseSuccess = (data) => {
    setParsedData(data);
    // Smooth scroll to results
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  return (
    <div className="dashboard-page">
      <Header />
      
      <main className="dashboard-main">
        <section className="intro-section fade-in">
          <Typography variant="h1">Extract Intel from Resumes.</Typography>
          <Typography variant="body" className="intro-text">
            Upload a PDF or Word document and let our AI parser extract the key information in seconds.
          </Typography>
        </section>

        <section className="upload-section fade-in">
          <ResumeUploader onParseSuccess={handleParseSuccess} />
        </section>

        {parsedData && (
          <section className="results-section">
            <ParsedDataViewer data={parsedData} />
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
