import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      
      console.log('=== Auth Check ===');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Token value:', token);
      console.log('User Role:', role);
      console.log('================');

      if (!token) {
        toast.error('Bạn cần đăng nhập để xem nội dung này');
        // Có thể thêm redirect về trang login nếu cần
        return false;
      }
      
      setUserRole(role || '');
      return true;
    };

    if (checkAuth()) {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('=== Fetch Customers Request ===');
      console.log('Using token:', token);
      
      const response = await fetch('https://backend-giahung.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      console.log('===========================');
      
      if (response.ok) {
        setCustomers(Array.isArray(result) ? result : []);
      } else {
        throw new Error(result.message || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error details:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://backend-giahung.onrender.com/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Xóa tài khoản thành công');
        if (userRole === 'admin') {
          fetchAllUsers();
        } else {
          // Nếu user tự xóa tài khoản của mình
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          window.location.href = '/login';
        }
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể xóa tài khoản');
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userId = userRole === 'admin' ? editUser._id : 'me';
      
      const response = await fetch(`https://backend-giahung.onrender.com/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email
        })
      });

      if (response.ok) {
        toast.success('Cập nhật thông tin thành công');
        setIsEditModalOpen(false);
        if (userRole === 'admin') {
          fetchAllUsers();
        } else {
          fetchCurrentUser();
        }
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật thông tin');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Danh sách người dùng</h2>

      {loading ? (
        <div className="text-center py-4">Đang tải...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg">Chưa có người dùng nào</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                {userRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.phone || 'Chưa cập nhật'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.role === 'admin' ? 'Admin' : 'Khách hàng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(customer._id)}
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
      )}

      {/* Modal chỉnh sửa người dùng */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-6">Chỉnh sửa thông tin người dùng</h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={editCustomer?.name || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editCustomer?.email || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={editCustomer?.phone || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, phone: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={editCustomer?.role || ''}
                  onChange={(e) => setEditCustomer({...editCustomer, role: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="user">Khách hàng</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Đang xử lý...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 