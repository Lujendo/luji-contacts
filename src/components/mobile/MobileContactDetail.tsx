import React from 'react';
import { Contact } from '../../types';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Edit, 
  MapPin, 
  Building, 
  Calendar,
  Globe,
  Share,
  Heart,
  Trash2
} from 'lucide-react';
import ProfileImage from '../ui/ProfileImage';
import MobileContainer from './MobileContainer';

interface MobileContactDetailProps {
  contact: Contact;
  onCall: (contact: Contact) => void;
  onEmail: (contact: Contact) => void;
  onSms: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onShare: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onFavorite?: (contact: Contact) => void;
  className?: string;
}

const MobileContactDetail: React.FC<MobileContactDetailProps> = ({
  contact,
  onCall,
  onEmail,
  onSms,
  onEdit,
  onShare,
  onDelete,
  onFavorite,
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

  const formatAddress = (contact: Contact) => {
    const parts = [
      contact.street_address,
      contact.city,
      contact.state,
      contact.zip_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className={`bg-gray-50 min-h-full ${className}`}>
      {/* Header Section */}
      <div className="bg-white">
        <MobileContainer className="text-center py-8">
          <ProfileImage
            src={contact.profile_image_url}
            alt={`${contact.first_name} ${contact.last_name}`}
            size="xl"
            fallbackInitials={getInitials(contact)}
            className="mx-auto mb-4"
          />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {contact.first_name} {contact.last_name}
          </h1>
          
          {contact.job_title && (
            <p className="text-gray-600 mb-1">{contact.job_title}</p>
          )}
          
          {contact.company && (
            <p className="text-gray-500 text-sm">{contact.company}</p>
          )}
        </MobileContainer>

        {/* Quick Actions */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex justify-center space-x-8">
            <button
              onClick={() => onCall(contact)}
              disabled={!contact.phone}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-600">Call</span>
            </button>

            <button
              onClick={() => onSms(contact)}
              disabled={!contact.phone}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600">Message</span>
            </button>

            <button
              onClick={() => onEmail(contact)}
              disabled={!contact.email}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600">Email</span>
            </button>

            <button
              onClick={() => onEdit(contact)}
              className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit className="w-6 h-6 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600">Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-4 space-y-4">
        {/* Phone Numbers */}
        {contact.phone && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900">{formatPhoneNumber(contact.phone)}</p>
                    <p className="text-xs text-gray-500">Mobile</p>
                  </div>
                </div>
                <button
                  onClick={() => onCall(contact)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Email */}
        {contact.email && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900">{contact.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <button
                  onClick={() => onEmail(contact)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Address */}
        {formatAddress(contact) && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-start space-x-3 py-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{formatAddress(contact)}</p>
                  <p className="text-xs text-gray-500">Address</p>
                </div>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Company */}
        {contact.company && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-center space-x-3 py-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">{contact.company}</p>
                  {contact.job_title && (
                    <p className="text-sm text-gray-600">{contact.job_title}</p>
                  )}
                  <p className="text-xs text-gray-500">Work</p>
                </div>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Birthday */}
        {contact.birthday && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-center space-x-3 py-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">
                    {new Date(contact.birthday).toLocaleDateString()}
                    {calculateAge(contact.birthday) && (
                      <span className="text-gray-500 ml-2">
                        (Age {calculateAge(contact.birthday)})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Birthday</p>
                </div>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Website */}
        {contact.website && (
          <div className="bg-white">
            <MobileContainer>
              <div className="flex items-center space-x-3 py-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-blue-600">{contact.website}</p>
                  <p className="text-xs text-gray-500">Website</p>
                </div>
              </div>
            </MobileContainer>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="bg-white">
            <MobileContainer>
              <div className="py-3">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{contact.notes}</p>
              </div>
            </MobileContainer>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 mb-8">
        <MobileContainer>
          <div className="space-y-3">
            <button
              onClick={() => onShare(contact)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
            >
              <Share className="w-5 h-5" />
              <span>Share Contact</span>
            </button>

            {onFavorite && (
              <button
                onClick={() => onFavorite(contact)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:bg-gray-300"
              >
                <Heart className="w-5 h-5" />
                <span>Add to Favorites</span>
              </button>
            )}

            <button
              onClick={() => onDelete(contact)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Contact</span>
            </button>
          </div>
        </MobileContainer>
      </div>
    </div>
  );
};

export default MobileContactDetail;
