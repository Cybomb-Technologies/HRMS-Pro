// src/components/HR-Letter/PrivacyPolicy.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Shield, Lock, Eye, FileCheck } from 'lucide-react';

const PrivacyPolicy = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Privacy Policy & Data Protection</h2>
              <p className="text-sm text-gray-600">How we handle and protect candidate data</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-blue max-w-none">
            {/* Introduction */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 text-blue-600 mr-2" />
                Data Protection Commitment
              </h3>
              <p className="text-gray-600 mb-4">
                At Cybomb Technologies LLP, we are committed to protecting the privacy and security 
                of all candidate information collected during the offer letter generation process. 
                This policy outlines how we collect, use, and protect your data.
              </p>
            </div>

            {/* Data Collection */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Information We Collect</h4>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                  <li>Personal identification information (name, email, phone number)</li>
                  <li>Professional details (designation, department, work experience)</li>
                  <li>Compensation and benefits information</li>
                  <li>Employment terms and conditions</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
            </div>

            {/* Data Usage */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">How We Use Your Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Offer Generation</p>
                    <p className="text-sm text-blue-700">Create and customize employment offer letters</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Eye className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Communication</p>
                    <p className="text-sm text-green-700">Send offer letters and related communications</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Protection */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Data Protection Measures</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Encrypted data storage and transmission</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Role-based access control systems</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Regular security audits and monitoring</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Compliance with data protection regulations</span>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Data Retention</h4>
              <p className="text-gray-600 mb-2">
                We retain candidate data only for as long as necessary to fulfill the purposes 
                for which it was collected, including for the purposes of satisfying any legal, 
                accounting, or reporting requirements.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Retention Period:</strong> Candidate data is typically retained for 
                  3 years after the recruitment process concludes, unless otherwise required by law.
                </p>
              </div>
            </div>

            {/* Candidate Rights */}
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-3">Your Rights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Right to Access</p>
                  <p className="text-xs text-gray-600">Request copies of your personal data</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Right to Rectification</p>
                  <p className="text-xs text-gray-600">Correct inaccurate or incomplete data</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Right to Erasure</p>
                  <p className="text-xs text-gray-600">Request deletion of your personal data</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">Right to Object</p>
                  <p className="text-xs text-gray-600">Object to processing of your data</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Contact Our Data Protection Officer</h4>
              <p className="text-sm text-blue-700">
                For any questions about this privacy policy or our data protection practices, 
                please contact: <strong>dpo@cybomb.com</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;