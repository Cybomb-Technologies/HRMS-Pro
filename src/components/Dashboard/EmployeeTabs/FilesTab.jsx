import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Download, Trash2, FileText, Plus, FolderOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const FilesTab = () => {
  const { employees: employeesApi } = useAppContext();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const documentSections = [
    { id: 'identity', name: 'Identity Documents', description: 'Passport, Driver License, National ID, etc.' },
    { id: 'education', name: 'Education Documents', description: 'Degrees, Certificates, Transcripts, etc.' },
    { id: 'work_experience', name: 'Work Experience Documents', description: 'Experience letters, Reference letters, etc.' },
    { id: 'banking', name: 'Banking Documents', description: 'Passbook, Bank statement, Cancelled cheque, etc.' }
  ];

  // Fetch documents on component mount
  useEffect(() => {
    fetchEmployeeDocuments();
  }, []);

  const fetchEmployeeDocuments = async () => {
    try {
      setLoading(true);
      const employeeId = user.employeeId || user.id;
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}/documents`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched documents:', data.documents); // Debug log
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (section) => {
    setSelectedSection(section);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!selectedSection) {
      toast({
        title: 'Error',
        description: 'Please select a document section first.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file types
    const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const invalidFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return !validTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only PDF, Word, or Text documents.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('section', selectedSection);

      // Use employeeId instead of MongoDB _id
      const employeeId = user.employeeId || user.id;
      
      console.log('Uploading files:', {
        employeeId,
        section: selectedSection,
        files: files.map(f => f.name)
      });

      // Upload files to server with both empId and section as query parameters
      const response = await fetch(`http://localhost:5000/api/employees/documents?empId=${employeeId}&section=${selectedSection}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Upload successful',
          description: `Uploaded ${files.length} file(s) to ${documentSections.find(s => s.id === selectedSection)?.name}`
        });
        
        // Refresh documents list without page reload
        await fetchEmployeeDocuments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload documents. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setSelectedSection('');
      event.target.value = ''; // Reset file input
    }
  };

  const handleDownload = async (document) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Download is only available in browser environment');
    }

    const employeeId = user.employeeId || user.id;
    console.log('Downloading document:', { 
      documentId: document.id, 
      documentName: document.name,
      employeeId 
    });

    const response = await fetch(`http://localhost:5000/api/employees/documents/${document.id}?empId=${employeeId}`);
    
    if (response.ok) {
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name || 'document';
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Download started',
        description: `Downloading ${document.name}`
      });
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || `Download failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Download error:', error);
    
    // If the createElement method fails, fall back to alternative method
    if (error.message.includes('createElement') || error.message.includes('browser environment')) {
      handleDownloadAlternative(document);
      return;
    }
    
    toast({
      title: 'Download failed',
      description: error.message || 'Failed to download document. Please try again.',
      variant: 'destructive'
    });
  }
};

  // Alternative download method using window.open
  const handleDownloadAlternative = async (document) => {
    try {
      const employeeId = user.employeeId || user.id;
      
      // Open in new tab - this often works better for downloads
      window.open(`http://localhost:5000/api/employees/documents/${document.id}?empId=${employeeId}`, '_blank');
      
    } catch (error) {
      console.error('Alternative download error:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (document) => {
    if (!confirm(`Are you sure you want to delete ${document.name}?`)) {
      return;
    }

    try {
      const employeeId = user.employeeId || user.id;
      const response = await fetch(`http://localhost:5000/api/employees/documents/${document.id}?empId=${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Document deleted',
          description: `${document.name} has been deleted successfully.`
        });
        
        // Refresh documents list without page reload
        await fetchEmployeeDocuments();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group documents by section
  const documentsBySection = documents.reduce((acc, doc) => {
    if (!acc[doc.section]) {
      acc[doc.section] = [];
    }
    acc[doc.section].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="mr-2 h-5 w-5" />
            Employee Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Upload and manage your required documents. Supported formats: PDF, Word (.doc, .docx), Text (.txt)
          </p>

          <div className="space-y-6">
            {documentSections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{section.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                    <Button 
                      onClick={() => handleFileSelect(section.id)}
                      disabled={uploading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Files
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {documentsBySection[section.id]?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File Name</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Date Uploaded</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentsBySection[section.id].map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              {doc.name}
                            </TableCell>
                            <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                            <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDownload(doc)}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700" 
                                onClick={() => handleDelete(doc)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => handleFileSelect(section.id)}
                        disabled={uploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
        </CardContent>
      </Card>

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p>Uploading documents...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FilesTab;