import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Edit,
  Eye,
  Copy,
  Share,
  Tag,
  Calendar,
  FileText,
  Video,
  Music,
  File,
  Plus,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  FolderPlus,
  Folder
} from 'lucide-react';

interface MediaAsset {
  id: number;
  uuid: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  alt_text?: string;
  caption?: string;
  description?: string;
  tags: string[];
  uploaded_by: string;
  uploaded_at: string;
  storage_path: string;
  thumbnail_url?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface MediaFilters {
  type: string;
  uploaded_by: string;
  date_range: string;
  tags: string;
}

const MediaLibrary: React.FC = () => {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(24);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<MediaFilters>({
    type: '',
    uploaded_by: '',
    date_range: '',
    tags: ''
  });

  const [uploadData, setUploadData] = useState({
    files: [] as File[],
    alt_text: '',
    caption: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    fetchMediaAssets();
  }, [currentPage, filters]);

  useEffect(() => {
    filterAssets();
  }, [mediaAssets, searchTerm]);

  useEffect(() => {
    // Setup drag and drop
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
      
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        setUploadData({ ...uploadData, files });
        setShowUploadModal(true);
      }
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, [uploadData]);

  const fetchMediaAssets = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockAssets: MediaAsset[] = [
        {
          id: 1,
          uuid: 'uuid-1',
          filename: 'career-guidance-hero.jpg',
          original_name: 'career-guidance-hero.jpg',
          mime_type: 'image/jpeg',
          file_size: 2048576,
          alt_text: 'Career guidance hero image',
          caption: 'Professional development in the UAE',
          description: 'Hero image for career guidance section',
          tags: ['career', 'guidance', 'hero', 'professional'],
          uploaded_by: 'Sarah Al-Mansouri',
          uploaded_at: '2024-01-20T10:30:00Z',
          storage_path: '/media/images/career-guidance-hero.jpg',
          thumbnail_url: '/api/media/1/thumbnail',
          dimensions: { width: 1920, height: 1080 }
        },
        {
          id: 2,
          uuid: 'uuid-2',
          filename: 'interview-tips-infographic.png',
          original_name: 'interview-tips-infographic.png',
          mime_type: 'image/png',
          file_size: 1536000,
          alt_text: 'Interview tips infographic',
          caption: 'Essential interview preparation tips',
          description: 'Comprehensive infographic about interview preparation',
          tags: ['interview', 'tips', 'infographic', 'preparation'],
          uploaded_by: 'Ahmed Al-Zaabi',
          uploaded_at: '2024-01-22T14:15:00Z',
          storage_path: '/media/images/interview-tips-infographic.png',
          thumbnail_url: '/api/media/2/thumbnail',
          dimensions: { width: 800, height: 1200 }
        },
        {
          id: 3,
          uuid: 'uuid-3',
          filename: 'uae-job-market-report.pdf',
          original_name: 'UAE Job Market Analysis 2024.pdf',
          mime_type: 'application/pdf',
          file_size: 5242880,
          alt_text: 'UAE job market report',
          caption: 'Comprehensive job market analysis',
          description: 'Detailed analysis of the UAE job market trends and opportunities',
          tags: ['report', 'job market', 'UAE', 'analysis', '2024'],
          uploaded_by: 'Fatima Al-Zahra',
          uploaded_at: '2024-01-25T09:45:00Z',
          storage_path: '/media/documents/uae-job-market-report.pdf',
          thumbnail_url: '/api/media/3/thumbnail'
        },
        {
          id: 4,
          uuid: 'uuid-4',
          filename: 'networking-event-video.mp4',
          original_name: 'Professional Networking Event Highlights.mp4',
          mime_type: 'video/mp4',
          file_size: 52428800,
          alt_text: 'Networking event highlights',
          caption: 'Professional networking event in Dubai',
          description: 'Highlights from the annual professional networking event',
          tags: ['networking', 'event', 'video', 'professional', 'Dubai'],
          uploaded_by: 'Mohammed Al-Rashid',
          uploaded_at: '2024-01-28T16:20:00Z',
          storage_path: '/media/videos/networking-event-video.mp4',
          thumbnail_url: '/api/media/4/thumbnail'
        }
      ];

      setMediaAssets(mockAssets);
      setTotalPages(Math.ceil(mockAssets.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch media assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = mediaAssets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(asset => {
          switch (key) {
            case 'type':
              return asset.mime_type.startsWith(value);
            case 'uploaded_by':
              return asset.uploaded_by.toLowerCase().includes(value.toLowerCase());
            case 'tags':
              return asset.tags.some(tag => tag.toLowerCase().includes(value.toLowerCase()));
            default:
              return true;
          }
        });
      }
    });

