import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import XLSX from 'xlsx-js-style';
import { FaFileExcel, FaSave } from 'react-icons/fa';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useLocation } from 'react-router-dom';

registerAllModules();

const Settings = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('convert'); // Default tab
  
  useEffect(() => {
    // Nhận activeTab từ navigation state
    if (location.state?.activeTab) {
      setActiveSection(location.state.activeTab);
    }
  }, [location]);

  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const hotTableRef = useRef(null);
  const [convertedJson, setConvertedJson] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [convertedJsons, setConvertedJsons] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showDragDropModal, setShowDragDropModal] = useState(false);

  const handleExcelEdit = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Đọc dữ liệu với header
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          defval: ''
        });

        if (jsonData.length > 0) {
          const headerRow = jsonData[0];
          const dataRows = jsonData.slice(1);
          setHeaders(headerRow);
          setExcelData(dataRows);
          setShowSpreadsheet(true);
        } else {
          toast.error('File Excel không có dữ liệu');
        }
      } catch (error) {
        console.error('Error reading Excel:', error);
        toast.error('Lỗi khi đọc file Excel');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveExcel = () => {
    try {
      if (!hotTableRef.current) return;

      const hot = hotTableRef.current.hotInstance;
      const currentData = hot.getData();
      const currentHeaders = hot.getColHeader();

      // Tạo workbook mới với headers và data
      const ws = XLSX.utils.aoa_to_sheet([currentHeaders, ...currentData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      XLSX.writeFile(wb, 'edited_spreadsheet.xlsx');
      toast.success('Đã lưu thành công!');
    } catch (error) {
      console.error('Error saving Excel:', error);
      toast.error('Lỗi khi lưu file');
    }
  };

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

        const headerRow = rawData.find(row => 
          row.some(cell => cell === 'Tên' || cell === 'Đơn giá' || cell === 'Đơn vị')
        );
        
        if (!headerRow) {
          toast.error(`File "${file.name}": Không tìm thấy cột "Tên", "Đơn giá" hoặc "Đơn vị"`);
          continue;
        }

        const nameIndex = headerRow.findIndex(cell => cell === 'Tên');
        const priceIndex = headerRow.findIndex(cell => cell === 'Đơn giá');
        const unitIndex = headerRow.findIndex(cell => cell === 'Đơn vị');

        const jsonData = rawData
          .slice(rawData.indexOf(headerRow) + 1)
          .filter(row => row[nameIndex] && row[priceIndex])
          .map(row => ({
            name: row[nameIndex].trim(),
            price: parseFloat(row[priceIndex].replace(/[,.]/g, '')) || 0,
            unit: row[unitIndex]?.trim() || '',
            sourceFile: file.name
          }));

        allJsonData.push(...jsonData);
      }

      setConvertedJson(allJsonData);
      setShowJsonModal(true);
      setShowDragDropModal(false);
      toast.success(`Đã chuyển đổi ${files.length} file thành công`);

    } catch (error) {
      console.error('Error converting files:', error);
      toast.error('Lỗi khi chuyển đổi file');
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

  const handleImportJson = async () => {
    if (!convertedJson || convertedJson.length === 0) {
      toast.error('Không có dữ liệu để import');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);

      const productsToImport = convertedJson
        .filter(item => item.name && item.price)
        .map((item, index) => ({
          ...item,
          originalIndex: index + 1,
          unit: item.unit || 'Cái'
        }));

      if (productsToImport.length === 0) {
        toast.error('Không có sản phẩm nào đủ thông tin bắt buộc (name và price)');
        return;
      }

      const token = localStorage.getItem('token');
      const totalProducts = productsToImport.length;

      // Import từng sản phẩm một để theo dõi tiến trình
      const results = {
        successCount: 0,
        failedCount: 0,
        failedProducts: []
      };

      for (let i = 0; i < productsToImport.length; i++) {
        const product = productsToImport[i];
        setCurrentProduct(product);
        setImportProgress(Math.round((i / totalProducts) * 100));

        try {
          const response = await fetch('https://backend-giahung.onrender.com/api/products/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ products: [product] })
          });

          const result = await response.json();

          if (!response.ok) {
            results.failedCount++;
            results.failedProducts.push({
              ...product,
              error: result.message || 'Lỗi không xác định'
            });
          } else {
            results.successCount++;
          }
        } catch (error) {
          results.failedCount++;
          results.failedProducts.push({
            ...product,
            error: error.message
          });
        }
      }

      setImportProgress(100);

      // Hiển thị kết quả
      if (results.failedProducts.length > 0) {
        console.error('=== Failed Products ===');
        console.table(results.failedProducts);
        
        const errorMessage = `
          Import thất bại:
          - Số sản phẩm lỗi: ${results.failedProducts.length}
          - Chi tiết lỗi:
          ${results.failedProducts.map(p => 
            `\n  + Dòng ${p.originalIndex}: ${p.name} - ${p.error}`
          ).join('')}
        `;
        
        toast.error(errorMessage, {
          autoClose: false,
          closeOnClick: false
        });
      }

      toast.success(
        `Import hoàn tất:\n` +
        `Thành công: ${results.successCount} sản phẩm\n` +
        `Thất bại: ${results.failedCount} sản phẩm`
      );

      // Reset states
      setIsImporting(false);
      setCurrentProduct(null);
      setShowJsonModal(false);
      setConvertedJson(null);

    } catch (error) {
      console.error('=== Import Error ===');
      console.error(error);
      toast.error(`Lỗi: ${error.message}`);
      setIsImporting(false);
      setCurrentProduct(null);
    }
  };

  // Modal hiển thị kết quả JSON
  const JsonPreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Kết quả chuyển đổi JSON</h3>
          <div className="space-x-2">
            <button
              onClick={handleImportJson}
              disabled={isImporting}
              className={`px-4 py-2 ${
                isImporting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded`}
            >
              {isImporting ? 'Đang Import...' : 'Import vào DB'}
            </button>
            <button
              onClick={downloadJson}
              disabled={isImporting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Tải JSON
            </button>
            <button
              onClick={() => setShowJsonModal(false)}
              disabled={isImporting}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Đóng
            </button>
          </div>
        </div>

        {isImporting && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Đang import: {currentProduct?.name}</p>
              <p>Tiến trình: {importProgress}%</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(convertedJson, null, 2)}
          </pre>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <div>Tổng số sản phẩm: {convertedJson?.length || 0}</div>
          <div>Số file đã xử lý: {[...new Set(convertedJson?.map(item => item.sourceFile) || [])].length}</div>
        </div>
      </div>
    </div>
  );

  // Thêm component DragDropModal
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
            
            <label 
              onClick={() => setShowDragDropModal(true)} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              <FaFileExcel className="mr-2" />
              <span>Chọn File Excel</span>
            </label>
            
            <p className="text-sm text-gray-500">
              Chấp nhận các file .xlsx, .xls
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const spreadsheetSettings = {
    data: excelData || [],
    colHeaders: headers,
    rowHeaders: true,
    width: '100%',
    height: '70vh',
    licenseKey: 'non-commercial-and-evaluation',
    stretchH: 'all',
    
    // Cấu hình cho việc mở rộng vô hạn
    minRows: 100, // Số hàng tối thiểu
    maxRows: 500, // Số hàng tối đa ban đầu
    minCols: 20,  // Số cột tối thiểu
    maxCols: 50,  // Số cột tối đa ban đầu
    
    // Tự động thêm hàng khi đến cuối
    autoInsertRow: true,
    
    // Cho phép thêm/xóa hàng và cột
    manualRowMove: true,
    manualColumnMove: true,
    manualRowResize: true,
    manualColumnResize: true,
    
    // Cho phép kéo để copy/fill data
    fillHandle: {
      autoInsertRow: true,
      direction: 'vertical'
    },

    // Menu và các tính năng khác
    contextMenu: {
      items: {
        'row_above': {name: 'Thêm hàng phía trên'},
        'row_below': {name: 'Thêm hàng phía dưới'},
        'col_left': {name: 'Thêm cột bên trái'},
        'col_right': {name: 'Thêm cột bên phải'},
        'remove_row': {name: 'Xóa hàng'},
        'remove_col': {name: 'Xóa cột'},
        'undo': {name: 'Hoàn tác'},
        'redo': {name: 'Làm lại'},
        'copy': {name: 'Sao chép'},
        'cut': {name: 'Cắt'},
        'paste': {name: 'Dán'}
      }
    },
    
    dropdownMenu: true,
    filters: true,
    multiColumnSorting: true,

    // Tự động điều chỉnh kích thước khi có nhiều dữ liệu
    viewportRowRenderingOffset: 100,
    viewportColumnRenderingOffset: 20,

    // Sự kiện khi scroll đến cuối
    afterScrollVertically: function() {
      const instance = this;
      const lastRow = instance.countRows() - 1;
      const lastVisibleRow = instance.getLastVisibleRow();
      
      // Nếu scroll gần đến cuối, tự động thêm hàng mới
      if (lastVisibleRow >= lastRow - 20) {
        instance.alter('insert_row', lastRow + 1, 50); // Thêm 50 hàng mới
      }
    },

    // Sự kiện khi thay đổi dữ liệu
    afterChange: function(changes, source) {
      if (changes) {
        const instance = this;
        const lastRow = instance.countRows() - 1;
        const lastCol = instance.countCols() - 1;
        
        // Kiểm tra nếu đang nhập liệu ở hàng cuối
        changes.forEach(([row, col, oldVal, newVal]) => {
          if (row === lastRow - 5) {
            instance.alter('insert_row', lastRow + 1, 20); // Thêm 20 hàng mới
          }
          if (col === lastCol - 2) {
            instance.alter('insert_col', lastCol + 1, 5); // Thêm 5 cột mới
          }
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Công cụ Excel</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div className={`bg-white rounded-lg shadow-md p-6 ${activeSection === 'convert' ? 'ring-2 ring-blue-500' : ''}`}>
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

          <div className={`bg-white rounded-lg shadow-md p-6 ${activeSection === 'edit' ? 'ring-2 ring-blue-500' : ''}`}>
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa Spreadsheet</h3>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Chọn file Excel để chỉnh sửa
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                  <FaFileExcel className="mr-2" />
                  <span>Chọn File Excel</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelEdit}
                    className="hidden"
                  />
                </label>
                {showSpreadsheet && (
                  <button
                    onClick={handleSaveExcel}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <FaSave className="mr-2" />
                    Lưu Excel
                  </button>
                )}
              </div>
            </div>

            {showSpreadsheet && (
              <div 
                className="border rounded-lg overflow-hidden mt-4" 
                style={{ 
                  height: '70vh',
                  maxWidth: '100%',
                  overflow: 'auto'
                }}
              >
                <HotTable
                  ref={hotTableRef}
                  settings={spreadsheetSettings}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showDragDropModal && <DragDropModal />}
      {showJsonModal && <JsonPreviewModal />}
    </div>
  );
};

export default Settings; 