export const dataGridCustomizations = {
  MuiDataGrid: {
    styleOverrides: {
      root: {
        border: 'none',
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 600,
        },
        '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
          padding: '0 16px',
        },
        '& .MuiDataGrid-columnHeaders': {
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        },
        '& .MuiDataGrid-virtualScroller': {
          backgroundColor: 'transparent',
        },
      },
    },
  },
  MuiDataGridColumnHeader: {
    styleOverrides: {
      root: {
        color: 'rgba(0, 0, 0, 0.87)',
        fontWeight: 600,
        fontSize: '0.875rem',
      },
    },
  },
  MuiDataGridCell: {
    styleOverrides: {
      root: {
        color: 'rgba(0, 0, 0, 0.87)',
        fontSize: '0.875rem',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        color: 'rgba(0, 0, 0, 0.6)',
        fontSize: '0.875rem',
      },
      selectIcon: {
        color: 'rgba(0, 0, 0, 0.6)',
      },
    },
  },
}; 