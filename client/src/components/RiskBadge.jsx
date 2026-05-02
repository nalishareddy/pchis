import React from 'react';

const RiskBadge = ({ level, size = 'sm' }) => {
  const classes = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-green-100 text-green-700 border-green-200'
  };

  const dots = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-green-500'
  };

  const padding = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${classes[level] || classes.Low} ${padding}`}
    >
      <span className={`w-2 h-2 rounded-full ${dots[level] || dots.Low}`} />
      {level || 'Unknown'} Risk
    </span>
  );
};

export default RiskBadge;
