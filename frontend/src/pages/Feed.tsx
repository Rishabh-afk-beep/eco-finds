import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/ProductCard';
import { store, Product, User, CATEGORIES } from '@/lib/store';
import { Search, Filter, X, SortAsc, SortDesc, Leaf } from 'lucide-react';

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 8;
  const badges = ['High Impact Save', 'Eco Choice', 'Budget Saver'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory, selectedBadge, priceRange, sortBy]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const loadData = () => {
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const allProducts = store.getProducts();
      const allUsers = store.getUsers();
      
      setProducts(allProducts);
      setUsers(allUsers);
      setIsLoading(false);
    }, 500);
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Badge filter
    if (selectedBadge !== 'all') {
      filtered = filtered.filter(product => product.badges.includes(selectedBadge));
    }

    // Price range filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'impact-high':
        filtered.sort((a, b) => b.ecoImpact.co2Kg - a.ecoImpact.co2Kg);
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBadge('all');
    setPriceRange([0, 100000]);
    setSortBy('newest');
    setSearchParams({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { search: searchQuery } : {});
  };

  const getProductOwner = (ownerId: string) => {
    return users.find(user => user.id === ownerId);
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== 'all' ? selectedCategory : null,
    selectedBadge !== 'all' ? selectedBadge : null,
    priceRange[0] > 0 || priceRange[1] < 100000 ? 'price' : null
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Leaf className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Loading sustainable products...</h2>
          <p className="text-muted-foreground">Finding the best eco-friendly deals for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Discover Sustainable Products</h1>
        <p className="text-muted-foreground">
          Find great deals while helping the environment
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Badge Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Eco Badge</label>
                  <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Badges</SelectItem>
                      {badges.map(badge => (
                        <SelectItem key={badge} value={badge}>
                          {badge}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <div className="flex items-center">
                          <SortDesc className="h-4 w-4 mr-2" />
                          Newest First
                        </div>
                      </SelectItem>
                      <SelectItem value="price-low">
                        <div className="flex items-center">
                          <SortAsc className="h-4 w-4 mr-2" />
                          Price: Low to High
                        </div>
                      </SelectItem>
                      <SelectItem value="price-high">
                        <div className="flex items-center">
                          <SortDesc className="h-4 w-4 mr-2" />
                          Price: High to Low
                        </div>
                      </SelectItem>
                      <SelectItem value="impact-high">
                        <div className="flex items-center">
                          <Leaf className="h-4 w-4 mr-2" />
                          Highest Impact
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedBadge !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedBadge}
                <button onClick={() => setSelectedBadge('all')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                owner={getProductOwner(product.ownerId)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="hidden sm:inline-flex"
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No products found</h2>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
}