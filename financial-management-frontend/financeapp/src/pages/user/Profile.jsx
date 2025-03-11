import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Cập nhật đường dẫn import styles nếu cần
// import styles from "../../styles/Profile.module.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra localStorage có dữ liệu không
    const storedProfile = localStorage.getItem("profile");
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      setEditedProfile(parsedProfile);
      setAvatarPreview(parsedProfile.avatar);
    } else {
      // Nếu không có, lấy từ JSON file mặc định
      fetch("/profile.json")
        .then((res) => res.json())
        .then((data) => {
          setProfile(data);
          setEditedProfile(data);
          setAvatarPreview(data.avatar);
          localStorage.setItem("profile", JSON.stringify(data)); // Lưu vào localStorage
        })
        .catch((error) => console.error("Lỗi tải dữ liệu:", error));
    }
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset lại dữ liệu đã chỉnh sửa nếu hủy chỉnh sửa
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
    // Cập nhật profile
    setProfile(editedProfile);
    // Lưu vào localStorage
    localStorage.setItem("profile", JSON.stringify(editedProfile));
    // Tắt chế độ chỉnh sửa
    setIsEditing(false);
    // Hiển thị thông báo thành công
    alert("Thông tin cá nhân đã được cập nhật!");
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Thông tin cá nhân</h1>

      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <img
                src={avatarPreview || "/default-avatar.png"}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full border-4 border-indigo-100"
              />
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            <h2 className="text-xl font-semibold">{profile.fullName}</h2>
            <p className="text-gray-600">{profile.role}</p>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={editedProfile.fullName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-800">{profile.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <p className="text-gray-800">{profile.email}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editedProfile.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-800">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Ngày tham gia
                </label>
                <p className="text-gray-800">{profile.joinDate}</p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-1">
                Giới thiệu
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editedProfile.bio}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-24"
                ></textarea>
              ) : (
                <p className="text-gray-800">{profile.bio}</p>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Lưu thay đổi
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Chỉnh sửa
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 