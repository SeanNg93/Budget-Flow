import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Profile.module.css"; 

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedProfile = JSON.parse(userData);
      const defaultProfile = {
        fullName: "",
        email: parsedProfile.email || "",
        phone: "",
        joinDate: new Date().toISOString(),
        dateOfBirth: "",
        bio: "",
        avatar: "/default-avatar.png",
        role: "User",
        ...parsedProfile,
      };
      setProfile(defaultProfile);
      setEditedProfile(defaultProfile);
      setAvatarPreview(defaultProfile.avatar);
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Chưa cập nhật";
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      setEditedProfile(profile);
      setAvatarPreview(profile.avatar);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setEditedProfile({
          ...editedProfile,
          avatar: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setProfile(editedProfile);
    const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    const updatedProfile = {
      ...currentUserData,
      ...editedProfile,
      id: currentUserData.id,
      username: currentUserData.username,
      email: currentUserData.email,
      role: currentUserData.role,
    };
    localStorage.setItem("userData", JSON.stringify(updatedProfile));
    setIsEditing(false);
    alert("Thông tin cá nhân đã được cập nhật thành công!");
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Thông tin cá nhân</h1>

      <div className={styles.profileCard}>
        <div className={styles.avatarContainer}>
          <img src={avatarPreview || "/default-avatar.png"} alt="Avatar" className={styles.avatar} />
          {isEditing && (
            <label htmlFor="avatar-upload" className={styles.editAvatar}>
              📷
              <input id="avatar-upload" type="file" accept="image/*" className={styles.hiddenInput} onChange={handleAvatarChange} />
            </label>
          )}
        </div>

        <div className={styles.profileInfo}>
          <div className={styles.formGroup}>
            <label>Họ và tên:</label>
            {isEditing ? (
              <input type="text" name="fullName" value={editedProfile.fullName} onChange={handleInputChange} className={styles.input} />
            ) : (
              <p>{profile.fullName}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Email:</label>
            <p>{profile.email}</p>
          </div>

          <div className={styles.formGroup}>
            <label>Số điện thoại:</label>
            {isEditing ? (
              <input type="tel" name="phone" value={editedProfile.phone} onChange={handleInputChange} className={styles.input} />
            ) : (
              <p>{profile.phone}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Ngày sinh:</label>
            {isEditing ? (
              <input type="date" name="dateOfBirth" value={editedProfile.dateOfBirth} onChange={handleInputChange} className={styles.input} />
            ) : (
              <p>{formatDate(profile.dateOfBirth)}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Giới thiệu:</label>
            {isEditing ? (
              <textarea name="bio" value={editedProfile.bio} onChange={handleInputChange} className={styles.textarea}></textarea>
            ) : (
              <p>{profile.bio}</p>
            )}
          </div>

          <div className={styles.buttonGroup}>
            {isEditing ? (
              <>
                <button className={styles.cancelButton} onClick={handleEditToggle}>
                  Hủy
                </button>
                <button className={styles.button} onClick={handleSave}>
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <>
                <button className={styles.cancelButton} onClick={() => navigate("/dashboard")}>
                  Quay lại
                </button>
                <button className={styles.button} onClick={handleEditToggle}>
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
