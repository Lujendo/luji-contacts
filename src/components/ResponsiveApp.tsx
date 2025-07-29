import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../context/MobileContext';
import { useAuth } from '../context/AuthContext';
import { contactsApi } from '../api';
import { Contact } from '../types';
import { MobileActions } from '../utils/mobileActions';

// Desktop Components
import Dashboard from './Dashboard';

// Mobile Components
import MobileLayout from './mobile/MobileLayout';
import MobileDashboard from './mobile/MobileDashboard';
import MobileContactList from './mobile/MobileContactList';
import MobileContactDetail from './mobile/MobileContactDetail';
import MobileContactForm from './mobile/MobileContactForm';

interface ResponsiveAppProps {
  className?: string;
}

type MobileView = 'dashboard' | 'contacts' | 'contact-detail' | 'contact-form' | 'import';

const ResponsiveApp: React.FC<ResponsiveAppProps> = ({ className = '' }) => {
  const { showMobileView } = useMobile();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mobile-specific state
  const [mobileView, setMobileView] = useState<MobileView>('dashboard');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Shared state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsApi.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  // Mobile action handlers
  const handleContactClick = (contact: Contact) => {
    if (showMobileView) {
      setSelectedContact(contact);
      setMobileView('contact-detail');
    } else {
      // Desktop behavior - could open modal or navigate
      navigate(`/contact/${contact.id}`);
    }
  };

  const handleCallContact = (contact: Contact) => {
    const result = MobileActions.call(contact);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleEmailContact = (contact: Contact) => {
    const result = MobileActions.email(contact);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleSmsContact = (contact: Contact) => {
    const result = MobileActions.sms(contact);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleShareContact = async (contact: Contact) => {
    const result = await MobileActions.share(contact);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.first_name} ${contact.last_name}?`)) {
      try {
        await contactsApi.deleteContact(contact.id);
        setContacts(prev => prev.filter(c => c.id !== contact.id));
        if (showMobileView) {
          setMobileView('contacts');
          setSelectedContact(null);
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        setError('Failed to delete contact');
      }
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    if (showMobileView) {
      setMobileView('contact-form');
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    if (showMobileView) {
      setMobileView('contact-form');
    } else {
      navigate('/add-contact');
    }
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      let savedContact: Contact;
      
      if (editingContact) {
        // Update existing contact
        savedContact = await contactsApi.updateContact(editingContact.id, contactData);
        setContacts(prev => prev.map(c => c.id === editingContact.id ? savedContact : c));
      } else {
        // Create new contact
        savedContact = await contactsApi.createContact(contactData);
        setContacts(prev => [savedContact, ...prev]);
      }

      if (showMobileView) {
        setSelectedContact(savedContact);
        setMobileView('contact-detail');
      }
      
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error; // Let the form handle the error
    }
  };

  const handleImportContacts = () => {
    if (showMobileView) {
      setMobileView('import');
    } else {
      navigate('/import');
    }
  };

  const handleSearchClick = () => {
    if (showMobileView) {
      setMobileView('contacts');
    }
  };

  const handleBackClick = () => {
    switch (mobileView) {
      case 'contact-detail':
      case 'contact-form':
      case 'import':
        setMobileView('dashboard');
        setSelectedContact(null);
        setEditingContact(null);
        break;
      case 'contacts':
        setMobileView('dashboard');
        break;
      default:
        setMobileView('dashboard');
    }
  };

  // Desktop view
  if (!showMobileView) {
    return (
      <div className={className}>
        <Dashboard />
      </div>
    );
  }

  // Mobile views
  const getMobileTitle = () => {
    switch (mobileView) {
      case 'dashboard':
        return 'Luji Contacts';
      case 'contacts':
        return 'All Contacts';
      case 'contact-detail':
        return selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : 'Contact';
      case 'contact-form':
        return editingContact ? 'Edit Contact' : 'New Contact';
      case 'import':
        return 'Import Contacts';
      default:
        return 'Luji Contacts';
    }
  };

  const renderMobileContent = () => {
    switch (mobileView) {
      case 'dashboard':
        return (
          <MobileDashboard
            contacts={contacts}
            onContactClick={handleContactClick}
            onCallContact={handleCallContact}
            onEmailContact={handleEmailContact}
            onAddContact={handleAddContact}
            onImportContacts={handleImportContacts}
            onSearchClick={handleSearchClick}
            loading={loading}
          />
        );

      case 'contacts':
        return (
          <MobileContactList
            contacts={contacts}
            onContactClick={handleContactClick}
            onCallContact={handleCallContact}
            onEmailContact={handleEmailContact}
            onSmsContact={handleSmsContact}
            loading={loading}
          />
        );

      case 'contact-detail':
        return selectedContact ? (
          <MobileContactDetail
            contact={selectedContact}
            onCall={handleCallContact}
            onEmail={handleEmailContact}
            onSms={handleSmsContact}
            onEdit={handleEditContact}
            onShare={handleShareContact}
            onDelete={handleDeleteContact}
          />
        ) : null;

      case 'contact-form':
        return (
          <MobileContactForm
            contact={editingContact || undefined}
            onSave={handleSaveContact}
            onCancel={handleBackClick}
          />
        );

      case 'import':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Import Contacts</h2>
            <p className="text-gray-600">Import functionality will be implemented here.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <MobileLayout
        title={getMobileTitle()}
        showBackButton={mobileView !== 'dashboard'}
        onBackClick={handleBackClick}
        showBottomNav={mobileView === 'dashboard' || mobileView === 'contacts'}
      >
        {renderMobileContent()}
      </MobileLayout>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveApp;
