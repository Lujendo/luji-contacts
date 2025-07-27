import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
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
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Info,
} from "lucide-react"
import SocialMediaSection from "./SocialMediaSection"
import { Camera, Upload } from "lucide-react"

const ContactDetail = ({ contact, allGroups, onUpdateContact, onAddToGroup, onRemoveFromGroup }) => {
  // State Management
  const [editMode, setEditMode] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
    const [error, setError] = useState('');

  useEffect(() => {
  if (error) {
    const timer = setTimeout(() => {
      setError('');
    }, 5000); // Message will disappear after 5 seconds

    return () => clearTimeout(timer);
  }
  }, [error]);


  const [loading, setLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  // Calculate age function
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

  // Initialize Contact Data
  useEffect(() => {
    if (contact) {
      console.log('ContactDetail received contact:', contact); // Debug log
      setEditedContact({
        ...contact,
        Groups: contact.Groups || [],
        age: calculateAge(contact.birthday)
      });
      setProfileImage(contact.profile_image_url);
      setError('');
      setEditMode(false);
    }
  }, [contact]);

  // Update document title when contact changes
  useEffect(() => {
    if (contact) {
      const fullName = `${contact.first_name} ${contact.last_name}`.trim();
      document.title = fullName ? `${fullName} - Contact Manager` : 'Contact Manager';

      // Cleanup function to reset title when component unmounts
      return () => {
        document.title = 'Contact Manager';
      };
    }
  }, [contact]);

  // Function to generate display name
  const getDisplayName = () => {
    if (!editedContact) return '';

    const fullName = `${editedContact.first_name || ''} ${editedContact.last_name || ''}`.trim();
    return fullName || 'Unnamed Contact';
  };



  // Input Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedContact(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'birthday' ? { age: calculateAge(value) } : {})
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Store the file for later upload
    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Contact Update Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Safety check: ensure editedContact exists and has an ID
    console.log('handleSubmit called with editedContact:', editedContact); // Debug log
    if (!editedContact || !editedContact.id) {
      console.error('Contact data missing or invalid:', editedContact); // Debug log
      setError('Contact data is not available. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // First handle profile image if there's a new one
      let profileImageUrl = editedContact.profile_image_url;

      if (profileImage instanceof File) {
        const formData = new FormData();
        formData.append('profile_image', profileImage);

        try {
          const token = localStorage.getItem('token');
          const imageResponse = await axios.put(
            `${import.meta.env.VITE_API_URL}/api/contacts/${editedContact.id}/profile-image`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          profileImageUrl = imageResponse.data.profile_image_url;
        } catch (imageError) {
          console.error('Error uploading profile image:', imageError);
          setError('Failed to upload profile image');
          setLoading(false);
          return;
        }
      }

      // Then update contact info
      const token = localStorage.getItem('token');
      console.log('Updating contact with ID:', editedContact.id); // Debug log
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/contacts/${editedContact.id}`,
        {
          first_name: editedContact.first_name,
          last_name: editedContact.last_name,
          email: editedContact.email,
          phone: editedContact.phone,
          notes: editedContact.notes,
          address_street: editedContact.address_street,
          address_city: editedContact.address_city,
          address_state: editedContact.address_state,
          address_zip: editedContact.address_zip,
          address_country: editedContact.address_country,
          birthday: editedContact.birthday,
          website: editedContact.website,
          facebook: editedContact.facebook,
          twitter: editedContact.twitter,
          linkedin: editedContact.linkedin,
          instagram: editedContact.instagram,
          company: editedContact.company,
          job_title: editedContact.job_title,
          profile_image_url: profileImageUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setEditedContact({
        ...response.data,
        age: calculateAge(response.data.birthday)
      });

      // Reset image states
      setProfileImage(null);
      setImagePreview(null);

      await onUpdateContact(response.data);
      setEditMode(false);
      setError('');
      showMessage('Contact updated successfully', 'success');
    } catch (error) {
      console.error('Error updating contact:', error);
      setError(error.response?.data?.message || 'Failed to update contact');
    } finally {
      setLoading(false);
    }
  };

  // Group Assignment Handlers
  // Group Assignment Handlers
  const handleAddGroup = async (e) => {
    const groupId = Number.parseInt(e.target.value, 10);
    if (!groupId) return;

    setGroupLoading(true);
    setError('');

    try {
      // Use the prop function instead of direct API call
      await onAddToGroup(editedContact.id, groupId);

      // Update the local state with the new group
      const addedGroup = allGroups.find(g => g.id === groupId);
      if (addedGroup) {
        setEditedContact(prev => ({
          ...prev,
          Groups: [...(prev.Groups || []), addedGroup]
        }));
        showMessage(`Added to group: ${addedGroup.name}`, 'success');
      }
    } catch (error) {
      console.error('Failed to add group:', error);
      setError('Failed to add to group');
    } finally {
      setGroupLoading(false);
      e.target.value = ''; // Reset the select
    }
  };

  const handleRemoveGroup = async (groupId) => {
    setGroupLoading(true);
    setError('');

    try {
      // Use the prop function instead of direct API call
      await onRemoveFromGroup(editedContact.id, groupId);

      // Update the local state by removing the group
      setEditedContact(prev => ({
        ...prev,
        Groups: prev.Groups.filter(g => g.id !== groupId)
      }));
      showMessage(`Removed from group: ${groupId}`, 'success');
    } catch (error) {
      console.error('Failed to remove group:', error);
      setError('Failed to remove from group');
    } finally {
      setGroupLoading(false);
    }
  };

  const showMessage = (text, type = 'info', duration = 3000) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, duration);
  };

  // Update the useEffect for contact initialization
  useEffect(() => {
    if (contact) {
      setEditedContact({
        ...contact,
        Groups: contact.Groups || [],
        age: calculateAge(contact.birthday)
      });
      setProfileImage(contact.profile_image_url);
      setError('');
      setEditMode(false);
    }
  }, [contact]);

  // Group Filtering and Available Groups
  const contactGroups = editedContact?.Groups || [];
  const availableGroups = allGroups.filter(group =>
    !contactGroups.some(g => g.id === group.id)
  );

  if (!editedContact) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <User size={24} className="mr-2" />
        <span>Select a contact to view details</span>
      </div>
    );
  }

  return (

    <div className="h-full relative flex flex-col bg-gray-50">
      {/* Fixed Header Section */}
      <div className="sticky top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        {/* Contact Info Header */}
        <div className="px-3 py-4 sm:px-4 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Contact Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 truncate">
                <User size={20} className="flex-shrink-0 text-indigo-600" />
                <span className="truncate">{getDisplayName()}</span>
                {editedContact.company && (
                  <span className="ml-2 text-sm text-gray-500 truncate hidden sm:inline">
                    • {editedContact.company}
                  </span>
                )}
              </h2>
              {editedContact.job_title && (
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {editedContact.job_title}
                </p>
              )}
              {editedContact.company && (
                <p className="mt-1 text-sm text-gray-500 truncate sm:hidden">
                  {editedContact.company}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditedContact(contact);
                      setError('');
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors 
                           rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-red-500"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-green-600 transition-colors 
                           rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-green-500"
                    title="Save changes"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Save size={18} />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="p-2 text-gray-600 hover:text-indigo-600 transition-colors 
                         rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-indigo-500"
                  title="Edit contact"
                >
                  <Edit3 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Bar */}
        {!editMode && (
          <div className="px-3 py-2 bg-gray-50 border-t border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              {editedContact.email && (
                <a
                  href={`mailto:${editedContact.email}`}
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600 
                       transition-colors group"
                >
                  <Mail size={14} className="mr-1.5 group-hover:text-indigo-600" />
                  <span className="truncate">{editedContact.email}</span>
                </a>
              )}
              {editedContact.phone && (
                <a
                  href={`tel:${editedContact.phone}`}
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600 
                       transition-colors group"
                >
                  <Phone size={14} className="mr-1.5 group-hover:text-indigo-600" />
                  <span>{editedContact.phone}</span>
                </a>
              )}
              {editedContact.address_city && editedContact.address_country && (
                <span className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1.5 text-gray-400" />
                  <span>{editedContact.address_city}, {editedContact.address_country}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="flex space-x-4 overflow-x-auto">
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Error Alert */}
          {(error || message) && (
            <div className="mb-4">
              <div className={`p-3 rounded-md ${messageType === 'error' || error ? 'bg-red-50 border-l-4 border-red-500' :
                  messageType === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                    'bg-blue-50 border-l-4 border-blue-500'
                }`}>
                <div className="flex items-start">
                  {messageType === 'error' || error ? (
                    <X className="h-5 w-5 text-red-400 flex-shrink-0" />
                  ) : messageType === 'success' ? (
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  )}
                  <p className={`ml-3 text-sm ${messageType === 'error' || error ? 'text-red-700' :
                      messageType === 'success' ? 'text-green-700' :
                        'text-blue-700'
                    }`}>
                    {error || message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Content */}
          <div className="space-y-4">
            {activeSection === 'basic' && (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="bg-white shadow-sm rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                    <User className="mr-2 text-indigo-600" size={16} />
                    Basic Information
                  </h3>
                  {/* Basic Info Fields */}
                  <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={editedContact.first_name || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full px-3 py-2 text-sm border rounded-md 
                          ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                      {/* Last Name */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={editedContact.last_name || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                          className={`w-full px-3 py-2 text-sm border rounded-md 
                          ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                    </div>

                    {/* Contact Fields */}
                    <div className="space-y-3">
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={editedContact.email || ''}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md 
                            ${editMode
                                ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                : 'border-transparent bg-gray-50 cursor-default'
                              }`}
                            placeholder={editMode ? "email@example.com" : ""}
                          />
                        </div>
                      </div>
                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={editedContact.phone || ''}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md 
                            ${editMode
                                ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                : 'border-transparent bg-gray-50 cursor-default'
                              }`}
                            placeholder={editMode ? "+1 (123) 456-7890" : ""}
                          />
                        </div>
                      </div>
                      {/* Birthday Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Birthday</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                              type="date"
                              name="birthday"
                              value={editedContact.birthday || ''}
                              onChange={handleInputChange}
                              disabled={!editMode}
                              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md 
                              ${editMode
                                  ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                                  : 'border-transparent bg-gray-50 cursor-default'
                                }`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                          <input
                            type="text"
                            value={editedContact.age || 'N/A'}
                            disabled
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent 
                                   rounded-md cursor-default text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white shadow-sm rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                    <MapPin className="mr-2 text-indigo-600" size={16} />
                    Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address_street"
                        value={editedContact.address_street || ''}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-3 py-2 text-sm border rounded-md 
                        ${editMode
                            ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            : 'border-transparent bg-gray-50 cursor-default'
                          }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          name="address_city"
                          value={editedContact.address_city || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full px-3 py-2 text-sm border rounded-md 
                          ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          name="address_state"
                          value={editedContact.address_state || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full px-3 py-2 text-sm border rounded-md 
      ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          name="address_zip"
                          value={editedContact.address_zip || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full px-3 py-2 text-sm border rounded-md 
                          ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          name="address_country"
                          value={editedContact.address_country || ''}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full px-3 py-2 text-sm border rounded-md 
                          ${editMode
                              ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                              : 'border-transparent bg-gray-50 cursor-default'
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  {(imagePreview || editedContact.profile_image_url) ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <img
                        src={imagePreview || editedContact.profile_image_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                      {editMode && (
                        <div
                          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center
                         opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera size={24} className="text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center 
                     bg-gray-100 border-2 border-dashed
                     ${editMode ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => editMode && fileInputRef.current?.click()}
                    >
                      <Camera
                        size={32}
                        className={`${editMode ? 'text-gray-400' : 'text-gray-300'}`}
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
              {editMode && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Click to {imagePreview ? 'change' : 'add'} profile picture
                </p>
              )}
            </div>

            {activeSection === 'professional' && (
              <div className="bg-white shadow-sm rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                  <Briefcase className="mr-2 text-indigo-600" size={16} />
                  Professional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        name="company"
                        value={editedContact.company || ''}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md 
                        ${editMode
                            ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            : 'border-transparent bg-gray-50 cursor-default'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      name="job_title"
                      value={editedContact.job_title || ''}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={`w-full px-3 py-2 text-sm border rounded-md 
                      ${editMode
                          ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                          : 'border-transparent bg-gray-50 cursor-default'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                    <div className="relative">
                      {editMode ? (
                        <>
                          <Link
                            size={16}
                            className={`absolute left-3 top-2.5 ${editedContact.website
                                ? 'text-indigo-600'
                                : 'text-gray-400'
                              } transition-colors duration-200`}
                          />
                          <input
                            type="url"
                            name="website"
                            value={editedContact.website || ''}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://"
                          />
                        </>
                      ) : (
                        <a
                          href={editedContact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative w-full"
                        >
                          <Link
                            size={16}
                            className={`absolute left-3 top-2.5 ${editedContact.website
                                ? 'text-indigo-600'
                                : 'text-gray-400'
                              } transition-colors duration-200`}
                          />
                          <input
                            type="text"
                            value={editedContact.website || ''}
                            readOnly
                            className="w-full pl-9 pr-3 py-2 text-sm border border-transparent 
                                   bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                            placeholder="No website"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'social' && (
              <SocialMediaSection
                editMode={editMode}
                editedContact={editedContact}
                handleInputChange={handleInputChange}
              />
            )}

            {activeSection === 'notes' && (
              <div className="bg-white shadow-sm rounded-lg p-4">
                <h3 className="text-sm font-medium text-grayrounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center mb-3">
                    <FileText className="mr-2 text-indigo-600" size={16} />
                    Notes
                  </h3>
                </h3>
                  <textarea
                    name="notes"
                    value={editedContact.notes || ''}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    rows="6"
                    className={`w-full px-3 py-2 text-sm border rounded-md resize-y
                  ${editMode
                        ? 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        : 'border-transparent bg-gray-50 cursor-default'
                      }`}
                    placeholder={editMode ? "Add notes about this contact..." : "No notes"}
                  />
              </div>
            )}

            {/* Groups Section - Always visible */}
            <div className="bg-white shadow-sm rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
                <Users className="mr-2 text-indigo-600" size={16} />
                Groups
                {groupLoading && (
                  <span className="ml-2 text-xs text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500 mr-1" />
                    Updating...
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {contactGroups.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-3 bg-gray-50 rounded-md">
                    No groups assigned
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contactGroups.map(group => (
                      <div
                        key={group.id}
                        className="flex items-center px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-200
                             hover:border-gray-300 transition-colors duration-200"
                      >
                        <span className="text-xs text-gray-700">{group.name}</span>
                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          disabled={groupLoading}
                          className="ml-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          title={`Remove from ${group.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {availableGroups.length > 0 && (
                  <select
                    onChange={handleAddGroup}
                    value=""
                    disabled={groupLoading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">+ Add to group</option>
                    {availableGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;

