import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

// Flag icons represented with emoji characters
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    handleClose();
    
    // Store the language preference in localStorage
    localStorage.setItem('i18nextLng', languageCode);
  };
  
  const currentLanguage = LANGUAGE_OPTIONS.find(
    (lang) => lang.code === i18n.language
  ) || LANGUAGE_OPTIONS[0];
  
  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label={t('common.language')}
          size="medium"
          sx={{ mx: 0.5 }}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 180,
            borderRadius: '10px',
            mt: 1,
          },
        }}
      >
        {LANGUAGE_OPTIONS.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            selected={i18n.language === language.code}
            sx={{
              py: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            }}
          >
            <ListItemIcon sx={{ fontSize: '1.2rem', minWidth: 36 }}>
              {language.flag}
            </ListItemIcon>
            <ListItemText primary={language.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector; 