import React from 'react';
import '../../styles/SkeletonLoader.css';

export function SkeletonCard({ count = 1, variant = 'file' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-card-icon"></div>
          <div className="skeleton-card-title"></div>
          <div className="skeleton-card-meta"></div>
        </div>
      ))}
    </>
  );
}

export function SkeletonGrid({ count = 12, variant = 'file' }) {
  return (
    <div className="skeleton-grid">
      <SkeletonCard count={count} variant={variant} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-list-icon"></div>
          <div className="skeleton-list-content">
            <div className="skeleton-list-title"></div>
            <div className="skeleton-list-subtitle"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton-text-line"></div>
      ))}
    </div>
  );
}
