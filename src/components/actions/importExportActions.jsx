import axios from 'axios';

export const importContacts = async (file, format) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/contacts/import/${format}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Import failed');
  }
};

export const exportContacts = async (format) => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/contacts/export/${format}`,
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
    throw new Error(error.response?.data?.message || 'Export failed');
  }
};