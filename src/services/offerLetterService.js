const API_URL = 'http://localhost:5000/api';

// Use functional approach instead of class
const OfferLetterService = {
  async getTemplate() {
    try {
      const response = await fetch(`${API_URL}/offer-letters/template`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      // Return default template if API fails
      return {
        success: true,
        data: {
          content: getDefaultTemplate(),
          version: 'v1.0',
          lastUpdated: new Date().toISOString().split('T')[0],
          isActive: true
        }
      };
    }
  },

  async saveTemplate(templateData) {
    try {
      const response = await fetch(`${API_URL}/offer-letters/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save template');
      }
      
      return data;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  async generateOfferLetter(employeeData = {}) {
    try {
      const response = await fetch(`${API_URL}/offer-letters/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeData })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating offer letter:', error);
      // Return sample data if API fails
      return {
        success: true,
        data: {
          content: generateSampleContent(employeeData),
          employee: getSampleEmployeeData(employeeData),
          templateVersion: 'v1.0',
          generatedAt: new Date().toISOString()
        }
      };
    }
  }
};

// Default template
const getDefaultTemplate = () => `OFFER LETTER

Date: {{offer_date}}

Dear {{candidate_name}},

We are pleased to offer you the position of {{designation}} at {{company_name}}. 

POSITION DETAILS:
- Designation: {{designation}}
- Department: {{department}}
- Employment Type: {{employment_type}}
- Date of Joining: {{date_of_joining}}
- Work Location: {{work_location}}
- Working Hours: {{working_hours}}

COMPENSATION:
- CTC: {{ctc}}
- Basic Salary: {{basic_salary}}
- Net Salary: {{net_salary}}

We look forward to welcoming you to our team.

Sincerely,
{{company_name}}
HR Department`;

// Sample data generation
const getSampleEmployeeData = (customData = {}) => ({
  candidate_name: customData.candidate_name || 'John Doe',
  candidate_address: customData.candidate_address || 'City, State',
  email: customData.email || 'john.doe@example.com',
  phone: customData.phone || '+91 98765 43210',
  company_name: customData.company_name || 'Cybomb Technologies LLP',
  company_address: customData.company_address || 'Prime Plaza, Chennai',
  designation: customData.designation || 'Software Developer',
  department: customData.department || 'Development',
  employment_type: customData.employment_type || 'Permanent',
  date_of_joining: customData.date_of_joining || '2024-01-25',
  offer_date: customData.offer_date || new Date().toISOString().split('T')[0],
  ctc: customData.ctc || '₹6,00,000 per annum',
  basic_salary: customData.basic_salary || '₹25,000',
  net_salary: customData.net_salary || '₹29,000',
  working_hours: customData.working_hours || '9:30 AM to 6:30 PM',
  work_location: customData.work_location || 'Chennai (Hybrid)'
});

const generateSampleContent = (employeeData) => {
  const data = getSampleEmployeeData(employeeData);
  const template = getDefaultTemplate();
  
  return template
    .replace(/{{candidate_name}}/g, data.candidate_name)
    .replace(/{{designation}}/g, data.designation)
    .replace(/{{department}}/g, data.department)
    .replace(/{{employment_type}}/g, data.employment_type)
    .replace(/{{date_of_joining}}/g, data.date_of_joining)
    .replace(/{{work_location}}/g, data.work_location)
    .replace(/{{working_hours}}/g, data.working_hours)
    .replace(/{{ctc}}/g, data.ctc)
    .replace(/{{basic_salary}}/g, data.basic_salary)
    .replace(/{{net_salary}}/g, data.net_salary)
    .replace(/{{company_name}}/g, data.company_name)
    .replace(/{{offer_date}}/g, data.offer_date);
};

export default OfferLetterService;