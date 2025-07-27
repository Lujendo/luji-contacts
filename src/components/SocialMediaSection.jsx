import React from 'react';
import { Share2, Copy, Check, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

const SocialMediaSection = ({ editMode, editedContact, handleInputChange }) => {
  const [copiedField, setCopiedField] = React.useState(null);

  const handleCopy = async (value, field) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const socialLinks = [
    {
      name: 'linkedin',
      icon: Linkedin,
      color: 'text-[#0A66C2]',
      value: editedContact.linkedin,
      placeholder: 'Profile URL'
    },
    {
      name: 'twitter',
      icon: Twitter,
      color: 'text-[#1DA1F2]',
      value: editedContact.twitter,
      placeholder: '@username'
    },
    {
      name: 'facebook',
      icon: Facebook,
      color: 'text-[#1877F2]',
      value: editedContact.facebook,
      placeholder: 'Username'
    },
    {
      name: 'instagram',
      icon: Instagram,
      color: 'text-[#E4405F]',
      value: editedContact.instagram,
      placeholder: '@username'
    }
  ];

  if (!editMode) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
          <Share2 className="mr-2 text-indigo-600" size={16} />
          Social Media
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {socialLinks.filter(link => link.value).map(({ name, icon: Icon, color, value }) => (
            <div key={name} className="flex items-center gap-2">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-4 py-2 ${color} bg-gray-50 
                     rounded-md hover:bg-gray-100 transition-colors duration-200 
                     border border-gray-200 hover:border-gray-300 text-xs
                     min-w-[100px] justify-center`}
              >
                <Icon size={16} className="mr-2" />
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </a>
              <button
                onClick={() => handleCopy(value, name)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 
                       rounded-md border border-gray-200 hover:border-gray-300 
                       transition-colors duration-200"
                title={`Copy ${name} link`}
              >
                {copiedField === name ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          ))}
          {!socialLinks.some(link => link.value) && (
            <p className="text-xs text-gray-500 italic col-span-2">No social media profiles added</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 flex items-center mb-4">
        <Share2 className="mr-2 text-indigo-600" size={16} />
        Social Media
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {socialLinks.map(({ name, icon: Icon, color, value, placeholder }) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </label>
            <div className="relative">
              <Icon
                size={16}
                className={`absolute left-3 top-2.5 ${value ? color : 'text-gray-400'} 
                         transition-colors duration-200`}
              />
              <input
                type="text"
                name={name}
                value={value || ''}
                onChange={handleInputChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={placeholder}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialMediaSection;