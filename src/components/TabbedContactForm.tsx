import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { contactsApi } from '../api';
import { Contact, Group, CreateContactRequest } from '../types';
import Tabs, { TabItem } from './ui/Tabs';
import {
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Share2,
  Globe,
  Building2,
  FileText,
  X,
  Camera,
  Upload,
  Check,
  UserCircle,
  ContactIcon
} from 'lucide-react';

// Component props interface
interface TabbedContactFormProps {
  onClose: () => void;
  onContactCreated?: (contact: Contact) => void;
  onContactAdded?: (contact: Contact) => void; // Legacy prop name for backward compatibility
  groups?: Group[];
  isLoading?: boolean;
  initialData?: Partial<Contact>;
  isEditing?: boolean;
}

// Form validation interface
interface FormErrors {
  [key: string]: string;
}

// Profile image state interface
interface ProfileImageState {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  progress: number;
}

const TabbedContactForm: React.FC<TabbedContactFormProps> = ({
  onClose,
  onContactCreated,
  onContactAdded, // Legacy support
  groups = [],
  isLoading = false,
  initialData = {},
  isEditing = false
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateContactRequest>({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    company: initialData.company || '',
    job_title: initialData.job_title || '',
    website: initialData.website || '',
    linkedin: initialData.linkedin || '',
    twitter: initialData.twitter || '',
    facebook: initialData.facebook || '',
    instagram: initialData.instagram || '',
    birthday: initialData.birthday || '',
    address_street: initialData.address_street || '',
    address_city: initialData.address_city || '',
    address_state: initialData.address_state || '',
    address_zip: initialData.address_zip || '',
    address_country: initialData.address_country || '',
    notes: initialData.notes || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    preview: initialData?.profile_image_url || null,
    isUploading: false,
    progress: 0
  });
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>('basic');

  // Refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount
  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  }, []);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle group toggle
  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Handle profile image selection
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profile_image: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (10MB limit - will be compressed automatically)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profile_image: 'Image size must be less than 10MB' }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage({
          file,
          preview: e.target?.result as string,
          isUploading: false,
          progress: 0
        });
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      setErrors(prev => ({ ...prev, profile_image: '' }));
    }
  };

  // Remove profile image
  const handleImageRemove = () => {
    setProfileImage({
      file: null,
      preview: null,
      isUploading: false,
      progress: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // At least one of first name, last name, or email is required
    if (!formData.first_name.trim() && !formData.last_name.trim() && !formData.email.trim()) {
      newErrors.general = 'Please provide at least a first name, last name, or email address';
    }

    // Email validation
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (formData.phone.trim()) {
      const phoneRegex = /^[\d\s+()-]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmittingForm(true);
    setErrors({});

    try {
      let contact: Contact;

      if (isEditing && initialData.id) {
        // Update existing contact
        contact = await contactsApi.updateContact(initialData.id, formData);
      } else {
        // Create new contact
        contact = await contactsApi.createContact(formData);
      }

      // Upload profile image if provided
      if (profileImage.file && contact.id) {
        try {
          setProfileImage(prev => ({ ...prev, isUploading: true, progress: 0 }));

          // Upload with progress tracking
          await contactsApi.uploadProfileImage(
            contact.id,
            profileImage.file,
            (progress) => {
              setProfileImage(prev => ({ ...prev, progress }));
            }
          );

          // Refresh contact data to get updated profile image URL
          contact = await contactsApi.getContact(contact.id);
          setProfileImage(prev => ({ ...prev, progress: 100 }));
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          setErrors(prev => ({ ...prev, profile_image: 'Failed to upload profile image. Please try again.' }));
          // Don't fail the entire operation for image upload errors
        } finally {
          setProfileImage(prev => ({ ...prev, isUploading: false, progress: 0 }));
        }
      }

      // Call the appropriate callback
      const callback = onContactCreated || onContactAdded;
      if (callback) {
        callback(contact);
      }

      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save contact'
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Tab configuration
  const tabs: TabItem[] = [
    {
      id: 'basic',
      label: 'Basic Info',
      icon: <UserCircle className="h-5 w-5" />,
      content: <BasicInfoTab 
        formData={formData}
        errors={errors}
        profileImage={profileImage}
        isSubmittingForm={isSubmittingForm}
        firstNameRef={firstNameRef}
        fileInputRef={fileInputRef}
        handleInputChange={handleInputChange}
        handleImageSelect={handleImageSelect}
        handleImageRemove={handleImageRemove}
      />
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: <ContactIcon className="h-5 w-5" />,
      content: <ContactDetailsTab 
        formData={formData}
        errors={errors}
        isSubmittingForm={isSubmittingForm}
        handleInputChange={handleInputChange}
      />
    },
    {
      id: 'address',
      label: 'Address',
      icon: <MapPin className="h-5 w-5" />,
      content: <AddressTab 
        formData={formData}
        errors={errors}
        isSubmittingForm={isSubmittingForm}
        handleInputChange={handleInputChange}
      />
    },
    {
      id: 'social',
      label: 'Social Media',
      icon: <Share2 className="h-5 w-5" />,
      content: <SocialMediaTab 
        formData={formData}
        errors={errors}
        isSubmittingForm={isSubmittingForm}
        handleInputChange={handleInputChange}
      />
    },
    {
      id: 'notes',
      label: 'Notes & Groups',
      icon: <FileText className="h-5 w-5" />,
      content: <NotesGroupsTab 
        formData={formData}
        errors={errors}
        groups={groups}
        selectedGroups={selectedGroups}
        isSubmittingForm={isSubmittingForm}
        handleInputChange={handleInputChange}
        handleGroupToggle={handleGroupToggle}
      />
    }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Edit Contact' : 'Create New Contact'}
        </h2>
        <button
          onClick={onClose}
          className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        {/* General Error */}
        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Tabbed Content */}
        <div className="flex-1 px-6 py-4 overflow-hidden">
          <Tabs
            tabs={tabs}
            defaultTab="basic"
            onTabChange={setActiveTab}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingForm}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmittingForm || isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmittingForm ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Contact' : 'Create Contact'}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Tab Components
interface TabProps {
  formData: CreateContactRequest;
  errors: FormErrors;
  isSubmittingForm: boolean;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

interface BasicInfoTabProps extends TabProps {
  profileImage: ProfileImageState;
  firstNameRef: React.RefObject<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleImageRemove: () => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  errors,
  profileImage,
  isSubmittingForm,
  firstNameRef,
  fileInputRef,
  handleInputChange,
  handleImageSelect,
  handleImageRemove
}) => (
  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
    {/* Profile Image */}
    <div className="flex items-center space-x-6">
      <div className="relative">
        {profileImage.preview ? (
          <img
            src={profileImage.preview}
            alt="Profile preview"
            className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {profileImage.isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-xs font-medium">
              {profileImage.progress}%
            </div>
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmittingForm}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </button>
          {profileImage.preview && (
            <button
              type="button"
              onClick={handleImageRemove}
              disabled={isSubmittingForm}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <p className="mt-2 text-sm text-gray-500">
          Upload a profile photo (max 10MB - will be compressed automatically)
        </p>
        {profileImage.isUploading && (
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{profileImage.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${profileImage.progress}%` }}
              ></div>
            </div>
          </div>
        )}
        {errors.profile_image && (
          <p className="mt-1 text-sm text-red-600">{errors.profile_image}</p>
        )}
      </div>
    </div>

    {/* Name Fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          ref={firstNameRef}
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleInputChange}
          disabled={isSubmittingForm}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter first name"
        />
        {errors.first_name && (
          <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleInputChange}
          disabled={isSubmittingForm}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter last name"
        />
        {errors.last_name && (
          <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
        )}
      </div>
    </div>

    {/* Company and Job Title */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          <Building2 className="inline h-4 w-4 mr-1" />
          Company
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleInputChange}
          disabled={isSubmittingForm}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter company name"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600">{errors.company}</p>
        )}
      </div>

      <div>
        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
          <Briefcase className="inline h-4 w-4 mr-1" />
          Job Title
        </label>
        <input
          type="text"
          id="job_title"
          name="job_title"
          value={formData.job_title}
          onChange={handleInputChange}
          disabled={isSubmittingForm}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter job title"
        />
        {errors.job_title && (
          <p className="mt-1 text-sm text-red-600">{errors.job_title}</p>
        )}
      </div>
    </div>
  </div>
);

const ContactDetailsTab: React.FC<TabProps> = ({
  formData,
  errors,
  isSubmittingForm,
  handleInputChange
}) => (
  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
    {/* Email */}
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
        <Mail className="inline h-4 w-4 mr-1" />
        Email Address
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="Enter email address"
      />
      {errors.email && (
        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
      )}
    </div>

    {/* Phone */}
    <div>
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
        <Phone className="inline h-4 w-4 mr-1" />
        Phone Number
      </label>
      <input
        type="tel"
        id="phone"
        name="phone"
        value={formData.phone}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="Enter phone number"
      />
      {errors.phone && (
        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
      )}
    </div>

    {/* Website */}
    <div>
      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
        <Globe className="inline h-4 w-4 mr-1" />
        Website
      </label>
      <input
        type="url"
        id="website"
        name="website"
        value={formData.website}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="https://example.com"
      />
      {errors.website && (
        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
      )}
    </div>

    {/* Birthday */}
    <div>
      <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
        <Calendar className="inline h-4 w-4 mr-1" />
        Birthday
      </label>
      <input
        type="date"
        id="birthday"
        name="birthday"
        value={formData.birthday}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {errors.birthday && (
        <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
      )}
    </div>
  </div>
);

const AddressTab: React.FC<TabProps> = ({
  formData,
  errors,
  isSubmittingForm,
  handleInputChange
}) => (
  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
    <div className="grid grid-cols-1 gap-4">
      {/* Street Address */}
      <div>
        <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          type="text"
          id="address_street"
          name="address_street"
          value={formData.address_street}
          onChange={handleInputChange}
          disabled={isSubmittingForm}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Enter street address"
        />
        {errors.address_street && (
          <p className="mt-1 text-sm text-red-600">{errors.address_street}</p>
        )}
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            id="address_city"
            name="address_city"
            value={formData.address_city}
            onChange={handleInputChange}
            disabled={isSubmittingForm}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter city"
          />
          {errors.address_city && (
            <p className="mt-1 text-sm text-red-600">{errors.address_city}</p>
          )}
        </div>

        <div>
          <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
            State/Province
          </label>
          <input
            type="text"
            id="address_state"
            name="address_state"
            value={formData.address_state}
            onChange={handleInputChange}
            disabled={isSubmittingForm}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter state or province"
          />
          {errors.address_state && (
            <p className="mt-1 text-sm text-red-600">{errors.address_state}</p>
          )}
        </div>
      </div>

      {/* ZIP and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP/Postal Code
          </label>
          <input
            type="text"
            id="address_zip"
            name="address_zip"
            value={formData.address_zip}
            onChange={handleInputChange}
            disabled={isSubmittingForm}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter ZIP or postal code"
          />
          {errors.address_zip && (
            <p className="mt-1 text-sm text-red-600">{errors.address_zip}</p>
          )}
        </div>

        <div>
          <label htmlFor="address_country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            id="address_country"
            name="address_country"
            value={formData.address_country}
            onChange={handleInputChange}
            disabled={isSubmittingForm}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter country"
          />
          {errors.address_country && (
            <p className="mt-1 text-sm text-red-600">{errors.address_country}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const SocialMediaTab: React.FC<TabProps> = ({
  formData,
  errors,
  isSubmittingForm,
  handleInputChange
}) => (
  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
    {/* LinkedIn */}
    <div>
      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
        LinkedIn Profile
      </label>
      <input
        type="url"
        id="linkedin"
        name="linkedin"
        value={formData.linkedin}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="https://linkedin.com/in/username"
      />
      {errors.linkedin && (
        <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>
      )}
    </div>

    {/* Twitter */}
    <div>
      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
        Twitter Profile
      </label>
      <input
        type="url"
        id="twitter"
        name="twitter"
        value={formData.twitter}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="https://twitter.com/username"
      />
      {errors.twitter && (
        <p className="mt-1 text-sm text-red-600">{errors.twitter}</p>
      )}
    </div>

    {/* Facebook */}
    <div>
      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
        Facebook Profile
      </label>
      <input
        type="url"
        id="facebook"
        name="facebook"
        value={formData.facebook}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="https://facebook.com/username"
      />
      {errors.facebook && (
        <p className="mt-1 text-sm text-red-600">{errors.facebook}</p>
      )}
    </div>

    {/* Instagram */}
    <div>
      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
        Instagram Profile
      </label>
      <input
        type="url"
        id="instagram"
        name="instagram"
        value={formData.instagram}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="https://instagram.com/username"
      />
      {errors.instagram && (
        <p className="mt-1 text-sm text-red-600">{errors.instagram}</p>
      )}
    </div>
  </div>
);

interface NotesGroupsTabProps extends TabProps {
  groups: Group[];
  selectedGroups: number[];
  handleGroupToggle: (groupId: number) => void;
}

const NotesGroupsTab: React.FC<NotesGroupsTabProps> = ({
  formData,
  errors,
  groups,
  selectedGroups,
  isSubmittingForm,
  handleInputChange,
  handleGroupToggle
}) => (
  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
    {/* Notes */}
    <div>
      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
        <FileText className="inline h-4 w-4 mr-1" />
        Notes
      </label>
      <textarea
        id="notes"
        name="notes"
        rows={4}
        value={formData.notes}
        onChange={handleInputChange}
        disabled={isSubmittingForm}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="Add any additional notes about this contact..."
      />
      {errors.notes && (
        <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
      )}
    </div>

    {/* Groups */}
    {groups.length > 0 && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Users className="inline h-4 w-4 mr-1" />
          Groups
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {groups.map((group) => (
            <label key={group.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedGroups.includes(group.id)}
                onChange={() => handleGroupToggle(group.id)}
                disabled={isSubmittingForm}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-700">{group.name}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default TabbedContactForm;
