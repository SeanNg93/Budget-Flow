export const chartsCustomizations = {
  MuiAreaElement: {
    styleOverrides: {
      root: {
        fill: 'url(#areaGradient)',
        fillOpacity: 1,
      },
    },
  },
  MuiLineElement: {
    styleOverrides: {
      root: {
        strokeWidth: 2,
      },
    },
  },
  MuiBarElement: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      },
    },
  },
  MuiChartsAxis: {
    styleOverrides: {
      root: {
        '& .MuiChartsAxis-line': {
          stroke: 'rgba(0, 0, 0, 0.1)',
        },
        '& .MuiChartsAxis-tick': {
          stroke: 'rgba(0, 0, 0, 0.1)',
        },
        '& .MuiChartsAxis-tickLabel': {
          fontFamily: 'Roboto',
          fontSize: '0.75rem',
          fill: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  },
  MuiChartsLegend: {
    styleOverrides: {
      root: {
        '& .MuiChartsLegend-label': {
          fontFamily: 'Roboto',
          fontSize: '0.75rem',
          fill: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  },
  MuiChartsTooltip: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.15)',
        borderRadius: 8,
        padding: 8,
        fontFamily: 'Roboto',
        fontSize: '0.75rem',
        color: 'rgba(0, 0, 0, 0.87)',
      },
    },
  },
}; 