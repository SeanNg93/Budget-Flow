import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Avatar, 
  CircularProgress, 
  Alert, 
  IconButton,
  Divider,
  Container,
  Paper,
  Stack,
  useTheme,
  Fab,
  Fade,
  Zoom
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import InfoIcon from "@mui/icons-material/Info";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import styles from "../../styles/Profile.module.css";

// Define the backend API base URL
const API_BASE_URL = "http://localhost:8080";
const DEFAULT_AVATAR = "/default-avatar.svg";

export default function Profile() {
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Refs for transitions
  const errorFadeRef = useRef(null);
  const noProfileFadeRef = useRef(null);
  const contentFadeRef = useRef(null);
  const fabZoomRef = useRef(null);

  // Get the authentication token and user data from localStorage
  const getAuthToken = () => localStorage.getItem("userToken");
  const getUserData = () => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Try to get user data from localStorage
      const userData = getUserData();
      
      // Use the current user endpoint if no user ID is available
      let response;
      if (!userData || !userData.id) {
        // Use the current user endpoint
        response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Use the user ID from userData
        const userId = userData.id;
        response = await axios.get(`${API_BASE_URL}/api/user/profile/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const profileData = response.data;
      
      // If we got profile data but don't have user data in localStorage, store it
      if (profileData && (!userData || !userData.id)) {
        const newUserData = {
          id: profileData.userId,
          username: profileData.username,
          email: profileData.email
        };
        localStorage.setItem('userData', JSON.stringify(newUserData));
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
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to load profile data: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset edited data if canceling edit
    if (isEditing) {
      setEditedProfile(profile);
      setAvatarPreview(profile.profilePictureUrl || DEFAULT_AVATAR);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error("Only image files are allowed");
        return;
      }
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload the image to the server
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
        setIsLoading(false);
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

      // ✅ Chỉ cập nhật avatar, giữ nguyên dữ liệu khác
      setProfile(prev => ({ ...prev, avatar: updatedProfile.profilePictureUrl }));
      setEditedProfile(prev => ({ ...prev, avatar: updatedProfile.profilePictureUrl }));

      const timestamp = new Date().getTime();
      if (updatedProfile.profilePictureUrl) {
        const profilePicUrl = updatedProfile.profilePictureUrl.startsWith('http') 
          ? `${updatedProfile.profilePictureUrl}?t=${timestamp}`
          : `${API_BASE_URL}${updatedProfile.profilePictureUrl}?t=${timestamp}`;
        setAvatarPreview(profilePicUrl);
      } else {
        setAvatarPreview(DEFAULT_AVATAR);
      }
      
      toast.success("Profile picture updated successfully!");
      setIsLoading(false);
    } catch (err) {
      toast.error(`Failed to upload profile picture: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Get user ID from profile or localStorage
      const userId = profile.userId || (getUserData() && getUserData().id);
      if (!userId) {
        toast.error("User ID not found. Please log in again.");
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
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={50} thickness={4} style={{ color: '#0071e3' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Fade in={!!error} nodeRef={errorFadeRef} timeout={300}>
        <Container ref={errorFadeRef} maxWidth="md" className={styles.errorContainer}>
          <Alert 
            severity="error" 
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </Fade>
    );
  }

  if (!profile) {
    return (
      <Fade in={true} nodeRef={noProfileFadeRef} timeout={300}>
        <Container ref={noProfileFadeRef} maxWidth="md" className={styles.errorContainer}>
          <Alert 
            severity="warning" 
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            }
          >
            No profile data available. Please log in again.
          </Alert>
        </Container>
      </Fade>
    );
  }

  return (
    <Fade in={true} nodeRef={contentFadeRef} timeout={500}>
      <Container ref={contentFadeRef} className={styles.profileContainer}>
        <Paper elevation={3} className={styles.profileCard}>
          {/* Header */}
          <Box className={styles.profileHeader}>
            <Typography variant="h5" className={styles.profileTitle}>
              Profile Information
            </Typography>
            
            {!isEditing && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleEditToggle}
                className={styles.editButton}
              >
                Edit Profile
              </Button>
            )}
          </Box>
          
          {/* User Section */}
          <Box className={styles.userSectionCompact}>
            <Box className={styles.avatarContainer}>
              <Avatar 
                src={avatarPreview} 
                alt={profile.fullName || profile.username}
                className={styles.avatarCompact}
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
                  className={styles.uploadButtonRight}
                  size="small"
                >
                  <PhotoCameraIcon />
                </IconButton>
              </label>
            </Box>
            
            <Box className={styles.userInfoCompact}>
              <Typography variant="h6" className={styles.userNameCompact}>
                {profile.fullName || profile.username}
              </Typography>
              
              <Typography variant="body2" className={styles.userRoleCompact}>
                <BadgeIcon fontSize="small" className={styles.userRoleIcon} />
                {profile.role || "User"}
              </Typography>
            </Box>
          </Box>
          
          {/* Details Section */}
          <Box className={styles.detailsSectionCompact}>
            <Typography variant="subtitle1" className={styles.sectionTitleCompact}>
              Personal Information
            </Typography>
            
            <Box className={styles.fieldGridCompact}>
              <Box className={styles.fieldContainerCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                    className={styles.textField}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Typography variant="body2" className={styles.fieldValue}>
                    {profile.fullName || profile.username}
                  </Typography>
                )}
              </Box>
              
              <Box className={styles.fieldContainerCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
                  <EmailIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Email
                </Typography>
                <Typography variant="body2" className={styles.fieldValue}>
                  {profile.email}
                </Typography>
              </Box>
              
              <Box className={styles.fieldContainerCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                    className={styles.textField}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <Typography variant="body2" className={styles.fieldValue}>
                    {profile.phone || "Not provided"}
                  </Typography>
                )}
              </Box>
              
              <Box className={styles.fieldContainerCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                    className={styles.textField}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                ) : (
                  <Typography variant="body2" className={styles.fieldValue}>
                    {profile.dateOfBirth || "Not provided"}
                  </Typography>
                )}
              </Box>
              
              <Box className={styles.fieldContainerCompact}>
                <Typography variant="caption" className={styles.fieldLabel}>
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
                    className={styles.textField}
                    placeholder="Enter your address"
                  />
                ) : (
                  <Typography variant="body2" className={styles.fieldValue}>
                    {profile.address || "Not provided"}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box className={styles.fieldContainerCompact} sx={{ mt: 2 }}>
              <Typography variant="caption" className={styles.fieldLabel}>
                <InfoIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                Bio
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
                  className={styles.textField}
                  placeholder="Tell us about yourself"
                />
              ) : (
                <Box className={styles.bioFieldCompact}>
                  <Typography variant="body2" className={styles.fieldValue}>
                    {profile.bio || "No bio provided"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Action Buttons */}
          {isEditing ? (
            <Box className={styles.actionButtonsCompact}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleEditToggle}
                startIcon={<CancelIcon />}
                className={styles.cancelButton}
                size="small"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                className={styles.saveButton}
                size="small"
              >
                Save
              </Button>
            </Box>
          ) : null}
        </Paper>
        
        {/* Floating Edit Button for Mobile */}
        {!isEditing && (
          <Zoom in={!isEditing} nodeRef={fabZoomRef}>
            <Fab 
              ref={fabZoomRef}
              color="primary" 
              aria-label="edit profile"
              className={styles.floatingEditButton}
              onClick={handleEditToggle}
            >
              <EditIcon />
            </Fab>
          </Zoom>
        )}
      </Container>
    </Fade>
  );
} 