import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExcelSettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleExcelToJson = () => {
    onClose();
    navigate('/settings', { state: { activeTab: 'convert' } });
  };

  const handleEditSpreadsheet = () => {
    onClose();
    navigate('/settings', { state: { activeTab: 'edit' } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chỉnh sửa Excel Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Chuyển Excel sang JSON</h3>
            <p className="text-gray-600 mb-3">Chọn file Excel để chuyển đổi thành JSON</p>
            <button
              onClick={handleExcelToJson}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Chuyển đổi Excel
            </button>
          </div>

          <div>
            <h3 className="font-medium mb-3">Chỉnh sửa Spreadsheet</h3>
            <p className="text-gray-600 mb-3">Chọn file Excel để chỉnh sửa cấu trúc</p>
            <button
              onClick={handleEditSpreadsheet}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Chỉnh sửa Excel
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelSettingsModal; 