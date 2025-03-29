import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Menu, 
  MenuItem, 
  IconButton, 
  Box, 
  Typography, 
  Tooltip,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';

const LanguageSwitcher = ({ iconOnly = false }) => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Get language label
  const getLanguageLabel = (code) => {
    switch(code) {
      case 'en': return 'English';
      case 'vi': return 'Tiếng Việt';
      default: return code.toUpperCase();
    }
  };
  
  const currentLanguage = i18n.language;
  
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    handleClose();
  };

  if (iconOnly) {
    return (
      <Box component="div" sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Tooltip title={t('common.language')}>
          <IconButton
            onClick={handleOpen}
            size="small"
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{ 
              color: 'inherit',
              position: 'relative',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <LanguageIcon fontSize="small" />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '9px',
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                color: 'white',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {currentLanguage.substring(0, 2).toUpperCase()}
            </Typography>
          </IconButton>
        </Tooltip>
        
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'language-button',
          }}
        >
          <MenuItem 
            onClick={() => changeLanguage('en')}
            selected={currentLanguage === 'en'}
          >
            <ListItemIcon sx={{ minWidth: '32px' }}>
              {currentLanguage === 'en' && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>English</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => changeLanguage('vi')}
            selected={currentLanguage === 'vi'}
          >
            <ListItemIcon sx={{ minWidth: '32px' }}>
              {currentLanguage === 'vi' && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>Tiếng Việt</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', m: 1 }}>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-controls={open ? 'language-menu-full' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ mr: 1 }}
      >
        <LanguageIcon fontSize="small" />
      </IconButton>
      
      <Typography 
        variant="subtitle2" 
        onClick={handleOpen}
        sx={{ cursor: 'pointer' }}
      >
        {getLanguageLabel(currentLanguage)}
      </Typography>
      
      <Menu
        id="language-menu-full"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        <MenuItem 
          onClick={() => changeLanguage('en')}
          selected={currentLanguage === 'en'}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {currentLanguage === 'en' && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>English</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('vi')}
          selected={currentLanguage === 'vi'}
        >
          <ListItemIcon sx={{ minWidth: '32px' }}>
            {currentLanguage === 'vi' && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Tiếng Việt</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher; 