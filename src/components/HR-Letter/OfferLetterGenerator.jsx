// src/components/OfferLetters/OfferLetterGenerator.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, FileText } from 'lucide-react';
import DefaultOfferLetterTemplate from './DefaultOfferLetterTemplate';
import ExecutiveOfferLetterTemplate from './ExecutiveOfferLetterTemplate';
import ContractOfferLetterTemplate from './ContractOfferLetterTemplate';

const OfferLetterGenerator = ({ 
  formData = {}, 
  templateId = 'default-offer', 
  onClose = () => {}, 
  onSave = () => {} 
}) => {
  
  const renderTemplate = () => {
    const commonProps = {
      company_name: formData.company_name || 'Cybomb Technologies LLP',
      company_address: formData.company_address || 'Prime Plaza, Chennai',
      company_email: formData.company_email || 'hr@cybomb.com',
      company_contact: formData.company_contact || '+91-XXXXXXXXXX',
      offer_date: formData.offer_date || new Date().toISOString().split('T')[0],
    };

    switch (templateId) {
      case 'executive-offer':
        return (
          <ExecutiveOfferLetterTemplate
            {...commonProps}
            candidate_name={formData.candidate_name}
            candidate_address={formData.candidate_address}
            title={formData.title}
            annual_base_salary={formData.annual_base_salary}
            target_bonus_percentage={formData.target_bonus_percentage}
            equity_grants={formData.equity_grants}
            severance_details={formData.severance_details}
            reporting_to={formData.reporting_to}
            start_date={formData.start_date || formData.date_of_joining}
            hr_contact={formData.hr_contact || formData.hr_name}
          />
        );

      case 'contract-offer':
        return (
          <ContractOfferLetterTemplate
            {...commonProps}
            contractor_name={formData.contractor_name || formData.candidate_name}
            contractor_address={formData.contractor_address || formData.candidate_address}
            project_name={formData.project_name}
            fixed_fee={formData.fixed_fee}
            payment_schedule={formData.payment_schedule}
            start_date={formData.start_date || formData.date_of_joining}
            end_date={formData.end_date}
            deliverables_summary={formData.deliverables_summary}
            ip_rights={formData.ip_rights}
            project_manager={formData.project_manager}
          />
        );

      case 'default-offer':
      default:
        return (
          <DefaultOfferLetterTemplate
            {...commonProps}
            candidate_name={formData.candidate_name}
            candidate_address={formData.candidate_address}
            email={formData.email}
            phone={formData.phone}
            designation={formData.designation}
            department={formData.department}
            employment_type={formData.employment_type}
            reporting_manager={formData.reporting_manager}
            work_location={formData.work_location}
            date_of_joining={formData.date_of_joining}
            ctc={formData.ctc}
            basic_salary={formData.basic_salary}
            allowances={formData.allowances}
            bonus={formData.bonus}
            deductions={formData.deductions}
            net_salary={formData.net_salary}
            working_hours={formData.working_hours}
            probation_period={formData.probation_period}
            notice_period={formData.notice_period}
            benefits={formData.benefits}
            offer_expiry_date={formData.offer_expiry_date}
            hr_name={formData.hr_name}
            hr_designation={formData.hr_designation}
          />
        );
    }
  };

  const handleDownload = () => {
    // Implement PDF download logic here
    // You can use libraries like html2canvas and jspdf
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Offer Letter Preview</h2>
              <p className="text-blue-100 text-sm">Review the generated offer letter</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-white text-blue-600 border-white hover:bg-blue-50"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden max-w-4xl mx-auto">
            {renderTemplate()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Template: <span className="font-medium">{templateId}</span>
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterGenerator;