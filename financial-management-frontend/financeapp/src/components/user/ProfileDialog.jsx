import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import BadgeIcon from "@mui/icons-material/Badge";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import { Slide, Fade } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { useTranslation } from 'react-i18next';

import "../../styles/ProfileDialog.css";

const API_BASE_URL = "http://localhost:8080";
const DEFAULT_AVATAR = "/default-avatar.svg";

// Slide transition component with ref
const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ProfileDialog({
  open,
  onClose,
  handleClose,
  onProfileUpdated,
}) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Refs for transitions
  const loadingFadeRef = useRef(null);
  const errorFadeRef = useRef(null);
  const contentFadeRef = useRef(null);

  // Get the user context
  const { updateProfilePicture, updateFullName, updateProfile } = useUser();

  useEffect(() => {
    if (open) {
      fetchUserProfile();
    }
  }, [open]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("userToken");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");

      if (!token) {
        setError(t('profile.errors.tokenNotFound', 'Authentication token not found. Please log in again.'));
        setIsLoading(false);
        return;
      }

      let response;
      let userId;

      if (userData && userData.id) {
        userId = userData.id;
        response = await axios.get(
          `${API_BASE_URL}/api/user/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const profileData = response.data;

      // If we got profile data but don't have user data in localStorage, store it
      if (profileData && (!userData || !userData.id)) {
        localStorage.setItem(
          "userData",
          JSON.stringify({
            id: profileData.userId,
            username: profileData.username,
            email: profileData.email,
          })
        );
      }

      // Process profile picture URL
      if (profileData.profilePictureUrl) {
        // Make sure the URL is absolute
        if (!profileData.profilePictureUrl.startsWith("http")) {
          profileData.profilePictureUrl = `${API_BASE_URL}${profileData.profilePictureUrl}`;
        }
      }

      setProfile(profileData);
      setEditedProfile(profileData);
      setAvatarPreview(profileData.profilePictureUrl || DEFAULT_AVATAR);

      // Update the context with the profile data
      updateProfile(profileData);
    } catch (err) {
      setError(t('profile.errors.loadFailed', 'Failed to load profile data: {{message}}', { message: err.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - revert changes
      setEditedProfile(profile);
      setAvatarPreview(profile.profilePictureUrl || DEFAULT_AVATAR);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);

      // Upload the image
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        toast.error(t('profile.errors.loginRequired', 'You need to be logged in to upload a profile picture'));
        return;
      }

      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error(t('profile.errors.userIdNotFound', 'User ID not found'));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_BASE_URL}/api/user/profile/${userId}/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.profilePictureUrl) {
        // Ensure URL is absolute
        let profilePictureUrl = response.data.profilePictureUrl;
        if (!profilePictureUrl.startsWith("http")) {
          profilePictureUrl = `${API_BASE_URL}${profilePictureUrl}`;
        }

        // Update both profile states with the new URL
        setProfile({ ...profile, profilePictureUrl });
        setEditedProfile({ ...editedProfile, profilePictureUrl });

        // Update the global user context
        updateProfilePicture(profilePictureUrl);

        toast.success(t('profile.pictureUploadSuccess', 'Profile picture updated successfully'));
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      toast.error(
        t('profile.errors.pictureUploadFailed', 'Failed to upload profile picture: {{message}}', 
        { message: err.response?.data?.message || err.message })
      );
    }
  };

  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch (e) {
      return {};
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate fullName
    if (editedProfile.fullName && editedProfile.fullName.length > 50) {
      newErrors.fullName = t('profile.errors.fullNameTooLong', 'Full name must be less than 50 characters');
    }

    // Validate phoneNumber format (optional field)
    if (
      editedProfile.phone &&
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(
        editedProfile.phone
      )
    ) {
      newErrors.phone = t('profile.errors.invalidPhoneFormat', 'Invalid phone number format');
    }

    // Validate dateOfBirth (optional)
    if (editedProfile.dateOfBirth) {
      const dateOfBirth = new Date(editedProfile.dateOfBirth);
      const now = new Date();
      if (isNaN(dateOfBirth.getTime())) {
        newErrors.dateOfBirth = t('profile.errors.invalidDateFormat', 'Invalid date format');
      } else if (dateOfBirth > now) {
        newErrors.dateOfBirth = t('profile.errors.futureBirthDate', 'Birth date cannot be in the future');
      }
    }

    // Validate bio length (optional)
    if (editedProfile.bio && editedProfile.bio.length > 500) {
      newErrors.bio = t('profile.errors.bioTooLong', 'Bio must be less than 500 characters');
    }

    // Validate address length (optional)
    if (editedProfile.address && editedProfile.address.length > 100) {
      newErrors.address = t('profile.errors.locationTooLong', 'Location must be less than 100 characters');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        toast.error(t('profile.errors.loginRequired', 'You need to be logged in to update your profile'));
        return;
      }

      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error(t('profile.errors.userIdNotFound', 'User ID not found'));
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/user/profile/${userId}`,
        editedProfile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        // Update the profile state
        setProfile(response.data);
        
        // Update the global user context for the full name
        updateFullName(response.data.fullName);
        
        // Exit editing mode
        setIsEditing(false);
        
        // Notify parent component
        if (onProfileUpdated) {
          onProfileUpdated(response.data);
        }
        
        toast.success(t('profile.updateSuccess', 'Profile updated successfully'));
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(
        t('profile.errors.updateFailed', 'Failed to update profile: {{message}}', 
        { message: err.response?.data?.message || err.message })
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Function to get the correct translation text based on language
  const getBilingualText = (key, englishText) => {
    const currentLanguage = i18n.language;
    
    // Hard-coded translations for critical UI elements
    const directTranslations = {
      'profile.profileInformation': {
        'en': 'Profile Information',
        'vi': 'Thông tin hồ sơ'
      },
      'profile.personalInformation': {
        'en': 'Personal Information',
        'vi': 'Thông tin cá nhân'
      },
      'profile.fullName': {
        'en': 'Full Name',
        'vi': 'Họ và tên'
      },
      'profile.phoneNumber': {
        'en': 'Phone Number',
        'vi': 'Số điện thoại'
      },
      'profile.dateOfBirth': {
        'en': 'Date of Birth',
        'vi': 'Ngày sinh'
      },
      'profile.address': {
        'en': 'Address',
        'vi': 'Địa chỉ'
      },
      'profile.bio': {
        'en': 'Bio',
        'vi': 'Tiểu sử'
      },
      'profile.placeholders.fullName': {
        'en': 'Enter your full name',
        'vi': 'Nhập họ và tên của bạn'
      },
      'profile.placeholders.phone': {
        'en': 'Enter your phone number',
        'vi': 'Nhập số điện thoại của bạn'
      },
      'profile.placeholders.address': {
        'en': 'Enter your address',
        'vi': 'Nhập địa chỉ của bạn'
      },
      'profile.placeholders.bio': {
        'en': 'Tell us about yourself',
        'vi': 'Hãy cho chúng tôi biết về bạn'
      },
      'profile.notProvided': {
        'en': 'Not provided',
        'vi': 'Chưa cung cấp'
      },
      'profile.noBioProvided': {
        'en': 'No bio provided',
        'vi': 'Chưa cung cấp tiểu sử'
      },
      'common.save': {
        'en': 'Save', 
        'vi': 'Lưu'
      },
      'common.cancel': {
        'en': 'Cancel',
        'vi': 'Hủy'
      },
      'common.edit': {
        'en': 'Edit',
        'vi': 'Sửa'
      },
      'common.email': {
        'en': 'Email',
        'vi': 'Email'
      }
    };
    
    if (directTranslations[key]) {
      return directTranslations[key][currentLanguage] || directTranslations[key]['en'] || englishText;
    }
    
    return t(key, englishText);
  };

  // Ensure the close handlers work properly
  const safeHandleClose = () => {
    try {
      // Reset any editing state to prevent conflicts on next open
      setIsEditing(false);
      
      // Call the parent's close handler
      if (typeof handleClose === 'function') {
        handleClose();
      } else if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error("Error closing dialog:", error);
      // Force close the dialog if an error occurs
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  };

  if (isLoading) {
    return (
      <Dialog
        open={open}
        onClose={safeHandleClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          {t('profile.loadingProfile', 'Loading Profile...')}
          <IconButton
            aria-label={t('common.close', 'Close')}
            onClick={safeHandleClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="loading-container">
            <Typography variant="body1">
              {t('profile.loadingInfo', 'Loading your profile information...')}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog
        open={open}
        onClose={safeHandleClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          {t('common.error', 'Error')}
          <IconButton
            aria-label={t('common.close', 'Close')}
            onClick={safeHandleClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return (
      <Dialog
        open={open}
        onClose={safeHandleClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          {t('profile.noProfileData', 'No Profile Data')}
          <IconButton
            aria-label={t('common.close', 'Close')}
            onClick={safeHandleClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            {t('profile.noProfileAvailable', 'No profile data available. Please log in again.')}
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={safeHandleClose}
      maxWidth="sm"
      fullWidth
      className="profile-dialog"
      aria-labelledby="profile-dialog-title"
      TransitionComponent={SlideTransition}
    >
      <DialogTitle className="dialog-title" component="div">
        <Typography variant="h6" className="profile-title">
          {getBilingualText('profile.profileInformation', 'Profile Information')}
        </Typography>
        <IconButton
          aria-label={t('common.close', 'Close')}
          onClick={safeHandleClose}
          className="close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="dialog-content">
        <Paper elevation={0} className="profile-card">
          {/* Loading spinner */}
          {isLoading && (
            <Fade
              in={isLoading}
              nodeRef={loadingFadeRef}
              mountOnEnter
              unmountOnExit
            >
              <Box ref={loadingFadeRef} className="loading-container">
                <CircularProgress color="primary" />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {t('profile.loadingInfo', 'Loading profile information...')}
                </Typography>
              </Box>
            </Fade>
          )}

          {/* Error message */}
          {error && !isLoading && (
            <Fade
              in={!!error}
              nodeRef={errorFadeRef}
              mountOnEnter
              unmountOnExit
            >
              <Box ref={errorFadeRef} className="loading-container">
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={fetchUserProfile}
                  startIcon={<RefreshIcon />}
                >
                  {t('common.tryAgain', 'Try Again')}
                </Button>
              </Box>
            </Fade>
          )}

          {/* Profile content */}
          {!isLoading && !error && profile && (
            <Box ref={contentFadeRef}>
              {/* User Section - Compact version */}
              <Box className="user-section-compact">
                <Box className="avatar-container">
                  <Avatar
                    src={avatarPreview}
                    alt={profile.fullName || profile.username}
                    className="avatar"
                    imgProps={{
                      onError: (e) => {
                        e.target.src = DEFAULT_AVATAR;
                      },
                    }}
                  />
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload">
                    <IconButton
                      component="span"
                      className="upload-button-right"
                      size="small"
                      aria-label={t('profile.changePicture', 'Change profile picture')}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  </label>
                </Box>

                <Box className="user-info-compact">
                  <Typography variant="h6" className="user-name">
                    {profile.fullName || profile.username}
                  </Typography>

                  <Typography variant="body2" className="user-role">
                    <BadgeIcon fontSize="small" className="user-role-icon" />
                    {profile.role || t('common.userRole', 'User')}
                  </Typography>

                  {!isEditing ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={handleEditToggle}
                      className="edit-button-compact"
                    >
                      {t('common.edit', 'Edit')}
                    </Button>
                  ) : null}
                </Box>
              </Box>

              {/* Details Section - Compact version */}
              <Box className="details-section-compact">
                <Typography
                  variant="subtitle1"
                  className="section-title-compact"
                >
                  {getBilingualText('profile.personalInformation', 'Personal Information')}
                </Typography>

                <Box className="field-grid-compact">
                  <Box className="field-container-compact">
                    <Typography variant="caption" className="field-label">
                      <PersonIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                      />
                      {getBilingualText('profile.fullName', 'Full Name')}
                    </Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="fullName"
                        value={editedProfile.fullName || ""}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        className="text-field"
                        placeholder={getBilingualText('profile.placeholders.fullName', 'Enter your full name')}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        aria-label={getBilingualText('profile.fullName', 'Full Name')}
                      />
                    ) : (
                      <Typography variant="body2" className="field-value">
                        {profile.fullName || profile.username}
                      </Typography>
                    )}
                  </Box>

                  <Box className="field-container-compact">
                    <Typography variant="caption" className="field-label">
                      <EmailIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                      />
                      {getBilingualText('common.email', 'Email')}
                    </Typography>
                    <Typography variant="body2" className="field-value">
                      {profile.email}
                    </Typography>
                  </Box>

                  <Box className="field-container-compact">
                    <Typography variant="caption" className="field-label">
                      <PhoneIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                      />
                      {getBilingualText('profile.phoneNumber', 'Phone Number')}
                    </Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="phone"
                        value={editedProfile.phone || ""}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        className="text-field"
                        placeholder={getBilingualText('profile.placeholders.phone', 'Enter your phone number')}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        aria-label={getBilingualText('profile.phoneNumber', 'Phone Number')}
                      />
                    ) : (
                      <Typography variant="body2" className="field-value">
                        {profile.phone || getBilingualText('profile.notProvided', 'Not provided')}
                      </Typography>
                    )}
                  </Box>

                  <Box className="field-container-compact">
                    <Typography variant="caption" className="field-label">
                      <CalendarTodayIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                      />
                      {getBilingualText('profile.dateOfBirth', 'Date of Birth')}
                    </Typography>
                    {isEditing ? (
                      <Box>
                        <TextField
                          fullWidth
                          name="dateOfBirth"
                          type="date"
                          value={editedProfile.dateOfBirth || ""}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          className="text-field"
                          error={!!errors.dateOfBirth}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          placeholder="dd/mm/yyyy"
                          aria-label={getBilingualText('profile.dateOfBirth', 'Date of Birth')}
                        />
                        {errors.dateOfBirth && (
                          <Alert
                            severity="error"
                            sx={{
                              mt: 1,
                              "& .MuiAlert-message": {
                                fontSize: "0.875rem",
                                padding: "4px 0",
                              },
                            }}
                          >
                            {errors.dateOfBirth}
                          </Alert>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" className="field-value">
                        {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : getBilingualText('profile.notProvided', 'Not provided')}
                      </Typography>
                    )}
                  </Box>

                  <Box className="field-container-compact">
                    <Typography variant="caption" className="field-label">
                      <LocationOnIcon
                        fontSize="small"
                        sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                      />
                      {getBilingualText('profile.address', 'Address')}
                    </Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="address"
                        value={editedProfile.address || ""}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        className="text-field"
                        placeholder={getBilingualText('profile.placeholders.address', 'Enter your address')}
                        error={!!errors.address}
                        helperText={errors.address}
                        aria-label={getBilingualText('profile.address', 'Address')}
                      />
                    ) : (
                      <Typography variant="body2" className="field-value">
                        {profile.address || getBilingualText('profile.notProvided', 'Not provided')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box className="field-container-compact bio-container-compact">
                  <Typography variant="caption" className="field-label">
                    <InfoIcon
                      fontSize="small"
                      sx={{ mr: 0.5, verticalAlign: "text-bottom" }}
                    />
                    {getBilingualText('profile.bio', 'Bio')}
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      name="bio"
                      value={editedProfile.bio || ""}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      className="text-field"
                      placeholder={getBilingualText('profile.placeholders.bio', 'Tell us about yourself')}
                      error={!!errors.bio}
                      helperText={errors.bio}
                      aria-label={getBilingualText('profile.bio', 'Bio')}
                    />
                  ) : (
                    <Box className="bio-field-compact">
                      <Typography variant="body2" className="field-value">
                        {profile.bio || getBilingualText('profile.noBioProvided', 'No bio provided')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Action Buttons */}
              {isEditing && (
                <Box className="action-buttons-compact">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={handleEditToggle}
                    startIcon={<CancelIcon />}
                    className="cancel-button"
                    size="small"
                  >
                    {getBilingualText('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    startIcon={<SaveIcon />}
                    className="save-button"
                    size="small"
                  >
                    {getBilingualText('common.save', 'Save')}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
}
