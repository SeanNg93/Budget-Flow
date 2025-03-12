export const treeViewCustomizations = {
  MuiTreeView: {
    styleOverrides: {
      root: {
        '& .MuiTreeItem-root': {
          '&.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label': {
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            color: '#1976d2',
          },
          '&.Mui-selected > .MuiTreeItem-content .MuiTreeItem-label:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
          },
          '& .MuiTreeItem-content': {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '& .MuiTreeItem-label': {
              padding: '4px 8px',
              borderRadius: 4,
            },
          },
        },
      },
    },
  },
  MuiTreeItem: {
    styleOverrides: {
      root: {
        '& .MuiTreeItem-content': {
          padding: '2px 0',
        },
        '& .MuiTreeItem-group': {
          marginLeft: 16,
        },
      },
      label: {
        fontSize: '0.875rem',
      },
    },
  },
}; 