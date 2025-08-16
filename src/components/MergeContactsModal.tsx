import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { contactsApi } from '../api';
import { X, User, Mail, Phone, Building, MapPin, Calendar, Globe, FileText, AlertTriangle, Check } from 'lucide-react';

interface MergeContactsModalProps {
  contacts: Contact[];
  onClose: () => void;
  onMergeComplete: () => void;
}

interface MergedContact {
  [key: string]: any;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  birthday?: string;
  website?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  snapchat?: string;
  discord?: string;
  spotify?: string;
  apple_music?: string;
  github?: string;
  behance?: string;
  dribbble?: string;
  company?: string;
  job_title?: string;
  role?: string;
  notes?: string;
  profile_image_url?: string;
}

const MergeContactsModal: React.FC<MergeContactsModalProps> = ({
  contacts,
  onClose,
  onMergeComplete
}) => {
  const [mergedContact, setMergedContact] = useState<MergedContact>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize merged contact with intelligent field selection
  useEffect(() => {
    if (contacts.length !== 2) return;

    const [contact1, contact2] = contacts;
    const merged: MergedContact = {};

    // Define field priorities and merge logic
    const fieldMergeRules = {
      // Core identity - prefer non-empty, longer values
      first_name: selectBestValue(contact1.first_name, contact2.first_name),
      last_name: selectBestValue(contact1.last_name, contact2.last_name),
      nickname: selectBestValue(contact1.nickname, contact2.nickname),
      
      // Contact info - prefer non-empty values
      email: selectBestValue(contact1.email, contact2.email),
      phone: selectBestValue(contact1.phone, contact2.phone),
      
      // Address - prefer complete addresses
      address_street: selectBestValue(contact1.address_street, contact2.address_street),
      address_city: selectBestValue(contact1.address_city, contact2.address_city),
      address_state: selectBestValue(contact1.address_state, contact2.address_state),
      address_zip: selectBestValue(contact1.address_zip, contact2.address_zip),
      address_country: selectBestValue(contact1.address_country, contact2.address_country),
      
      // Personal info
      birthday: selectBestValue(contact1.birthday, contact2.birthday),
      website: selectBestValue(contact1.website, contact2.website),
      
      // Social media
      facebook: selectBestValue(contact1.facebook, contact2.facebook),
      twitter: selectBestValue(contact1.twitter, contact2.twitter),
      linkedin: selectBestValue(contact1.linkedin, contact2.linkedin),
      instagram: selectBestValue(contact1.instagram, contact2.instagram),
      youtube: selectBestValue(contact1.youtube, contact2.youtube),
      tiktok: selectBestValue(contact1.tiktok, contact2.tiktok),
      snapchat: selectBestValue(contact1.snapchat, contact2.snapchat),
      discord: selectBestValue(contact1.discord, contact2.discord),
      spotify: selectBestValue(contact1.spotify, contact2.spotify),
      apple_music: selectBestValue(contact1.apple_music, contact2.apple_music),
      github: selectBestValue(contact1.github, contact2.github),
      behance: selectBestValue(contact1.behance, contact2.behance),
      dribbble: selectBestValue(contact1.dribbble, contact2.dribbble),
      
      // Professional info
      company: selectBestValue(contact1.company, contact2.company),
      job_title: selectBestValue(contact1.job_title, contact2.job_title),
      role: selectBestValue(contact1.role, contact2.role),
      
      // Notes - merge both if different
      notes: mergeNotes(contact1.notes, contact2.notes),
      
      // Profile image - prefer non-empty
      profile_image_url: selectBestValue(contact1.profile_image_url, contact2.profile_image_url)
    };

    setMergedContact(fieldMergeRules);
  }, [contacts]);

  // Helper function to select the best value between two options
  function selectBestValue(value1?: string, value2?: string): string | undefined {
    if (!value1 && !value2) return undefined;
    if (!value1) return value2;
    if (!value2) return value1;
    
    // Prefer longer, more complete values
    if (value1.length > value2.length) return value1;
    if (value2.length > value1.length) return value2;
    
    // If same length, prefer the first one
    return value1;
  }

  // Helper function to merge notes intelligently
  function mergeNotes(notes1?: string, notes2?: string): string | undefined {
    if (!notes1 && !notes2) return undefined;
    if (!notes1) return notes2;
    if (!notes2) return notes1;
    
    // If notes are the same, return one
    if (notes1.trim() === notes2.trim()) return notes1;
    
    // Merge different notes with separator
    return `${notes1.trim()}\n\n--- Merged from second contact ---\n${notes2.trim()}`;
  }

  // Handle field value change
  const handleFieldChange = (field: string, value: string) => {
    setMergedContact(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  // Handle merge submission
  const handleMerge = async () => {
    if (contacts.length !== 2) {
      setError('Exactly 2 contacts must be selected for merging');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the first contact as the primary (keep its ID)
      const primaryContact = contacts[0];
      const secondaryContact = contacts[1];

      // Update the primary contact with merged data
      const updatedContact = {
        ...mergedContact,
        id: primaryContact.id
      };

      await contactsApi.updateContact(primaryContact.id, updatedContact);
      
      // Delete the secondary contact
      await contactsApi.deleteContact(secondaryContact.id);

      setSuccess(`Successfully merged contacts. Kept "${primaryContact.first_name} ${primaryContact.last_name}" and removed duplicate.`);
      
      // Close modal after success
      setTimeout(() => {
        onMergeComplete();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error merging contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to merge contacts');
    } finally {
      setLoading(false);
    }
  };

  // Render field comparison
  const renderFieldComparison = (
    field: keyof Contact,
    label: string,
    icon: React.ReactNode,
    type: 'text' | 'textarea' = 'text'
  ) => {
    const value1 = contacts[0]?.[field] as string;
    const value2 = contacts[1]?.[field] as string;
    const mergedValue = mergedContact[field] as string;
    const hasConflict = value1 && value2 && value1 !== value2;

    if (!value1 && !value2) return null;

    return (
      <div className="mb-4">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          {icon}
          <span className="ml-2">{label}</span>
          {hasConflict && (
            <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" title="Conflicting values" />
          )}
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Contact 1 value */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Contact 1</div>
            <div className="p-2 bg-gray-50 rounded text-sm min-h-[2rem] flex items-center">
              {value1 || <span className="text-gray-400 italic">Empty</span>}
            </div>
          </div>
          
          {/* Contact 2 value */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Contact 2</div>
            <div className="p-2 bg-gray-50 rounded text-sm min-h-[2rem] flex items-center">
              {value2 || <span className="text-gray-400 italic">Empty</span>}
            </div>
          </div>
          
          {/* Merged value (editable) */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Merged Result</div>
            {type === 'textarea' ? (
              <textarea
                value={mergedValue || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                rows={3}
                placeholder="Enter merged value..."
              />
            ) : (
              <input
                type="text"
                value={mergedValue || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Enter merged value..."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (contacts.length !== 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Merge Contacts</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Please select exactly 2 contacts to merge.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Merge Contacts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the merged contact information below
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm flex items-center">
                <Check className="w-4 h-4 mr-2" />
                {success}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Core Identity */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Core Identity</h3>
              {renderFieldComparison('first_name', 'First Name', <User className="w-4 h-4" />)}
              {renderFieldComparison('last_name', 'Last Name', <User className="w-4 h-4" />)}
              {renderFieldComparison('nickname', 'Nickname', <User className="w-4 h-4" />)}
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              {renderFieldComparison('email', 'Email', <Mail className="w-4 h-4" />)}
              {renderFieldComparison('phone', 'Phone', <Phone className="w-4 h-4" />)}
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
              {renderFieldComparison('address_street', 'Street', <MapPin className="w-4 h-4" />)}
              {renderFieldComparison('address_city', 'City', <MapPin className="w-4 h-4" />)}
              {renderFieldComparison('address_state', 'State', <MapPin className="w-4 h-4" />)}
              {renderFieldComparison('address_zip', 'ZIP Code', <MapPin className="w-4 h-4" />)}
              {renderFieldComparison('address_country', 'Country', <MapPin className="w-4 h-4" />)}
            </div>

            {/* Professional */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional</h3>
              {renderFieldComparison('company', 'Company', <Building className="w-4 h-4" />)}
              {renderFieldComparison('job_title', 'Job Title', <Building className="w-4 h-4" />)}
              {renderFieldComparison('role', 'Role', <Building className="w-4 h-4" />)}
            </div>

            {/* Personal */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal</h3>
              {renderFieldComparison('birthday', 'Birthday', <Calendar className="w-4 h-4" />)}
              {renderFieldComparison('website', 'Website', <Globe className="w-4 h-4" />)}
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
              {renderFieldComparison('linkedin', 'LinkedIn', <Globe className="w-4 h-4" />)}
              {renderFieldComparison('twitter', 'Twitter', <Globe className="w-4 h-4" />)}
              {renderFieldComparison('facebook', 'Facebook', <Globe className="w-4 h-4" />)}
              {renderFieldComparison('instagram', 'Instagram', <Globe className="w-4 h-4" />)}
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              {renderFieldComparison('notes', 'Notes', <FileText className="w-4 h-4" />, 'textarea')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Merging...
              </>
            ) : (
              'Merge Contacts'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeContactsModal;
