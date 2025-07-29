import React from 'react';
import { Contact } from '../types';
import { Phone, Mail, Building, MapPin } from 'lucide-react';
import ProfileImage from './ui/ProfileImage';

interface ContactListItemProps {
  contact: Contact;
  onClick: () => void;
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  onClick,
  onSelect,
  selected = false,
  style,
  className = ''
}) => {
  const getInitials = (contact: Contact) => {
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
      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      } ${className}`}
      style={style}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="mr-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelectChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}

      {/* Profile image */}
      <div className="flex-shrink-0 mr-4">
        <ProfileImage
          src={contact.profile_image_url}
          alt={`${contact.first_name} ${contact.last_name}`}
          size="md"
          fallbackInitials={getInitials(contact)}
        />
      </div>

      {/* Contact information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {contact.first_name} {contact.last_name}
          </h3>
          
          {/* Quick action icons */}
          <div className="flex items-center space-x-2 ml-4">
            {contact.phone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${contact.phone}`;
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            {contact.email && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `mailto:${contact.email}`;
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="mt-1 space-y-1">
          {contact.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-3 h-3 mr-2 text-gray-400" />
              <span className="truncate">{formatPhoneNumber(contact.phone)}</span>
            </div>
          )}
          
          {contact.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-3 h-3 mr-2 text-gray-400" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          
          {contact.company && (
            <div className="flex items-center text-sm text-gray-600">
              <Building className="w-3 h-3 mr-2 text-gray-400" />
              <span className="truncate">
                {contact.company}
                {contact.job_title && ` • ${contact.job_title}`}
              </span>
            </div>
          )}
          
          {(contact.city || contact.state) && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-3 h-3 mr-2 text-gray-400" />
              <span className="truncate">
                {[contact.city, contact.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Groups */}
        {contact.groups && contact.groups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {contact.groups.slice(0, 3).map((group) => (
              <span
                key={group.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {group.name}
              </span>
            ))}
            {contact.groups.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{contact.groups.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactListItem;
