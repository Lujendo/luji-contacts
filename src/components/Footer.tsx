import React, { useState } from 'react';
import { ExternalLink, Mail, Shield, FileText, Info, Heart } from 'lucide-react';

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
  onAboutClick?: () => void;
  onSupportClick?: () => void;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  onPrivacyClick,
  onTermsClick,
  onAboutClick,
  onSupportClick,
  className = ''
}) => {
  const [showModal, setShowModal] = useState<string | null>(null);

  const handleLinkClick = (type: string) => {
    switch (type) {
      case 'privacy':
        onPrivacyClick ? onPrivacyClick() : setShowModal('privacy');
        break;
      case 'terms':
        onTermsClick ? onTermsClick() : setShowModal('terms');
        break;
      case 'about':
        onAboutClick ? onAboutClick() : setShowModal('about');
        break;
      case 'support':
        onSupportClick ? onSupportClick() : setShowModal('support');
        break;
    }
  };

  const closeModal = () => setShowModal(null);

  return (
    <>
      <footer className={`bg-gray-50 border-t border-gray-200 ${className}`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            {/* Left side - Copyright and branding */}
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600">
                © 2025 Luji Contacts. Made with{' '}
                <Heart className="w-4 h-4 inline text-red-500" />{' '}
                for better contact management.
              </p>
            </div>

            {/* Center - Links */}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLinkClick('about')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
              <button
                onClick={() => handleLinkClick('privacy')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
              >
                <Shield className="w-4 h-4" />
                <span>Privacy</span>
              </button>
              <button
                onClick={() => handleLinkClick('terms')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span>Terms</span>
              </button>
              <button
                onClick={() => handleLinkClick('support')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
              >
                <Mail className="w-4 h-4" />
                <span>Support</span>
              </button>
            </div>

            {/* Right side - Version and status */}
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>v2.0.0</span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>All systems operational</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal for legal pages */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold capitalize">{showModal}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {showModal === 'privacy' && (
                <div className="prose prose-sm max-w-none">
                  <h3>Privacy Policy</h3>
                  <p className="text-gray-600">Last updated: January 2025</p>
                  
                  <h4>Information We Collect</h4>
                  <p>
                    Luji Contacts is designed with privacy in mind. All your contact data is stored locally 
                    and processed on your device or your chosen cloud infrastructure.
                  </p>
                  
                  <h4>Data Storage</h4>
                  <p>
                    Your contacts are stored in your Cloudflare D1 database and R2 storage. We do not 
                    have access to your personal contact information.
                  </p>
                  
                  <h4>Data Security</h4>
                  <p>
                    All data is encrypted in transit and at rest. We use industry-standard security 
                    practices to protect your information.
                  </p>
                  
                  <h4>Contact Us</h4>
                  <p>
                    If you have questions about this Privacy Policy, please contact us at 
                    privacy@lujicontacts.com
                  </p>
                </div>
              )}
              
              {showModal === 'terms' && (
                <div className="prose prose-sm max-w-none">
                  <h3>Terms of Service</h3>
                  <p className="text-gray-600">Last updated: January 2025</p>
                  
                  <h4>Acceptance of Terms</h4>
                  <p>
                    By using Luji Contacts, you agree to these terms of service and our privacy policy.
                  </p>
                  
                  <h4>Service Description</h4>
                  <p>
                    Luji Contacts is a contact management application that helps you organize and 
                    manage your personal and professional contacts.
                  </p>
                  
                  <h4>User Responsibilities</h4>
                  <p>
                    You are responsible for maintaining the confidentiality of your account and for 
                    all activities that occur under your account.
                  </p>
                  
                  <h4>Limitation of Liability</h4>
                  <p>
                    Luji Contacts is provided "as is" without warranties of any kind. We are not 
                    liable for any damages arising from your use of the service.
                  </p>
                </div>
              )}
              
              {showModal === 'about' && (
                <div className="prose prose-sm max-w-none">
                  <h3>About Luji Contacts</h3>
                  
                  <h4>Our Mission</h4>
                  <p>
                    To provide a powerful, privacy-focused contact management solution that helps 
                    individuals and businesses organize their relationships effectively.
                  </p>
                  
                  <h4>Features</h4>
                  <ul>
                    <li>Advanced contact management with custom fields</li>
                    <li>Smart duplicate detection and merging</li>
                    <li>Group organization and bulk operations</li>
                    <li>Import/export from popular formats</li>
                    <li>Email integration and history tracking</li>
                    <li>Privacy-first design with local data storage</li>
                  </ul>
                  
                  <h4>Technology</h4>
                  <p>
                    Built with modern web technologies including React, TypeScript, and Cloudflare 
                    Workers for optimal performance and reliability.
                  </p>
                  
                  <h4>Version</h4>
                  <p>Current version: 2.0.0 - January 2025</p>
                </div>
              )}
              
              {showModal === 'support' && (
                <div className="prose prose-sm max-w-none">
                  <h3>Support & Help</h3>
                  
                  <h4>Getting Help</h4>
                  <p>
                    Need assistance with Luji Contacts? We're here to help!
                  </p>
                  
                  <h4>Contact Methods</h4>
                  <ul>
                    <li>
                      <strong>Email:</strong> support@lujicontacts.com
                    </li>
                    <li>
                      <strong>Documentation:</strong> Available in the Settings panel
                    </li>
                    <li>
                      <strong>Feature Requests:</strong> We welcome your suggestions!
                    </li>
                  </ul>
                  
                  <h4>Common Issues</h4>
                  <ul>
                    <li><strong>Import Problems:</strong> Ensure your file is in CSV or vCard format</li>
                    <li><strong>Duplicate Contacts:</strong> Use our smart duplicate detection feature</li>
                    <li><strong>Performance:</strong> Try clearing your browser cache</li>
                  </ul>
                  
                  <h4>Response Time</h4>
                  <p>
                    We typically respond to support requests within 24-48 hours during business days.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
