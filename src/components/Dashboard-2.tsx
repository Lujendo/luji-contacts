// Alternative Dashboard component - TypeScript version
// This is an alternative implementation of the Dashboard component
// The main Dashboard.tsx should be used instead

import React from 'react';
import Dashboard from './Dashboard';

// Component props interface
interface Dashboard2Props {
  // Add any specific props for this alternative version
}

const Dashboard2: React.FC<Dashboard2Props> = (props) => {
  // For now, just use the main Dashboard component
  // This alternative version can be implemented later if needed
  return <Dashboard {...props} />;
};

export default Dashboard2;
