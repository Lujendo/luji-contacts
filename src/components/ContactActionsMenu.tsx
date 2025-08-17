import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Contact } from '../types';
import {
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  UserPlus,
  Star,
  StarOff,
  Globe,
  MessageSquare
} from 'lucide-react';

interface ContactActionsMenuProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => void;
  onSendEmail?: (contact: Contact) => void;
  onAddToGroup?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
  onDuplicate?: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
  className?: string;
}

const ContactActionsMenu: React.FC<ContactActionsMenuProps> = ({
  contact,
  onEdit,
  onDelete,
  onSendEmail,
  onAddToGroup,
  onViewDetails,
  onDuplicate,
  onToggleFavorite,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getContactName = () => {
    const firstName = contact.first_name?.trim() || '';
    const lastName = contact.last_name?.trim() || '';
    return firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'Unnamed Contact';
  };

  // Enhanced duplicate function with proper implementation
  const handleDuplicate = useCallback(() => {
    if (onDuplicate) {
      onDuplicate(contact);
    } else {
      // Default duplicate implementation - copy contact data to clipboard
      const contactData = {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        job_title: contact.job_title,
        notes: contact.notes ? `Duplicated from: ${getContactName()}\n\n${contact.notes}` : `Duplicated from: ${getContactName()}`
      };

      navigator.clipboard.writeText(JSON.stringify(contactData, null, 2)).then(() => {
        alert(`Contact data copied to clipboard! You can now create a new contact and paste this data.`);
      }).catch(() => {
        alert(`Contact ready to duplicate: ${getContactName()}`);
      });
    }
  }, [contact, onDuplicate]);

  // Enhanced delete function with better warning
  const handleDelete = useCallback(() => {
    const contactName = getContactName();
    const confirmMessage = `⚠️ DELETE CONTACT\n\nAre you sure you want to permanently delete "${contactName}"?\n\nThis action cannot be undone and will remove:\n• All contact information\n• Associated notes and history\n• Group memberships\n\nType "DELETE" to confirm:`;

    const userInput = prompt(confirmMessage);
    if (userInput === 'DELETE') {
      if (onDelete) {
        onDelete(contact.id);
      }
    } else if (userInput !== null) {
      alert('Deletion cancelled. Contact was not deleted.');
    }
  }, [contact, onDelete]);

  // Streamlined essential actions - no labels, just icons with tooltips
  const menuItems = [
    // === ESSENTIAL ACTIONS ===
    ...(onViewDetails ? [{
      icon: ExternalLink,
      action: () => onViewDetails(contact),
      className: 'text-blue-600 hover:bg-blue-50',
      tooltip: 'Open contact details'
    }] : []),

    ...(onEdit ? [{
      icon: Edit,
      action: () => onEdit(contact),
      className: 'text-gray-700 hover:bg-gray-50',
      tooltip: 'Edit contact'
    }] : []),

    // Duplicate with enhanced functionality
    {
      icon: Copy,
      action: handleDuplicate,
      className: 'text-gray-700 hover:bg-gray-50',
      tooltip: 'Duplicate contact'
    },

    // === COMMUNICATION ===
    ...(contact.email && onSendEmail ? [{
      icon: Mail,
      action: () => onSendEmail(contact),
      className: 'text-blue-600 hover:bg-blue-50',
      tooltip: `Email ${contact.email}`
    }] : []),

    ...(contact.phone ? [{
      icon: Phone,
      action: () => window.open(`tel:${contact.phone}`),
      className: 'text-green-600 hover:bg-green-50',
      tooltip: `Call ${contact.phone}`
    }] : []),

    // === ORGANIZATION ===
    ...(onAddToGroup ? [{
      icon: UserPlus,
      action: () => onAddToGroup(contact),
      className: 'text-indigo-600 hover:bg-indigo-50',
      tooltip: 'Add to group'
    }] : []),

    ...(onToggleFavorite ? [{
      icon: (contact as any).is_favorite ? StarOff : Star,
      action: () => onToggleFavorite(contact),
      className: (contact as any).is_favorite ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-700 hover:bg-gray-50',
      tooltip: (contact as any).is_favorite ? 'Remove from favorites' : 'Add to favorites'
    }] : []),

    // === EXTERNAL LINKS ===
    ...(contact.website ? [{
      icon: Globe,
      action: () => window.open(contact.website!.startsWith('http') ? contact.website! : `https://${contact.website!}`, '_blank'),
      className: 'text-blue-600 hover:bg-blue-50',
      tooltip: 'Visit website'
    }] : []),

    ...(contact.linkedin ? [{
      icon: ExternalLink,
      action: () => window.open(contact.linkedin!, '_blank'),
      className: 'text-blue-600 hover:bg-blue-50',
      tooltip: 'View LinkedIn'
    }] : []),

    // === DESTRUCTIVE ACTION (with enhanced warning) ===
    ...(onDelete ? [{
      icon: Trash2,
      action: handleDelete,
      className: 'text-red-600 hover:bg-red-50 border-t border-gray-100',
      tooltip: 'Delete contact (permanent)'
    }] : [])
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isOpen
            ? 'bg-blue-100 text-blue-600 shadow-sm'
            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }`}
        title={`More actions for ${getContactName()}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Compact Menu Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {getContactName()}
            </div>
          </div>

          {menuItems.length > 0 ? (
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isLastInSection = index === menuItems.length - 1 ||
                  (menuItems[index + 1] && item.className.includes('border-t'));

                return (
                  <div key={index}>
                    <button
                      onClick={() => handleAction(item.action)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-center transition-all duration-150 hover:bg-gray-50 ${item.className} group relative`}
                      title={item.tooltip}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-150" />

                      {/* Tooltip on hover */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {item.tooltip}
                      </div>
                    </button>
                    {isLastInSection && index < menuItems.length - 1 && (
                      <div className="my-1 border-t border-gray-100"></div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-gray-400" />
              No actions available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactActionsMenu;
