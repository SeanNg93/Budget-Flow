import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, TextField, Typography, CircularProgress, Select, MenuItem } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function EditWallet({ selectedWallet, handleEditWallet, handleDeleteWallet }) {
    const navigate = useNavigate();
    const { id } = useParams();
    const [wallet, setWallet] = useState({
        walletName: "",
        balance: "",
        currency: "VND",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchWallet = async () => {
            const token = localStorage.getItem("userToken");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await axios.get(`http://localhost:8080/api/wallets/${selectedWallet.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWallet(response.data);
            } catch (err) {
                setError("Không thể tải thông tin ví.");
            }
        };

        if (selectedWallet) {
            fetchWallet();
        }
    }, [selectedWallet, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setWallet((prevWallet) => ({
            ...prevWallet,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            await axios.put(`http://localhost:8080/api/wallets/update/${selectedWallet.id}`, {
                walletName: wallet.walletName,
                balance: wallet.balance,
                currency: wallet.currency,
                description: wallet.description,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            handleEditWallet(selectedWallet.id);
        } catch (error) {
            console.error("Lỗi cập nhật ví:", error);
            alert("Không thể cập nhật ví. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 5, p: 3, border: "1px solid #ddd", borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h5" fontWeight={700} mb={2}>
                Chỉnh sửa ví: {selectedWallet.walletName}
            </Typography>
            {error && <Typography color="error" textAlign="center">{error}</Typography>}
            
            <TextField fullWidth label="Tên ví" name="walletName" value={wallet.walletName} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth type="number" label="Số dư" name="balance" value={wallet.balance} onChange={handleChange} sx={{ mb: 2 }} />
            
            <Select fullWidth name="currency" value={wallet.currency} onChange={handleChange} sx={{ mb: 2 }}>
                <MenuItem value="VND">VND</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
            </Select>

            <TextField fullWidth label="Mô tả" name="description" value={wallet.description} onChange={handleChange} multiline rows={3} sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="contained" color="secondary" onClick={() => navigate("/wallets")}>Hủy</Button>
                <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : "Lưu thay đổi"}
                </Button>
            </Box>
        </Box>
    );
}
