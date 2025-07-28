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
type TabType = 'overview' | 'details' | 'address' | 'social' | 'notes' | 'groups';

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
    const urlFields: (keyof Contact)[] = ['website', 'linkedin', 'twitter', 'facebook', 'instagram'];
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
        website: editedContact.website,
        linkedin: editedContact.linkedin,
        twitter: editedContact.twitter,
        facebook: editedContact.facebook,
        instagram: editedContact.instagram,
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
            { id: 'groups', name: 'Groups', icon: Users }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Birthday
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
                  <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                    {editedContact.birthday
                      ? new Date(editedContact.birthday).toLocaleDateString()
                      : 'Not provided'
                    }
                  </p>
                )}
                {errors.birthday && (
                  <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
                )}
              </div>
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
            {editedContact.Groups && editedContact.Groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editedContact.Groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="font-medium text-indigo-900">{group.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">This contact is not assigned to any groups</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetail;
