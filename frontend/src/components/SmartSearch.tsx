import { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { store } from '@/lib/store';

interface SmartSearchProps {
  onSearch: (query: string) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function SmartSearch({ onSearch, onSuggestionClick }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const getSuggestions = () => {
    if (!query) return recentSearches.slice(0, 5);
    
    const products = store.getProducts();
    const suggestions = products
      .filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .map(product => product.title)
      .slice(0, 5);
      
    return [...new Set(suggestions)];
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(updatedRecent);
      
      onSearch(searchQuery);
      onSuggestionClick(searchQuery);
      setQuery(searchQuery);
      setShowSuggestions(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const suggestions = getSuggestions();

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10 pr-4"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {!query && recentSearches.length > 0 && (
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Recent searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center justify-between group"
                  onClick={() => handleSearch(suggestion)}
                >
                  <span>{suggestion}</span>
                  {!query && recentSearches.includes(suggestion) && (
                    <X
                      className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches(recentSearches.filter(s => s !== suggestion));
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}