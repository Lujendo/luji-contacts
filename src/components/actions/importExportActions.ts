import axios from 'axios';

// Import result interface
interface ImportResult {
  success: boolean;
  message: string;
  imported?: number;
  failed?: number;
  errors?: string[];
}

// Export result interface
interface ExportResult {
  success: boolean;
  message: string;
}

// Export format type
type ExportFormat = 'csv' | 'xlsx' | 'json';

// Import format type
type ImportFormat = 'csv' | 'xlsx' | 'json';

export const importContacts = async (file: File, format: ImportFormat): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/contacts/import/${format}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Import failed');
    }
    throw new Error('Import failed');
  }
};

export const exportContacts = async (format: ExportFormat): Promise<ExportResult> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/contacts/export/${format}`,
      { responseType: 'blob' }
    );
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `contacts_${timestamp}.${format}`;
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: `Export completed: ${filename}` };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Export failed');
    }
    throw new Error('Export failed');
  }
};
