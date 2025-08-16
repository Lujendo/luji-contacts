import React, { useState, useEffect, useMemo } from 'react';
import { Contact } from '../types';
import { DuplicateDetector, DuplicateMatch, DuplicateGroup } from '../utils/duplicateDetection';
import { Users, AlertTriangle, Check, X, Merge, Search, Filter, Phone, Mail, User } from 'lucide-react';

interface DuplicateDetectionPanelProps {
  contacts: Contact[];
  onMergeContacts: (contacts: Contact[]) => void;
  onClose: () => void;
}

type DetectionMode = 'all' | 'name' | 'phone' | 'email';
type ViewMode = 'matches' | 'groups';

const DuplicateDetectionPanel: React.FC<DuplicateDetectionPanelProps> = ({
  contacts,
  onMergeContacts,
  onClose
}) => {
  const [detectionMode, setDetectionMode] = useState<DetectionMode>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('matches');
  const [threshold, setThreshold] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());

  // Calculate duplicates based on current settings
  const duplicateData = useMemo(() => {
    if (contacts.length === 0) return { matches: [], groups: [] };

    setLoading(true);
    let matches: DuplicateMatch[] = [];

    try {
      switch (detectionMode) {
        case 'name':
          matches = DuplicateDetector.findDuplicatesByName(contacts, threshold);
          break;
        case 'phone':
          matches = DuplicateDetector.findDuplicatesByPhone(contacts, threshold);
          break;
        case 'email':
          matches = DuplicateDetector.findDuplicatesByEmail(contacts, threshold);
          break;
        default:
          matches = DuplicateDetector.findDuplicates(contacts);
          break;
      }

      const groups = DuplicateDetector.groupDuplicates(contacts);
      
      return { matches, groups };
    } finally {
      setLoading(false);
    }
  }, [contacts, detectionMode, threshold]);

  // Handle match selection
  const toggleMatchSelection = (matchId: string) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId);
    } else {
      newSelected.add(matchId);
    }
    setSelectedMatches(newSelected);
  };

  // Generate unique ID for a match
  const getMatchId = (match: DuplicateMatch) => {
    return `${match.contact1.id}-${match.contact2.id}`;
  };

  // Get confidence color
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  // Render contact summary
  const renderContactSummary = (contact: Contact) => {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed';
    return (
      <div className="text-sm">
        <div className="font-medium">{name}</div>
        {contact.email && <div className="text-gray-600">{contact.email}</div>}
        {contact.phone && <div className="text-gray-600">{contact.phone}</div>}
        {contact.company && <div className="text-gray-500">{contact.company}</div>}
      </div>
    );
  };

  // Render duplicate match
  const renderDuplicateMatch = (match: DuplicateMatch, index: number) => {
    const matchId = getMatchId(match);
    const isSelected = selectedMatches.has(matchId);

    return (
      <div key={matchId} className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleMatchSelection(matchId)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-900">Match #{index + 1}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
              {match.confidence} ({Math.round(match.similarity * 100)}%)
            </span>
          </div>
          <button
            onClick={() => onMergeContacts([match.contact1, match.contact2])}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Merge className="w-3 h-3" />
            <span>Merge</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="border-r pr-4">
            <div className="text-xs text-gray-500 mb-1">Contact 1</div>
            {renderContactSummary(match.contact1)}
          </div>
          <div className="pl-4">
            <div className="text-xs text-gray-500 mb-1">Contact 2</div>
            {renderContactSummary(match.contact2)}
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="text-xs text-gray-500 mb-1">Similarity Reasons:</div>
          <div className="flex flex-wrap gap-1">
            {match.reasons.map((reason, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render duplicate group
  const renderDuplicateGroup = (group: DuplicateGroup, index: number) => {
    return (
      <div key={index} className="border rounded-lg p-4 border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Group #{index + 1} ({group.contacts.length} contacts)
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
              {Math.round(group.totalSimilarity * 100)}% similarity
            </span>
          </div>
          <button
            onClick={() => onMergeContacts(group.contacts)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Merge className="w-3 h-3" />
            <span>Merge All</span>
          </button>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Primary Contact (will be kept):</div>
          <div className="p-2 bg-green-50 border border-green-200 rounded">
            {renderContactSummary(group.primaryContact)}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Duplicates (will be merged):</div>
          <div className="space-y-2">
            {group.duplicates.map((contact, idx) => (
              <div key={contact.id} className="p-2 bg-red-50 border border-red-200 rounded">
                {renderContactSummary(contact)}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="text-xs text-gray-500 mb-1">Similarity Reasons:</div>
          <div className="flex flex-wrap gap-1">
            {group.reasons.map((reason, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Duplicate Detection
          </h2>
          <p className="text-sm text-gray-600">
            Found {duplicateData.matches.length} potential duplicates in {contacts.length} contacts
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Detection Mode:</label>
              <select
                value={detectionMode}
                onChange={(e) => setDetectionMode(e.target.value as DetectionMode)}
                className="ml-2 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Fields</option>
                <option value="name">Names Only</option>
                <option value="phone">Phone Numbers</option>
                <option value="email">Email Addresses</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Threshold:</label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="ml-2 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={0.6}>60% (More matches)</option>
                <option value={0.7}>70% (Balanced)</option>
                <option value={0.8}>80% (Fewer matches)</option>
                <option value={0.9}>90% (Very strict)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('matches')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'matches' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Individual Matches ({duplicateData.matches.length})
            </button>
            <button
              onClick={() => setViewMode('groups')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'groups' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grouped ({duplicateData.groups.length})
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>High confidence: {duplicateData.matches.filter(m => m.confidence === 'high').length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Medium confidence: {duplicateData.matches.filter(m => m.confidence === 'medium').length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Low confidence: {duplicateData.matches.filter(m => m.confidence === 'low').length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Analyzing contacts...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {viewMode === 'matches' ? (
              duplicateData.matches.length > 0 ? (
                duplicateData.matches.map((match, index) => renderDuplicateMatch(match, index))
              ) : (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No duplicates found</h3>
                  <p className="text-gray-600">
                    No potential duplicate contacts were detected with the current settings.
                  </p>
                </div>
              )
            ) : (
              duplicateData.groups.length > 0 ? (
                duplicateData.groups.map((group, index) => renderDuplicateGroup(group, index))
              ) : (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No duplicate groups found</h3>
                  <p className="text-gray-600">
                    No groups of duplicate contacts were detected.
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateDetectionPanel;
