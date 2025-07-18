import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, ShoppingCart, Video } from "lucide-react";
import { AmazonProduct } from "@shared/catalog-schema";

// Country flag component
const CountryFlag = ({ country }: { country: string }) => {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'CA': '🇨🇦',
    'UK': '🇬🇧',
    'AU': '🇦🇺',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'JP': '🇯🇵',
    'IN': '🇮🇳',
    'BR': '🇧🇷',
    'MX': '🇲🇽',
  };
  
  return (
    <span className="text-lg" title={country}>
      {flags[country] || '🌍'}
    </span>
  );
};

// Product card component
const ProductCard = ({ product }: { product: AmazonProduct }) => {
  const handleProductClick = () => {
    // Open Amazon affiliate link in new tab
    window.open(product.amazonUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105" onClick={handleProductClick}>
      <CardHeader className="pb-3">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
            {product.name}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-green-600">
            {product.price}
          </div>
          <div className="flex items-center space-x-1">
            {product.availabilityCountries.map((country) => (
              <CountryFlag key={country} country={country} />
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Buy on Amazon</span>
          </div>
          {product.videoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(product.videoUrl!, '_blank', 'noopener,noreferrer');
              }}
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch product categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/products/categories'],
    queryFn: async () => {
      const response = await fetch('/api/products/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Fetch products with filters
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products', selectedCategory, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Recommended Products
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover carefully curated products to enhance your child's learning and entertainment experience.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(selectedCategory || searchTerm) && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="aspect-square w-full bg-gray-200 rounded-lg"></div>
                </CardHeader>
                <CardContent className="space-y-3">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-600">
              {selectedCategory || searchTerm
                ? "Try adjusting your filters or search terms."
                : "No products are currently available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            <ExternalLink className="h-4 w-4 inline mr-1" />
            Clicking on products will take you to Amazon. We may earn a commission from purchases.
          </p>
        </div>
      </div>
    </div>
  );
}