    setFilteredAssets(filtered);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadData({ ...uploadData, files });
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock upload - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create new assets
      const newAssets = uploadData.files.map((file, index) => ({
        id: Date.now() + index,
        uuid: `uuid-${Date.now()}-${index}`,
        filename: file.name.replace(/\s+/g, '-').toLowerCase(),
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        alt_text: uploadData.alt_text,
        caption: uploadData.caption,
        description: uploadData.description,
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        uploaded_by: 'Current User',
        uploaded_at: new Date().toISOString(),
        storage_path: `/media/${file.type.split('/')[0]}s/${file.name}`,
        thumbnail_url: `/api/media/${Date.now() + index}/thumbnail`
      }));

      setUploadProgress(100);
      setTimeout(() => {
        setMediaAssets([...newAssets, ...mediaAssets]);
        setShowUploadModal(false);
        setUploadData({ files: [], alt_text: '', caption: '', description: '', tags: '' });
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Failed to upload files:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditAsset = async () => {
    if (!editingAsset) return;

    try {
      // Mock API call - replace with actual implementation
      setMediaAssets(mediaAssets.map(asset =>
        asset.id === editingAsset.id ? editingAsset : asset
      ));
      setShowEditModal(false);
      setEditingAsset(null);
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDeleteAssets = async (assetIds: number[]) => {
    try {
      // Mock API call - replace with actual implementation
      setMediaAssets(mediaAssets.filter(asset => !assetIds.includes(asset.id)));
      setSelectedAssets([]);
    } catch (error) {
      console.error('Failed to delete assets:', error);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType === 'application/pdf') return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage images, videos, documents, and other media assets
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Upload className="w-4 h-4 me-2" />
                Upload Media
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 me-2" />
                Filters
              </button>
              
              <button
                onClick={fetchMediaAssets}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="application">Documents</option>
                </select>

                <input
                  type="text"
                  placeholder="Uploaded by"
                  value={filters.uploaded_by}
                  onChange={(e) => setFilters({ ...filters, uploaded_by: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  placeholder="Tags"
                  value={filters.tags}
                  onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedAssets.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedAssets.length} asset(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteAssets(selectedAssets)}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Drop files here to upload</p>
          <p className="text-sm text-gray-500">or click the Upload Media button above</p>
        </div>

        {/* Media Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 me-3" />
            <span className="text-lg font-medium text-gray-700">Loading media...</span>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                  {asset.mime_type.startsWith('image/') ? (
                    <img
                      src={asset.thumbnail_url || '/api/placeholder-image'}
                      alt={asset.alt_text || asset.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">
                      {getFileIcon(asset.mime_type)}
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(asset.storage_path)}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-green-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssets([asset.id])}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Selection checkbox */}
                  <div className="absolute top-2 start-2">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets([...selectedAssets, asset.id]);
                        } else {
                          setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={asset.original_name}>
                    {asset.original_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(asset.file_size)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{asset.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start">
                    <input
                      type="checkbox"
                      checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets(filteredAssets.map(asset => asset.id));
                        } else {
                          setSelectedAssets([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssets([...selectedAssets, asset.id]);
                          } else {
                            setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {asset.mime_type.startsWith('image/') ? (
                            <img
                              src={asset.thumbnail_url || '/api/placeholder-image'}
                              alt={asset.alt_text || asset.original_name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400">
                              {getFileIcon(asset.mime_type)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {asset.original_name}
                          </p>
                          {asset.caption && (
                            <p className="text-sm text-gray-500 truncate">
                              {asset.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {asset.mime_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatFileSize(asset.file_size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {asset.uploaded_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(asset.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 text-end text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(asset.storage_path)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssets([asset.id])}
                          className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Media Files</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Files to Upload</label>
                <div className="space-y-2">
                  {uploadData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newFiles = uploadData.files.filter((_, i) => i !== index);
                          setUploadData({ ...uploadData, files: newFiles });
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={uploadData.alt_text}
                  onChange={(e) => setUploadData({ ...uploadData, alt_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alternative text for accessibility"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={uploadData.caption}
                  onChange={(e) => setUploadData({ ...uploadData, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief caption for the media"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the media"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>
              
              {isUploading && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || uploadData.files.length === 0}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Media Asset</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAsset(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Name</label>
                <input
                  type="text"
                  value={editingAsset.original_name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, original_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={editingAsset.alt_text || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, alt_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alternative text for accessibility"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={editingAsset.caption || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, caption: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief caption for the media"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingAsset.description || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the media"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={editingAsset.tags.join(', ')}
                  onChange={(e) => setEditingAsset({ 
                    ...editingAsset, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAsset(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAsset}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
