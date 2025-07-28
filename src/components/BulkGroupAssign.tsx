import React, { useState, useEffect, FormEvent } from 'react';
import { Group } from '../types';
import { contactsApi } from '../api';
import { Users, Loader, X, Check } from 'lucide-react';

// Component props interface
interface BulkGroupAssignProps {
  groups?: Group[];
  contactIds?: number[];
  onAssign?: (groupId: number, contactIds: number[]) => void;
  onClose: () => void;
  onAssignmentComplete?: () => void;
  isLoading?: boolean;
}

const BulkGroupAssign: React.FC<BulkGroupAssignProps> = ({
  groups = [],
  contactIds = [],
  onAssign,
  onClose,
  onAssignmentComplete,
  isLoading = false
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!selectedGroup || !contactIds.length) {
      setError('Please select a group and ensure contacts are selected');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const groupId = parseInt(selectedGroup, 10);
      
      if (onAssign) {
        // Use custom handler if provided
        onAssign(groupId, contactIds);
      } else {
        // Use API directly
        await contactsApi.assignContactsToGroup(groupId, contactIds);
      }

      setSuccess(`Successfully assigned ${contactIds.length} contact${contactIds.length !== 1 ? 's' : ''} to group`);
      
      // Call completion callback after a short delay
      setTimeout(() => {
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error assigning contacts to group:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign contacts to group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!submitting) {
      onClose();
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedGroup(e.target.value);
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center text-gray-900">
            <Users className="w-6 h-6 mr-2 text-indigo-600" />
            Assign to Group
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
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            Assigning <strong>{contactIds.length}</strong> contact{contactIds.length !== 1 ? 's' : ''} to a group
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
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Group
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
                  No groups available. Please create a group first.
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Assigning...
                </div>
              ) : (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Group
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkGroupAssign;
