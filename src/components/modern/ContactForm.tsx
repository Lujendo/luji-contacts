import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Contact, Group, CreateContactRequest, UpdateContactRequest } from '../../types';
import { useCreateContact, useUpdateContact } from '../../hooks/useContactQueries';
import { useContactStore } from '../../stores/contactStore';
import Modal from '../ui/Modal';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Globe, 
  Calendar,
  FileText,
  Users,
  Save,
  X,
  Loader2
} from 'lucide-react';

// Validation schema using Zod
const contactSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  nickname: z.string().max(50, 'Nickname too long').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number too long').optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  job_title: z.string().max(100, 'Job title too long').optional(),
  role: z.string().max(100, 'Role too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  birthday: z.string().optional(),
  address_street: z.string().max(200, 'Street address too long').optional(),
  address_city: z.string().max(100, 'City too long').optional(),
  address_state: z.string().max(100, 'State too long').optional(),
  address_zip: z.string().max(20, 'ZIP code too long').optional(),
  address_country: z.string().max(100, 'Country too long').optional(),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
  snapchat: z.string().max(100, 'Snapchat username too long').optional(),
  discord: z.string().max(100, 'Discord username too long').optional(),
  spotify: z.string().url('Invalid Spotify URL').optional().or(z.literal('')),
  apple_music: z.string().url('Invalid Apple Music URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  behance: z.string().url('Invalid Behance URL').optional().or(z.literal('')),
  dribbble: z.string().url('Invalid Dribbble URL').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes too long').optional(),
  group_ids: z.array(z.number()).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ModernContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  groups?: Group[];
  mode?: 'create' | 'edit';
}

export const ModernContactForm: React.FC<ModernContactFormProps> = ({
  isOpen,
  onClose,
  contact,
  groups = [],
  mode = contact ? 'edit' : 'create'
}) => {
  const isEditing = mode === 'edit' && !!contact;
  
  // Hooks
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const { setShowContactForm } = useContactStore();

  // Form setup with React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    watch,
    setValue
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      nickname: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      role: '',
      website: '',
      birthday: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      address_country: '',
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      snapchat: '',
      discord: '',
      spotify: '',
      apple_music: '',
      github: '',
      behance: '',
      dribbble: '',
      notes: '',
      group_ids: [],
    },
  });

  // Reset form when contact changes
  useEffect(() => {
    if (isEditing && contact) {
      reset({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        nickname: contact.nickname || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        job_title: contact.job_title || '',
        role: contact.role || '',
        website: contact.website || '',
        birthday: contact.birthday || '',
        address_street: contact.address_street || '',
        address_city: contact.address_city || '',
        address_state: contact.address_state || '',
        address_zip: contact.address_zip || '',
        address_country: contact.address_country || '',
        linkedin: contact.linkedin || '',
        twitter: contact.twitter || '',
        facebook: contact.facebook || '',
        instagram: contact.instagram || '',
        youtube: contact.youtube || '',
        tiktok: contact.tiktok || '',
        snapchat: contact.snapchat || '',
        discord: contact.discord || '',
        spotify: contact.spotify || '',
        apple_music: contact.apple_music || '',
        github: contact.github || '',
        behance: contact.behance || '',
        dribbble: contact.dribbble || '',
        notes: contact.notes || '',
        group_ids: contact.groups?.map(g => g.id) || [],
      });
    } else {
      reset();
    }
  }, [contact, isEditing, reset]);

  // Form submission handler
  const onSubmit = async (data: ContactFormData) => {
    try {
      if (isEditing && contact) {
        // Update existing contact
        await updateContactMutation.mutateAsync({
          id: contact.id,
          data: data as UpdateContactRequest
        });
      } else {
        // Create new contact
        await createContactMutation.mutateAsync(data as CreateContactRequest);
      }
      
      // Close form and update store
      setShowContactForm(false);
      onClose();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error);
    }
  };

  // Handle form close
  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    
    reset();
    setShowContactForm(false);
    onClose();
  };

  const isLoading = isSubmitting || createContactMutation.isPending || updateContactMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Contact' : 'Create New Contact'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline h-4 w-4 mr-1" />
              First Name *
            </label>
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="Enter first name"
                />
              )}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline h-4 w-4 mr-1" />
              Last Name *
            </label>
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="Enter last name"
                />
              )}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="Enter email address"
                />
              )}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone
            </label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="Enter phone number"
                />
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Contact' : 'Create Contact'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModernContactForm;
