import React from 'react';
import { Contact, SortConfig } from '../types';
import {
    User,
    Mail,
    Phone,
    Users,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader
} from 'lucide-react';

// Component props interface
interface ContactTableProps {
    contacts: Contact[];
    onDelete?: (contactId: number) => void;
    onSelectContact?: (contact: Contact) => void;
    selectedContactId?: number;
    selectedContactIds?: number[];
    selectedContacts?: number[]; // Alternative prop name for compatibility
    onToggleSelection?: (contactId: number, selected: boolean) => void;
    onContactSelection?: (contactId: number, selected: boolean) => void; // Alternative prop name
    sortConfig?: SortConfig;
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    onSortChange?: (field: string) => void; // Alternative prop name
    sortLoading?: boolean;
    highlightedGroupId?: number | null;
    onDoubleClickContact?: (contact: Contact) => void;
    onBulkSelection?: (selected: boolean) => void;
}

// Sort indicator component props
interface SortIndicatorProps {
    columnKey: string;
    sortConfig?: SortConfig;
}

// Sortable header component props
interface SortableHeaderProps {
    column: string;
    label: string;
    icon?: React.ComponentType<{ className?: string; size?: number }>;
    sortConfig?: SortConfig;
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

const ContactTable: React.FC<ContactTableProps> = ({
    contacts,
    onDelete,
    onSelectContact,
    selectedContactId,
    selectedContactIds = [],
    selectedContacts = [], // Alternative prop
    onToggleSelection,
    onContactSelection, // Alternative prop
    sortConfig = { field: 'first_name', direction: 'asc' },
    onSort,
    onSortChange, // Alternative prop
    sortLoading = false,
    highlightedGroupId,
    onDoubleClickContact,
    onBulkSelection
}) => {
    // Normalize selected contacts array
    const normalizedSelectedContacts = selectedContactIds.length > 0 ? selectedContactIds : selectedContacts;
    
    // Normalize selection handler
    const handleToggleSelection = onToggleSelection || onContactSelection;
    
    // Normalize sort handler
    const handleSort = (field: string, direction: 'asc' | 'desc') => {
        if (onSort) {
            onSort(field, direction);
        } else if (onSortChange) {
            onSortChange(field);
        }
    };

    const SortIndicator: React.FC<SortIndicatorProps> = ({ columnKey }) => {
        if (sortConfig.field !== columnKey) {
            return (
                <ArrowUpDown size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            );
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={16} className="text-indigo-600" />
            : <ArrowDown size={16} className="text-indigo-600" />;
    };

    const SortableHeader: React.FC<SortableHeaderProps> = ({ column, label, icon: Icon }) => {
        const isActive = sortConfig.field === column;
        return (
            <th scope="col" className="px-6 py-3 text-left">
                <button
                    onClick={() => {
                        const direction = isActive && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                        handleSort(column, direction);
                    }}
                    className={`
                        group flex items-center space-x-2 text-xs font-medium 
                        ${isActive ? 'text-indigo-600' : 'text-gray-500'} 
                        hover:text-indigo-600 focus:outline-none uppercase tracking-wider
                        transition-colors duration-200
                    `}
                    disabled={sortLoading}
                >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{label}</span>
                    {sortLoading && isActive ? (
                        <Loader className="animate-spin h-4 w-4" />
                    ) : (
                        <SortIndicator columnKey={column} />
                    )}
                </button>
            </th>
        );
    };

    const handleContactClick = (contact: Contact): void => {
        if (onSelectContact) {
            onSelectContact(contact);
        }
    };

    const handleContactDoubleClick = (contact: Contact): void => {
        if (onDoubleClickContact) {
            onDoubleClickContact(contact);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, contactId: number): void => {
        e.stopPropagation();
        if (onDelete && window.confirm('Are you sure you want to delete this contact?')) {
            onDelete(contactId);
        }
    };

    const handleCheckboxChange = (contactId: number, checked: boolean): void => {
        if (handleToggleSelection) {
            handleToggleSelection(contactId, checked);
        }
    };

    const handleSelectAll = (checked: boolean): void => {
        if (onBulkSelection) {
            onBulkSelection(checked);
        } else if (handleToggleSelection) {
            // If no bulk selection handler, toggle each contact individually
            contacts.forEach(contact => {
                handleToggleSelection(contact.id, checked);
            });
        }
    };

    const isAllSelected = contacts.length > 0 && contacts.every(contact => 
        normalizedSelectedContacts.includes(contact.id)
    );
    const isPartiallySelected = normalizedSelectedContacts.length > 0 && !isAllSelected;

    if (contacts.length === 0) {
        return (
            <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new contact.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        {/* Select All Checkbox */}
                        {(handleToggleSelection || onBulkSelection) && (
                            <th scope="col" className="relative px-6 py-3">
                                <input
                                    type="checkbox"
                                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    ref={(input) => {
                                        if (input) {
                                            input.indeterminate = isPartiallySelected;
                                        }
                                    }}
                                    checked={isAllSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </th>
                        )}

                        <SortableHeader
                            column="first_name"
                            label="Name"
                            icon={User}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                        
                        <SortableHeader
                            column="email"
                            label="Email"
                            icon={Mail}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                        
                        <SortableHeader
                            column="phone"
                            label="Phone"
                            icon={Phone}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />
                        
                        <SortableHeader
                            column="company"
                            label="Company"
                            sortConfig={sortConfig}
                            onSort={handleSort}
                        />

                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Groups</span>
                            </div>
                        </th>

                        {onDelete && (
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((contact) => {
                        const isSelected = normalizedSelectedContacts.includes(contact.id);
                        const isHighlighted = selectedContactId === contact.id;
                        
                        return (
                            <tr
                                key={contact.id}
                                onClick={() => handleContactClick(contact)}
                                onDoubleClick={() => handleContactDoubleClick(contact)}
                                className={`
                                    cursor-pointer transition-colors duration-150
                                    ${isHighlighted ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}
                                    ${isSelected ? 'bg-blue-50' : ''}
                                `}
                            >
                                {/* Selection Checkbox */}
                                {(handleToggleSelection || onBulkSelection) && (
                                    <td className="relative px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleCheckboxChange(contact.id, e.target.checked);
                                            }}
                                        />
                                    </td>
                                )}

                                {/* Name */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {contact.profile_image_url ? (
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={contact.profile_image_url}
                                                    alt={`${contact.first_name} ${contact.last_name}`}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {contact.first_name || contact.last_name 
                                                    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                                                    : 'Unnamed Contact'
                                                }
                                            </div>
                                            {contact.job_title && (
                                                <div className="text-sm text-gray-500">
                                                    {contact.job_title}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Email */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {contact.email ? (
                                            <a
                                                href={`mailto:${contact.email}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {contact.email}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No email</span>
                                        )}
                                    </div>
                                </td>

                                {/* Phone */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {contact.phone ? (
                                            <a
                                                href={`tel:${contact.phone}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {contact.phone}
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No phone</span>
                                        )}
                                    </div>
                                </td>

                                {/* Company */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {contact.company || <span className="text-gray-400">No company</span>}
                                    </div>
                                </td>

                                {/* Groups */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {(contact.Groups || contact.groups || []).map((group) => (
                                            <span
                                                key={group.id}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    highlightedGroupId === group.id
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {group.name}
                                            </span>
                                        ))}
                                        {(!contact.Groups || contact.Groups.length === 0) && 
                                         (!contact.groups || contact.groups.length === 0) && (
                                            <span className="text-gray-400 text-xs">No groups</span>
                                        )}
                                    </div>
                                </td>

                                {/* Actions */}
                                {onDelete && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => handleDeleteClick(e, contact.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                            title="Delete contact"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ContactTable;
