import React from 'react';
import '../styles/ProjectSkeleton.css';

const ProjectSkeleton = ({ count = 6, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-card-list">
            <div className="skeleton-list-image"></div>
            <div className="skeleton-list-content">
              <div className="skeleton-list-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
              <div className="skeleton-tech">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-stats">
                  <div className="skeleton-stat"></div>
                  <div className="skeleton-stat"></div>
                </div>
                <div className="skeleton-actions">
                  <div className="skeleton-btn"></div>
                  <div className="skeleton-btn"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
            <div className="skeleton-tags">
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
              <div className="skeleton-tag"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProjectSkeleton;