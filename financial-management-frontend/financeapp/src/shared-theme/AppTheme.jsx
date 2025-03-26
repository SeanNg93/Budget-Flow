import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const AppTheme = ({ children, themeComponents = {} }) => {
  // Create a theme instance with Apple-inspired design
  const theme = createTheme({
    palette: {
      primary: {
        main: '#007AFF', // Apple blue
        light: '#42a5f5',
        dark: '#0055b3',
      },
      secondary: {
        main: '#FF2D55', // Apple pink/red
        light: '#ff6b81',
        dark: '#c4002b',
      },
      success: {
        main: '#34C759', // Apple green
      },
      error: {
        main: '#FF3B30', // Apple red
      },
      warning: {
        main: '#FF9500', // Apple orange
      },
      info: {
        main: '#5AC8FA', // Apple light blue
      },
      background: {
        default: '#F2F2F7', // Apple light gray background
        paper: '#FFFFFF',   // White for cards and surfaces
      },
      text: {
        primary: '#000000',
        secondary: '#8E8E93', // Apple secondary text
      },
      divider: 'rgba(0, 0, 0, 0.1)',
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        'San Francisco',
        'Helvetica Neue',
        'Helvetica',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1rem',
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.875rem',
      },
      body1: {
        fontWeight: 400,
        fontSize: '1rem',
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.875rem',
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 2px 8px rgba(0, 0, 0, 0.05)',  // Subtle Apple-style shadow
      '0px 4px 12px rgba(0, 0, 0, 0.08)',
      '0px 6px 16px rgba(0, 0, 0, 0.1)',
      // ... rest of the shadows array
      ...Array(21).fill('none').map((_, i) => 
        i > 3 ? `0px ${i}px ${i * 4}px rgba(0, 0, 0, ${0.05 + i * 0.01})` : 'none'
      ),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            boxShadow: 'none',
            fontWeight: 600,
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: 'none',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            padding: '16px 20px 8px',
          },
          title: {
            fontSize: '1.1rem',
            fontWeight: 600,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '8px 20px 20px',
            '&:last-child': {
              paddingBottom: 20,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
          },
          rounded: {
            borderRadius: 16,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 0px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            color: '#000000',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#F2F2F7',
            borderRight: 'none',
          },
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 8px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              color: '#007AFF',
              '&:hover': {
                backgroundColor: 'rgba(0, 122, 255, 0.15)',
              },
              '& .MuiListItemIcon-root': {
                color: '#007AFF',
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            padding: '16px 20px',
          },
          head: {
            fontWeight: 600,
            color: '#8E8E93',
          },
        },
      },
      ...themeComponents,
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0, 0, 0, 0.15) transparent",
            // The overflow and padding help prevent layout shifts with modals
            overflowY: "scroll !important",
            paddingRight: "0 !important"
          },
          body: {
            overflow: "auto !important",
            // Prevent automatic padding adjustments from Material UI
            paddingRight: "0 !important"
          },
          // Customize scrollbars for better appearance
          "::-webkit-scrollbar": {
            width: "10px",
            height: "10px"
          },
          "::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.02)"
          },
          "::-webkit-scrollbar-thumb": {
            background: "rgba(0, 0, 0, 0.15)",
            borderRadius: "6px"
          },
          "::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0, 0, 0, 0.3)"
          }
        }
      },
      MuiPopover: {
        defaultProps: {
          container: document.body
        }
      },
      MuiModal: {
        defaultProps: {
        }
      },
      MuiDialog: {
        defaultProps: {
        }
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
          }
        }
      }
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

export default AppTheme; 