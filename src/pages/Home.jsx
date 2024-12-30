import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Products from '../components/Products';
import Categories from '../components/Categories';
import Customers from '../components/Customers';
import Dashboard from '../components/Dashboard';
import Settings from '../components/Settings';
import Tool from '../components/Tool';
const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  React.useEffect(() => {
    if (location.state?.showToast) {
      toast.success('Đăng nhập thành công!');
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getMenuItems = () => {
    const baseMenuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'products', label: 'Products', icon: '📦' },
      { id: 'categories', label: 'Categories', icon: '📑' },
      { id: 'customers', label: 'Customers', icon: '👥' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'tool', label: 'Tool', icon: '🔧' }
    ];
    return baseMenuItems;
  };

  return (
    <div className="min-h-1 flex bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg ${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className={`font-bold ${isSidebarOpen ? 'block' : 'hidden'}`}>Admin Panel</h2>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? '◀️' : '▶️'}
          </button>
        </div>
        <nav className="mt-4">
          {getMenuItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center p-3 hover:bg-blue-50 transition-colors
                ${activeMenu === item.id ? 'bg-blue-100 text-blue-600' : ''}
                ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="flex justify-between items-center px-8 py-4">
            <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            {activeMenu === 'dashboard' && <Dashboard />}
            {activeMenu === 'products' && <Products />}
            {activeMenu === 'categories' && <Categories />}
            {activeMenu === 'customers' && <Customers />}
            {activeMenu === 'settings' && <Settings />}
            {activeMenu === 'tool' && <Tool />}
          </div>
        </main>
      </div>

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Home;