// src/components/HR-Letter/OfferLetter.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { FileText, Download, Send, Plus, Trash2 } from 'lucide-react';

const OfferLetter = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch('http://localhost:5000/api/offer-letters/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTemplates(result.data || []);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateLetter = async () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a template',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/generate/${selectedTemplate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setGeneratedLetter(result.data);
        toast({
          title: 'Success',
          description: 'Offer letter generated successfully'
        });
      } else {
        throw new Error(result.message || 'Failed to generate letter');
      }
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedLetter) return;

    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/download/${generatedLetter.generatedLetterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `offer-letter-${formData.candidate_name || 'candidate'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive'
      });
    }
  };

  // Get selected template variables
  const selectedTemplateData = templates.find(t => t._id === selectedTemplate);
  const templateVariables = selectedTemplateData?.variables || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Generate Offer Letter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div>
            <Label htmlFor="template">Select Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Form Fields */}
          {selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateVariables.map(variable => (
                <div key={variable}>
                  <Label htmlFor={variable}>
                    {variable.replace(/_/g, ' ').toUpperCase()}
                  </Label>
                  <Input
                    id={variable}
                    value={formData[variable] || ''}
                    onChange={(e) => handleInputChange(variable, e.target.value)}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={generateLetter} 
            disabled={loading || !selectedTemplate}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Offer Letter'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Letter Preview */}
      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <div 
                dangerouslySetInnerHTML={{ __html: generatedLetter.html }} 
                className="prose max-w-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={downloadPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfferLetter;