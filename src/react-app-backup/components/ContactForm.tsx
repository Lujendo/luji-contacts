// Contact form component (placeholder)
import { Contact } from '../types';

interface ContactFormProps {
  contact: Contact | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600">Contact form coming soon...</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
