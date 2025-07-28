import React, { useState, ChangeEvent } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Music,
  Github,
  MessageCircle,
  Video,
  Camera,
  Headphones,
  Palette,
  Globe
} from 'lucide-react';
import { Contact } from '../types';

// Social link interface
interface SocialLink {
  name: keyof Contact;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string | undefined;
  placeholder: string;
  urlPrefix?: string;
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
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Share2,
      value: contactData.linkedin,
      placeholder: 'https://linkedin.com/in/username',
      urlPrefix: 'https://linkedin.com/in/'
    },
    {
      name: 'twitter',
      label: 'X (Twitter)',
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: MessageCircle,
      value: contactData.twitter,
      placeholder: 'https://x.com/username',
      urlPrefix: 'https://x.com/'
    },
    {
      name: 'facebook',
      label: 'Facebook',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Share2,
      value: contactData.facebook,
      placeholder: 'https://facebook.com/username',
      urlPrefix: 'https://facebook.com/'
    },
    {
      name: 'instagram',
      label: 'Instagram',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      icon: Camera,
      value: contactData.instagram,
      placeholder: 'https://instagram.com/username',
      urlPrefix: 'https://instagram.com/'
    },
    {
      name: 'youtube',
      label: 'YouTube',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: Video,
      value: contactData.youtube,
      placeholder: 'https://youtube.com/@username',
      urlPrefix: 'https://youtube.com/@'
    },
    {
      name: 'tiktok',
      label: 'TikTok',
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Video,
      value: contactData.tiktok,
      placeholder: 'https://tiktok.com/@username',
      urlPrefix: 'https://tiktok.com/@'
    },
    {
      name: 'snapchat',
      label: 'Snapchat',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: Camera,
      value: contactData.snapchat,
      placeholder: 'https://snapchat.com/add/username',
      urlPrefix: 'https://snapchat.com/add/'
    },
    {
      name: 'discord',
      label: 'Discord',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      icon: MessageCircle,
      value: contactData.discord,
      placeholder: 'discord.gg/username or @username',
      urlPrefix: 'https://discord.gg/'
    },
    {
      name: 'spotify',
      label: 'Spotify',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Headphones,
      value: contactData.spotify,
      placeholder: 'https://open.spotify.com/user/username',
      urlPrefix: 'https://open.spotify.com/user/'
    },
    {
      name: 'apple_music',
      label: 'Apple Music',
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Music,
      value: contactData.apple_music,
      placeholder: 'https://music.apple.com/profile/username',
      urlPrefix: 'https://music.apple.com/profile/'
    },
    {
      name: 'github',
      label: 'GitHub',
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Github,
      value: contactData.github,
      placeholder: 'https://github.com/username',
      urlPrefix: 'https://github.com/'
    },
    {
      name: 'behance',
      label: 'Behance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Palette,
      value: contactData.behance,
      placeholder: 'https://behance.net/username',
      urlPrefix: 'https://behance.net/'
    },
    {
      name: 'dribbble',
      label: 'Dribbble',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      icon: Palette,
      value: contactData.dribbble,
      placeholder: 'https://dribbble.com/username',
      urlPrefix: 'https://dribbble.com/'
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
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Social Media & Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialLinks.map((link) => {
            if (!link.value) return null;

            const IconComponent = link.icon;
            const isValidUrl = link.value.startsWith('http://') || link.value.startsWith('https://');
            const displayUrl = isValidUrl ? link.value : `${link.urlPrefix || ''}${link.value}`;

            return (
              <div key={link.name} className={`group relative overflow-hidden rounded-lg border ${link.borderColor} ${link.bgColor} hover:shadow-md transition-all duration-200`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${link.color} shadow-sm`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{link.label}</div>
                        <div className="text-xs text-gray-500">Social Profile</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-700 truncate font-medium">
                      {link.value.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium ${link.color} bg-white border ${link.borderColor} hover:bg-opacity-80 transition-colors`}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit Profile
                    </a>

                    <button
                      onClick={() => handleCopy(displayUrl, link.name)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white hover:bg-opacity-50 transition-colors"
                      title="Copy link"
                    >
                      {copiedField === link.name ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <Share2 className="h-5 w-5 mr-2" />
        Social Media & Links
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <div key={link.name} className={`p-4 rounded-lg border ${link.borderColor} ${link.bgColor}`}>
              <label htmlFor={link.name} className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <div className={`w-6 h-6 rounded-full bg-white flex items-center justify-center ${link.color} mr-2 shadow-sm`}>
                  <IconComponent className="h-3 w-3" />
                </div>
                {link.label}
              </label>
              <div className="relative">
                <input
                  type="url"
                  id={link.name}
                  name={link.name}
                  value={link.value || ''}
                  onChange={inputChangeHandler}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder={link.placeholder}
                />
                {link.value && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(link.value!, link.name)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Copy link"
                    >
                      {copiedField === link.name ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    <a
                      href={link.value.startsWith('http') ? link.value : `${link.urlPrefix || ''}${link.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      title="Open link"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              {errors[link.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[link.name]}</p>
              )}
              {link.value && !errors[link.name] && (
                <p className="mt-1 text-xs text-gray-500">
                  Preview: {link.value.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialMediaSection;
