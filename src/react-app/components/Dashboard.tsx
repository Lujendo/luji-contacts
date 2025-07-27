// Dashboard component - main application interface
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import GroupList from './GroupList';
import ImportExport from './ImportExport';
import { Contact } from '../types';

type ActiveView = 'contacts' | 'groups' | 'import-export' | 'settings';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('contacts');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactFormOpen(true);
  };

  const handleContactCreate = () => {
    setSelectedContact(null);
    setIsContactFormOpen(true);
  };

  const handleContactSave = () => {
    setIsContactFormOpen(false);
    setSelectedContact(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleContactCancel = () => {
    setIsContactFormOpen(false);
    setSelectedContact(null);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'contacts':
        return (
          <ContactList
            onContactSelect={handleContactSelect}
            onContactCreate={handleContactCreate}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'groups':
        return <GroupList refreshTrigger={refreshTrigger} />;
      case 'import-export':
        return <ImportExport onImportComplete={() => setRefreshTrigger(prev => prev + 1)} />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Limit</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.contact_limit === -1 ? 'Unlimited' : user?.contact_limit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        user={user}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 capitalize">
                {activeView.replace('-', ' & ')}
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome back, {user?.username}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Contact Form Modal */}
      {isContactFormOpen && (
        <ContactForm
          contact={selectedContact}
          onSave={handleContactSave}
          onCancel={handleContactCancel}
        />
      )}
    </div>
  );
}
