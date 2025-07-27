import React, { useState, useEffect, useRef } from 'react';
import {
  User,
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
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Camera,
  Upload,
  Link,
  Check
} from 'lucide-react';

const ContactForm = ({ onClose, onContactAdded, isLoading }) => {
  // Refs
  const firstNameRef = useRef(null);
  const fileInputRef = useRef(null);
  const isSubmitting = useRef(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birthday: '',
    website: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: '',
    company: '',
    job_title: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    notes: ''
  });

  // UI State
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Focus first input on mount
  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  }, []);

  // Helper function to calculate age
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Form Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if already submitting
    if (isSubmitting.current || isLoading) {
      console.log('Submission already in progress');
      return;
    }

    // Validate form
    if (!formData.first_name?.trim() || !formData.last_name?.trim()) {
      setError('First name and last name are required');
      return;
    }

    try {
      isSubmitting.current = true;
      setError('');

      // Clean form data
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData)
          .filter(([_, value]) => value?.trim?.())
          .map(([key, value]) => [key, value.trim()])
      );

      // If there's a profile image, add it to the cleaned data
      if (profileImage) {
        const formData = new FormData();
        formData.append('profile_image', profileImage);
        cleanedFormData.profile_image = formData;
      }

      // Submit to parent handler
      await onContactAdded(cleanedFormData);

    } catch (error) {
      console.error('Form submission error:', error);
      setError(error.response?.data?.message || 'Failed to create contact');
    } finally {
      isSubmitting.current = false;
    }
  };

  // ... continuing from previous part

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl m-4">
        {/* Form Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-lg z-30">
          <div className="px-4 py-4">
            {/* Title and Close */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="text-indigo-600" size={20} />
                Add New Contact
              </h2>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading || isSubmitting.current}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 
                         transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Section Navigation */}
            <div className="flex space-x-4 overflow-x-auto mt-4">
              {[
                { id: 'basic', label: 'Basic Info', icon: User },
                { id: 'professional', label: 'Professional', icon: Briefcase },
                { id: 'social', label: 'Social Media', icon: Share2 },
                { id: 'notes', label: 'Notes', icon: FileText }
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md
                    whitespace-nowrap transition-colors duration-200
                    ${activeSection === section.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <section.icon size={14} className="mr-1.5" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Profile Image Section */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-full overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center
                               opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center 
                             bg-gray-100 border-2 border-dashed cursor-pointer hover:bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={32} className="text-gray-400" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Click to {imagePreview ? 'change' : 'add'} profile picture
            </p>
          </div>

          {/* Form Content Placeholder - Will be filled with sections */}
<div className="space-y-4">
  {/* Basic Info Tab */}
  {activeSection === 'basic' && (
    <div className="space-y-4">
      {/* Basic Information Card */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
          <User className="mr-2 text-indigo-600" size={16} />
          Basic Information
        </h3>
{/* Basic Info Fields */}
<div className="space-y-4">
  {/* Name Fields */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        First Name <span className="text-red-500">*</span>
      </label>
      <input
        ref={firstNameRef}
        type="text"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        required
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter first name"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Last Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        required
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter last name"
      />
    </div>
  </div>

  {/* Contact Fields */}
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
      <div className="relative">
        <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="email@example.com"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
      <div className="relative">
        <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="+1 (123) 456-7890"
        />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">Birthday</label>
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
        <input
          type="text"
          value={calculateAge(formData.birthday) || 'N/A'}
          disabled
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent 
                  rounded-md cursor-default text-center"
        />
      </div>
    </div>
  </div>
</div>


      </div>

      {/* Address Card */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
          <MapPin className="mr-2 text-indigo-600" size={16} />
          Address
        </h3>
{/* Address Fields */}
<div className="space-y-4">
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Street Address
    </label>
    <input
      type="text"
      name="address_street"
      value={formData.address_street}
      onChange={handleChange}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      placeholder="Enter street address"
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
      <input
        type="text"
        name="address_city"
        value={formData.address_city}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter city"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        State/Province
      </label>
      <input
        type="text"
        name="address_state"
        value={formData.address_state}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter state/province"
      />
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Postal Code
      </label>
      <input
        type="text"
        name="address_zip"
        value={formData.address_zip}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter postal code"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
      <input
        type="text"
        name="address_country"
        value={formData.address_country}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter country"
      />
    </div>
  </div>
</div>
      </div>
    </div>
  )}

  {/* Professional Tab */}
  {activeSection === 'professional' && (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
        <Briefcase className="mr-2 text-indigo-600" size={16} />
        Professional Information
      </h3>
{/* Professional Info Fields */}
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Company
      </label>
      <div className="relative">
        <Building2 size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter company name"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Job Title
      </label>
      <div className="relative">
        <Briefcase size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          name="job_title"
          value={formData.job_title}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter job title"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Website
      </label>
      <div className="relative">
        <Globe size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://"
        />
      </div>
    </div>
  </div>
    </div>
  )}

  {/* Social Media Tab */}
  {activeSection === 'social' && (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
        <Share2 className="mr-2 text-indigo-600" size={16} />
        Social Media
      </h3>
{/* Social Media Fields */}
  <div className="space-y-4">
    {/* LinkedIn and Twitter Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          LinkedIn
        </label>
        <div className="relative">
          <Linkedin size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="LinkedIn profile URL"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Twitter
        </label>
        <div className="relative">
          <Twitter size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            name="twitter"
            value={formData.twitter}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="@username"
          />
        </div>
      </div>
    </div>

    {/* Facebook and Instagram Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Facebook
        </label>
        <div className="relative">
          <Facebook size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            name="facebook"
            value={formData.facebook}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Facebook profile URL"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Instagram
        </label>
        <div className="relative">
          <Instagram size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            name="instagram"
            value={formData.instagram}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="@username"
          />
        </div>
      </div>
    </div>
  </div>
    </div>
  )}

  {/* Notes Tab */}
  {activeSection === 'notes' && (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
        <FileText className="mr-2 text-indigo-600" size={16} />
        Notes
      </h3>
{/* Notes Fields */}
  <div className="space-y-4">
    <div>
      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        rows="6"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                resize-y min-h-[150px]"
        placeholder="Add notes about this contact..."
      />
      <p className="mt-2 text-xs text-gray-500">
        Add any additional information or notes about this contact that might be helpful.
      </p>
    </div>
  </div>
    </div>
  )}
</div>


          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isSubmitting.current}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                       rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitting.current}
              className={`flex items-center px-4 py-2 text-sm font-medium text-white 
                       bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none 
                       focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                       ${(isLoading || isSubmitting.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading || isSubmitting.current ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Contact...
                </>
              ) : (
                'Create Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;