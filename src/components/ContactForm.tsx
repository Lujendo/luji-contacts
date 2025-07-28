import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { contactsApi } from '../api';
import { Contact, Group, CreateContactRequest } from '../types';
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
  ChevronRight
} from 'lucide-react';

// Component props interface
interface ContactFormProps {
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
}

const ContactForm: React.FC<ContactFormProps> = ({
  onClose,
  onContactCreated,
  onContactAdded, // Legacy support
  groups = [],
  isLoading = false,
  initialData,
  isEditing = false
}) => {
  // Refs
  const firstNameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmitting = useRef<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateContactRequest>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    birthday: initialData?.birthday || '',
    website: initialData?.website || '',
    address_street: initialData?.address_street || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_zip: initialData?.address_zip || '',
    address_country: initialData?.address_country || '',
    company: initialData?.company || '',
    job_title: initialData?.job_title || '',
    role: initialData?.role || '',
    linkedin: initialData?.linkedin || '',
    twitter: initialData?.twitter || '',
    facebook: initialData?.facebook || '',
    instagram: initialData?.instagram || '',
    notes: initialData?.notes || ''
  });

  // UI State
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<ProfileImageState>({
    file: null,
    preview: initialData?.profile_image_url || null,
    isUploading: false
  });
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Focus first input on mount
  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // At least one of first_name, last_name, or email is required
    if (!formData.first_name?.trim() && !formData.last_name?.trim() && !formData.email?.trim()) {
      newErrors.general = 'At least one of first name, last name, or email is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.phone && !/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // URL validations
    const urlFields: (keyof CreateContactRequest)[] = ['website', 'linkedin', 'twitter', 'facebook', 'instagram'];
    urlFields.forEach(field => {
      const value = formData[field];
      if (value && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          newErrors[field] = `Please enter a valid URL for ${field}`;
        }
      }
    });

    // Birthday validation
    if (formData.birthday) {
      const date = new Date(formData.birthday);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
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

    // Clear any previous image errors
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (isSubmitting.current || isSubmittingForm) return;
    
    if (!validateForm()) return;

    isSubmitting.current = true;
    setIsSubmittingForm(true);
    setErrors({});

    try {
      // Create the contact
      const newContact = await contactsApi.createContact(formData);

      // Upload profile image if selected
      if (profileImage.file && newContact.id) {
        setProfileImage(prev => ({ ...prev, isUploading: true }));
        try {
          await contactsApi.uploadProfileImage(newContact.id, profileImage.file);
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          // Don't fail the entire operation for image upload errors
        }
        setProfileImage(prev => ({ ...prev, isUploading: false }));
      }

      // Call the appropriate callback
      const callback = onContactCreated || onContactAdded;
      if (callback) {
        callback(newContact);
      }

      onClose();
    } catch (error) {
      console.error('Error creating contact:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create contact. Please try again.'
      });
    } finally {
      isSubmitting.current = false;
      setIsSubmittingForm(false);
    }
  };

  // Handle group selection
  const handleGroupToggle = (groupId: number): void => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
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

  // Trigger file input
  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmittingForm}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Profile Image Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profileImage.preview ? (
                    <div className="relative">
                      <img
                        src={profileImage.preview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                      />
                      {profileImage.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={removeProfileImage}
                        disabled={profileImage.isUploading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:cursor-not-allowed"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={profileImage.isUploading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {profileImage.preview ? 'Change Image' : 'Upload Image'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF up to 5MB
                  </p>
                </div>
              </div>
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  First Name
                </label>
                <input
                  ref={firstNameRef}
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name || ''}
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
                  <User className="inline h-4 w-4 mr-1" />
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleInputChange}
                  disabled={isSubmittingForm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  disabled={isSubmittingForm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  disabled={isSubmittingForm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company || ''}
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
                  value={formData.job_title || ''}
                  onChange={handleInputChange}
                  disabled={isSubmittingForm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter job title"
                />
                {errors.job_title && (
                  <p className="mt-1 text-sm text-red-600">{errors.job_title}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleInputChange}
                  disabled={isSubmittingForm}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g., Music Publisher, Client, Vendor, Partner"
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Fields</span>
                <ChevronRight className={`ml-1 h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-6">
                {/* Address Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="address_street"
                        name="address_street"
                        value={formData.address_street || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter street address"
                      />
                    </div>

                    <div>
                      <label htmlFor="address_city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="address_city"
                        name="address_city"
                        value={formData.address_city || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter city"
                      />
                    </div>

                    <div>
                      <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="address_state"
                        name="address_state"
                        value={formData.address_state || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter state or province"
                      />
                    </div>

                    <div>
                      <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP/Postal Code
                      </label>
                      <input
                        type="text"
                        id="address_zip"
                        name="address_zip"
                        value={formData.address_zip || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter ZIP or postal code"
                      />
                    </div>

                    <div>
                      <label htmlFor="address_country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        id="address_country"
                        name="address_country"
                        value={formData.address_country || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media & Web */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Share2 className="h-5 w-5 mr-2" />
                    Social Media & Web
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                        <Globe className="inline h-4 w-4 mr-1" />
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://example.com"
                      />
                      {errors.website && (
                        <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                        <Share2 className="inline h-4 w-4 mr-1" />
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://linkedin.com/in/username"
                      />
                      {errors.linkedin && (
                        <p className="mt-1 text-sm text-red-600">{errors.linkedin}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                        <Share2 className="inline h-4 w-4 mr-1" />
                        Twitter
                      </label>
                      <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={formData.twitter || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://twitter.com/username"
                      />
                      {errors.twitter && (
                        <p className="mt-1 text-sm text-red-600">{errors.twitter}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                        <Share2 className="inline h-4 w-4 mr-1" />
                        Facebook
                      </label>
                      <input
                        type="url"
                        id="facebook"
                        name="facebook"
                        value={formData.facebook || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://facebook.com/username"
                      />
                      {errors.facebook && (
                        <p className="mt-1 text-sm text-red-600">{errors.facebook}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                        <Share2 className="inline h-4 w-4 mr-1" />
                        Instagram
                      </label>
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={formData.instagram || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="https://instagram.com/username"
                      />
                      {errors.instagram && (
                        <p className="mt-1 text-sm text-red-600">{errors.instagram}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Birthday
                      </label>
                      <input
                        type="date"
                        id="birthday"
                        name="birthday"
                        value={formData.birthday || ''}
                        onChange={handleInputChange}
                        disabled={isSubmittingForm}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {errors.birthday && (
                        <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
                      )}
                    </div>
                  </div>
                </div>

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
                    value={formData.notes || ''}
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
            )}
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
    </div>
  );
};

export default ContactForm;
