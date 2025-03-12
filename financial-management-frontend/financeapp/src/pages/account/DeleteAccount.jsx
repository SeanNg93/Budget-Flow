import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Cập nhật đường dẫn import styles nếu cần
// import styles from '../../styles/delete-account.module.css';

export default function DeleteAccount() {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!password.trim()) {
            alert("Vui lòng nhập mật khẩu để xác nhận.");
            return;
        }

        const confirmed = window.confirm('Bạn có chắc chắn muốn xoá tài khoản? Hành động này sẽ không thể hoàn tác.');
        if (!confirmed) return;

        setIsLoading(true);
        try {
            // Lấy token từ localStorage và kiểm tra
            const token = localStorage.getItem('userToken');
            if (!token) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                navigate('/login');
                return;
            }

            console.log('Token being used:', token); // Debug log

            // Gọi API xoá tài khoản
            const response = await axios.delete('/api/user/delete-account', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                data: {
                    password: password
                }
            });

            console.log('Delete response:', response); // Debug log

            if (response.status === 200) {
                // Xoá thông tin đăng nhập
                localStorage.removeItem('userToken');
                localStorage.removeItem('user');
                
                // Thông báo thành công và chuyển hướng
                alert('Tài khoản đã được xoá thành công.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            
            // Xử lý các loại lỗi
            if (error.response) {
                // Lỗi từ server
                if (error.response.status === 401) {
                    alert('Mật khẩu không chính xác hoặc phiên đăng nhập đã hết hạn.');
                } else if (error.response.status === 403) {
                    alert('Bạn không có quyền thực hiện hành động này.');
                } else {
                    alert(`Lỗi: ${error.response.data.message || 'Không thể xoá tài khoản.'}`);
                }
            } else if (error.request) {
                // Không nhận được phản hồi từ server
                alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            } else {
                // Lỗi khác
                alert('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Xoá tài khoản
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Hành động này sẽ xoá vĩnh viễn tài khoản của bạn và tất cả dữ liệu liên quan.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Xác nhận mật khẩu
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {isLoading ? 'Đang xử lý...' : 'Xoá tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 