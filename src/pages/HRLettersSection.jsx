// src/pages/HRLettersSection.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { FileText, Plus, Search, Filter, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

import OfferLetter from '../components/HR-Letter/OfferLetter';
import AppointmentLetter from '@/components/HR-Letter/AppointmentLetter';
import SalaryRevisionLetter from '@/components/HR-Letter/SalaryRevisionLetter';
import ExperienceLetter from '../components/HR-Letter/ExperienceLetter';
import GeneratedLetters from '../components/HR-Letter/GeneratedLetter';

const HRLettersSection = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showLetterPopup, setShowLetterPopup] = useState(false);

  const letterTemplates = [
    { 
      id: 'LT001', 
      name: 'Offer Letter', 
      description: 'Professional employment offer letters for new hires',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      component: OfferLetter
    },
    { 
      id: 'LT002', 
      name: 'Appointment Letter', 
      description: 'Formal appointment confirmation letters',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      component: AppointmentLetter
    },
    { 
      id: 'LT003', 
      name: 'Salary Revision Letter', 
      description: 'Salary increment and revision letters',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      component: SalaryRevisionLetter
    },
    { 
      id: 'LT004', 
      name: 'Experience Letter', 
      description: 'Work experience and relieving letters',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      component: ExperienceLetter
    }
  ];

  const filteredTemplates = letterTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowLetterPopup(true);
  };

  const handleClosePopup = () => {
    setShowLetterPopup(false);
    setSelectedTemplate(null);
  };

  const handleGenerateLetter = () => {
    toast({ 
      title: 'Select a template', 
      description: 'Please select a template to generate a letter.' 
    });
  };

  return (
    <>
      <Helmet>
        <title>HR Letters - HRMS Pro</title>
        <meta name="description" content="Generate, manage, and track HR letters" />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Letters</h1>
            <p className="text-gray-600 mt-2">
              Generate and manage official HR letters from templates
            </p>
          </div>
          <Button
            onClick={handleGenerateLetter}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Letter
          </Button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'templates', label: 'Templates', icon: FileText },
                { id: 'generated', label: 'Generated Letters', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Template Grid */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredTemplates.map((template, index) => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className="p-6 card-hover group cursor-pointer border-2 border-transparent hover:border-blue-200 transition-all duration-200"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 bg-gradient-to-r ${template.color} rounded-xl`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2">
                              {template.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                              {template.description}
                            </p>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Template
                            </Badge>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Click to open editor</span>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTemplateSelect(template);
                            }}
                          >
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'generated' && (
          <GeneratedLetters />
        )}

        {/* Letter Editor Popup */}
        {showLetterPopup && selectedTemplate && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden">
      <div className="h-full">
        {selectedTemplate.id === 'LT001' && (
          <OfferLetter 
            isPopup={true} 
            onClose={handleClosePopup} 
          />
        )}
        {selectedTemplate.id === 'LT002' && <AppointmentLetter />}
        {selectedTemplate.id === 'LT003' && <SalaryRevisionLetter />}
        {selectedTemplate.id === 'LT004' && <ExperienceLetter />}
      </div>
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default HRLettersSection;