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
  FileText,
  Download,
  Share2,
  MessageSquare,
  History,
  Star,
  StarOff,
  UserX,
  Archive,
  RotateCcw,
  Bookmark,
  Tag,
  Calendar,
  MapPin,
  Globe
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
  onDuplicate?: (contact: Contact) => void;
  onExport?: (contact: Contact) => void;
  onShare?: (contact: Contact) => void;
  onAddNote?: (contact: Contact) => void;
  onViewHistory?: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
  onArchive?: (contact: Contact) => void;
  onScheduleMeeting?: (contact: Contact) => void;
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
  onDuplicate,
  onExport,
  onShare,
  onAddNote,
  onViewHistory,
  onToggleFavorite,
  onArchive,
  onScheduleMeeting,
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

    // === NEW ENHANCED ACTIONS ===

    // Duplicate contact
    ...(onDuplicate ? [{
      icon: Copy,
      label: 'Duplicate Contact',
      action: () => onDuplicate(contact),
      className: 'text-gray-700 hover:bg-gray-50 border-t border-gray-100'
    }] : []),

    // Export contact
    ...(onExport ? [{
      icon: Download,
      label: 'Export Contact',
      action: () => onExport(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // Share contact
    ...(onShare ? [{
      icon: Share2,
      label: 'Share Contact',
      action: () => onShare(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // Add note
    ...(onAddNote ? [{
      icon: MessageSquare,
      label: 'Add Note',
      action: () => onAddNote(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // Schedule meeting
    ...(onScheduleMeeting ? [{
      icon: Calendar,
      label: 'Schedule Meeting',
      action: () => onScheduleMeeting(contact),
      className: 'text-purple-600 hover:bg-purple-50'
    }] : []),

    // Toggle favorite
    ...(onToggleFavorite ? [{
      icon: contact.is_favorite ? StarOff : Star,
      label: contact.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
      action: () => onToggleFavorite(contact),
      className: contact.is_favorite ? 'text-yellow-600 hover:bg-yellow-50' : 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // View history
    ...(onViewHistory ? [{
      icon: History,
      label: 'View History',
      action: () => onViewHistory(contact),
      className: 'text-gray-700 hover:bg-gray-50'
    }] : []),

    // Archive contact
    ...(onArchive ? [{
      icon: Archive,
      label: 'Archive Contact',
      action: () => onArchive(contact),
      className: 'text-orange-600 hover:bg-orange-50'
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
          className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions for {getContactName()}
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
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-3 transition-all duration-150 hover:bg-gray-50 ${item.className} group`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-150" />
                      <span className="font-medium">{item.label}</span>
                      {item.label.includes('Copied!') && (
                        <div className="ml-auto">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
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
