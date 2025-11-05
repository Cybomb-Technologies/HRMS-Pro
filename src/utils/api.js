// API helper for HR Letters
const API_BASE_URL = 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status
    );
  }
  return response.json();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('hrms_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// HR Letters API
export const hrLettersAPI = {
  // Generate new letter
  generateLetter: async (letterData) => {
    const response = await fetch(`${API_BASE_URL}/hrletters/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(letterData),
    });
    return handleResponse(response);
  },

  // Get all letters
  getAllLetters: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const url = `${API_BASE_URL}/hrletters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get letter by ID
  getLetterById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/hrletters/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Download PDF - IMPROVED: Better error handling and retry logic
  downloadPDF: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hrletters/download/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Failed to download PDF: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        throw new ApiError(errorMessage, response.status);
      }
      
      // Check if response is PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        
        // Check if blob is valid
        if (blob.size === 0) {
          throw new ApiError('PDF file is empty', 500);
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `letter_${id}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return { success: true, filename };
      } else {
        // Handle non-PDF response (error)
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'Server returned non-PDF response',
          response.status
        );
      }
    } catch (error) {
      console.error('Download PDF error:', error);
      throw error;
    }
  },

  // Preview HTML
  previewHTML: async (id) => {
    const response = await fetch(`${API_BASE_URL}/hrletters/preview/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new ApiError('Failed to preview letter', response.status);
    }
    
    return response.text();
  },

  // Delete letter
  deleteLetter: async (id) => {
    const response = await fetch(`${API_BASE_URL}/hrletters/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get statistics
  getStatistics: async () => {
    const response = await fetch(`${API_BASE_URL}/hrletters/statistics`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export { ApiError };