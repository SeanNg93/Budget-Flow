import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Format date for Excel report
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Export transactions to Excel file
 * @param {Array} transactions - Array of transaction objects
 * @param {Function} formatCurrency - Function to format currency values
 * @param {string} filename - Name of the output file (without extension)
 */
export const exportTransactionsToExcel = async (transactions, formatCurrency, filename = 'transactions-export') => {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Budget Flow App';
  workbook.lastModifiedBy = 'Budget Flow App';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add a worksheet
  const worksheet = workbook.addWorksheet('Transactions');
  
  // Define columns - removing User column, keeping just 6 columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Wallet', key: 'wallet', width: 20 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 }
  ];
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  // Add background color to header
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add border to header cells
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add transactions data
  transactions.forEach(transaction => {
    // Determine the sign for the amount based on transaction type
    const isIncome = transaction.transactionType === 'INCOME';
    const amount = isIncome ? transaction.amount : -transaction.amount;
    
    // Parse amount to remove currency symbols for Excel
    const amountValue = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
      : amount;
    
    // Improved shared wallet detection
    // Check if this is a shared wallet using multiple methods
    const isSharedWallet = (
      // 1. If the transaction has a isShared flag (passed from TransactionsSection)
      transaction.isShared === true ||

      // 2. Original check from shared wallets object
      (transaction.wallet && 
       transaction.wallet.id && 
       transaction.sharedWallets && 
       transaction.wallet.id in transaction.sharedWallets) ||
      
      // 3. Check if wallet name already includes "(shared)"
      (transaction.wallet && 
       transaction.wallet.accountName && 
       transaction.wallet.accountName.toLowerCase().includes('(shared)')) ||

      // 4. Check for "shared" flag directly in the wallet object
      (transaction.wallet && transaction.wallet.shared === true)
    );
    
    // Format wallet name with clear shared wallet indication
    let walletName = 'Unknown';
    if (transaction.wallet) {
      const baseName = transaction.wallet.accountName || 'Wallet';
      const sharedTag = isSharedWallet && !baseName.toLowerCase().includes('shared') ? ' [SHARED]' : '';
      walletName = baseName + sharedTag;
    } else if (transaction.account) {
      walletName = transaction.account.accountName || 'Unknown';
    }
    
    // Format type with username for shared wallets
    let typeWithUser = transaction.transactionType || '';
    if (isSharedWallet && transaction.user && (transaction.user.username || transaction.user.name)) {
      const username = transaction.user.username || transaction.user.name;
      typeWithUser = `${transaction.transactionType} (${username})`;
    }
    
    // Add row to worksheet
    worksheet.addRow({
      id: transaction.id,
      date: formatDate(transaction.transactionDate),
      description: transaction.description || '',
      category: transaction.category 
        ? transaction.category.categoryName 
        : (transaction.categoryId ? `Category #${transaction.categoryId}` : 'Uncategorized'),
      wallet: walletName,
      type: typeWithUser,
      amount: amountValue
    });
  });
  
  // Style the amount column
  // Get the amount column (column 7 now)
  const amountColumn = worksheet.getColumn(7);
  
  // Format the amount cells for currency
  amountColumn.eachCell((cell, rowNumber) => {
    // Skip header row
    if (rowNumber > 1) {
      // Set number format
      cell.numFmt = '$#,##0.00;[Red]-$#,##0.00';
      
      // Set color based on value
      const value = cell.value;
      if (value < 0) {
        cell.font = { color: { argb: 'FFFF0000' } }; // Red for negative
      } else if (value > 0) {
        cell.font = { color: { argb: 'FF008000' } }; // Green for positive
      }
    }
  });

  // Style the Type column to highlight entries with usernames
  const typeColumn = worksheet.getColumn(6);
  typeColumn.eachCell((cell, rowNumber) => {
    // Skip header row
    if (rowNumber > 1) {
      // If this is a cell with username info (contains parentheses)
      if (cell.value && cell.value.toString().includes('(')) {
        cell.font = { 
          color: { argb: 'FF0066CC' }, // Blue text
          bold: true 
        };
      }
    }
  });
  
  // Style data rows
  worksheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber > 1) {
      // Add border to cells
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Align text
        cell.alignment = { 
          vertical: 'middle',
          // Align amount to right, ID and date to center, others to left
          horizontal: cell.col === 7 ? 'right' : (cell.col === 1 || cell.col === 2 ? 'center' : 'left')
        };
      });
      
      // Alternate row background for better readability
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' }
          };
        });
      }
    }
  });
  
  // Add a total row at the bottom
  const totalRowIndex = transactions.length + 2;
  const totalRow = worksheet.getRow(totalRowIndex);
  
  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.transactionType === 'INCOME')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalExpense = transactions
    .filter(t => t.transactionType === 'EXPENSE')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const netAmount = totalIncome - totalExpense;
  
  // Add total row
  totalRow.getCell(6).value = 'TOTAL';
  totalRow.getCell(6).font = { bold: true };
  totalRow.getCell(7).value = netAmount;
  totalRow.getCell(7).font = { 
    bold: true,
    color: { argb: netAmount >= 0 ? 'FF008000' : 'FFFF0000' }
  };
  totalRow.getCell(7).numFmt = '$#,##0.00;[Red]-$#,##0.00';
  
  // Style the total row
  totalRow.eachCell((cell, colNumber) => {
    if (colNumber >= 6) {
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };
      
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }
  });
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Save file
  saveAs(new Blob([buffer]), `${filename}.xlsx`);
}; 