import React, { useState, useEffect, FormEvent } from 'react';
import { Group } from '../types';
import { contactsApi } from '../api';
import { UserMinus, Loader, X, AlertTriangle, Check } from 'lucide-react';

// Component props interface
interface BulkGroupRemoveProps {
  groups?: Group[];
  contactIds?: number[];
  onRemove?: (groupId: number, contactIds: number[]) => void;
  onClose: () => void;
  onRemovalComplete?: () => void;
  isLoading?: boolean;
}

const BulkGroupRemove: React.FC<BulkGroupRemoveProps> = ({
  groups = [],
  contactIds = [],
  onRemove,
  onClose,
  onRemovalComplete,
  isLoading = false
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [validGroups, setValidGroups] = useState<Group[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Validate groups data when component mounts or groups prop changes
  useEffect(() => {
    if (Array.isArray(groups)) {
      // Filter out any invalid group objects
      const filtered = groups.filter((group): group is Group =>
        group && typeof group === 'object' && 
        typeof group.id === 'number' && 
        typeof group.name === 'string'
      );
      setValidGroups(filtered);
    } else {
      setValidGroups([]);
    }
  }, [groups]);

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

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (selectedGroup) {
      setShowConfirm(true);
    }
  };

  // Handle confirmation
  const handleConfirmRemove = async (): Promise<void> => {
    if (!selectedGroup || !contactIds.length) {
      setError('Please select a group and ensure contacts are selected');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const groupId = parseInt(selectedGroup, 10);
      
      if (onRemove) {
        // Use custom handler if provided
        onRemove(groupId, contactIds);
      } else {
        // Use API directly
        await contactsApi.removeContactsFromGroup(groupId, contactIds);
      }

      setSuccess(`Successfully removed ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} from group`);
      setShowConfirm(false);
      
      // Call completion callback after a short delay
      setTimeout(() => {
        if (onRemovalComplete) {
          onRemovalComplete();
        }
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error removing contacts from group:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove contacts from group');
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close button click
  const handleClose = (): void => {
    if (!submitting) {
      setShowConfirm(false);
      onClose();
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedGroup(e.target.value);
    setError('');
  };

  const selectedGroupName = validGroups.find(g => g.id.toString() === selectedGroup)?.name || '';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center text-gray-900">
            <UserMinus className="w-6 h-6 mr-2 text-red-600" />
            Remove from Group
          </h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contact count info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Removing <strong>{contactIds.length}</strong> contact{contactIds.length !== 1 ? 's' : ''} from a group
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

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Confirm Removal
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Are you sure you want to remove {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} from "{selectedGroupName}"?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleConfirmRemove}
                    disabled={submitting}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Yes, Remove
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={submitting}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!showConfirm && (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Group to Remove From
              </label>
              {validGroups.length > 0 ? (
                <select
                  id="group-select"
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  disabled={submitting || isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Choose a group...</option>
                  {validGroups.map((group) => (
                    <option key={group.id} value={group.id.toString()}>
                      {group.name} ({group.contact_count || 0} contacts)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    No groups available.
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
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
                disabled={submitting || !selectedGroup || validGroups.length === 0 || isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove from Group
                </div>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BulkGroupRemove;
