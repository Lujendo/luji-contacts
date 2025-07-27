import React from 'react';
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

const ContactTable = ({
    contacts,
    onDelete,
    onSelectContact,
    selectedContactId,
    selectedContactIds = [],
    onToggleSelection,
    sortConfig,
    onSort,
    sortLoading,
    highlightedGroupId,
    onDoubleClickContact
}) => {
    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return (
                <ArrowUpDown size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            );
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={16} className="text-indigo-600" />
            : <ArrowDown size={16} className="text-indigo-600" />;
    };

    const SortableHeader = ({ column, label, icon }) => {
        const isActive = sortConfig.key === column;
        return (
            <th scope="col" className="px-6 py-3 text-left">
                <button
                    onClick={() => {
                        const direction = isActive && sortConfig.direction === 'asc' ? 'desc' : 'asc';
                        onSort(column, direction);
                    }}
                    className={`
            group flex items-center space-x-2 text-xs font-medium 
            ${isActive ? 'text-indigo-600' : 'text-gray-500'} 
            hover:text-indigo-600 focus:outline-none uppercase tracking-wider
            transition-colors duration-200
          `}
                    disabled={sortLoading}
                >
                    {icon}
                    <span className="ml-2">{label}</span>
                    <div className="w-4 h-4 flex items-center justify-center">
                        {sortLoading && sortConfig.key === column ? (
                            <Loader size={16} className="animate-spin text-indigo-600" />
                        ) : (
                            <SortIndicator columnKey={column} />
                        )}
                    </div>
                </button>
            </th>
        );
    };

    const handleSelectAll = () => {
        if (selectedContactIds.length === contacts.length) {
            contacts.forEach(contactItem => onToggleSelection(contactItem.id));
        } else {
            contacts.forEach(contactItem => {
                if (!selectedContactIds.includes(contactItem.id)) {
                    onToggleSelection(contactItem.id);
                }
            });
        }
    };

    const isContactInHighlightedGroup = (currentContact) => {
        if (!highlightedGroupId || !currentContact.Groups) return false;
        return currentContact.Groups.some(group => group.id === highlightedGroupId);
    };

    return (
       
            <div className="relative">
                {sortLoading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                        <div className="flex items-center space-x-2 text-indigo-600">
                            <Loader size={24} className="animate-spin" />
                            <span className="text-sm font-medium">Sorting...</span>
                        </div>
                    </div>
                )}

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-12">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer
                             focus:ring-indigo-500"
                                        checked={selectedContactIds.length === contacts.length && contacts.length > 0}
                                        ref={input => input && (input.indeterminate =
                                            selectedContactIds.length > 0 && selectedContactIds.length < contacts.length)}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <SortableHeader
                                column="name"
                                label="Name"
                                icon={<User size={16} className="text-gray-400" />}
                            />
                            <SortableHeader
                                column="email"
                                label="Email"
                                icon={<Mail size={16} className="text-gray-400" />}
                            />
                            <SortableHeader
                                column="phone"
                                label="Phone"
                                icon={<Phone size={16} className="text-gray-400" />}
                            />
                            <SortableHeader
                                column="groups"
                                label="Groups"
                                icon={<Users size={16} className="text-gray-400" />}
                            />
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.map((contactItem) => (
                            <tr
                                key={contactItem.id}
                                className={`
                  transition-colors duration-150
                  ${selectedContactId === contactItem.id ? 'bg-indigo-50' : ''}
                  ${selectedContactIds.includes(contactItem.id) ? 'bg-indigo-50' : ''}
                  ${isContactInHighlightedGroup(contactItem) ? 'bg-amber-50' : 'hover:bg-gray-50'}
                `}
                                onDoubleClick={() => onDoubleClickContact && onDoubleClickContact(contactItem)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap w-12">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer focus:ring-indigo-500"
                                            checked={selectedContactIds.includes(contactItem.id)}
                                            onChange={() => onToggleSelection(contactItem.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                    onClick={() => onSelectContact(contactItem)}
                                >
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden">
                                            {contactItem.profile_image_url ? (
                                                <img
                                                    src={contactItem.profile_image_url}
                                                    alt={`${contactItem.first_name} ${contactItem.last_name}`}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onError = null;
                                                        e.target.src = '';
                                                        e.target.parentElement.className = 'flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center';
                                                        e.target.parentElement.innerHTML = `<svg width="16" height="16" class="text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                                                    <User size={16} className="text-indigo-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {contactItem.first_name} {contactItem.last_name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                    onClick={() => onSelectContact(contactItem)}
                                >
                                    <div className="text-sm text-gray-900">
                                        {contactItem.email || 'N/A'}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                                    onClick={() => onSelectContact(contactItem)}
                                >
                                    <div className="text-sm text-gray-900">
                                        {contactItem.phone || 'N/A'}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-4 cursor-pointer"
                                    onClick={() => onSelectContact(contactItem)}
                                >
                                    <div className="text-sm text-gray-900">
                                        {contactItem.Groups && contactItem.Groups.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {contactItem.Groups.map(group => (
                                                    <span
                                                        key={group.id}
                                                        className={`
                              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${group.id === highlightedGroupId
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-indigo-100 text-indigo-800'}
                            `}
                                                    >
                                                        {group.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">No groups</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(contactItem.id);
                                        }}
                                        className="inline-flex items-center p-1.5 border border-transparent rounded-full 
                             text-red-600 hover:bg-red-50 transition-colors duration-200
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {contacts.length === 0 && (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No contacts</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new contact.
                        </p>
                    </div>
                )}
            </div>
        
    );
};

export default ContactTable;