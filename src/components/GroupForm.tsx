import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { Group, CreateGroupRequest } from '../types';
import { contactsApi } from '../api';
import { X, Loader, Users, Check } from 'lucide-react';

// Component props interface
interface GroupFormProps {
  onClose: () => void;
  onGroupAdded?: (group: Group) => void;
  onGroupCreated?: (group: Group) => void; // Alternative prop name
  isLoading?: boolean;
}

// Form errors interface
interface FormErrors {
  [key: string]: string;
}

const GroupForm: React.FC<GroupFormProps> = ({
  onClose,
  onGroupAdded,
  onGroupCreated, // Alternative prop
  isLoading = false
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
    name: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Focus name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!newGroup.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (newGroup.name.trim().length < 2) {
      newErrors.name = 'Group name must be at least 2 characters';
    } else if (newGroup.name.trim().length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
    }

    if (newGroup.description && newGroup.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setNewGroup(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Create the group
      const createdGroup = await contactsApi.createGroup({
        name: newGroup.name.trim(),
        description: newGroup.description?.trim() || ''
      });

      setSuccess('Group created successfully');

      // Call the appropriate callback
      const callback = onGroupCreated || onGroupAdded;
      if (callback) {
        callback(createdGroup);
      }

      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating group:', error);
      setError(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="p-6">
      {/* Close button - removed since Modal handles this */}



        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-400 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              name="name"
              value={newGroup.name}
              onChange={handleInputChange}
              disabled={submitting || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter group name"
              required
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Group Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={newGroup.description}
              onChange={handleInputChange}
              disabled={submitting || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter group description (optional)"
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {newGroup.description.length}/500 characters
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isLoading || !newGroup.name.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Create Group
                </div>
              )}
            </button>
          </div>
        </form>
    </div>
  );
};

export default GroupForm;
