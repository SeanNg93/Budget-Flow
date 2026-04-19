import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const AppTheme = ({ children, themeComponents = {} }) => {
  // Create a theme instance with SaaS-style design
  const theme = createTheme({
    palette: {
      primary: {
        main: '#FF6A4F', // Soft orange-red
        light: '#FF8E7A',
        dark: '#E55A3F',
      },
      secondary: {
        main: '#1A1A1A', // Dark charcoal
        light: '#404040',
        dark: '#000000',
      },
      success: {
        main: '#34C759', // Green
      },
      error: {
        main: '#FF3B30', // Red
      },
      warning: {
        main: '#FF9500', // Orange
      },
      info: {
        main: '#5AC8FA', // Light blue
      },
      background: {
        default: '#F3E7DD', // Warm pastel beige
        paper: '#FFFFFF',   // White for cards and surfaces
      },
      text: {
        primary: '#1A1A1A', // Dark charcoal
        secondary: '#6B7280', // Medium gray
      },
      divider: '#E6E6E6', // Neutral light gray
    },
    typography: {
      fontFamily: [
        'Inter',
        'SF Pro Display',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
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
      borderRadius: 16,
    },
    shadows: [
      'none',
      '0px 2px 8px rgba(0, 0, 0, 0.05)',  // Subtle shadow
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
            borderRadius: 24,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
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
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          },
          rounded: {
            borderRadius: 24,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 0px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            color: '#1A1A1A',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E6E6E6',
            boxSizing: 'border-box',
            width: '280px'
          },
          root: {
            width: '280px',
            flexShrink: 0
          },
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            backgroundColor: '#E6E6E6',
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
              backgroundColor: 'rgba(255, 106, 79, 0.1)',
              color: '#FF6A4F',
              '&:hover': {
                backgroundColor: 'rgba(255, 106, 79, 0.15)',
              },
              '& .MuiListItemIcon-root': {
                color: '#FF6A4F',
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid #E6E6E6',
            padding: '16px 20px',
          },
          head: {
            fontWeight: 600,
            color: '#6B7280',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E6E6E6',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E6E6E6',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF6A4F',
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: {
          MenuProps: {
            disableScrollLock: true,
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left'
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left'
            },
            PaperProps: {
              style: {
                minWidth: '220px',
                maxWidth: 'none'
              }
            },
            MenuListProps: {
              style: {
                paddingTop: '8px',
                paddingBottom: '8px'
              }
            }
          }
        },
        styleOverrides: {
          select: {
            minWidth: '100%',
            display: 'flex',
            whiteSpace: 'nowrap'
          }
        }
      },
      ...themeComponents,
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarWidth: "thin",
            scrollbarColor: "#E6E6E6 transparent",
            overflowY: "scroll !important",
            paddingRight: "0 !important",
            paddingLeft: "0 !important",
            margin: "0 !important"
          },
          body: {
            overflow: "visible !important",
            paddingRight: "0 !important",
            paddingLeft: "0 !important",
            margin: "0 !important",
            backgroundColor: '#F3E7DD', // Set default background color
          },
          "::-webkit-scrollbar": {
            width: "10px",
            height: "10px"
          },
          "::-webkit-scrollbar-track": {
            background: "rgba(0, 0, 0, 0.02)"
          },
          "::-webkit-scrollbar-thumb": {
            background: "#E6E6E6",
            borderRadius: "6px"
          },
          "::-webkit-scrollbar-thumb:hover": {
            background: "#CCCCCC"
          }
        }
      },
      MuiPopover: {
        defaultProps: {
          container: document.body,
          disableScrollLock: true,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left'
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left'
          }
        },
        styleOverrides: {
          paper: {
            marginTop: '2px'
          }
        }
      },
      MuiModal: {
        defaultProps: {
          disableScrollLock: true
        }
      },
      MuiDialog: {
        defaultProps: {
          disableScrollLock: true
        }
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

export default AppTheme;