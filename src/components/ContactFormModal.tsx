import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { contactsApi } from '../api';
import { Contact, Group } from '../types';
import Modal from './ui/Modal';
import Tabs, { TabItem } from './ui/Tabs';
import { User, Mail, Phone, Building2, MapPin, FileText } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contact: Contact) => void;
  onContactAdded?: (contact: Contact) => void;
  onContactUpdated?: (contact: Contact) => void;
  groups?: Group[];
  contact?: Contact; // Contact to edit (if provided, modal is in edit mode)
}

interface FormData {
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  website: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  birthday: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  notes: string;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onContactCreated,
  onContactAdded,
  onContactUpdated,
  groups = [],
  contact
}) => {
  const isEditing = !!contact;
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    nickname: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    website: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    birthday: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    address_country: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('basic');



  const WorkTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter company name"
          />
        </div>
        <div>
          <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            id="job_title"
            name="job_title"
            value={formData.job_title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter job title"
          />
        </div>
      </div>
    </div>
  );

  const SocialTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="LinkedIn profile URL"
          />
        </div>
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
            Twitter
          </label>
          <input
            type="url"
            id="twitter"
            name="twitter"
            value={formData.twitter}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Twitter profile URL"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
            Facebook
          </label>
          <input
            type="url"
            id="facebook"
            name="facebook"
            value={formData.facebook}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Facebook profile URL"
          />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
            Instagram
          </label>
          <input
            type="url"
            id="instagram"
            name="instagram"
            value={formData.instagram}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Instagram profile URL"
          />
        </div>
      </div>
    </div>
  );

  const AddressTab = () => (
    <div className="space-y-4">
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter street address"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="City"
          />
        </div>
        <div>
          <label htmlFor="address_state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            type="text"
            id="address_state"
            name="address_state"
            value={formData.address_state}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="State"
          />
        </div>
        <div>
          <label htmlFor="address_zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            id="address_zip"
            name="address_zip"
            value={formData.address_zip}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ZIP"
          />
        </div>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Country"
        />
      </div>
    </div>
  );

  const NotesTab = () => (
    <div className="space-y-4">
      {/* Groups */}
      {groups.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Groups
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {groups.map((group) => (
              <label key={group.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => handleGroupToggle(group.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{group.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <div className="border border-gray-300 rounded-md">
          <ReactQuill
            value={formData.notes}
            onChange={(value) => {
              setFormData(prev => ({
                ...prev,
                notes: value
              }));
            }}
            theme="snow"
            placeholder="Enter any additional notes"
            style={{ minHeight: '150px' }}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                [{ 'align': [] }],
                ['link', 'image', 'blockquote', 'code-block'],
                ['clean']
              ],
            }}
            formats={[
              'header', 'font', 'size',
              'bold', 'italic', 'underline', 'strike',
              'color', 'background',
              'script',
              'list', 'bullet', 'indent',
              'direction', 'align',
              'link', 'image', 'blockquote', 'code-block'
            ]}
          />
        </div>
      </div>
    </div>
  );



  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Reset form when modal opens or populate with contact data when editing
  useEffect(() => {
    if (isOpen) {
      if (isEditing && contact) {
        // Populate form with existing contact data
        setFormData({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          nickname: contact.nickname || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          job_title: contact.job_title || '',
          website: contact.website || '',
          linkedin: contact.linkedin || '',
          twitter: contact.twitter || '',
          facebook: contact.facebook || '',
          instagram: contact.instagram || '',
          birthday: contact.birthday || '',
          address_street: contact.address_street || '',
          address_city: contact.address_city || '',
          address_state: contact.address_state || '',
          address_zip: contact.address_zip || '',
          address_country: contact.address_country || '',
          notes: contact.notes || ''
        });
        // TODO: Set selected groups based on contact's groups
        setSelectedGroups([]);
      } else {
        // Reset form for new contact
        setFormData({
          first_name: '',
          last_name: '',
          nickname: '',
          email: '',
          phone: '',
          company: '',
          job_title: '',
          website: '',
          linkedin: '',
          twitter: '',
          facebook: '',
          instagram: '',
          birthday: '',
          address_street: '',
          address_city: '',
          address_state: '',
          address_zip: '',
          address_country: '',
          notes: ''
        });
        setSelectedGroups([]);
      }
      setError('');
    }
  }, [isOpen, isEditing, contact]);

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  // Handle group selection
  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.first_name.trim() && !formData.last_name.trim() && !formData.email.trim()) {
      setError('Please provide at least a first name, last name, or email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const contactData = {
        ...formData,
        group_ids: selectedGroups
      };

      let savedContact: Contact;

      if (isEditing && contact) {
        // Update existing contact
        savedContact = await contactsApi.updateContact(contact.id, contactData);
        if (onContactUpdated) {
          onContactUpdated(savedContact);
        }
      } else {
        // Create new contact
        savedContact = await contactsApi.createContact(contactData);
        if (onContactCreated) {
          onContactCreated(savedContact);
        } else if (onContactAdded) {
          onContactAdded(savedContact);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEditing ? 'Failed to update contact' : 'Failed to create contact'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate age from birthday
  const calculateAge = (birthday: string): number | null => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  };

  // Memoized tab content to prevent input field recreation on every render
  const basicInfoContent = useMemo(() => {
    const age = calculateAge(formData.birthday);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter first name"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter last name"
            />
          </div>
        </div>
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
            Nickname / Artist Name
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter nickname or artist name"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
              Birthday
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData.birthday}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600">
              {age !== null ? `${age} years old` : 'Enter birthday to calculate age'}
            </div>
          </div>
        </div>
      </div>
    );
  }, [formData.first_name, formData.last_name, formData.birthday, handleInputChange]);

  const contactContent = useMemo(() => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email address"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter phone number"
          />
        </div>
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
          Website
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com"
        />
      </div>
    </div>
  ), [formData.email, formData.phone, formData.website, handleInputChange]);

  // Tab configuration with memoized content
  const tabs: TabItem[] = [
    { id: 'basic', label: 'Basic Info', icon: <User size={16} />, content: basicInfoContent },
    { id: 'contact', label: 'Contact', icon: <Mail size={16} />, content: contactContent },
    { id: 'work', label: 'Work', icon: <Building2 size={16} />, content: <WorkTab /> },
    { id: 'social', label: 'Social', icon: <Phone size={16} />, content: <SocialTab /> },
    { id: 'address', label: 'Address', icon: <MapPin size={16} />, content: <AddressTab /> },
    { id: 'notes', label: 'Notes', icon: <FileText size={16} />, content: <NotesTab /> }
  ];

  // Get contact display name for editing
  const getContactDisplayName = () => {
    if (!contact) return 'No Contact Data';
    const firstName = contact.first_name || '';
    const lastName = contact.last_name || '';
    const email = contact.email || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (email) {
      return email;
    } else {
      return 'Unnamed Contact';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Contact` : "Create New Contact"}
      size="2xl"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-[600px]">
        {/* Contact Name Display for Editing - Always show when contact exists */}
        {contact && (
          <div className="mx-6 mt-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">Editing Contact:</span>
                  <span className="text-base font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded">
                    {getContactDisplayName()}
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabbed Content */}
        <div className="flex-1 px-6 py-4">
          <Tabs
            tabs={tabs}
            defaultTab={activeTab}
            onTabChange={handleTabChange}
            className="h-full"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Contact' : 'Create Contact')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactFormModal;