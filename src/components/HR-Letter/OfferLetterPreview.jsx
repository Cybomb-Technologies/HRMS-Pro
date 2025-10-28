// src/components/HR-Letter/OfferLetterPreview.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, ArrowLeft, X } from 'lucide-react';

const OfferLetterPreview = ({ generatedLetter, formData, onBack, onClose, isPopup = false }) => {
  const downloadOfferLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-letter-${formData.candidate_name.replace(/\s+/g, '-').toLowerCase() || 'candidate'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printOfferLetter = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Offer Letter - ${formData.candidate_name}</title>
        </head>
        <body>
          ${generatedLetter}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
          {/* Header - Fixed height */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Button 
                onClick={onBack} 
                size="sm" 
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Offer Letter Preview</h3>
                <p className="text-sm text-gray-500">Generated for {formData.candidate_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={downloadOfferLetter} size="sm" className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
              <Button onClick={printOfferLetter} size="sm" variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-hidden p-4 bg-gray-100">
            <div className="h-full overflow-y-auto">
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-white shadow-inner min-h-full">
                <div 
                  dangerouslySetInnerHTML={{ __html: generatedLetter }}
                  className="offer-letter-preview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button 
            onClick={onBack} 
            size="sm" 
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Offer Letter Preview</h3>
            <p className="text-sm text-gray-500">Generated for {formData.candidate_name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={downloadOfferLetter} size="sm" className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Download HTML
          </Button>
          <Button onClick={printOfferLetter} size="sm" variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-2 bg-white shadow-inner">
        <div 
          dangerouslySetInnerHTML={{ __html: generatedLetter }}
          className="offer-letter-preview"
        />
      </div>
    </div>
  );
};

export default OfferLetterPreview;