import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, TextField, Typography, CircularProgress, Select, MenuItem } from "@mui/material";

export default function EditWallet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState({
        walletName: "",
        balance: "",
        currency: "VND",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("Wallet ID from URL:", id);  
    
        if (!id || id === "undefined") {
            setError("ID ví không hợp lệ! Vui lòng thử lại.");
            return;
        }
    
        const fetchWallet = async () => {
            try {
                const token = localStorage.getItem("userToken");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    navigate("/login");
                    return;
                }
    
                const response = await axios.get(`http://localhost:8080/api/wallets/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
    
                if (response.status === 200 && response.data) {
                    console.log("Fetched wallet:", response.data);  // 🛠️ Debug
                    setWallet(response.data);
                } else {
                    setError("Không thể tải thông tin ví.");
                }
            } catch (err) {
                console.error("Lỗi khi tải ví:", err);
                setError("Bạn không có quyền truy cập ví này.");
            }
        };
    
        fetchWallet();
    }, [id, navigate]);
    

    const handleChange = (e) => {
        setWallet({ ...wallet, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!wallet.walletName.trim()) {
            setError("Tên ví không được để trống.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("userToken");

            // 🔥 Kiểm tra nếu `id` tồn tại trước khi gửi request
            if (!id || id === "undefined") {
                throw new Error("ID ví không hợp lệ.");
            }

            const response = await axios.put(
                `http://localhost:8080/api/wallets/update/${id}`,
                {
                    walletName: wallet.walletName,
                    balance: wallet.balance,
                    currency: wallet.currency,
                    description: wallet.description,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.status === 200) {
                alert("Cập nhật ví thành công!");
                navigate("/dashboard");
            } else {
                throw new Error("Cập nhật ví thất bại.");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật ví:", error);
            if (error.response?.status === 403) {
                alert("Bạn không có quyền sửa ví này!");
            } else {
                setError("Không thể cập nhật ví, vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (walletId) => {
        navigate(`/wallets/edit/${walletId}`);
    };

    return (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 5, p: 3, border: "1px solid #ddd", borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h5" textAlign="center">Chỉnh sửa Ví</Typography>
            {error && <Typography color="error" textAlign="center">{error}</Typography>}

            <TextField
                fullWidth
                label="Tên ví"
                name="walletName"
                value={wallet.walletName}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth
                type="number"
                label="Số dư"
                name="balance"
                value={wallet.balance}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />

            <Select
                fullWidth
                name="currency"
                value={wallet.currency}
                onChange={handleChange}
                sx={{ mb: 2 }}
            >
                <MenuItem value="VND">VND</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
            </Select>

            <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={wallet.description}
                onChange={handleChange}
                multiline
                rows={3}
                sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="contained" color="secondary" onClick={() => navigate("/dashboard")}>
                    Hủy
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : "Lưu thay đổi"}
                </Button>
            </Box>
        </Box>
    );
}
