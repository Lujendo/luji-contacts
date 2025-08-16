import React, { useState, useRef, useEffect } from 'react';
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
  Users,
  FileText
} from 'lucide-react';

interface ContactActionsMenuProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => void;
  onSendEmail?: (contact: Contact) => void;
  onCall?: (contact: Contact) => void;
  onAddToGroup?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
  onCopyInfo?: (contact: Contact) => void;
  className?: string;
}

const ContactActionsMenu: React.FC<ContactActionsMenuProps> = ({
  contact,
  onEdit,
  onDelete,
  onSendEmail,
  onCall,
  onAddToGroup,
  onViewDetails,
  onCopyInfo,
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

  const menuItems = [
    // Primary actions
    ...(onViewDetails ? [{
      icon: FileText,
      label: 'View Details',
      action: () => onViewDetails(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),
    
    ...(onEdit ? [{
      icon: Edit,
      label: 'Edit Contact',
      action: () => onEdit(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // Communication actions
    ...(contact.email && onSendEmail ? [{
      icon: Mail,
      label: 'Send Email',
      action: () => onSendEmail(contact),
      className: 'text-blue-600 hover:bg-blue-50'
    }] : []),

    ...(contact.phone && onCall ? [{
      icon: Phone,
      label: 'Call',
      action: () => window.open(`tel:${contact.phone}`),
      className: 'text-green-600 hover:bg-green-50'
    }] : []),

    // Group management
    ...(onAddToGroup ? [{
      icon: UserPlus,
      label: 'Add to Group',
      action: () => onAddToGroup(contact),
      className: 'text-indigo-600 hover:bg-indigo-50'
    }] : []),

    // Copy actions
    ...(contact.email ? [{
      icon: Copy,
      label: copiedField === 'email' ? 'Email Copied!' : 'Copy Email',
      action: () => copyToClipboard(contact.email!, 'email'),
      className: copiedField === 'email' ? 'text-green-600 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'
    }] : []),

    ...(contact.phone ? [{
      icon: Copy,
      label: copiedField === 'phone' ? 'Phone Copied!' : 'Copy Phone',
      action: () => copyToClipboard(contact.phone!, 'phone'),
      className: copiedField === 'phone' ? 'text-green-600 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'
    }] : []),

    // External links
    ...(contact.website ? [{
      icon: ExternalLink,
      label: 'Visit Website',
      action: () => window.open(contact.website!.startsWith('http') ? contact.website! : `https://${contact.website!}`, '_blank'),
      className: 'text-blue-600 hover:bg-blue-50'
    }] : []),

    ...(contact.linkedin ? [{
      icon: ExternalLink,
      label: 'View LinkedIn',
      action: () => window.open(contact.linkedin!, '_blank'),
      className: 'text-blue-600 hover:bg-blue-50'
    }] : []),

    // Destructive actions (at the bottom)
    ...(onDelete ? [{
      icon: Trash2,
      label: 'Delete Contact',
      action: () => {
        if (window.confirm(`Are you sure you want to delete ${getContactName()}?`)) {
          onDelete(contact.id);
        }
      },
      className: 'text-red-600 hover:bg-red-50 border-t border-gray-100'
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
        className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.length > 0 ? (
            menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleAction(item.action)}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 transition-colors duration-150 ${item.className}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              No actions available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactActionsMenu;
