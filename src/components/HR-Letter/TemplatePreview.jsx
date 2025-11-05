// src/components/HR-Letter/TemplatePreview.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, CheckCircle, Star, Calendar, Users, Target, Shield, Zap, Info } from 'lucide-react';

// Added new icon (Zap) and updated the gradient/shadows for a more premium look

const TemplatePreview = ({ template, onClose, onUseTemplate }) => {
  const getTemplateFeatures = (templateId) => {
    const features = {
      'standard-fulltime': [
        '**Structured Compensation Breakdown** (Salary, bonuses, equity)',
        'Comprehensive **Benefits & Perks** section',
        'Clear **Terms of Employment** and conditions',
        'Full **Digital Signature** readiness and e-signing support',
        'Overview of key **Company Policies** (e.g., PTO, code of conduct)',
        'Formal **Start Date** and **Reporting Structure** confirmation',
        'Professional, clean, and modern layout'
      ],
      'executive-level': [
        'Detailed **Executive Compensation** package and vesting schedules',
        'Specific **Equity and Bonus** structures (e.g., RSU, Stock Options)',
        'Outline of **Leadership Responsibilities** and goals',
        'Mandatory **Confidentiality and Non-Compete** agreements',
        'Dedicated **Board Approval** section',
        'Structured **Performance Expectations** and evaluation criteria',
        'Inclusion of specific **Stock Options** details and terms'
      ],
      'contract-based': [
        'Precise **Contract Duration** (Start and End Dates)',
        'Detailed **Project Scope** and deliverables specification',
        'Clear **Renewal and Extension** terms',
        'Explicit **Termination Clauses** and conditions',
        'Structured **Deliverables Timeline** and milestones',
        'Transparent **Payment Schedule** and invoicing requirements',
        'Detailed **Intellectual Property** (IP) rights and ownership'
      ],
      'internship-offer': [
        'Defined **Learning Objectives** and skill development roadmap',
        'Designated **Mentorship Program** details',
        'Clear **Stipend, Accommodation, and Travel** information',
        'Formal **Evaluation Criteria** and feedback process',
        'Potential **Full-time Conversion** opportunities outline',
        'Structured **Training Schedule** and professional development',
        'Documentation for **Academic Credit** compliance'
      ],
      'remote-work': [
        'Formal **Remote Work Policies** and jurisdiction details',
        'Details on **Equipment Provision** and technical support',
        'Mandatory **Communication Guidelines** and response times',
        'Clarification on **Work Hours** and time zone requirements',
        'Strict **Data Security Protocols** and compliance standards',
        'Clear process for **Home Office Expense** reimbursement',
        'Structured **Virtual Onboarding** and orientation schedule'
      ]
    };
    
    return features[templateId] || features['standard-fulltime'];
  };

  const getTemplateIcons = (templateId) => {
    const icons = {
      'standard-fulltime': Users,
      'executive-level': Target,
      'contract-based': Calendar,
      'internship-offer': Star,
      'remote-work': Shield
    };
    
    return icons[templateId] || FileText;
  };

  const TemplateIcon = getTemplateIcons(template._id);

  return (
    // Updated fade-in duration and added a subtle backdrop blur
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-500 transform transition-all">
        
        {/* Header - More defined and premium gradient */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-100/50">
          <div className="flex items-center space-x-4">
            {/* Icon - More defined gradient and shadow for visual impact */}
            <div className="p-4 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl shadow-lg">
              <TemplateIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">{template.name}</h2>
              <p className="text-md text-gray-600 mt-1 font-medium">{template.description}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon" // Used 'icon' size for a smaller, cleaner 'X' button
            className="h-10 w-10 p-0 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Increased max-height for better viewing */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10"> {/* Changed to 3 columns for better layout */}
            
            {/* Left Column (Details) */}
            <div className="space-y-8 lg:col-span-2"> 
              
              {/* Overview Section - Elevated appearance */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center">
                  <Info className="w-5 h-5 text-blue-600 mr-2" />
                  Template Overview
                </h3>
                <p className="text-gray-700 text-base leading-relaxed">
                  {template.preview || 'This professional offer letter template is meticulously designed for modern, high-standard organizations. It systematically includes all legally and HR-essential sections, ensuring compliance, clarity, and a premium candidate experience. The structure is fully modular and effortlessly customizable to align with your specific branding and legal requirements.'}
                </p>
              </div>

              {/* Key Features - Visually separated and highlighted */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <h4 className="font-bold text-gray-900 text-xl mb-6 flex items-center">
                  <Zap className="w-6 h-6 text-yellow-600 mr-3 fill-current" />
                  Core Capabilities & Sections
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getTemplateFeatures(template._id).map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white border border-gray-100 transition-shadow duration-200 hover:shadow-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-800 leading-relaxed font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Use Cases - Clearer labeling and design */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 text-xl mb-4">
                  Recommended Deployment
                </h4>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full border border-blue-300 shadow-sm">
                    {template.category || 'General'} Roles
                  </span>
                  <span className="px-4 py-2 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full border border-purple-300 shadow-sm">
                    {template._id === 'executive-level' ? 'C-Suite & Senior Leadership' : 
                     template._id === 'contract-based' ? 'High-Value Project-based Work' :
                     template._id === 'internship-offer' ? 'Structured Student Programs' :
                     template._id === 'remote-work' ? 'Globally Distributed Teams' : 'Standard Full-time Employment'}
                  </span>
                  <span className="px-4 py-2 bg-teal-100 text-teal-800 text-sm font-semibold rounded-full border border-teal-300 shadow-sm">
                    High-Volume Hiring
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (Preview & Specs) */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Template Preview - Higher contrast and border */}
              <div className="bg-white rounded-xl p-6 border-4 border-gray-100 shadow-lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Document Visual Layout</h3>
                  <p className="text-sm text-gray-500 mt-1">A high-fidelity wireframe preview</p>
                </div>
                
                {/* Simulated document content - More structure */}
                <div className="space-y-4 text-sm bg-white p-4 rounded-lg border border-dashed border-gray-300">
                  <div className="h-4 bg-gray-300 rounded-full shadow-sm"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-4/5 shadow-sm"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-3/5 shadow-sm"></div>
                  <div className="h-6 bg-gray-400 rounded-md w-1/3 mt-6 shadow-sm"></div>
                  <div className="h-20 bg-gray-200 rounded-lg mt-4 shadow-inner border-l-4 border-blue-400 p-2"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-2/3 shadow-sm"></div>
                  <div className="h-4 bg-gray-300 rounded-full w-4/5 shadow-sm"></div>
                  <div className="h-6 bg-gray-400 rounded-md w-1/4 mt-6 shadow-sm"></div>
                  <div className="h-16 bg-gray-200 rounded-lg mt-4 shadow-inner border-l-4 border-green-400 p-2"></div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed font-medium">
                      Guaranteed to be fully customizable, highly responsive across all platforms, and pre-vetted for employment standards compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Specifications - Clean table-like layout */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-900 text-lg mb-4 pb-2 border-b border-gray-100">Template Specifications</h4>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500">Document Format</p>
                    <p className="font-semibold text-gray-900">PDF & DOCX</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Responsiveness</p>
                    <p className="font-semibold text-gray-900">All Devices</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Customization Level</p>
                    <p className="font-semibold text-gray-900 text-green-700">Full Access</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500">Compliance Updates</p>
                    <p className="font-semibold text-gray-900 text-blue-700">Included</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Included Variables - More prominent and structured */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h4 className="font-bold text-gray-900 text-xl mb-4">Dynamic Data Fields</h4>
            <div className="flex flex-wrap gap-3">
              {(template.variables || [
                'candidate_name',
                'position_title',
                'start_date',
                'salary_amount',
                'reporting_manager',
                'work_location',
                'benefits_details',
                'signature_date',
                'equity_details', // Added more executive-level variable example
                'contract_duration' // Added more contract-level variable example
              ]).map((variable, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-green-50 text-green-800 text-sm font-semibold rounded-full border border-green-300 shadow-sm capitalize hover:bg-green-100 transition-colors"
                >
                  {variable.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              These **dynamic smart fields** are automatically populated from your HRIS system, drastically reducing manual data entry errors and ensuring high-speed document generation.
            </p>
          </div>
        </div>

        {/* Footer - Clear call-to-action */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 p-6 border-t border-gray-200 bg-gray-50/70">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Template Status:</span> Up-to-date. <span className="font-medium">Last Audit:</span> {template.lastUpdated || 'November 2025'}
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="min-w-[140px] border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Close Preview
            </Button>
            <Button 
              onClick={() => onUseTemplate?.(template)}
              className="min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              🚀 Generate Letter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;