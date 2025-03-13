import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, CircularProgress, TextField, Typography, Alert } from '@mui/material';

export default function DeleteAccount() {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();


    localStorage.removeItem('token');

    const handleDelete = async () => {
        if (!password.trim()) {
            alert("Vui lòng nhập mật khẩu để xác nhận.");
            return;
        }
    
        const confirmed = window.confirm('Bạn có chắc chắn muốn xoá tài khoản? Hành động này sẽ không thể hoàn tác.');
        if (!confirmed) return;
    
        setIsLoading(true);
        try {
            // Lấy token từ localStorage
            const token = localStorage.getItem('userToken');
            if (!token) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                navigate('/login');
                return;
            }
    
            console.log('Token being used:', token); // Debug token
    
            // Gọi API xóa tài khoản
            const response = await axios.delete(`http://localhost:8080/api/user/delete-account?password=${password}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    password: password // Chuyển password vào body thay vì query string
                }
            });
    
            console.log('Delete response:', response); // Debug response
    
            if (response.status === 200) {
                localStorage.removeItem('userToken');
                localStorage.removeItem('user');
                alert('Tài khoản đã được xoá thành công.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
    
            if (error.response) {
                if (error.response.status === 401) {
                    alert('Mật khẩu không chính xác hoặc phiên đăng nhập đã hết hạn.');
                } else if (error.response.status === 403) {
                    alert('Bạn không có quyền thực hiện hành động này.');
                } else {
                    alert(`Lỗi: ${error.response.data.message || 'Không thể xoá tài khoản.'}`);
                }
            } else if (error.request) {
                alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            } else {
                alert('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10, p: 3, border: '1px solid #ddd', borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h5" fontWeight="bold" textAlign="center">
                Xoá tài khoản
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1, mb: 2 }}>
                Hành động này sẽ xoá vĩnh viễn tài khoản của bạn và tất cả dữ liệu liên quan.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
                fullWidth
                type="password"
                label="Xác nhận mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={isLoading}
                    startIcon={isLoading && <CircularProgress size={20} />}
                >
                    {isLoading ? 'Đang xử lý...' : 'Xoá tài khoản'}
                </Button>
            </Box>
        </Box>
    );
}
