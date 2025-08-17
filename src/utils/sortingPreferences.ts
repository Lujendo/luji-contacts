/**
 * Sorting preferences utility for managing user's sorting preferences
 */

export interface SortPreference {
  field: string;
  direction: 'asc' | 'desc';
  priority: number; // For multi-column sorting
}

export interface SortingPreferences {
  primary: SortPreference;
  secondary?: SortPreference;
  lastUsed: string; // ISO timestamp
}

const STORAGE_KEY = 'contactSortingPreferences';

/**
 * Available sort fields with their display names and types
 */
export const SORT_FIELDS = {
  first_name: { label: 'First Name', type: 'string', sortable: true },
  last_name: { label: 'Last Name', type: 'string', sortable: true },
  email: { label: 'Email', type: 'string', sortable: true },
  phone: { label: 'Phone', type: 'string', sortable: true },
  company: { label: 'Company', type: 'string', sortable: true },
  job_title: { label: 'Job Title', type: 'string', sortable: true },
  created_at: { label: 'Date Added', type: 'date', sortable: true },
  updated_at: { label: 'Last Updated', type: 'date', sortable: true },
  last_contacted: { label: 'Last Contacted', type: 'date', sortable: true },
  birthday: { label: 'Birthday', type: 'date', sortable: true },
  address_city: { label: 'City', type: 'string', sortable: true },
  address_country: { label: 'Country', type: 'string', sortable: true },
  notes: { label: 'Notes', type: 'string', sortable: false }, // Too long for sorting
  website: { label: 'Website', type: 'string', sortable: true },
  linkedin: { label: 'LinkedIn', type: 'string', sortable: true }
} as const;

export type SortField = keyof typeof SORT_FIELDS;

/**
 * Default sorting preferences
 */
export const DEFAULT_SORT_PREFERENCES: SortingPreferences = {
  primary: {
    field: 'first_name',
    direction: 'asc',
    priority: 1
  },
  lastUsed: new Date().toISOString()
};

/**
 * Load sorting preferences from localStorage
 */
export const loadSortingPreferences = (): SortingPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the structure
      if (parsed.primary && parsed.primary.field && parsed.primary.direction) {
        return {
          ...DEFAULT_SORT_PREFERENCES,
          ...parsed
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load sorting preferences:', error);
  }
  
  return DEFAULT_SORT_PREFERENCES;
};

/**
 * Save sorting preferences to localStorage
 */
export const saveSortingPreferences = (preferences: SortingPreferences): void => {
  try {
    const toSave = {
      ...preferences,
      lastUsed: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('Failed to save sorting preferences:', error);
  }
};

/**
 * Create a new sorting preference
 */
export const createSortPreference = (
  field: SortField,
  direction: 'asc' | 'desc' = 'asc',
  priority: number = 1
): SortPreference => ({
  field,
  direction,
  priority
});

/**
 * Toggle sort direction for a field
 */
export const toggleSortDirection = (currentDirection: 'asc' | 'desc'): 'asc' | 'desc' => {
  return currentDirection === 'asc' ? 'desc' : 'asc';
};

/**
 * Get sort field info
 */
export const getSortFieldInfo = (field: string) => {
  return SORT_FIELDS[field as SortField] || { label: field, type: 'string', sortable: true };
};

/**
 * Validate if a field is sortable
 */
export const isSortable = (field: string): boolean => {
  const fieldInfo = SORT_FIELDS[field as SortField];
  return fieldInfo ? fieldInfo.sortable : false;
};

/**
 * Get all sortable fields
 */
export const getSortableFields = (): Array<{ field: SortField; info: typeof SORT_FIELDS[SortField] }> => {
  return Object.entries(SORT_FIELDS)
    .filter(([_, info]) => info.sortable)
    .map(([field, info]) => ({ field: field as SortField, info }));
};

/**
 * Create sort query parameters for API
 */
export const createSortQueryParams = (preferences: SortingPreferences) => {
  const params: Record<string, string> = {
    sort: preferences.primary.field,
    direction: preferences.primary.direction
  };

  // Add secondary sort if available
  if (preferences.secondary) {
    params.sort_secondary = preferences.secondary.field;
    params.direction_secondary = preferences.secondary.direction;
  }

  return params;
};

/**
 * Parse sort parameters from URL or API response
 */
export const parseSortParams = (params: Record<string, string>): SortingPreferences => {
  const primary = createSortPreference(
    (params.sort as SortField) || 'first_name',
    (params.direction as 'asc' | 'desc') || 'asc',
    1
  );

  let secondary: SortPreference | undefined;
  if (params.sort_secondary && params.direction_secondary) {
    secondary = createSortPreference(
      params.sort_secondary as SortField,
      params.direction_secondary as 'asc' | 'desc',
      2
    );
  }

  return {
    primary,
    secondary,
    lastUsed: new Date().toISOString()
  };
};

/**
 * Get user-friendly sort description
 */
export const getSortDescription = (preferences: SortingPreferences): string => {
  const primaryInfo = getSortFieldInfo(preferences.primary.field);
  let description = `${primaryInfo.label} (${preferences.primary.direction === 'asc' ? 'A-Z' : 'Z-A'})`;
  
  if (preferences.secondary) {
    const secondaryInfo = getSortFieldInfo(preferences.secondary.field);
    description += `, then ${secondaryInfo.label} (${preferences.secondary.direction === 'asc' ? 'A-Z' : 'Z-A'})`;
  }
  
  return description;
};
