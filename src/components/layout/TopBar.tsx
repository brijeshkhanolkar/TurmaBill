import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, PlusCircle, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onMenuClick: () => void;
}

interface SearchResult {
  id: string;
  type: 'FARMER' | 'BUYER' | 'BILL' | 'INWARD';
  name: string;
  number?: string;
  amount?: number;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      
      try {
        // Dynamic import to handle if service is not yet available
        // const { globalSearch } = await import('../../database/services');
        // const results = await globalSearch(searchQuery);
        // setSearchResults(results);
        
        // Mock data for now
        if (searchQuery.length > 2) {
           setSearchResults([
             { id: '1', type: 'FARMER', name: 'Ramesh Patel' },
             { id: '2', type: 'BILL', name: 'INV-2023-001', amount: 45000 }
           ]);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    // Navigate based on type
    // navigate(`/${result.type.toLowerCase()}/${result.id}`);
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden mr-3 p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        <div className="relative max-w-md w-full ml-2 md:ml-0" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search farmers, buyers, bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full h-8 pl-9 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleResultClick(result)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mr-2 uppercase">
                      {result.type}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{result.name}</span>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    {result.number && <div className="text-xs">{result.number}</div>}
                    {result.amount && <div className="font-medium text-gray-700">₹{result.amount.toLocaleString('en-IN')}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4 pl-4">
        <div className="hidden sm:block text-sm font-medium text-gray-600">
          {currentDate}
        </div>
        
        <button 
          onClick={() => navigate('/transaction/new')}
          className="hidden sm:flex items-center h-8 px-3 text-sm font-medium text-white bg-[#B8860B] hover:bg-amber-600 rounded transition-colors"
        >
          <PlusCircle size={16} className="mr-1.5" />
          New Transaction
        </button>

        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
        </button>

        <div className="flex items-center space-x-2 border-l border-gray-200 pl-3">
          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-gray-600">
            <User size={18} />
          </div>
          <div className="hidden md:block flex-col text-left">
            <div className="text-xs font-semibold text-gray-800 leading-none">Admin User</div>
            <div className="text-[10px] text-gray-500 leading-none mt-1">ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
}
