import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Fab from '@mui/material/Fab';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BadgeIcon from '@mui/icons-material/Badge';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';

import '../../styles/ProfileDialog.css';

const API_BASE_URL = "http://localhost:8080";
const DEFAULT_AVATAR = "/default-avatar.svg";

export default function ProfileDialog({ open, onClose, handleClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      const token = localStorage.getItem('userToken');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      let response;
      let userId;

      if (userData && userData.id) {
        userId = userData.id;
        response = await axios.get(`${API_BASE_URL}/api/user/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const profileData = response.data;

      // If we got profile data but don't have user data in localStorage, store it
      if (profileData && (!userData || !userData.id)) {
        localStorage.setItem('userData', JSON.stringify({
          id: profileData.userId,
          username: profileData.username,
          email: profileData.email
        }));
      }

      // Process profile picture URL
      if (profileData.profilePictureUrl) {
        // Make sure the URL is absolute
        if (!profileData.profilePictureUrl.startsWith('http')) {
          profileData.profilePictureUrl = `${API_BASE_URL}${profileData.profilePictureUrl}`;
        }
      }

      setProfile(profileData);
      setEditedProfile(profileData);
      setAvatarPreview(profileData.profilePictureUrl || DEFAULT_AVATAR);
      
      // Update the context with the profile data
      updateProfile(profileData);
    } catch (err) {
      setError(`Failed to load profile data: ${err.message}`);
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
      [name]: value
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
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error("You need to be logged in to upload a profile picture");
        return;
      }

      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/api/user/profile/${userId}/picture`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedProfile = response.data;
      
      // Update profile state with new avatar URL
      setProfile(prev => ({ ...prev, avatar: updatedProfile.profilePictureUrl }));
      setEditedProfile(prev => ({ ...prev, avatar: updatedProfile.profilePictureUrl }));
      
      // Make sure we use the absolute URL for the avatar preview
      if (updatedProfile.profilePictureUrl) {
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const profilePicUrl = updatedProfile.profilePictureUrl.startsWith('http')
          ? `${updatedProfile.profilePictureUrl}?t=${timestamp}`
          : `${API_BASE_URL}${updatedProfile.profilePictureUrl}?t=${timestamp}`;
        setAvatarPreview(profilePicUrl);
        
        // Update the Context with the new profile picture URL
        updateProfilePicture(updatedProfile.profilePictureUrl);
      }
      
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to upload profile picture: ${err.message}`);
    }
  };

  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (e) {
      console.error("Failed to parse user data:", e);
      return {};
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error("You need to be logged in to update your profile");
        return;
      }

      // Get user ID from profile or localStorage
      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/api/user/profile/${userId}`, editedProfile, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedProfile = response.data;
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);
      
      // Update the Context with the updated profile
      updateProfile(updatedProfile);
      
      // Also update the full name specifically
      if (updatedProfile.fullName) {
        updateFullName(updatedProfile.fullName);
      }
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile. Please try again.");
      console.error(err);
    }
  };

  const handleDialogClose = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedProfile(profile);
    }
    // Use the appropriate closing function (handleClose takes priority if available)
    if (handleClose) {
      handleClose();
    } else if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <Dialog 
        open={open} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          Loading Profile...
          <IconButton 
            aria-label="close"
            onClick={handleDialogClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="loading-container">
            <Typography variant="body1">Loading your profile information...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog 
        open={open} 
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          Error
          <IconButton 
            aria-label="close"
            onClick={handleDialogClose}
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
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        className="profile-dialog"
      >
        <DialogTitle className="dialog-title" component="div">
          No Profile Data
          <IconButton 
            aria-label="close"
            onClick={handleDialogClose}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning">No profile data available. Please log in again.</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose}
      maxWidth="md"
      fullWidth
      className="profile-dialog"
    >
      <DialogTitle className="dialog-title" component="div">
        <Typography variant="h5" className="profile-title">
          Profile Information
        </Typography>
        <IconButton 
          aria-label="close"
          onClick={handleDialogClose}
          className="close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="dialog-content">
        <Paper elevation={0} className="profile-card">
          {/* User Section */}
          <Box className="user-section">
            <Box className="avatar-container">
              <Avatar 
                src={avatarPreview} 
                alt={profile.fullName || profile.username}
                className="avatar"
                imgProps={{
                  onError: (e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }
                }}
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <IconButton 
                  component="span" 
                  className="upload-button"
                  size="small"
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
            
            <Box className="user-info">
              <Typography variant="h5" className="user-name">
                {profile.fullName || profile.username}
              </Typography>
              
              <Typography variant="body1" className="user-role">
                <BadgeIcon className="user-role-icon" />
                {profile.role || "User"}
              </Typography>
              
              {!isEditing && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleEditToggle}
                  className="edit-button"
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Box>
          
          {/* Details Section */}
          <Box className="details-section">
            <Typography variant="h6" className="section-title">
              Personal Information
            </Typography>
            
            <Box className="field-grid">
              <Box className="field-container">
                <Typography variant="caption" className="field-label">
                  <PersonIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Full Name
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
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Typography variant="body1" className="field-value">
                    {profile.fullName || profile.username}
                  </Typography>
                )}
              </Box>
              
              <Box className="field-container">
                <Typography variant="caption" className="field-label">
                  <EmailIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Email
                </Typography>
                <Typography variant="body1" className="field-value">
                  {profile.email}
                </Typography>
              </Box>
              
              <Box className="field-container">
                <Typography variant="caption" className="field-label">
                  <PhoneIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Phone Number
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
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <Typography variant="body1" className="field-value">
                    {profile.phone || "Not provided"}
                  </Typography>
                )}
              </Box>
              
              <Box className="field-container">
                <Typography variant="caption" className="field-label">
                  <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Date of Birth
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    name="dateOfBirth"
                    type="date"
                    value={editedProfile.dateOfBirth || ""}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    className="text-field"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                ) : (
                  <Typography variant="body1" className="field-value">
                    {profile.dateOfBirth || "Not provided"}
                  </Typography>
                )}
              </Box>
              
              <Box className="field-container">
                <Typography variant="caption" className="field-label">
                  <LocationOnIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Address
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
                    placeholder="Enter your address"
                  />
                ) : (
                  <Typography variant="body1" className="field-value">
                    {profile.address || "Not provided"}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box className="field-container bio-container">
              <Typography variant="caption" className="field-label">
                <InfoIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                Bio
              </Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="bio"
                  value={editedProfile.bio || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  className="text-field"
                  placeholder="Tell us about yourself"
                />
              ) : (
                <Box className="bio-field">
                  <Typography variant="body1" className="field-value">
                    {profile.bio || "No bio provided"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Action Buttons */}
          {isEditing && (
            <Box className="action-buttons">
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleEditToggle}
                startIcon={<CancelIcon />}
                className="cancel-button"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                className="save-button"
              >
                Save Changes
              </Button>
            </Box>
          )}
        </Paper>
      </DialogContent>
    </Dialog>
  );
} 