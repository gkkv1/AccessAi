import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Search,
  Volume2,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { endpoints, Document } from '@/lib/api';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: endpoints.getDocuments,
    refetchInterval: (data) => {
      // Poll if any document is processing
      return Array.isArray(data) && data.some(d => d.status === 'processing') ? 2000 : false;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: endpoints.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("Document uploaded successfully");
      setUploadProgress(null);
    },
    onError: () => {
      toast.error("Failed to upload document");
      setUploadProgress(null);
    }
  });

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      setUploadProgress(0); // Indeterminate or fake progress for now
      // In a real app with axios onUploadProgress, we'd update this
      try {
        await uploadMutation.mutateAsync(file);
        setUploadProgress(100);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
    }
  };

  return (
    <main id="main-content" className="container py-8 md:py-12 transition-accessibility">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-accessible-2xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage workplace documents for AI analysis
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            'relative rounded-2xl border-2 border-dashed p-8 transition-all text-center',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileInput}
            accept=".pdf,.docx,.doc,.txt"
            multiple
            aria-label="Upload files"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Drag and drop files here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • PDF, DOCX, TXT supported
              </p>
            </div>
            <Button className="mt-2" disabled={uploadMutation.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>

          {uploadProgress !== null && (
            <div className="mt-6">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mt-8 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search documents"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading documents...</p>
            </div>
          ) : filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className={cn(
                'p-4 transition-all hover:shadow-md',
                doc.status === 'processing' && 'opacity-70'
              )}
              tabIndex={0}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground truncate">
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(doc.status)}
                          {getStatusText(doc.status)}
                        </span>
                        {doc.pages && (
                          <span>{doc.pages} pages</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {doc.summary && (
                    <p className="mt-2 text-sm text-foreground/70 line-clamp-2">
                      {doc.summary}
                    </p>
                  )}

                  {doc.status === 'ready' && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Volume2 className="h-4 w-4 mr-1" />
                        Listen
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Simplify
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {!isLoading && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchQuery ? 'No documents found' : 'No documents uploaded yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
