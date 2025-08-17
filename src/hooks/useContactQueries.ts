import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { contactsApi } from '../api';
import { useContactStore } from '../stores/contactStore';
import { Contact, CreateContactRequest, UpdateContactRequest, ContactQueryParams } from '../types';
import toast from 'react-hot-toast';

// Query keys for consistent caching
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: ContactQueryParams) => [...contactKeys.lists(), params] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactKeys.details(), id] as const,
  infinite: (params: ContactQueryParams) => [...contactKeys.all, 'infinite', params] as const,
};

// Hook for fetching contacts with caching and error handling
export const useContacts = (params?: ContactQueryParams) => {
  const { setContacts, setLoading, setError, setTotalContacts } = useContactStore();

  return useQuery({
    queryKey: contactKeys.list(params || {}),
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await contactsApi.getContacts(params);
        const contacts = response.data || [];
        
        // Update store
        setContacts(contacts);
        setTotalContacts(response.total || contacts.length);
        setError(null);
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contacts';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for infinite scrolling contacts
export const useInfiniteContacts = (params?: ContactQueryParams) => {
  const { setContacts, setLoading, setError } = useContactStore();

  return useInfiniteQuery({
    queryKey: contactKeys.infinite(params || {}),
    queryFn: async ({ pageParam = 1 }) => {
      setLoading(true);
      try {
        const response = await contactsApi.getContacts({
          ...params,
          page: pageParam.toString(),
          limit: '50',
        });
        
        if (pageParam === 1) {
          setContacts(response.data || []);
        }
        
        setError(null);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contacts';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil((lastPage.total || 0) / 50);
      return pages.length < totalPages ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for fetching a single contact
export const useContact = (id: number) => {
  const { selectContact, setError } = useContactStore();

  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      try {
        const contact = await contactsApi.getContact(id);
        selectContact(contact);
        setError(null);
        return contact;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch contact';
        setError(errorMessage);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for creating contacts with optimistic updates
export const useCreateContact = () => {
  const queryClient = useQueryClient();
  const { addContact, setError } = useContactStore();

  return useMutation({
    mutationFn: async (contactData: CreateContactRequest) => {
      console.log('Creating contact with data:', contactData);
      const contact = await contactsApi.createContact(contactData);
      console.log('Contact created successfully:', contact.id);
      return contact;
    },
    
    // Optimistic update
    onMutate: async (newContactData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });

      // Snapshot the previous value
      const previousContacts = queryClient.getQueryData(contactKeys.lists());

      // Optimistically update with temporary ID
      const optimisticContact: Contact = {
        id: Date.now(), // Temporary ID
        user_id: 0, // Will be set by server
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newContactData,
      };

      // Update store optimistically
      addContact(optimisticContact);

      return { previousContacts, optimisticContact };
    },

    onSuccess: (newContact, variables, context) => {
      // Update all contact queries
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      
      // Update the store with the real contact
      addContact(newContact);
      
      // Show success message
      toast.success(`Contact ${newContact.first_name} ${newContact.last_name} created successfully!`);
      
      setError(null);
    },

    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
      setError(errorMessage);
      toast.error(errorMessage);
      
      console.error('Error creating contact:', error);
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
  });
};

// Hook for updating contacts with optimistic updates
export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  const { updateContact, setError } = useContactStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateContactRequest }) => {
      console.log('Updating contact:', id, data);
      const contact = await contactsApi.updateContact(id, data);
      console.log('Contact updated successfully:', contact.id);
      return contact;
    },

    onMutate: async ({ id, data }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: contactKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });

      // Snapshot previous values
      const previousContact = queryClient.getQueryData(contactKeys.detail(id));
      const previousContacts = queryClient.getQueryData(contactKeys.lists());

      // Optimistically update
      updateContact(id, data);

      return { previousContact, previousContacts };
    },

    onSuccess: (updatedContact) => {
      // Update queries
      queryClient.setQueryData(contactKeys.detail(updatedContact.id), updatedContact);
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      
      // Update store
      updateContact(updatedContact.id, updatedContact);
      
      toast.success('Contact updated successfully!');
      setError(null);
    },

    onError: (error, { id }, context) => {
      // Revert optimistic updates
      if (context?.previousContact) {
        queryClient.setQueryData(contactKeys.detail(id), context.previousContact);
      }
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      setError(errorMessage);
      toast.error(errorMessage);
      
      console.error('Error updating contact:', error);
    },
  });
};

// Hook for deleting contacts
export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  const { removeContact, setError } = useContactStore();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting contact:', id);
      await contactsApi.deleteContact(id);
      console.log('Contact deleted successfully:', id);
      return id;
    },

    onMutate: async (id) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });
      
      // Snapshot previous values
      const previousContacts = queryClient.getQueryData(contactKeys.lists());
      
      // Optimistically remove
      removeContact(id);
      
      return { previousContacts };
    },

    onSuccess: (deletedId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.removeQueries({ queryKey: contactKeys.detail(deletedId) });
      
      toast.success('Contact deleted successfully!');
      setError(null);
    },

    onError: (error, id, context) => {
      // Revert optimistic update
      if (context?.previousContacts) {
        queryClient.setQueryData(contactKeys.lists(), context.previousContacts);
      }

      // Handle 404 errors gracefully
      if (error instanceof Error && error.message.includes('Contact not found')) {
        console.log('Contact not found in database, removing from local state');
        removeContact(id);
        toast.success('Contact removed from list');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contact';
      setError(errorMessage);
      toast.error(errorMessage);
      
      console.error('Error deleting contact:', error);
    },
  });
};

// Hook for bulk operations
export const useBulkDeleteContacts = () => {
  const queryClient = useQueryClient();
  const { setError, clearSelection } = useContactStore();

  return useMutation({
    mutationFn: async (contactIds: number[]) => {
      console.log('Bulk deleting contacts:', contactIds);
      const result = await contactsApi.bulkDeleteContacts(contactIds);
      console.log('Bulk delete completed:', result);
      return result;
    },

    onSuccess: (result) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      
      // Clear selection
      clearSelection();
      
      toast.success(`Successfully deleted ${result.successful} contacts`);
      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} contacts`);
      }
      
      setError(null);
    },

    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete contacts';
      setError(errorMessage);
      toast.error(errorMessage);
      
      console.error('Error bulk deleting contacts:', error);
    },
  });
};
