import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { Download, FileText, Search, Calendar, User, Briefcase, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  url: string;
  entityInfo: {
    type?: string;
    applicationNumber?: string;
  };
}

export function DocumentSearch({ open, onOpenChange }: DocumentSearchProps) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchParams, setSearchParams] = useState({
    entityType: '',
    entityName: '',
    year: new Date().getFullYear().toString(),
    month: '',
    documentType: '',
  });

  const handleSearch = async () => {
    try {
      setSearching(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchParams.entityType) params.append('entityType', searchParams.entityType);
      if (searchParams.entityName) params.append('entityName', searchParams.entityName);
      if (searchParams.year) params.append('year', searchParams.year);
      if (searchParams.month) params.append('month', searchParams.month);
      if (searchParams.documentType) params.append('documentType', searchParams.documentType);
      params.append('limit', '100');
      
      const response = await apiClient.get(`/documents/search?${params.toString()}`);
      setResults(response.data.files || []);
      
      if (response.data.files.length === 0) {
        alert('No documents found matching your search criteria');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search documents');
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (file: SearchResult) => {
    try {
      // Get a fresh URL in case the current one is expired
      const response = await apiClient.post('/documents/refresh-url', {
        key: file.key,
        expiresIn: 3600,
      });
      
      // Open in new tab for download
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const getEntityIcon = (type?: string) => {
    switch (type) {
      case 'application':
        return <Briefcase className="h-4 w-4" />;
      case 'client':
        return <User className="h-4 w-4" />;
      case 'candidate':
        return <User className="h-4 w-4" />;
      case 'company':
        return <Building2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Documents</DialogTitle>
          <DialogDescription>
            Search for documents across all applications, clients, and candidates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entityType">Document Type</Label>
              <Select
                value={searchParams.entityType}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, entityType: value })
                }
              >
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="application">Application Documents</SelectItem>
                  <SelectItem value="client">Client Documents</SelectItem>
                  <SelectItem value="candidate">Candidate Documents</SelectItem>
                  <SelectItem value="company">Company Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entityName">Name (Client/Candidate)</Label>
              <Input
                id="entityName"
                placeholder="e.g., John Doe"
                value={searchParams.entityName}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, entityName: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Select
                value={searchParams.year}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, year: value })
                }
              >
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Month</Label>
              <Select
                value={searchParams.month}
                onValueChange={(value) =>
                  setSearchParams({ ...searchParams, month: value })
                }
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All months</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="documentType">Document Name/Type</Label>
              <Input
                id="documentType"
                placeholder="e.g., passport, contract, invoice"
                value={searchParams.documentType}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, documentType: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full"
          >
            <Search className="mr-2 h-4 w-4" />
            {searching ? 'Searching...' : 'Search Documents'}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        File Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Size
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Modified
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((file, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            {getEntityIcon(file.entityInfo?.type)}
                            <span className="ml-2 text-sm text-gray-600">
                              {file.entityInfo?.type || 'Document'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {file.fileName}
                            </div>
                            {file.entityInfo?.applicationNumber && (
                              <div className="text-xs text-gray-500">
                                App: {file.entityInfo.applicationNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(file.lastModified), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.length === 0 && !searching && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No search results yet</p>
              <p className="text-sm">Enter search criteria and click search</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}