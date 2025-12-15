import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-amz-orange animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-amz-orange transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={isLoading}
          className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-lg leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amz-orange focus:border-amz-orange transition-shadow shadow-sm sm:text-lg text-gray-900"
          placeholder="Enter a product name (e.g., 'wireless headphones', 'yoga mat')..."
        />
        <button
          type="submit"
          disabled={isLoading || !term.trim()}
          className="absolute inset-y-2 right-2 px-6 bg-amz-dark hover:bg-amz-light text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? 'Researching...' : 'Analyze'}
        </button>
      </form>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Powered by Gemini AI with Google Search Grounding to simulate market data.
      </p>
    </div>
  );
};

export default SearchBar;