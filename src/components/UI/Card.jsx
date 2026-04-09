import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`card bg-base-100 shadow-xl border border-gray-200 ${className}`}>
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
