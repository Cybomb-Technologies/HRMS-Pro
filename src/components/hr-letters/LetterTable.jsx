import React, { useState } from 'react';
import { hrLettersAPI } from '../../utils/api';

const LetterTable = ({ 
  letters, 
  onLetterUpdate, 
  isLoading,
  onEditLetter,
  onDownloadLetter,
  onDeleteLetter
}) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = async (id, fileName) => {
    setDownloadingId(id);
    try {
      await hrLettersAPI.downloadPDF(id);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF: ' + error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (id) => {
    setPreviewingId(id);
    try {
      const htmlContent = await hrLettersAPI.previewHTML(id);
      setPreviewContent(htmlContent);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Failed to preview letter: ' + error.message);
    } finally {
      setPreviewingId(null);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewContent(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this letter? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      await hrLettersAPI.deleteLetter(id);
      onLetterUpdate(); // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete letter: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (letter) => {
    if (onEditLetter) {
      onEditLetter(letter);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getLetterTypeLabel = (type) => {
    const typeMap = {
      offer: 'Offer Letter',
      appointment: 'Appointment Letter',
      hike: 'Salary Hike',
      promotion: 'Promotion Letter',
      termination: 'Termination',
      experience: 'Experience Letter'
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colorMap = {
      offer: 'bg-green-100 text-green-800',
      appointment: 'bg-blue-100 text-blue-800',
      hike: 'bg-yellow-100 text-yellow-800',
      promotion: 'bg-purple-100 text-purple-800',
      termination: 'bg-red-100 text-red-800',
      experience: 'bg-indigo-100 text-indigo-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!letters || letters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No letters generated yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by generating your first HR letter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Letter Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Designation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {letters.map((letter) => (
              <tr key={letter._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {letter.candidateName}
                        {letter.isModified && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Modified
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {letter.candidateEmail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(letter.letterType)}`}>
                    {getLetterTypeLabel(letter.letterType)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {letter.designation}
                  {letter.department && (
                    <div className="text-sm text-gray-500">
                      {letter.department}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(letter.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(letter)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit and Regenerate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Preview Button */}
                    <button
                      onClick={() => handlePreview(letter._id)}
                      disabled={previewingId === letter._id}
                      className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewingId === letter._id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Previewing
                        </span>
                      ) : (
                        'Preview'
                      )}
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(letter._id, letter.fileName)}
                      disabled={downloadingId === letter._id}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === letter._id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Downloading
                        </span>
                      ) : (
                        'Download PDF'
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(letter._id)}
                      disabled={deletingId === letter._id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                    >
                      {deletingId === letter._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Letter Preview</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {previewContent ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Preview Frame - Fixed scrolling */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div 
                      className="bg-white p-8 mx-auto shadow-lg max-w-4xl min-h-full"
                      dangerouslySetInnerHTML={{ __html: previewContent }}
                    />
                  </div>

                  {/* Actions - Fixed at bottom */}
                  <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-white">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        This is a preview of the letter content.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleClosePreview}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Close Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No preview available</h3>
                    <p className="mt-1 text-sm text-gray-500">Preview content could not be loaded.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LetterTable;