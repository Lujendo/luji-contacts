import React, { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { Group, UpdateGroupRequest } from '../types';
import { groupsApi } from '../api';
import { X, Save, Loader, Users, Check } from 'lucide-react';

// Component props interface
interface GroupEditFormProps {
  group: Group;
  onClose: () => void;
  onGroupUpdated: (updatedGroup: Group) => void;
  isLoading?: boolean;
}

// Form errors interface
interface FormErrors {
  [key: string]: string;
}

const GroupEditForm: React.FC<GroupEditFormProps> = ({
  group,
  onClose,
  onGroupUpdated,
  isLoading = false
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [editedGroup, setEditedGroup] = useState<UpdateGroupRequest>({
    name: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Initialize form data when group changes
  useEffect(() => {
    if (group) {
      setEditedGroup({
        name: group.name || '',
        description: group.description || ''
      });
    }
  }, [group]);

  // Focus on name input when form opens
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

    if (!editedGroup.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (editedGroup.name.trim().length < 2) {
      newErrors.name = 'Group name must be at least 2 characters';
    } else if (editedGroup.name.trim().length > 100) {
      newErrors.name = 'Group name must be less than 100 characters';
    }

    if (editedGroup.description && editedGroup.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setEditedGroup(prev => ({
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
      // Update the group
      const updatedGroup = await groupsApi.updateGroup(group.id, {
        name: editedGroup.name.trim(),
        description: editedGroup.description?.trim() || ''
      });

      setSuccess('Group updated successfully');

      // Call the callback with updated group
      onGroupUpdated(updatedGroup);

      // Close after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating group:', error);
      setError(error instanceof Error ? error.message : 'Failed to update group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!submitting) {
      onClose();
    }
  };

  // Check if form has changes
  const hasChanges = editedGroup.name !== group.name || editedGroup.description !== (group.description || '');

  return (
    <div className="p-6">
      {/* Close button - removed since Modal handles this */}

        {/* Group Info */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Editing: <span className="font-bold">{group.name}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Group ID: {group.id} • {group.contact_count || 0} contacts
          </p>
        </div>

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
              value={editedGroup.name}
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
              value={editedGroup.description}
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
              {editedGroup.description.length}/500 characters
            </p>
          </div>

          {/* Additional Group Info */}
          {group.created_at && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs text-gray-600">
                <strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

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
              disabled={submitting || isLoading || !editedGroup.name.trim() || !hasChanges}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Update Group
                </div>
              )}
            </button>
          </div>
        </form>
    </div>
  );
};

export default GroupEditForm;
