import TokenManager from '../utils/tokenManager';

class HRLettersService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api/hr-letters';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('🌐 Making request to:', url);
    console.log('🔐 Token present:', !!TokenManager.getToken());

    const config = {
      headers: TokenManager.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        console.error('❌ Authentication failed - 401 Unauthorized');
        TokenManager.clearToken();
        throw new Error('Authentication failed. Please login again.');
      }

      if (response.status === 403) {
        console.error('❌ Access denied - 403 Forbidden');
        throw new Error('Access denied. HR/Admin role required.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('💥 Request failed:', error);
      throw error;
    }
  }

  async getTemplates() {
    console.log('📋 Fetching templates...');
    return this.makeRequest('/templates');
  }

  async uploadTemplate(formData, file) {
    console.log('📤 Uploading template...');
    
    const uploadData = new FormData();
    uploadData.append('template', file);
    uploadData.append('name', formData.name);
    uploadData.append('type', formData.type);
    uploadData.append('description', formData.description);

    const token = TokenManager.getToken();
    const config = {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: uploadData
    };

    return this.makeRequest('/templates/upload', config);
  }

  async getTemplateById(templateId) {
    console.log('📄 Fetching template:', templateId);
    return this.makeRequest(`/templates/${templateId}`);
  }

  async downloadTemplate(templateId) {
    console.log('📥 Downloading template:', templateId);
    
    const token = TokenManager.getToken();
    const response = await fetch(`${this.baseURL}/templates/${templateId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    return blob;
  }

  async updateTemplate(templateId, formData, file = null) {
    console.log('🔄 Updating template:', templateId);
    
    const uploadData = new FormData();
    if (file) {
      uploadData.append('template', file);
    }
    uploadData.append('name', formData.name);
    uploadData.append('type', formData.type);
    uploadData.append('description', formData.description);

    const token = TokenManager.getToken();
    const config = {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: uploadData
    };

    return this.makeRequest(`/templates/${templateId}`, config);
  }

  async deleteTemplate(templateId) {
    console.log('🗑️ Deleting template:', templateId);
    return this.makeRequest(`/templates/${templateId}`, {
      method: 'DELETE'
    });
  }

  async generateLetter(templateId, data) {
    console.log('🔄 Generating letter for template:', templateId);
    return this.makeRequest(`/templates/${templateId}/generate`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getGeneratedLetters(filters = {}) {
    console.log('📜 Fetching generated letters...');
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/generated-letters?${queryParams}` : '/generated-letters';
    return this.makeRequest(endpoint);
  }

  // Helper method to download blob files
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const hrLettersService = new HRLettersService();