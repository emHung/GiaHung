import React, { useState } from 'react';
import { toast } from 'react-toastify';
import XLSX from 'xlsx-js-style';
import { FaFileExcel } from 'react-icons/fa';

const Settings = () => {
  const [convertedJson, setConvertedJson] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showDragDropModal, setShowDragDropModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (files.length === 0) {
      toast.error('Vui lòng chỉ kéo file Excel (.xlsx, .xls)');
      return;
    }
    
    await handleFileConversion(files);
  };

  const handleFileConversion = async (files) => {
    if (files.length === 0) return;

    try {
      const allJsonData = [];

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        const headerRow = rawData[0];
        let nameIndex = headerRow.findIndex(col => col === "Tên");
        let unitIndex = headerRow.findIndex(col => col === "Đơn vị");
        let priceIndex = headerRow.findIndex(col => col === "Đơn giá");

        // Set giá trị mặc định nếu không tìm thấy
        if (nameIndex === -1) nameIndex = 2;  // Cột 3
        if (unitIndex === -1) unitIndex = 3;  // Cột 4
        if (priceIndex === -1) priceIndex = 5;  // Cột 6

        console.log('Vị trí các cột:', { nameIndex, unitIndex, priceIndex });

        // Chuyển đổi dữ liệu thành JSON
        const jsonData = rawData
          .slice(1)
          .filter(row => row[nameIndex])
          .map(row => {
            const name = row[nameIndex]?.toString().trim();
            const unit = row[unitIndex]?.toString().trim();
            let price = parseFloat(row[priceIndex]) || 0;

            // Thêm logic xử lý price
            if (price > 0 && price < 500) {
              price = price * 1000;
            }

            return {
              name: name,
              unit: unit,
              price: price,
              source: file.name, // Thêm tên file nguồn
              importDate: new Date().toISOString() // Thêm thời gian import
            };
          })
          .filter(item => item.name && item.unit && item.price > 0);

        allJsonData.push(...jsonData);
      }

      if (allJsonData.length === 0) {
        toast.error('Không có dữ liệu hợp lệ để chuyển đổi');
        return;
      }

      setConvertedJson(allJsonData);
      setShowJsonModal(true);
      setShowDragDropModal(false);
      toast.success(`Đã chuyển đổi ${allJsonData.length} sản phẩm thành công`);

    } catch (error) {
      console.error('Error converting files:', error);
      toast.error('Lỗi khi chuyển đổi file: ' + error.message);
    }
  };

  const handleConvertToJson = (e) => {
    const files = Array.from(e.target.files);
    handleFileConversion(files);
  };

  const downloadJson = () => {
    if (!convertedJson) return;

    const blob = new Blob([JSON.stringify(convertedJson, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file JSON');
  };

  const handleImport = async () => {
    if (!convertedJson || convertedJson.length === 0) {
      toast.error('Không có dữ liệu để import');
      return;
    }

    try {
      setIsImporting(true);
      setIsCancelling(false);
      const token = localStorage.getItem('token');
      const duplicates = [];
      const imported = [];
      const totalItems = convertedJson.length;

      for (const [index, product] of convertedJson.entries()) {
        if (isCancelling) {
          toast.info(`Đã dừng import sau khi thêm ${imported.length} sản phẩm`);
          break;
        }

        try {
          setCurrentProduct(product);
          
          // Kiểm tra sản phẩm trùng
          const checkResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/products?limit=9999`, 
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );

          const checkData = await checkResponse.json();
          
          const isDuplicate = checkData.data.some(
            existingProduct => 
              existingProduct.name === product.name && 
              existingProduct.unit === product.unit
          );

          if (isDuplicate) {
            console.log(`Sản phẩm trùng: ${product.name} - ${product.unit}`);
            duplicates.push(product);
          } else {
            // Import sản phẩm mới
            const formData = new FormData();
            formData.append('name', product.name.trim());
            formData.append('unit', product.unit.trim());
            formData.append('price', product.price);
            formData.append('import_price', 0);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData
            });

            if (response.ok) {
              imported.push(product);
              console.log(`Đã import: ${product.name} - ${product.unit}`);
            }
          }

          // Cập nhật tiến trình
          const progress = Math.round(((index + 1) / totalItems) * 100);
          setImportProgress(progress);

        } catch (error) {
          console.error(`Lỗi khi import sản phẩm ${product.name}:`, error);
          continue;
        }
      }

      // Hiển thị kết quả
      if (!isCancelling) {
        if (imported.length > 0) {
          toast.success(`Đã import thành công ${imported.length} sản phẩm`);
        }

        if (duplicates.length > 0) {
          setDuplicateProducts(duplicates);
          setShowDuplicateModal(true);
          toast.warning(`Có ${duplicates.length} sản phẩm trùng lặp`);
        }
      }

    } catch (error) {
      console.error('Import Error:', error);
      toast.error('Có lỗi xảy ra trong quá trình import');
    } finally {
      setIsImporting(false);
      setIsCancelling(false);
      setImportProgress(0);
      setCurrentProduct(null);
    }
  };

  // Modal hiển thị sản phẩm trùng lặp
  const DuplicateProductsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sản phẩm trùng lặp</h3>
          <button
            onClick={() => setShowDuplicateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn vị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nguồn
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {duplicateProducts.map((product, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Thêm nút Import vào JsonPreviewModal
  const JsonPreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Kết quả chuyển đổi JSON</h3>
          <div className="space-x-2">
            {isImporting ? (
              <>
                <div className="text-sm text-gray-600 mb-2">
                  Đang import: {currentProduct?.name}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 min-w-[45px]">
                    {importProgress}%
                  </span>
                </div>
                <button
                  onClick={() => setIsCancelling(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Dừng Import
                </button>
              </>
            ) : (
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Import vào DB
              </button>
            )}
            <button
              onClick={downloadJson}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Tải JSON
            </button>
            <button
              onClick={() => {
                setIsCancelling(true);
                setShowJsonModal(false);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(convertedJson, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  // Modal kéo thả file
  const DragDropModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Chuyển đổi Excel sang JSON</h3>
          <button
            onClick={() => setShowDragDropModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
        >
          <div className="space-y-4">
            <div className="text-gray-600">
              <p className="text-lg mb-2">Kéo và thả file Excel vào đây</p>
              <p className="text-sm">hoặc</p>
            </div>
            
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
              <FaFileExcel className="mr-2" />
              <span>Chọn File Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleConvertToJson}
                className="hidden"
                multiple
              />
            </label>
            
            <p className="text-sm text-gray-500">
              Chấp nhận các file .xlsx, .xls
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Công cụ Excel</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Chuyển Excel sang JSON</h3>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Chọn file Excel để chuyển đổi thành JSON
            </label>
            <div className="flex items-center space-x-4">
              <label 
                onClick={() => setShowDragDropModal(true)} 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                <FaFileExcel className="mr-2" />
                <span>Chọn File Excel</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {showDragDropModal && <DragDropModal />}
      {showJsonModal && <JsonPreviewModal />}
      {showDuplicateModal && <DuplicateProductsModal />}
    </div>
  );
};

export default Settings; 