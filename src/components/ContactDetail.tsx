import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { contactsApi } from '../api';
import { Contact, Group, UpdateContactRequest } from '../types';
import {
  Edit3,
  Save,
  X,
  Plus,
  Search,
  Phone,
  Mail,
  User,
  Users,
  Check,
  Trash2,
  Filter,
  ArrowUpDown,
  FileText,
  MapPin,
  Briefcase,
  Share2,
  Globe,
  Calendar,
  Building2,
  Link,
  Info,
  Camera,
  Upload
} from "lucide-react";
import SocialMediaSection from "./SocialMediaSection";

// Tab type definition
type TabType = 'overview' | 'details' | 'address' | 'social' | 'notes' | 'groups' | 'activity';

// Component props interface
interface ContactDetailProps {
  contact: Contact;
  allGroups?: Group[];
  onUpdateContact?: (contact: Contact) => void;
  onAddToGroup?: (contactId: number, groupId: number) => void;
  onRemoveFromGroup?: (contactId: number, groupId: number) => void;
  onClose?: () => void;
  onContactUpdate?: (contact: Contact) => void;
  onContactDelete?: (contactId: number) => void;
}

// Age calculation utility function
const calculateAge = (birthday: string): number | null => {
  if (!birthday) return null;

  const birthDate = new Date(birthday);
  const today = new Date();

  // Check if the birth date is valid
  if (isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
};

// Form errors interface
interface FormErrors {
  [key: string]: string;
}

// Profile image state interface
interface ProfileImageState {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
}

const ContactDetail: React.FC<ContactDetailProps> = ({
  contact,
  allGroups = [],
  onUpdateContact,
  onAddToGroup,
  onRemoveFromGroup,
  onClose,
  onContactUpdate,
  onContactDelete
}) => {
  // State Management
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    preview: null,
    isUploading: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize contact data
  useEffect(() => {
    if (contact) {
      setEditedContact({ ...contact });
      setContactId(contact.id);
      setProfileImage(prev => ({
        ...prev,
        preview: contact.profile_image_url || null
      }));
    }
  }, [contact]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!editedContact) return false;

    // At least one of first_name, last_name, or email is required
    if (!editedContact.first_name?.trim() && !editedContact.last_name?.trim() && !editedContact.email?.trim()) {
      newErrors.general = 'At least one of first name, last name, or email is required';
    }

    // Email validation
    if (editedContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedContact.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (editedContact.phone && !/^[\d\s+()-]{10,}$/.test(editedContact.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // URL validations
    const urlFields: (keyof Contact)[] = [
      'website', 'linkedin', 'twitter', 'facebook', 'instagram',
      'youtube', 'tiktok', 'snapchat', 'discord', 'spotify',
      'apple_music', 'github', 'behance', 'dribbble'
    ];
    urlFields.forEach(field => {
      const value = editedContact[field];
      if (value && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          newErrors[field] = `Please enter a valid URL for ${field}`;
        }
      }
    });

    // Birthday validation
    if (editedContact.birthday) {
      const date = new Date(editedContact.birthday);
      const now = new Date();
      if (date > now) {
        newErrors.birthday = 'Birthday cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    
    if (!editedContact) return;

    setEditedContact(prev => prev ? {
      ...prev,
      [name]: value
    } : null);

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle profile image selection
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage({
        file,
        preview: e.target?.result as string,
        isUploading: false
      });
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSave = async (): Promise<void> => {
    if (!editedContact || !validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      // Prepare update data
      const updateData: UpdateContactRequest = {
        first_name: editedContact.first_name,
        last_name: editedContact.last_name,
        email: editedContact.email,
        phone: editedContact.phone,
        company: editedContact.company,
        job_title: editedContact.job_title,
        role: editedContact.role,
        website: editedContact.website,
        linkedin: editedContact.linkedin,
        twitter: editedContact.twitter,
        facebook: editedContact.facebook,
        instagram: editedContact.instagram,
        youtube: editedContact.youtube,
        tiktok: editedContact.tiktok,
        snapchat: editedContact.snapchat,
        discord: editedContact.discord,
        spotify: editedContact.spotify,
        apple_music: editedContact.apple_music,
        github: editedContact.github,
        behance: editedContact.behance,
        dribbble: editedContact.dribbble,
        birthday: editedContact.birthday,
        address_street: editedContact.address_street,
        address_city: editedContact.address_city,
        address_state: editedContact.address_state,
        address_zip: editedContact.address_zip,
        address_country: editedContact.address_country,
        notes: editedContact.notes
      };

      // Update contact
      const updatedContact = await contactsApi.updateContact(editedContact.id, updateData);

      // Upload profile image if changed
      if (profileImage.file) {
        setProfileImage(prev => ({ ...prev, isUploading: true }));
        try {
          await contactsApi.uploadProfileImage(editedContact.id, profileImage.file);
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Don't fail the entire operation for image upload errors
        }
        setProfileImage(prev => ({ ...prev, isUploading: false }));
      }

      // Call the appropriate callback
      const callback = onContactUpdate || onUpdateContact;
      if (callback) {
        callback(updatedContact);
      }

      setEditMode(false);
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to update contact');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = (): void => {
    setEditedContact({ ...contact });
    setEditMode(false);
    setErrors({});
    setProfileImage({
      file: null,
      preview: contact?.profile_image_url || null,
      isUploading: false
    });
  };

  // Delete contact
  const handleDelete = async (): Promise<void> => {
    if (!contact || !window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await contactsApi.deleteContact(contact.id);
      
      if (onContactDelete) {
        onContactDelete(contact.id);
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete contact');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove profile image
  const removeProfileImage = (): void => {
    setProfileImage({
      file: null,
      preview: null,
      isUploading: false
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!contact || !editedContact) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No contact selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {editMode ? 'Edit Contact' : 'Contact Details'}
          </h2>
          {editMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Editing
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {editMode ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', icon: User },
            { id: 'details', name: 'Details', icon: Info },
            { id: 'address', name: 'Address', icon: MapPin },
            { id: 'social', name: 'Social', icon: Share2 },
            { id: 'notes', name: 'Notes', icon: FileText },
            { id: 'groups', name: 'Groups', icon: Users },
            { id: 'activity', name: 'Activity', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                {profileImage.preview ? (
                  <div className="relative">
                    <img
                      src={profileImage.preview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                    />
                    {profileImage.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                    {editMode && (
                      <button
                        type="button"
                        onClick={removeProfileImage}
                        disabled={profileImage.isUploading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:cursor-not-allowed shadow-lg"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border-4 border-gray-200 shadow-lg">
                    <User className="h-16 w-16 text-indigo-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {editedContact.first_name || editedContact.last_name
                      ? `${editedContact.first_name || ''} ${editedContact.last_name || ''}`.trim()
                      : 'Unnamed Contact'
                    }
                  </h1>
                  {editedContact.job_title && (
                    <p className="text-xl text-gray-600 mb-1">{editedContact.job_title}</p>
                  )}
                  {editedContact.company && (
                    <p className="text-lg text-gray-500 flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      {editedContact.company}
                    </p>
                  )}
                </div>

                {editMode && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={profileImage.isUploading}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {profileImage.preview ? 'Change Photo' : 'Add Photo'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Email */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                    Email
                  </label>
                </div>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={editedContact.email || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter email address"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium">{editedContact.email || 'Not provided'}</p>
                    {editedContact.email && (
                      <a
                        href={`mailto:${editedContact.email}`}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-indigo-500" />
                    Phone
                  </label>
                </div>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editedContact.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium">{editedContact.phone || 'Not provided'}</p>
                    {editedContact.phone && (
                      <a
                        href={`tel:${editedContact.phone}`}
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Company/Job Title/Role */}
              {(editedContact.company || editedContact.job_title || editedContact.role) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
                      Professional Info
                    </label>
                  </div>
                  <div className="space-y-1">
                    {editedContact.job_title && (
                      <p className="text-gray-900 font-medium">{editedContact.job_title}</p>
                    )}
                    {editedContact.role && (
                      <p className="text-indigo-600 font-medium text-sm">{editedContact.role}</p>
                    )}
                    {editedContact.company && (
                      <p className="text-gray-600">{editedContact.company}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Website */}
              {editedContact.website && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-indigo-500" />
                      Website
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium truncate">{editedContact.website}</p>
                    <a
                      href={editedContact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                    >
                      <Link className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Birthday & Age */}
              {editedContact.birthday && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                      Birthday
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium">
                      {new Date(editedContact.birthday).toLocaleDateString()}
                    </p>
                    {(() => {
                      const age = calculateAge(editedContact.birthday);
                      return age !== null ? (
                        <p className="text-sm text-gray-600">
                          {age} year{age !== 1 ? 's' : ''} old
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Address Summary */}
              {(editedContact.address_city || editedContact.address_state || editedContact.address_country) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                      Location
                    </label>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {[editedContact.address_city, editedContact.address_state, editedContact.address_country]
                      .filter(Boolean)
                      .join(', ')
                    }
                  </p>
                </div>
              )}

              {/* Groups Summary */}
              {editedContact.Groups && editedContact.Groups.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-indigo-500" />
                      Groups ({editedContact.Groups.length})
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {editedContact.Groups.slice(0, 3).map((group) => (
                      <span
                        key={group.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {group.name}
                      </span>
                    ))}
                    {editedContact.Groups.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{editedContact.Groups.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Quick Links */}
            {(editedContact.linkedin || editedContact.twitter || editedContact.facebook || editedContact.instagram ||
              editedContact.youtube || editedContact.tiktok || editedContact.snapchat || editedContact.discord ||
              editedContact.spotify || editedContact.apple_music || editedContact.github || editedContact.behance ||
              editedContact.dribbble) && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Share2 className="h-5 w-5 mr-2" />
                  Social Media
                </h3>
                <div className="flex flex-wrap gap-3">
                  {editedContact.linkedin && (
                    <a
                      href={editedContact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  )}
                  {editedContact.twitter && (
                    <a
                      href={editedContact.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-sky-300 rounded-md text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Twitter
                    </a>
                  )}
                  {editedContact.facebook && (
                    <a
                      href={editedContact.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Facebook
                    </a>
                  )}
                  {editedContact.instagram && (
                    <a
                      href={editedContact.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-pink-300 rounded-md text-sm font-medium text-pink-700 bg-pink-50 hover:bg-pink-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  )}
                  {editedContact.youtube && (
                    <a
                      href={editedContact.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      YouTube
                    </a>
                  )}
                  {editedContact.github && (
                    <a
                      href={editedContact.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  )}
                  {editedContact.spotify && (
                    <a
                      href={editedContact.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Spotify
                    </a>
                  )}
                  {editedContact.discord && (
                    <a
                      href={editedContact.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Discord
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Notes Preview */}
            {editedContact.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm line-clamp-3">
                    {editedContact.notes}
                  </p>
                  {editedContact.notes.length > 150 && (
                    <button
                      onClick={() => setActiveTab('notes')}
                      className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Read more →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="first_name"
                    value={editedContact.first_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter first name"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.first_name || 'Not provided'}</p>
                )}
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="last_name"
                    value={editedContact.last_name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter last name"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.last_name || 'Not provided'}</p>
                )}
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Company
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="company"
                    value={editedContact.company || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter company name"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.company || 'Not provided'}</p>
                )}
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Job Title
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="job_title"
                    value={editedContact.job_title || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter job title"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.job_title || 'Not provided'}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Role
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="role"
                    value={editedContact.role || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Music Publisher, Client, Vendor, Partner"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.role || 'Not provided'}</p>
                )}
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Website
                </label>
                {editMode ? (
                  <input
                    type="url"
                    name="website"
                    value={editedContact.website || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com"
                  />
                ) : (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{editedContact.website || 'Not provided'}</p>
                    {editedContact.website && (
                      <a
                        href={editedContact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                      >
                        <Link className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              {/* Birthday & Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Birthday & Age
                </label>
                {editMode ? (
                  <input
                    type="date"
                    name="birthday"
                    value={editedContact.birthday || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <div className="py-2 px-3 bg-gray-50 rounded-md">
                    {editedContact.birthday ? (
                      <div className="space-y-1">
                        <p className="text-gray-900 font-medium">
                          {new Date(editedContact.birthday).toLocaleDateString()}
                        </p>
                        {(() => {
                          const age = calculateAge(editedContact.birthday);
                          return age !== null ? (
                            <p className="text-sm text-gray-600">
                              {age} year{age !== 1 ? 's' : ''} old
                            </p>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-900">Not provided</p>
                    )}
                  </div>
                )}
                {errors.birthday && (
                  <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
                )}
              </div>

              {/* Age (calculated field - read-only) */}
              {editedContact.birthday && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Current Age
                  </label>
                  <div className="py-2 px-3 bg-blue-50 rounded-md border border-blue-200">
                    {(() => {
                      const age = calculateAge(editedContact.birthday);
                      return age !== null ? (
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-blue-600 mr-2">{age}</span>
                          <span className="text-blue-700">year{age !== 1 ? 's' : ''} old</span>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Unable to calculate age</p>
                      );
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Automatically calculated from birthday
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="address_street"
                    value={editedContact.address_street || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter street address"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.address_street || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="address_city"
                    value={editedContact.address_city || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter city"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.address_city || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="address_state"
                    value={editedContact.address_state || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter state or province"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.address_state || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="address_zip"
                    value={editedContact.address_zip || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter ZIP or postal code"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.address_zip || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="address_country"
                    value={editedContact.address_country || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter country"
                  />
                ) : (
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{editedContact.address_country || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="p-6">
            <SocialMediaSection
              contact={editedContact}
              editMode={editMode}
              onInputChange={handleInputChange}
              errors={errors}
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              {editMode ? (
                <textarea
                  name="notes"
                  rows={8}
                  value={editedContact.notes || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add any additional notes about this contact..."
                />
              ) : (
                <div className="bg-gray-50 rounded-md p-4 min-h-[200px]">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {editedContact.notes || 'No notes available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="p-6">
            {/* Add to Group Section */}
            {editMode && allGroups && allGroups.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add to Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {allGroups
                    .filter(group => !editedContact.Groups?.some(g => g.id === group.id))
                    .map((group) => (
                      <button
                        key={group.id}
                        onClick={() => onAddToGroup && onAddToGroup(editedContact.id, group.id)}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {group.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Current Groups */}
            {editedContact.Groups && editedContact.Groups.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Current Groups</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editedContact.Groups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-indigo-600 mr-2" />
                          <span className="font-medium text-indigo-900">{group.name}</span>
                        </div>
                        {editMode && onRemoveFromGroup && (
                          <button
                            onClick={() => onRemoveFromGroup(editedContact.id, group.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove from group"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">This contact is not assigned to any groups</p>
                {editMode && allGroups && allGroups.length > 0 && (
                  <p className="text-sm text-gray-400">Use the "Add to Groups" section above to assign this contact to groups</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Contact ID:</span>
                    <span className="ml-2 font-mono text-gray-900">#{editedContact.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">User ID:</span>
                    <span className="ml-2 font-mono text-gray-900">#{editedContact.user_id}</span>
                  </div>
                  {editedContact.created_at && (
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(editedContact.created_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {editedContact.updated_at && (
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(editedContact.updated_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {editedContact.email && (
                    <a
                      href={`mailto:${editedContact.email}`}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  )}
                  {editedContact.phone && (
                    <a
                      href={`tel:${editedContact.phone}`}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  )}
                  {editedContact.website && (
                    <a
                      href={editedContact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  )}
                  {editedContact.linkedin && (
                    <a
                      href={editedContact.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* Contact Statistics */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {editedContact.Groups?.length || 0}
                    </div>
                    <div className="text-sm text-indigo-700">Groups</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {editedContact.created_at
                        ? Math.floor((Date.now() - new Date(editedContact.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      }
                    </div>
                    <div className="text-sm text-green-700">Days Since Added</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {[
                        editedContact.email,
                        editedContact.phone,
                        editedContact.website,
                        editedContact.linkedin,
                        editedContact.twitter,
                        editedContact.facebook,
                        editedContact.instagram,
                        editedContact.youtube,
                        editedContact.tiktok,
                        editedContact.snapchat,
                        editedContact.discord,
                        editedContact.spotify,
                        editedContact.apple_music,
                        editedContact.github,
                        editedContact.behance,
                        editedContact.dribbble
                      ].filter(Boolean).length}
                    </div>
                    <div className="text-sm text-purple-700">Contact Methods</div>
                  </div>
                  {editedContact.birthday && (
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {calculateAge(editedContact.birthday) || '?'}
                      </div>
                      <div className="text-sm text-orange-700">Years Old</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Completeness */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Profile Completeness</h4>
                {(() => {
                  const fields = [
                    'first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'role',
                    'address_street', 'address_city', 'website', 'birthday', 'notes'
                  ];
                  const filledFields = fields.filter(field => editedContact[field as keyof Contact]);
                  const completeness = Math.round((filledFields.length / fields.length) * 100);

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          {filledFields.length} of {fields.length} fields completed
                        </span>
                        <span className="text-sm font-medium text-gray-900">{completeness}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetail;
