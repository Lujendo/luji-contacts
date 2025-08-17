import React, { useState } from 'react';
import { Contact } from '../types';
import { Phone, Mail, Building, MapPin, Edit, PhoneCall } from 'lucide-react';
import ProfileImage from './ui/ProfileImage';
import ContactActionsMenu from './ContactActionsMenu';

interface ContactListItemProps {
  contact: Contact;
  onClick: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => void;
  onSendEmail?: (contact: Contact) => void;
  onAddToGroup?: (contact: Contact) => void;
  onViewDetails?: (contact: Contact) => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  onClick,
  onSelect,
  selected = false,
  style,
  className = '',
  onEdit,
  onDelete,
  onSendEmail,
  onAddToGroup,
  onViewDetails
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const getInitials = (contact: Contact) => {
    // Use nickname if available, otherwise use first and last name
    if (contact.nickname) {
      const nicknameParts = contact.nickname.split(' ');
      if (nicknameParts.length >= 2) {
        return (nicknameParts[0].charAt(0) + nicknameParts[1].charAt(0)).toUpperCase();
      }
      return contact.nickname.charAt(0).toUpperCase();
    }

    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement) {
      return; // Don't trigger onClick when clicking checkbox
    }
    onClick();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  return (
    <div
      className={`group grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 ${
        selected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      } ${isHovered ? 'shadow-sm' : ''} ${className}`}
      style={style}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="col-span-1 flex justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelectChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* Name column with profile image */}
      <div className={`${onSelect ? 'col-span-3' : 'col-span-3'} flex items-center min-w-0`}>
        <div className="flex-shrink-0 mr-3">
          <ProfileImage
            src={contact.profile_image_url}
            alt={`${contact.first_name} ${contact.last_name}`}
            size="sm"
            fallbackInitials={getInitials(contact)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {contact.nickname || (contact.first_name || contact.last_name)
              ? contact.nickname || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
              : 'Unnamed Contact'
            }
          </h3>
          {contact.nickname && (contact.first_name || contact.last_name) && (
            <p className="text-xs text-gray-400 truncate">
              {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
            </p>
          )}
          {contact.job_title && (
            <p className="text-xs text-gray-500 truncate">
              {contact.job_title}
            </p>
          )}
        </div>
      </div>

      {/* Email column */}
      <div className="col-span-2 min-w-0">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="text-sm text-blue-600 hover:text-blue-800 truncate block"
            onClick={(e) => e.stopPropagation()}
            title={contact.email}
          >
            {contact.email}
          </a>
        ) : (
          <span className="text-sm text-gray-400 truncate block">No email</span>
        )}
      </div>

      {/* Phone column */}
      <div className="col-span-2 min-w-0">
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="text-sm text-blue-600 hover:text-blue-800 truncate block"
            onClick={(e) => e.stopPropagation()}
            title={contact.phone}
          >
            {formatPhoneNumber(contact.phone)}
          </a>
        ) : (
          <span className="text-sm text-gray-400 truncate block">No phone</span>
        )}
      </div>

      {/* Company column */}
      <div className="col-span-2 min-w-0">
        {contact.company ? (
          <span className="text-sm text-gray-900 truncate block" title={contact.company}>
            {contact.company}
          </span>
        ) : (
          <span className="text-sm text-gray-400 truncate block">No company</span>
        )}
      </div>

      {/* Role/Groups column */}
      <div className="col-span-1 min-w-0">
        {contact.role ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate">
            {contact.role}
          </span>
        ) : contact.groups && contact.groups.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {contact.groups.slice(0, 2).map((group) => (
              <span
                key={group.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {group.name}
              </span>
            ))}
            {contact.groups.length > 2 && (
              <span className="text-xs text-gray-500">+{contact.groups.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400 truncate block">No role</span>
        )}
      </div>

      {/* Enhanced Actions column with quick actions */}
      <div className="col-span-1 flex justify-end items-center space-x-1">
        {/* Quick Action Buttons - appear on hover */}
        <div className={`flex items-center space-x-1 transition-all duration-200 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          {/* Quick Call Button */}
          {contact.phone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${contact.phone}`);
              }}
              className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              title={`Call ${contact.phone}`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Email Button */}
          {contact.email && onSendEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail(contact);
              }}
              className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title={`Email ${contact.email}`}
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Edit Button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact);
              }}
              className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              title="Edit contact"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3-dots menu - always visible */}
        <ContactActionsMenu
          contact={contact}
          onEdit={onEdit}
          onDelete={onDelete}
          onSendEmail={onSendEmail}
          onAddToGroup={onAddToGroup}
          onViewDetails={onViewDetails}
          className="ml-1"
        />
      </div>

    </div>
  );
};

export default ContactListItem;
