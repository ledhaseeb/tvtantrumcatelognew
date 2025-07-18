import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ExternalLink, Video, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AmazonProduct, InsertAmazonProduct } from "@shared/catalog-schema";
import { VideoPreview } from "@/components/VideoPreview";

// Country options for availability
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
];

// Product form component
const ProductForm = ({ 
  product, 
  onSubmit, 
  onCancel 
}: { 
  product?: AmazonProduct; 
  onSubmit: (product: InsertAmazonProduct) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<InsertAmazonProduct>({
    name: product?.name || '',
    category: product?.category || '',
    imageUrl: product?.imageUrl || '',
    amazonUrl: product?.amazonUrl || '',
    price: product?.price || '',
    availabilityCountries: product?.availabilityCountries || [],
    videoUrl: product?.videoUrl || '',
    description: product?.description || '',
    isActive: product?.isActive ?? true,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalFormData = { ...formData };
    
    // Upload image if a file is selected
    if (imageFile) {
      try {
        const imageUrl = await handleImageUpload(imageFile);
        finalFormData.imageUrl = imageUrl;
      } catch (error) {
        console.error('Failed to upload image:', error);
        return;
      }
    }
    
    onSubmit(finalFormData);
  };

  const handleCountryToggle = (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      availabilityCountries: prev.availabilityCountries.includes(countryCode)
        ? prev.availabilityCountries.filter(c => c !== countryCode)
        : [...prev.availabilityCountries, countryCode]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image">Product Image *</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="flex-1 text-sm"
            />
            {isUploading && (
              <div className="text-sm text-gray-600">Uploading...</div>
            )}
          </div>
          
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Product preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border"
              />
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            Or enter an image URL:
          </div>
          <Input
            value={formData.imageUrl}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
              setImagePreview(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            className="text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="amazonUrl">Amazon Affiliate URL *</Label>
        <Input
          id="amazonUrl"
          value={formData.amazonUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, amazonUrl: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="$29.99"
            required
          />
        </div>

        <div>
          <Label htmlFor="videoUrl">Video URL (optional)</Label>
          <Input
            id="videoUrl"
            value={formData.videoUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
          className="text-sm"
        />
      </div>

      <div>
        <Label>Availability Countries *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 mt-2">
          {COUNTRIES.map(country => (
            <div key={country.code} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={country.code}
                checked={formData.availabilityCountries.includes(country.code)}
                onChange={() => handleCountryToggle(country.code)}
                className="w-4 h-4"
              />
              <label htmlFor={country.code} className="text-sm flex-1">
                {country.flag} {country.name}
              </label>
            </div>
          ))}
        </div>
        {formData.availabilityCountries.length === 0 && (
          <p className="text-sm text-red-500 mt-1">Please select at least one country</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button type="submit" disabled={formData.availabilityCountries.length === 0} size="sm">
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default function AdminProductsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AmazonProduct | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ isOpen: boolean; videoUrl: string; productName: string }>({
    isOpen: false,
    videoUrl: '',
    productName: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (product: InsertAmazonProduct) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Product created successfully' });
      setIsCreateOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to create product', variant: 'destructive' });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, product }: { id: number; product: InsertAmazonProduct }) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Product updated successfully' });
      setEditingProduct(null);
    },
    onError: () => {
      toast({ title: 'Failed to update product', variant: 'destructive' });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Product deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    },
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Amazon Products</h1>
          <p className="text-gray-600 mt-2">Manage your affiliate product catalog</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 m-4 sm:m-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto">
              <ProductForm
                onSubmit={(product) => createMutation.mutate(product)}
                onCancel={() => setIsCreateOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="aspect-square w-full bg-gray-200 rounded-lg"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Yet</h2>
          <p className="text-gray-600 mb-4">Add your first affiliate product to get started.</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="h-full w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">Image not available</div>`;
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-green-600">
                    {product.price}
                  </div>
                  <div className="flex items-center space-x-1">
                    {(product.availabilityCountries || []).map((country) => (
                      <span key={country} className="text-sm">
                        {COUNTRIES.find(c => c.code === country)?.flag || '🌍'}
                      </span>
                    ))}
                  </div>
                </div>
                
                {product.description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(product.amazonUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {product.videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoPreview({
                            isOpen: true,
                            videoUrl: product.videoUrl!,
                            productName: product.name
                          });
                        }}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(product.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 m-4 sm:m-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Edit Product</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto">
            {editingProduct && (
              <ProductForm
                product={editingProduct}
                onSubmit={(product) => updateMutation.mutate({ id: editingProduct.id, product })}
                onCancel={() => setEditingProduct(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <VideoPreview
        isOpen={videoPreview.isOpen}
        onClose={() => setVideoPreview({ isOpen: false, videoUrl: '', productName: '' })}
        videoUrl={videoPreview.videoUrl}
        productName={videoPreview.productName}
      />
    </div>
  );
}