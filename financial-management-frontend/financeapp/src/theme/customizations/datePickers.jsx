export const datePickersCustomizations = {
  MuiDatePicker: {
    styleOverrides: {
      root: {
        '& .MuiInputBase-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiPickersDay: {
    styleOverrides: {
      root: {
        fontWeight: 400,
        borderRadius: '50%',
        '&.Mui-selected': {
          fontWeight: 600,
          backgroundColor: '#1976d2',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
        },
      },
    },
  },
  MuiPickersCalendarHeader: {
    styleOverrides: {
      root: {
        '& .MuiPickersCalendarHeader-label': {
          fontWeight: 600,
        },
      },
    },
  },
  MuiPickersMonth: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          backgroundColor: '#1976d2',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
        },
      },
    },
  },
  MuiPickersYear: {
    styleOverrides: {
      root: {
        '&.Mui-selected': {
          backgroundColor: '#1976d2',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#1565c0',
          },
        },
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
        },
      },
    },
  },
}; 