// ContactImportExport component - TypeScript version
// This component provides import/export functionality for contacts
// Uses the main DashboardImportExport component

import React from 'react';
import DashboardImportExport from './DashboardImportExport';
import { Contact } from '../types';

// Component props interface
interface ContactImportExportProps {
  onClose: () => void;
  onContactsImported?: (contacts: Contact[]) => void;
}

const ContactImportExport: React.FC<ContactImportExportProps> = (props) => {
  // Use the main DashboardImportExport component
  return <DashboardImportExport {...props} />;
};

export default ContactImportExport;
