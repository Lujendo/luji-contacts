import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { Contact, Group, ContactFilters, SortConfig } from '../types';

// Contact store state interface
interface ContactState {
  // Data
  contacts: Contact[];
  selectedContact: Contact | null;
  selectedContacts: number[];
  
  // UI State
  filters: ContactFilters;
  searchQuery: string;
  sortConfig: SortConfig;
  isLoading: boolean;
  error: string | null;
  
  // View State
  viewMode: 'table' | 'grid' | 'list';
  showContactForm: boolean;
  showContactDetail: boolean;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  totalContacts: number;
}

// Contact store actions interface
interface ContactActions {
  // Data actions
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: number, updates: Partial<Contact>) => void;
  removeContact: (id: number) => void;
  
  // Selection actions
  selectContact: (contact: Contact | null) => void;
  toggleContactSelection: (contactId: number) => void;
  selectAllContacts: () => void;
  clearSelection: () => void;
  
  // Filter actions
  setFilters: (filters: Partial<ContactFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSortConfig: (config: SortConfig) => void;
  clearFilters: () => void;
  
  // UI actions
  setViewMode: (mode: 'table' | 'grid' | 'list') => void;
  setShowContactForm: (show: boolean) => void;
  setShowContactDetail: (show: boolean) => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalContacts: (total: number) => void;
  
  // Computed getters
  getFilteredContacts: () => Contact[];
  getSelectedContactsData: () => Contact[];
}

// Default state values
const defaultFilters: ContactFilters = {
  groups: [],
  hasEmail: undefined,
  hasPhone: undefined,
  company: '',
  role: '',
  dateRange: undefined,
};

const defaultSortConfig: SortConfig = {
  field: 'first_name',
  direction: 'asc',
};

// Create the contact store
export const useContactStore = create<ContactState & ContactActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      contacts: [],
      selectedContact: null,
      selectedContacts: [],
      filters: defaultFilters,
      searchQuery: '',
      sortConfig: defaultSortConfig,
      isLoading: false,
      error: null,
      viewMode: 'table',
      showContactForm: false,
      showContactDetail: false,
      currentPage: 1,
      pageSize: 50,
      totalContacts: 0,

      // Data actions
      setContacts: (contacts) => set({ contacts }),
      
      addContact: (contact) => set((state) => ({
        contacts: [...state.contacts, contact],
        totalContacts: state.totalContacts + 1,
      })),
      
      updateContact: (id, updates) => set((state) => ({
        contacts: state.contacts.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ),
        selectedContact: state.selectedContact?.id === id 
          ? { ...state.selectedContact, ...updates }
          : state.selectedContact,
      })),
      
      removeContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id),
        selectedContacts: state.selectedContacts.filter(cId => cId !== id),
        selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
        totalContacts: Math.max(0, state.totalContacts - 1),
      })),

      // Selection actions
      selectContact: (contact) => set({ selectedContact: contact }),
      
      toggleContactSelection: (contactId) => set((state) => ({
        selectedContacts: state.selectedContacts.includes(contactId)
          ? state.selectedContacts.filter(id => id !== contactId)
          : [...state.selectedContacts, contactId],
      })),
      
      selectAllContacts: () => set((state) => ({
        selectedContacts: state.contacts.map(c => c.id),
      })),
      
      clearSelection: () => set({ selectedContacts: [] }),

      // Filter actions
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        currentPage: 1, // Reset to first page when filtering
      })),
      
      setSearchQuery: (searchQuery) => set({ 
        searchQuery,
        currentPage: 1, // Reset to first page when searching
      }),
      
      setSortConfig: (sortConfig) => set({ sortConfig }),
      
      clearFilters: () => set({
        filters: defaultFilters,
        searchQuery: '',
        currentPage: 1,
      }),

      // UI actions
      setViewMode: (viewMode) => set({ viewMode }),
      setShowContactForm: (showContactForm) => set({ showContactForm }),
      setShowContactDetail: (showContactDetail) => set({ showContactDetail }),

      // Loading states
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Pagination
      setCurrentPage: (currentPage) => set({ currentPage }),
      setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
      setTotalContacts: (totalContacts) => set({ totalContacts }),

      // Computed getters
      getFilteredContacts: () => {
        const { contacts, filters, searchQuery, sortConfig } = get();
        let filtered = [...contacts];

        // Apply search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(contact => 
            contact.first_name?.toLowerCase().includes(query) ||
            contact.last_name?.toLowerCase().includes(query) ||
            contact.email?.toLowerCase().includes(query) ||
            contact.phone?.includes(query) ||
            contact.company?.toLowerCase().includes(query)
          );
        }

        // Apply filters
        if (filters.groups && filters.groups.length > 0) {
          filtered = filtered.filter(contact =>
            contact.groups?.some(group => filters.groups!.includes(group.id))
          );
        }

        if (filters.hasEmail !== undefined) {
          filtered = filtered.filter(contact => 
            filters.hasEmail ? !!contact.email : !contact.email
          );
        }

        if (filters.hasPhone !== undefined) {
          filtered = filtered.filter(contact => 
            filters.hasPhone ? !!contact.phone : !contact.phone
          );
        }

        if (filters.company) {
          filtered = filtered.filter(contact =>
            contact.company?.toLowerCase().includes(filters.company!.toLowerCase())
          );
        }

        if (filters.role) {
          filtered = filtered.filter(contact =>
            contact.role?.toLowerCase().includes(filters.role!.toLowerCase())
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aValue = a[sortConfig.field as keyof Contact] || '';
          const bValue = b[sortConfig.field as keyof Contact] || '';
          
          const comparison = String(aValue).localeCompare(String(bValue));
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },

      getSelectedContactsData: () => {
        const { contacts, selectedContacts } = get();
        return contacts.filter(contact => selectedContacts.includes(contact.id));
      },
    })),
    {
      name: 'contact-store',
    }
  )
);

// Selector hooks for performance optimization
export const useContacts = () => useContactStore(state => state.contacts);
export const useSelectedContact = () => useContactStore(state => state.selectedContact);
export const useSelectedContacts = () => useContactStore(state => state.selectedContacts);
export const useContactFilters = () => useContactStore(state => state.filters);
export const useContactSearch = () => useContactStore(state => state.searchQuery);
export const useContactSort = () => useContactStore(state => state.sortConfig);
export const useContactLoading = () => useContactStore(state => state.isLoading);
export const useContactError = () => useContactStore(state => state.error);
export const useContactViewMode = () => useContactStore(state => state.viewMode);
export const useContactUI = () => useContactStore(state => ({
  showContactForm: state.showContactForm,
  showContactDetail: state.showContactDetail,
}));
