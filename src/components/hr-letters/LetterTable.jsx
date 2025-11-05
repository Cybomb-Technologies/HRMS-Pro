import React, {useState } from 'react';
import { hrLettersAPI } from '../../utils/api';

const LetterTable = ({ letters, onLetterUpdate, isLoading }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
  );
};

export default LetterTable;