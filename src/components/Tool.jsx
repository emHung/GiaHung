import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './Tool.css';

const Tool = () => {
  const defaultColumns = [
    'Ngày',
    'STT',
    'Tên',
    'Đơn vị',
    'Số lượng',
    'Đơn giá',
    'Thành tiền',
    'Tổng'
  ];

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function createEmptyRow(cols) {
    const row = {};
    cols.forEach(col => {
      row[col] = '';
    });
    return row;
  }

  const createNewFile = () => {
    if (!newFileName) {
      alert('Vui lòng nhập tên file');
      return;
    }

    setFileName(newFileName);
    setColumns(defaultColumns);
    // Tạo 15 hàng trống mặc định
    const initialRows = Array(15).fill(null).map(() => createEmptyRow(defaultColumns));
    setRows(initialRows);
    setShowNewFileModal(false);
    setNewFileName('');
  };

  const addNewRow = () => {
    const newRows = [...rows, createEmptyRow(columns)];
    // Cập nhật STT cho toàn bộ bảng khi thêm dòng mới
    setRows(updateAllSTT(newRows));
  };

  const addNewColumn = () => {
    const newColumnName = prompt('Nhập tên cột mới:');
    if (newColumnName && !columns.includes(newColumnName)) {
      const newColumns = [...columns, newColumnName];
      setColumns(newColumns);
      
      const updatedRows = rows.map(row => ({
        ...row,
        [newColumnName]: ''
      }));
      setRows(updatedRows);
    }
  };

  // Hàm so sánh ngày
  const compareDates = (date1, date2) => {
    // Chuyển đổi chuỗi ngày (d/m) thành Date object
    const [day1, month1] = date1.split('/').map(Number);
    const [day2, month2] = date2.split('/').map(Number);
    
    // So sánh tháng trước
    if (month1 !== month2) return month1 - month2;
    // Nếu cùng tháng thì so sánh ngày
    return day1 - day2;
  };

  // Sửa lại hàm tính tổng theo STT
  const calculateTotalBySTT = (rows, currentRow, currentIndex) => {
    // Nếu dòng hiện tại không có ngày, trả về rỗng
    if (!currentRow['Ngày']) {
      return '';
    }

    // Tìm STT hiển thị gần nhất phía trên
    let visibleSTT = '';
    let startIndex = currentIndex;
    
    // Tìm STT hiện tại hoặc STT gần nhất phía trên
    for (let i = currentIndex; i >= 0; i--) {
      if (rows[i]['Ngày'] && rows[i]['STT']) {
        visibleSTT = rows[i]['STT'];
        startIndex = i;
        break;
      }
    }
    
    if (!visibleSTT) return '';

    // Tìm vị trí kết thúc của nhóm STT hiện tại
    let endIndex = currentIndex + 1;
    while (endIndex < rows.length && (!rows[endIndex]['Ngày'] || !rows[endIndex]['STT'])) {
      endIndex++;
    }

    // Chỉ tính tổng các dòng có thành tiền
    let total = 0;
    for (let i = startIndex; i < endIndex; i++) {
      if (rows[i]['Thành tiền']) {
        total += Number(rows[i]['Thành tiền']) || 0;
      }
    }

    return total || '';
  };

  // Sửa lại hàm handleCellEdit
  const handleCellEdit = (rowIndex, columnName, value) => {
    let updatedRows = [...rows];
    
    if (columnName === 'Ngày') {
      const datePattern = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])$/;
      if (!datePattern.test(value) && value !== '') {
        alert('Vui lòng nhập ngày theo định dạng dd/mm');
        return;
      }
      updatedRows[rowIndex][columnName] = value;
      updatedRows = updateAllSTT(updatedRows);
    } else if (columnName === 'Số lượng' || columnName === 'Đơn giá') {
      const numericValue = value.replace(/[^0-9]/g, '');
      updatedRows[rowIndex][columnName] = numericValue;
      
      // Tính lại thành tiền
      const quantity = Number(updatedRows[rowIndex]['Số lượng']) || 0;
      const price = Number(updatedRows[rowIndex]['Đơn giá']) || 0;
      updatedRows[rowIndex]['Thành tiền'] = quantity * price;

      // Cập nhật tổng tiền cho các dòng có ngày
      updatedRows = updatedRows.map((row, idx) => {
        if (row['Ngày']) {
          row['Tổng'] = calculateTotalBySTT(updatedRows, row, idx);
        } else {
          row['Tổng'] = '';
        }
        return row;
      });
    } else if (columnName !== 'STT' && columnName !== 'Thành tiền' && columnName !== 'Tổng') {
      updatedRows[rowIndex][columnName] = value;
    }

    setRows(updatedRows);
    if (columnName !== 'Tên') {
      setEditingCell(null);
    }
  };

  // Sửa lại hàm updateAllSTT
  const updateAllSTT = (updatedRows) => {
    // Lọc ra các dòng có ngày và sắp xếp theo thứ tự thời gian
    const rowsWithDates = updatedRows
      .map((row, index) => ({ ...row, originalIndex: index }))
      .filter(row => row['Ngày']);

    if (rowsWithDates.length > 0) {
      // Sắp xếp các dòng theo ngày
      rowsWithDates.sort((a, b) => compareDates(a['Ngày'], b['Ngày']));

      // Gán STT theo thứ tự thời gian
      let currentSTT = 1;
      const sttMap = new Map();
      rowsWithDates.forEach(row => {
        sttMap.set(row.originalIndex, currentSTT++);
      });

      // Cập nhật lại mảng gốc
      const rows = updatedRows.map((row, index) => {
        if (row['Ngày']) {
          row['STT'] = sttMap.get(index);
          // Cập nhật tổng tiền cho mỗi dòng có STT
          row['Tổng'] = calculateTotalBySTT(updatedRows, row);
        } else {
          // Nếu không có ngày, để STT trống
          row['STT'] = '';
          row['Tổng'] = '';
        }
        return row;
      });

      // Cập nhật tổng cho tất cả các dòng
      for (let i = 0; i < rows.length; i++) {
        const total = calculateTotalBySTT(rows, rows[i], i);
        if (total > 0) {
          rows[i]['Tổng'] = total;
        } else {
          rows[i]['Tổng'] = '';
        }
      }

      return rows;
    }
    return updatedRows;
  };

  const calculateTotals = (currentRows) => {
    const total = currentRows.reduce((sum, row) => {
      return sum + (Number(row['Thành tiền']) || 0);
    }, 0);

    const chietKhau = total * 0.03; // 3% chiết khấu
    const finalTotal = total - chietKhau;

    // Cập nhật các hàng tổng
    const updatedRows = [...currentRows];
    const lastIndex = updatedRows.length - 1;
  

    setRows(updatedRows);
  };

  const exportToExcel = () => {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!rows || !columns || columns.length === 0) {
        throw new Error('Dữ liệu không hợp lệ');
      }

      // Lọc bỏ các dòng trống
      const filteredRows = rows.filter(row => 
        Object.values(row).some(value => value !== '' && value !== null && value !== undefined)
      );

      // Tạo workbook mới
      const wb = XLSX.utils.book_new();

      // Chuyển đổi dữ liệu sang định dạng phù hợp cho XLSX
      const wsData = [
        ['Tên file'], // Dòng tiêu đề
        [], // Dòng trống
        columns, // Header columns
      ];

      // Thêm dữ liệu từ filteredRows
      filteredRows.forEach(row => {
        const rowData = columns.map(col => row[col] || '');
        wsData.push(rowData);
      });

      // Tính toán tổng
      const totalAmount = filteredRows.reduce((sum, row) => sum + (Number(row['Thành tiền']) || 0), 0);
      const totalSummary = filteredRows.reduce((sum, row) => sum + (Number(row['Tổng']) || 0), 0);
      const discount = totalAmount * 0.03;
      const discountSummary = totalSummary * 0.03;
      const finalTotal = totalAmount - discount;
      const finalTotalSummary = totalSummary - discountSummary;

      // Thêm dòng tổng
      wsData.push(
        Array(columns.length).fill(''), // Dòng trống
        ['', '', 'Tổng tiền', '', '', '', totalAmount, totalSummary],
        ['', '', 'Chiết khấu 3%', '', '', '', discount, discountSummary],
        ['', '', 'Tổng', '', '', '', finalTotal, finalTotalSummary]
      );

      // Tạo worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge cells cho tiêu đề
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } } // Merge ô tiêu đề
      ];

      // Định dạng style cho các ô
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;

          ws[cellRef].s = {
            font: {
              name: 'Arial',
              sz: R === 0 ? 40 : 11,
              bold: R === 0 || R === 2 || R > range.e.r - 3
            },
            alignment: {
              vertical: 'center',
              horizontal: C === 2 ? 'left' : 'center',
              wrapText: true
            },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };

          // Format số cho các cột tiền
          if (R > 2 && (C === 5 || C === 6 || C === 7)) {
            ws[cellRef].z = '#,##0';
            if (ws[cellRef].v) {
              ws[cellRef].t = 'n';
            }
          }
        }
      }

      // Thiết lập độ rộng cột
      ws['!cols'] = columns.map(col => ({
        wch: col === 'Tên' ? 30 : 15
      }));

      // Thiết lập độ cao hàng đầu tiên
      ws['!rows'] = [{ hpt: 50 }];

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Bảng dữ liệu');

      // Xuất file
      XLSX.writeFile(wb, `${fileName || 'bang_du_lieu'}.xlsx`);

    } catch (error) {
      console.error('Lỗi xuất Excel:', error);
      throw new Error('Không thể xuất file Excel. Vui lòng thử lại.');
    }
  };

  const searchProducts = async (query) => {
    try {
      const response = await axios.get(`https://backend-giahung.onrender.com/api/products?limit=9999`);
      const filteredProducts = response.data.data.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredProducts);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const handleSelectProduct = (product, rowIndex) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex]['Tên'] = product.name;
    updatedRows[rowIndex]['Đơn vị'] = product.unit;
    updatedRows[rowIndex]['Đơn giá'] = product.price;
    
    // Tính thành tiền nếu có số lượng
    if (updatedRows[rowIndex]['Số lượng']) {
      const quantity = Number(updatedRows[rowIndex]['Số lượng']);
      updatedRows[rowIndex]['Thành tiền'] = quantity * product.price;
    }

    setRows(updatedRows);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  // Thêm hàm format tiền VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="tool-container">
      <h1>Excel Tool</h1>

      <div className="tool-header">
        <button 
          onClick={() => setShowNewFileModal(true)}
          className="create-btn"
        >
          Create New File
        </button>

        {fileName && (
          <div className="current-file">
            Current file: {fileName}
          </div>
        )}
      </div>

      {/* Modal tạo file mới */}
      {showNewFileModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Excel File</h2>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name (without extension)"
              className="file-name-input"
            />
            <div className="modal-buttons">
              <button onClick={createNewFile} className="create-btn">
                Create
              </button>
              <button 
                onClick={() => {
                  setShowNewFileModal(false);
                  setNewFileName('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {columns.length > 0 && (
        <>
          <div className="table-controls">
            <button onClick={addNewRow} className="control-btn">
              Add Row
            </button>
            <button onClick={addNewColumn} className="control-btn">
              Add Column
            </button>
            <button onClick={exportToExcel} className="export-btn">
              Export to Excel
            </button>
          </div>

          <div className="table-container">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th 
                      key={column}
                      className="border border-gray-300 bg-gray-100 px-4 py-2 text-center"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map(column => (
                      <td 
                        key={`${rowIndex}-${column}`}
                        onClick={() => {
                          if (!['STT', 'Thành tiền', 'Tổng'].includes(column)) {
                            setEditingCell({ rowIndex, column });
                            if (column === 'Tên') {
                              setSearchTerm(row[column]);
                            }
                          }
                        }}
                        className={`relative border border-gray-300 px-4 py-2
                          ${!row['Ngày'] && (column === 'STT' || column === 'Tổng') ? 'text-transparent' : ''}
                          ${['STT', 'Thành tiền', 'Tổng'].includes(column) ? 'bg-gray-50' : ''}
                          ${['Ngày', 'STT', 'Đơn vị', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Tổng'].includes(column) ? 'text-center' : ''}
                          ${column === 'Tên' ? 'text-left' : ''}`}
                      >
                        {editingCell?.rowIndex === rowIndex && editingCell?.column === column ? (
                          <div ref={column === 'Tên' ? suggestionsRef : null}>
                            <input
                              type="text"
                              value={column === 'Tên' ? searchTerm : row[column]}
                              autoFocus
                              className={`w-full px-2 py-1 border border-blue-500 rounded
                                ${['Ngày', 'STT', 'Đơn vị', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Tổng'].includes(column) ? 'text-center' : 'text-left'}`}
                              onChange={(e) => {
                                if (column === 'Tên') {
                                  setSearchTerm(e.target.value);
                                  searchProducts(e.target.value);
                                  setShowSuggestions(true);
                                } else {
                                  const updatedRows = [...rows];
                                  updatedRows[rowIndex][column] = e.target.value;
                                  setRows(updatedRows);
                                }
                              }}
                              onBlur={(e) => {
                                handleCellEdit(rowIndex, column, e.target.value);
                                if (column !== 'Tên') {
                                  setEditingCell(null);
                                }
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellEdit(rowIndex, column, e.target.value);
                                  setEditingCell(null);
                                }
                              }}
                            />
                            {column === 'Tên' && showSuggestions && suggestions.length > 0 && (
                              <div className="suggestions-container">
                                {suggestions.map((product, index) => (
                                  <div
                                    key={index}
                                    className="suggestion-item"
                                    onClick={() => handleSelectProduct(product, rowIndex)}
                                  >
                                    {product.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          !row['Ngày'] && (column === 'STT' || column === 'Tổng') ? '' :
                          ['Đơn giá', 'Thành tiền', 'Tổng'].includes(column) && row[column] !== '' 
                            ? formatCurrency(Number(row[column]) || 0)
                            : row[column]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Tool;