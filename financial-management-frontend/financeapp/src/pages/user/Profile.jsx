import { useState, useEffect } from "react";
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
  Card,
  CardContent,
  Divider,
  Container,
  useTheme
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

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

      // Get user ID from profile or localStorage
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
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      
      // Add a timestamp to the URL to prevent caching
      const timestamp = new Date().getTime();
      if (updatedProfile.profilePictureUrl) {
        // Make sure the URL is absolute
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={40} thickness={4} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            py: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchUserProfile}
              sx={{ 
                borderRadius: 10, 
                px: 3,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="warning" 
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            py: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/login')}
              sx={{ 
                borderRadius: 10, 
                px: 3,
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Go to Login
            </Button>
          }
        >
          No profile data available. Please log in again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        align="center" 
        sx={{ 
          mb: 5, 
          fontWeight: 500,
          color: theme.palette.text.primary
        }}
      >
        Profile Information
      </Typography>

      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
          }
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={6}>
            {/* Left column - Avatar and basic info */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Avatar 
                  src={avatarPreview} 
                  alt={profile.fullName || profile.username}
                  sx={{ 
                    width: 180, 
                    height: 180, 
                    border: '4px solid #fff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    }
                  }}
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
                    sx={{ 
                      position: 'absolute', 
                      bottom: 5, 
                      right: 5, 
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      width: 44,
                      height: 44,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>
              
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary
                }}
              >
                {profile.fullName || profile.username}
              </Typography>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  fontWeight: 500,
                  mb: 1
                }}
              >
                {profile.role || 'User'}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ opacity: 0.8 }}
              >
                Joined: {profile.joinDate || 'N/A'}
              </Typography>
            </Grid>

            {/* Right column - Profile details */}
            <Grid item xs={12} md={8}>
              <Box component="form" noValidate>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.light,
                            },
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: 400,
                          color: theme.palette.text.primary
                        }}
                      >
                        {profile.fullName || profile.username}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
                      Email
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ 
                        fontWeight: 400,
                        color: theme.palette.text.primary
                      }}
                    >
                      {profile.email}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.light,
                            },
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: 400,
                          color: theme.palette.text.primary
                        }}
                      >
                        {profile.phone || "Not updated"}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
                      Role
                    </Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="role"
                        value={editedProfile.role || ""}
                        disabled={true}
                        variant="outlined"
                        size="small"
                        helperText="Role cannot be changed"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                          },
                          '& .MuiFormHelperText-root': {
                            marginLeft: 0
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: 400,
                          color: theme.palette.text.primary
                        }}
                      >
                        {profile.role || "User"}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        mb: 1
                      }}
                    >
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.light,
                            },
                          }
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: 400,
                          color: theme.palette.text.primary
                        }}
                      >
                        {profile.bio || "Not updated"}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  {isEditing ? (
                    <>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleEditToggle}
                        startIcon={<CancelIcon />}
                        sx={{ 
                          borderRadius: 10, 
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          boxShadow: 'none',
                          borderWidth: 1.5
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        startIcon={<SaveIcon />}
                        sx={{ 
                          borderRadius: 10, 
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate('/dashboard')}
                        startIcon={<ArrowBackIcon />}
                        sx={{ 
                          borderRadius: 10, 
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          boxShadow: 'none',
                          borderWidth: 1.5
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleEditToggle}
                        startIcon={<EditIcon />}
                        sx={{ 
                          borderRadius: 10, 
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                          '&:hover': {
                            boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                          }
                        }}
                      >
                        Edit Profile
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
} 