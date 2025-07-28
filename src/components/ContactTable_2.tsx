// Alternative ContactTable component - TypeScript version
// This is an alternative implementation of the ContactTable component
// The main ContactTable.tsx should be used instead

import React from 'react';
import ContactTable from './ContactTable';
import { Contact, SortConfig } from '../types';

// Component props interface
interface ContactTable2Props {
  contacts: Contact[];
  onDelete?: (contactId: number) => void;
  onSelectContact?: (contact: Contact) => void;
  selectedContactId?: number;
  selectedContactIds?: number[];
  onToggleSelection?: (contactId: number, selected: boolean) => void;
  sortConfig?: SortConfig;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortLoading?: boolean;
  highlightedGroupId?: number | null;
  onDoubleClickContact?: (contact: Contact) => void;
}

const ContactTable2: React.FC<ContactTable2Props> = (props) => {
  // For now, just use the main ContactTable component
  // This alternative version can be implemented later if needed
  return <ContactTable {...props} />;
};

export default ContactTable2;
