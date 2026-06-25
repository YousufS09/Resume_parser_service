import React from 'react';
import './Typography.css';

const Typography = ({ variant = 'body', children, className = '' }) => {
  const Component = variant.startsWith('h') ? variant : 'p';
  return (
    <Component className={`typography typography-${variant} ${className}`}>
      {children}
    </Component>
  );
};

export default Typography;
