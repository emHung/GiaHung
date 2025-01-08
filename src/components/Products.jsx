import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const UNITS = [
  { value: 'Cái', label: 'Cái' },
  { value: 'Hộp', label: 'Hộp' },
  { value: 'Kg', label: 'Kg' },
  { value: 'Cặp', label: 'Cặp' },
  { value: 'Con', label: 'Con' },
  { value: 'Bịch', label: 'Bịch' },
  { value: 'Cuộn', label: 'Cuộn' },
  { value: 'Hũ', label: 'Hũ' },
  { value: 'Bộ', label: 'Bộ' },
  { value: 'Cây', label: 'Cây' },
  { value: 'Túi', label: 'Túi' },
  { value: 'Hủ', label: 'Hủ' },
  { value: 'Sợi', label: 'Sợi' },
  { value: 'Tấm', label: 'Tấm' },
  { value: 'M', label: 'M' },
  { value: 'Bóng', label: 'Bóng' },
  { value: 'Lít', label: 'Lít' },
  { value: 'Chai', label: 'Chai' },
  { value: 'Thùng', label: 'Thùng' },
  { value: 'Gói', label: 'Gói' },
  { value: 'Lon', label: 'Lon' },
  { value: 'Đôi', label: 'Đôi' },
  { value: 'G', label: 'G' },
  { value: 'Gam', label: 'Gam' },
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    import_price: '',
    price: '',
    description: '',
    category: '',
    image: null,
    date: new Date().toISOString().split('T')[0]
  });
  const [editProduct, setEditProduct] = useState({
    _id: '',
    name: '',
    description: '',
    import_price: '',
    price: '',
    category: '',
    unit: 'Cái',
    image: null,
    imagePreview: null
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [importExportMode, setImportExportMode] = useState('');
  const [jsonFiles, setJsonFiles] = useState([]);
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [newProducts, setNewProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [activeTab, setActiveTab] = useState('duplicates'); // 'duplicates' hoặc 'new'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);
  const searchRef = useRef(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  useEffect(() => {
    const checkUserRole = () => {
      const role = localStorage.getItem('userRole');
      console.log('=== User Role Check on Mount ===');
      console.log('Current Role:', role);
      console.log('============================');
      setUserRole(role || '');
    };

    checkUserRole();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const baseUrl = 'https://backend-giahung.onrender.com/api/products';
      const url = searchTerm
        ? `${baseUrl}/search?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=${productsPerPage}`
        : `${baseUrl}?page=${page}&limit=${productsPerPage}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setProducts(data.data);
        setFilteredProducts(data.data);
        setTotalProducts(data.total);
        setTotalFilteredProducts(searchTerm ? data.total : data.total);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1); // Reset về trang 1 khi tìm kiếm
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Effect cho việc chuyển trang
  useEffect(() => {
    if (!isSearching) {
      fetchProducts(currentPage);
    }
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-giahung.onrender.com/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Log để debug
      console.log('=== Submitting Form ===');
      console.log('Product Data:', newProduct);

      const formData = new FormData();
      
      // Thêm các trường bắt buộc
      if (!newProduct.name || !newProduct.price) {
        toast.error('Vui lòng điền đầy đủ tên sản phẩm và giá bán');
        return;
      }

      // Append các trường vào FormData
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      
      if (newProduct.import_price) {
        formData.append('import_price', newProduct.import_price);
      }
      if (newProduct.description) {
        formData.append('description', newProduct.description);
      }
      if (newProduct.category) {
        formData.append('category', newProduct.category);
      }

      // Xử lý file hình ảnh
      if (newProduct.image instanceof File) {
        formData.append('image', newProduct.image);
        console.log('=== Image File Info ===');
        console.log('File name:', newProduct.image.name);
        console.log('File size:', newProduct.image.size);
        console.log('File type:', newProduct.image.type);
      }

      // Log FormData để debug
      console.log('=== FormData Contents ===');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-giahung.onrender.com/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Không set Content-Type khi dùng FormData
        },
        body: formData
      });

      // Log response để debug
      console.log('=== Response Status ===');
      console.log('Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra khi thêm sản phẩm');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Thêm sản phẩm thành công');
        setIsModalOpen(false);
        setImagePreview(null);
        setSelectedFileName('');
        setNewProduct({
          name: '',
          import_price: '',
          price: '',
          description: '',
          category: '',
          image: null,
          date: new Date().toISOString().split('T')[0]
        });
        fetchProducts();
      } else {
        throw new Error(result.message || 'Lỗi khi thêm sản phẩm');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://backend-giahung.onrender.com/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          toast.success('Xóa sản phẩm thành công');
          fetchProducts(); // Refresh danh sách
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Không thể xóa sản phẩm');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error(error.message || 'Có lỗi xảy ra khi xóa sản phẩm');
      }
    }
  };

  const handleEdit = (product) => {
    setEditProduct({
      _id: product._id,
      name: product.name,
      description: product.description || '',
      import_price: product.import_price || '',
      price: product.price || '',
      category: product.category?._id || '',
      unit: product.unit || 'Cái',
      image: product.image || null,
      imagePreview: product.image?.url || null
    });
    setSelectedFileName(product.image?.url ? 'Current image' : '');
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Đảm bảo gửi unit
      formData.append('name', editProduct.name || '');
      formData.append('price', editProduct.price || '');
      formData.append('import_price', editProduct.import_price || '');
      formData.append('description', editProduct.description || '');
      formData.append('category', editProduct.category || '');
      formData.append('unit', editProduct.unit); // Gửi unit không cần giá trị mặc định
      formData.append('image', editProduct.image || '');
      console.log('Sending update with unit:', editProduct.unit); // Log để debug

      // Xử lý hình ảnh
      const imageFile = document.querySelector('input[type="file"]').files[0];
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // Log để kiểm tra dữ liệu trước khi gửi
      console.log('=== Update Data ===');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-giahung.onrender.com/api/products/${editProduct._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Lỗi khi cập nhật sản phẩm');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Cập nhật sản phẩm thành công');
        setIsEditModalOpen(false);
        fetchProducts(); // Refresh danh sách
      } else {
        throw new Error(result.message || 'Lỗi khi cập nhật sản phẩm');
      }
    } catch (error) {
      console.error('Update Error:', error);
      toast.error('Không thể cập nhật sản phẩm: ' + error.message);
    }
  };

  const handleImportJSON = async () => {
    if (!newProducts.length) return;
    
    try {
      setIsImporting(true); // Bắt đầu import
      const token = localStorage.getItem('token');
      
      // Gửi request import
      const response = await fetch('https://backend-giahung.onrender.com/api/products/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ products: newProducts })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success(`Đã import ${newProducts.length} sản phẩm thành công`);
        setIsImportExportModalOpen(false);
        setJsonFiles([]);
        setNewProducts([]);
        setDuplicateItems([]);
        fetchProducts(); // Tải lại danh sách sản phẩm
      } else {
        throw new Error(data.message || 'Lỗi khi import sản phẩm');
      }
    } catch (error) {
      console.error('Import Error:', error);
      toast.error('Không thể import sản phẩm: ' + error.message);
    } finally {
      setIsImporting(false); // Kết thúc import
    }
  };

  const handleExportJSON = async () => {
    try {
      const token = localStorage.getItem('token');
      // Sử dụng endpoint products thông thường nhưng không giới hạn số lượng
      const response = await fetch('https://backend-giahung.onrender.com/api/products?limit=9999', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xuất dữ liệu');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        // Chỉ lấy mảng sản phẩm để xuất
        const productsToExport = data.data;
        
        // Tạo và tải file JSON
        const jsonString = JSON.stringify(productsToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Đã xuất ${productsToExport.length} sản phẩm thành công`);
        setIsImportExportModalOpen(false);
      } else {
        throw new Error(data.message || 'Lỗi khi xuất dữ liệu');
      }
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Không thể xuất dữ liệu: ' + error.message);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Modal hiển thị danh sách trùng lặp
  const DuplicateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full">
        <h3 className="text-xl font-semibold mb-4">Kiểm tra sản phẩm import</h3>
        
        {/* Tab headers */}
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 mr-2 ${
              activeTab === 'duplicates'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('duplicates')}
          >
            Sản phẩm trùng lặp ({duplicateItems.length})
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === 'new'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('new')}
          >
            Sản phẩm mới ({newProducts.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá nhập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn vị
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'duplicates' 
                ? duplicateItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.import_price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.unit || 'Cái'}
                    </td>
                  </tr>
                ))
                : newProducts.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.import_price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.price?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.unit || 'Cái'}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end space-x-4">
          <button
            onClick={() => setShowDuplicateModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border rounded"
          >
            Hủy
          </button>
          <button
            onClick={() => importProducts(newProducts)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import {newProducts.length} sản phẩm mới
          </button>
        </div>
      </div>
    </div>
  );

  // Thêm hàm xử lý chuyển trang
  const handlePageChange = (pageNumber) => {
    // Kiểm tra trang hợp lệ
    if (pageNumber < 1 || pageNumber > Math.ceil(totalProducts / productsPerPage)) {
      return;
    }
    
    // Cập nhật trang hiện tại
    setCurrentPage(pageNumber);
    
    // Log để debug
    console.log('=== Page Change ===');
    console.log('Current Page:', pageNumber);
    console.log('Total Products:', totalProducts);
    console.log('Products Per Page:', productsPerPage);
  };

  // Component phân trang
  const Pagination = () => {
    const totalPages = Math.ceil(totalFilteredProducts / productsPerPage);
    
    // Tạo mảng các số trang cần hiển thị
    const getPageNumbers = () => {
      let pages = [];
      
      // Nếu tổng số trang <= 7, hiển thị tất cả
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Luôn hiển thị trang đầu
        pages.push(1);
        
        // Nếu trang hiện tại > 3, thêm dấu ...
        if (currentPage > 3) {
          pages.push('...');
        }
        
        // Hiển thị các trang xung quanh trang hiện tại
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(currentPage + 1, totalPages - 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        // Nếu còn cách trang cuối > 1, thêm dấu ...
        if (currentPage < totalPages - 2) {
          pages.push('...');
        }
        
        // Luôn hiển thị trang cuối
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex justify-between items-center mt-4 pb-4">
        <div className="text-sm text-gray-700">
          Hiển thị {Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)} đến{' '}
          {Math.min(currentPage * productsPerPage, totalProducts)} trong số{' '}
          {totalProducts} sản phẩm
        </div>
        
        <div className="flex items-center gap-2">
          {/* Nút Trước */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>

          {/* Các số trang */}
          {getPageNumbers().map((pageNumber, index) => (
            <button
              key={index}
              onClick={() => {
                if (pageNumber !== '...') {
                  handlePageChange(pageNumber);
                }
              }}
              disabled={pageNumber === '...'}
              className={`px-3 py-1 border rounded-md ${
                pageNumber === currentPage 
                  ? 'bg-blue-500 text-white' 
                  : pageNumber === '...' 
                    ? 'cursor-default'
                    : 'hover:bg-gray-100'
              }`}
            >
              {pageNumber}
            </button>
          ))}

          {/* Nút Sau */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      </div>
    );
  };

  // Thêm hàm xử lý khi chọn file
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      // Kiểm tra loại file
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WEBP)');
        return;
      }

      console.log('=== Image Selected ===');
      console.log('File:', file);
      console.log('Type:', file.type);
      console.log('Size:', file.size);
      console.log('====================');

      setEditProduct(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Thêm cleanup cho URL.createObjectURL
  useEffect(() => {
    return () => {
      // Cleanup preview URL khi component unmount
      if (editProduct.imagePreview && editProduct.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(editProduct.imagePreview);
      }
    };
  }, [editProduct.imagePreview]);

  // Thêm hàm xử lý hình ảnh cho EditModal
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProduct(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
      setSelectedFileName(file.name);
    }
  };

  // Thêm hàm xóa hình ảnh preview
  const handleRemoveEditImage = () => {
    setEditProduct(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
    setSelectedFileName('');
  };

  // Cập nhật EditModal component
  const EditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 sticky top-0 bg-white pb-2">
          Chỉnh sửa sản phẩm
        </h3>
        <form onSubmit={handleUpdate} encType="multipart/form-data">
          {/* Tên sản phẩm */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm
            </label>
            <input
              type="text"
              name="name"
              value={editProduct.name || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditProduct((prev) => ({
                  ...prev,
                  name: value
                }));
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Mô tả */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={editProduct.description || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditProduct((prev) => ({
                  ...prev,
                  description: value
                }));
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Đơn vị */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn vị
            </label>
            <select
              name="unit"
              value={editProduct.unit || 'Cái'}
              onChange={(e) => {
                const value = e.target.value;
                setEditProduct((prev) => ({
                  ...prev,
                  unit: value
                }));
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Giá nhập */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá nhập
            </label>
            <input
              type="number"
              name="import_price"
              value={editProduct.import_price || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditProduct((prev) => ({
                  ...prev,
                  import_price: value
                }));
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Giá bán */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá bán
            </label>
            <input
              type="number"
              name="price"
              value={editProduct.price || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEditProduct((prev) => ({
                  ...prev,
                  price: value
                }));
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Phần upload hình ảnh */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh sản phẩm
            </label>
            <div className="mt-1 flex items-center">
              <div className="relative">
                <input
                  type="file"
                  onChange={handleEditImageChange}
                  className="hidden"
                  id="edit-image-upload"
                  accept="image/*"
                />
                <label
                  htmlFor="edit-image-upload"
                  className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Chọn hình ảnh
                </label>
              </div>
              {selectedFileName && (
                <span className="ml-3 text-sm text-gray-500">{selectedFileName}</span>
              )}
            </div>

            {/* Preview hình ảnh */}
            {(editProduct.imagePreview || editProduct.image?.url) && (
              <div className="mt-2 relative">
                <img
                  src={editProduct.imagePreview || editProduct.image.url}
                  alt="Preview"
                  className="max-h-64 w-auto object-contain rounded-md"
                />
                <button
                  type="button"
                  onClick={handleRemoveEditImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end sticky bottom-0 bg-white pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Cập nhật Modal thêm sản phẩm
  const AddProductModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header cố định */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Thêm sản phẩm mới</h3>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setImagePreview(null);
                setSelectedFileName('');
                setNewProduct({
                  name: '',
                  import_price: '',
                  price: '',
                  description: '',
                  category: '',
                  image: null,
                  date: new Date().toISOString().split('T')[0]
                });
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form content với scroll */}
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
            {/* Tên sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Giá nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá nhập
              </label>
              <input
                type="number"
                name="import_price"
                value={newProduct.import_price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Giá bán */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán *
              </label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                name="category"
                value={newProduct.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hình ảnh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh
              </label>
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Kích thước file không được vượt quá 5MB');
                        e.target.value = '';
                        setImagePreview(null);
                        setSelectedFileName('');
                        return;
                      }
                      setSelectedFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                      setNewProduct(prev => ({
                        ...prev,
                        image: file
                      }));
                    }
                  }}
                  className="w-full"
                />

                {selectedFileName && (
                  <div className="text-sm text-gray-600">
                    File đã chọn: {selectedFileName}
                  </div>
                )}

                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFileName('');
                        setNewProduct(prev => ({
                          ...prev,
                          image: null
                        }));
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer cố định */}
            <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t mt-4">
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setImagePreview(null);
                    setSelectedFileName('');
                    setNewProduct({
                      name: '',
                      import_price: '',
                      price: '',
                      description: '',
                      category: '',
                      image: null,
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Thêm sản phẩm
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Thêm các hàm xử lý checkbox
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Hàm xóa nhiều sản phẩm
  const handleDeleteMultiple = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`)) {
      try {
        const token = localStorage.getItem('token');
        const deletePromises = selectedProducts.map(id =>
          fetch(`https://backend-giahung.onrender.com/api/products/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        );

        await Promise.all(deletePromises);
        toast.success(`Đã xóa ${selectedProducts.length} sản phẩm`);
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting products:', error);
        toast.error('Có lỗi xảy ra khi xóa sản phẩm');
      }
    }
  };

  // Thêm hàm lọc sản phẩm
  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return products;

    return products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.unit?.toLowerCase().includes(searchLower) ||
        product.category?.name?.toLowerCase().includes(searchLower) ||
        product.price?.toString().includes(searchTerm) ||
        product.import_price?.toString().includes(searchTerm)
      );
    });
  };

  // Modal Import/Export
  const ImportExportModal = () => {
    if (importExportMode === 'export') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Export JSON</h2>
            <div className="mb-6">
              <p className="text-gray-600">
                Bạn có muốn xuất {totalProducts} sản phẩm ra file JSON không?
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsImportExportModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleExportJSON();
                  setIsImportExportModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xuất file
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Modal Import
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Import JSON</h2>
            <button
              onClick={() => setIsImportExportModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {!jsonFiles.length ? (
            // Màn hình chọn file
            <div className="text-center py-12">
              <input
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length > 0) {
                    handleFileSelect(e.target.files);
                  }
                }}
                className="hidden"
                id="excelFileInput"
              />
              <label
                htmlFor="excelFileInput"
                className="px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 inline-block"
              >
                <div className="text-gray-600">Click để chọn file Excel</div>
                <div className="text-sm text-gray-500 mt-1">hoặc kéo thả file vào đây</div>
                <div className="text-sm text-blue-500 mt-1">Có thể chọn nhiều file</div>
                <div className="text-xs text-gray-500 mt-2">Định dạng: .xlsx, .xls</div>
                <div className="text-xs text-gray-500">Cột bắt buộc: Tên, Đơn giá</div>
              </label>
            </div>
          ) : (
            <div className="max-h-[80vh] flex flex-col">
              <div className="mb-4 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Đang xử lý file {currentFileIndex + 1}/{jsonFiles.length}: {jsonFiles[currentFileIndex].name}
                  </div>
                  {jsonFiles.length > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (currentFileIndex > 0) {
                            const newIndex = currentFileIndex - 1;
                            setCurrentFileIndex(newIndex);
                            // Xử lý file mới
                            const fileContent = await jsonFiles[newIndex].text();
                            const jsonData = JSON.parse(fileContent);
                            // ... logic phân loại sản phẩm
                          }
                        }}
                        disabled={currentFileIndex === 0}
                        className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <button
                        onClick={async () => {
                          if (currentFileIndex < jsonFiles.length - 1) {
                            const newIndex = currentFileIndex + 1;
                            setCurrentFileIndex(newIndex);
                            // Xử lý file mới
                            const fileContent = await jsonFiles[newIndex].text();
                            const jsonData = JSON.parse(fileContent);
                            // ... logic phân loại sản phẩm
                          }
                        }}
                        disabled={currentFileIndex === jsonFiles.length - 1}
                        className="px-2 py-1 text-sm bg-gray-200 rounded disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="overflow-y-auto h-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          Tên sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          Giá nhập
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          Giá bán
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                          Đơn vị
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(activeTab === 'new' ? newProducts : duplicateItems).map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.import_price?.toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.price?.toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 bg-white">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {activeTab === 'new' 
                      ? `${newProducts.length} sản phẩm mới`
                      : `${duplicateItems.length} sản phẩm trùng`
                    }
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setJsonFiles([]);
                        setCurrentFileIndex(0);
                        setNewProducts([]);
                        setDuplicateItems([]);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      disabled={isImporting}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleImportJSON}
                      disabled={newProducts.length === 0 || isImporting}
                      className={`px-4 py-2 rounded-lg ${
                        isImporting 
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white flex items-center space-x-2`}
                    >
                      {isImporting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Đang import...</span>
                        </>
                      ) : (
                        <span>Import {newProducts.length} sản phẩm</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleFileSelect = async (files) => {
    try {
      const fileArray = Array.from(files);
      setJsonFiles(fileArray);
      
      // Xử lý file đầu tiên
      if (fileArray.length > 0) {
        const file = fileArray[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Lấy sheet đầu tiên
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Chuyển đổi sang mảng JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Chuẩn hóa dữ liệu
          const normalizedData = jsonData.map(item => ({
            name: item['Tên'] || item['tên'] || item['TÊN'] || item['Name'] || item['name'] || '',
            price: Number(item['Đơn giá'] || item['đơn giá'] || item['ĐƠN GIÁ'] || item['Price'] || item['price'] || 0),
            unit: 'Cái', // Đơn vị mặc định
          })).filter(item => item.name && item.price > 0); // Lọc bỏ dữ liệu không hợp lệ
          
          // Kiểm tra và phân loại sản phẩm
          const duplicates = [];
          const newItems = [];
          
          for (const item of normalizedData) {
            const isDuplicate = products.some(
              existingProduct => existingProduct.name.toLowerCase() === item.name.toLowerCase()
            );
            
            if (isDuplicate) {
              duplicates.push(item);
            } else {
              newItems.push(item);
            }
          }
          
          setNewProducts(newItems);
          setDuplicateItems(duplicates);
          setActiveTab('new');
        };
        
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('File không hợp lệ');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Danh sách sản phẩm ({totalFilteredProducts})
          </h1>
        </div>
        
        <div className="flex items-center gap-4 justify-end flex-grow">
          <div className="relative w-full" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {userRole === 'admin' && (
            <>
              <button
                onClick={() => {
                  setImportExportMode('import');
                  setIsImportExportModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Import JSON
              </button>
              <button
                onClick={() => {
                  setImportExportMode('export');
                  setIsImportExportModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Export JSON
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thêm sản phẩm
              </button>
            </>
          )}
        </div>
      </div>

      {/* Nút xóa nhiều */}
      {selectedProducts.length > 0 && userRole === 'admin' && (
        <div className="mb-4">
          <button
            onClick={handleDeleteMultiple}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Xóa ({selectedProducts.length})
          </button>
        </div>
      )}

      {/* Bảng sản phẩm */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="mt-4 text-gray-600">Đang tải...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-lg">
            {searchTerm ? (
              <>
                <div className="mb-2">🔍</div>
                <div>Không tìm thấy sản phẩm nào cho "{searchTerm}"</div>
              </>
            ) : (
              <>
                <div className="mb-2">📦</div>
                <div>Chưa có sản phẩm nào</div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {userRole === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        className="rounded border-gray-300"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá nhập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  {userRole === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    {userRole === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap w-10">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image?.url ? (
                        <img
                          src={product.image.url}
                          alt={product.name}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded-lg">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {product.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.import_price?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.price?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {product.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>
                    {userRole === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Phân trang */}
      {!loading && filteredProducts.length > 0 && <Pagination />}

      {/* Các modal */}
      {isImportExportModalOpen && <ImportExportModal />}
      {isModalOpen && <AddProductModal />}
      {isEditModalOpen && <EditModal />}
      {showDuplicateModal && <DuplicateModal />}
    </div>
  );
};

export default Products;