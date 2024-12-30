import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const searchRef = useRef(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    console.log('Current user role:', role);
    setUserRole(role || '');
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`https://backend-giahung.onrender.com/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleProductSelect = (product) => {
    setSearchTerm(product.name);
    setShowSuggestions(false);
    setSelectedProduct(product);
    setShowModal(true);
    onSearch(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };
  const formatimport_price = (import_price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(import_price);
  };

  console.log('User role in render:', userRole);
  console.log('Selected product:', selectedProduct);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-3 py-1.5 pl-8 pr-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
        />
        <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
      </div>

      {showSuggestions && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((product) => (
                <li
                  key={product._id}
                  className="px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center space-x-2">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                        No IMG
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.name}</div>
                      <div className="text-xs text-gray-500">{formatPrice(product.price)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-center text-sm text-gray-500">
              Không tìm thấy sản phẩm
            </div>
          )}
        </div>
      )}

      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết sản phẩm</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-w-1 aspect-h-1">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Không có hình ảnh</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatPrice(selectedProduct.price)}
                  </p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Mô tả</h5>
                  <p className="mt-1 text-gray-600">{selectedProduct.description || 'Không có mô tả'}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Danh mục</h5>
                  <p className="mt-1 text-gray-600">{selectedProduct.category || 'Chưa phân loại'}</p>
                </div>
                
                {userRole === 'admin' && (
  <div>
    <h5 className="text-sm font-medium text-gray-500">Giá nhập</h5>
    <p className="mt-1 text-gray-600">
        {formatPrice(selectedProduct.import_price)}
    </p>
  </div>
)}


                <div className="text-xs text-gray-400">
                  Role: {userRole} 
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;