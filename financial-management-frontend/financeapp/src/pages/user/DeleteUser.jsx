import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DeleteUser() {
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (storedToken) {
      setToken(storedToken);
      setCurrentUser(storedUser);
      setRole(storedRole);

      if (storedRole === "ADMIN") {
        fetchUsers(storedToken);
      }
    }
    setLoading(false);
  }, []);

  const fetchUsers = async (token) => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const deleteUser = async (username) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Cập nhật danh sách người dùng sau khi xóa
        setUsers(users.filter((user) => user.username !== username));
        alert(`Đã xóa người dùng ${username} thành công!`);
      } else {
        const errorData = await response.json();
        alert(`Lỗi: ${errorData.message || "Không thể xóa người dùng"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Đã xảy ra lỗi khi xóa người dùng");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Lỗi!</strong>
          <span className="block sm:inline">
            {" "}
            Bạn không có quyền truy cập trang này.
          </span>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý người dùng</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Danh sách người dùng</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Không có người dùng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.username}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.active ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.username !== currentUser && (
                        <button
                          onClick={() => deleteUser(user.username)}
                          className="text-red-600 hover:text-red-900"
                          disabled={user.role === "ADMIN"}
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Quay lại Dashboard
        </button>
      </div>
    </div>
  );
} 