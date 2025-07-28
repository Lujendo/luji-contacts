import React, { useState, ChangeEvent } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { Contact } from '../types';

// Social link interface
interface SocialLink {
  name: keyof Contact;
  label: string;
  color: string;
  value: string | undefined;
  placeholder: string;
}

// Component props interface
interface SocialMediaSectionProps {
  editMode: boolean;
  contact: Contact;
  editedContact?: Contact;
  handleInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void; // Alternative prop name
  errors?: Record<string, string>;
}

const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({ 
  editMode, 
  contact,
  editedContact,
  handleInputChange,
  onInputChange,
  errors = {}
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Use the contact data (editedContact in edit mode, contact in view mode)
  const contactData = editMode ? (editedContact || contact) : contact;
  
  // Normalize input change handler
  const inputChangeHandler = handleInputChange || onInputChange;

  const handleCopy = async (value: string, field: string): Promise<void> => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const socialLinks: SocialLink[] = [
    {
      name: 'linkedin',
      label: 'LinkedIn',
      color: 'text-blue-600',
      value: contactData.linkedin,
      placeholder: 'https://linkedin.com/in/username'
    },
    {
      name: 'twitter',
      label: 'Twitter',
      color: 'text-blue-400',
      value: contactData.twitter,
      placeholder: 'https://twitter.com/username'
    },
    {
      name: 'facebook',
      label: 'Facebook',
      color: 'text-blue-700',
      value: contactData.facebook,
      placeholder: 'https://facebook.com/username'
    },
    {
      name: 'instagram',
      label: 'Instagram',
      color: 'text-pink-600',
      value: contactData.instagram,
      placeholder: 'https://instagram.com/username'
    }
  ];

  if (!editMode) {
    // View mode - show social links if they exist
    const hasAnySocialLinks = socialLinks.some(link => link.value);
    
    if (!hasAnySocialLinks) {
      return null;
    }

    return (
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Social Media
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialLinks.map((link) => {
            if (!link.value) return null;
            
            return (
              <div key={link.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${link.color}`}>
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{link.label}</div>
                    <div className="text-sm text-gray-600 truncate max-w-48">
                      {link.value}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(link.value!, link.name)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Copy link"
                  >
                    {copiedField === link.name ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Edit mode - show input fields
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Share2 className="h-5 w-5 mr-2" />
        Social Media
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialLinks.map((link) => (
          <div key={link.name}>
            <label htmlFor={link.name} className="block text-sm font-medium text-gray-700 mb-1">
              {link.label}
            </label>
            <div className="relative">
              <input
                type="url"
                id={link.name}
                name={link.name}
                value={link.value || ''}
                onChange={inputChangeHandler}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={link.placeholder}
              />
              {link.value && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(link.value!, link.name)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy link"
                  >
                    {copiedField === link.name ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
            {errors[link.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[link.name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialMediaSection;
