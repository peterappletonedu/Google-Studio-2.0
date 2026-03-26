/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onRandom: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onRandom, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery(''); // Clear the input field after search
    }
  };

  return (
    <div id="search-container-1" className="search-container">
      <form id="search-form-1" onSubmit={handleSubmit} className="search-form" role="search">
        <input
          id="search-input-1"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="search-input"
          aria-label="Search for a topic"
          disabled={isLoading}
        />
      </form>
      <button id="button-random-1" onClick={onRandom} className="random-button" disabled={isLoading}>
        Random
      </button>
    </div>
  );
};

export default SearchBar;