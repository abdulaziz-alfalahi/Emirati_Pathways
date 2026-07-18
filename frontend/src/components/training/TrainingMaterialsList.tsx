import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, File, FileText, Film, PresentationIcon, 
  Search, Clock, CheckSquare, Calendar, Trash2, Edit, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/EmptyState';
import { TrainingMaterial } from '@/types/training-materials';

interface TrainingMaterialsListProps {
  isManagement: boolean;
}

export const TrainingMaterialsList: React.FC<TrainingMaterialsListProps> = ({ isManagement }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMaterial, setViewMaterial] = useState<TrainingMaterial | null>(null);
  
  const fetchTrainingMaterials = async () => {
    let query = supabase
      .from('training_materials')
      .select('*');
      
    if (isManagement && user) {
      // If management view, only show materials from this training center
      query = query.eq('center_id', user.id);
    } else {
      // For regular users, only show public materials
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as unknown as TrainingMaterial[];
  };
  
  const { data: materials = [], isLoading, error, refetch } = useQuery({
    queryKey: ['training-materials', isManagement, user?.id],
    queryFn: fetchTrainingMaterials,
  });
  
  // Extract unique categories for filtering
  const categories = ['all', ...new Set(materials.map(m => m.category))];
  
  // Filter materials based on search term and category
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  const getMaterialTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Film className="h-4 w-4" />;
      case 'presentation':
        return <PresentationIcon className="h-4 w-4" />;
      case 'interactive':
        return <CheckSquare className="h-4 w-4" />;
      case 'assessment':
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  const handleDownload = async (material: TrainingMaterial) => {
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.storage
        .from('training-materials')
        .download(material.file_path);
        
      if (error) throw error;
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('training_materials')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Material deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };
  
  if (error) {
    return <EmptyState title="Error" description="Failed to load training materials" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {isManagement ? 'Manage Training Materials' : 'Available Training Materials'}
        </h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="ps-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <select 
            className="p-2 border rounded-md bg-background text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState 
          title="No materials found" 
          description={isManagement ? 
            "You haven't uploaded any training materials yet." : 
            "No training materials match your search criteria."
          } 
        />
      ) : isManagement ? (
        // Management view - table format
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getMaterialTypeIcon(material.material_type)}
                      <span className="ms-2 capitalize">{material.material_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>
                    <Badge variant={material.is_public ? "default" : "outline"}>
                      {material.is_public ? "Public" : "Private"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 me-1" />
                      <span>{format(new Date(material.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setViewMaterial(material)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(material)} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(material.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        // User view - card format
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge className="bg-blue-500/10 text-blue-500">
                    <div className="flex items-center">
                      {getMaterialTypeIcon(material.material_type)}
                      <span className="ms-1 capitalize">{material.material_type}</span>
                    </div>
                  </Badge>
                </div>
                <CardTitle className="mt-2">{material.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {material.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm space-y-2">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 me-2" />
                    <span>{format(new Date(material.created_at), 'MMMM d, yyyy')}</span>
                  </div>
                  {material.category && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="font-medium">Category:</span>
                      <span className="ms-2">{material.category}</span>
                    </div>
                  )}
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {material.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-1">
                <div className="w-full flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-500"
                    onClick={() => setViewMaterial(material)}
                  >
                    <Eye className="h-4 w-4 me-1" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(material)}
                  >
                    <Download className="h-4 w-4 me-1" />
                    Download
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Material Detail Dialog */}
      {viewMaterial && (
        <Dialog open={!!viewMaterial} onOpenChange={(open) => !open && setViewMaterial(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewMaterial.title}</DialogTitle>
              <DialogDescription>
                {format(new Date(viewMaterial.created_at), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-muted-foreground">{viewMaterial.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Type</h4>
                  <div className="flex items-center">
                    {getMaterialTypeIcon(viewMaterial.material_type)}
                    <span className="ms-2 capitalize">{viewMaterial.material_type}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Category</h4>
                  <p>{viewMaterial.category}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {viewMaterial.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">File Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-muted-foreground">
                    <span>Filename: </span>
                    <span className="font-medium">{viewMaterial.file_name}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span>Size: </span>
                    <span className="font-medium">
                      {(viewMaterial.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleDownload(viewMaterial)}>
                  <Download className="h-4 w-4 me-2" />
                  Download Material
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
