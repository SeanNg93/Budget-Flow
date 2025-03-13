import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, TextField, Typography, Select, MenuItem, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

const CreateWallet = ({ open, handleClose, onWalletCreated }) => {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateWallet = async () => {
    setLoading(true);
    setError("");

    let token = localStorage.getItem("userToken");

    if (!token) {
      alert("Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    try {
      // ✅ Gửi request tạo ví
      await axios.post(
        "http://localhost:8080/api/wallets/create",
        { walletName, balance, currency },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Wallet created successfully!");
      onWalletCreated(); // Gọi hàm callback khi tạo ví thành công
    } catch (error) {
      console.error("Error creating wallet:", error);

      // 🔴 Kiểm tra nếu lỗi là do Unauthorized (401)
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Đang thử làm mới token...");

        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              "http://localhost:8080/api/auth/refresh-token",
              { refreshToken }
            );

            // ✅ Cập nhật token mới
            localStorage.setItem("userToken", refreshResponse.data.accessToken);
            handleCreateWallet(); // Gửi lại request
            return;
          } catch (refreshError) {
            alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            localStorage.removeItem("userToken");
            localStorage.removeItem("refreshToken");
            navigate("/login");
          }
        } else {
          alert("Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
          localStorage.removeItem("userToken");
          navigate('/login');
        }
      } else if (error.response?.status === 403) {
        setError("Bạn không có quyền tạo ví.");
      } else {
        setError("Không thể tạo ví. Vui lòng kiểm tra lại dữ liệu.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo Ví Mới</DialogTitle>
      <DialogContent>
        {error && <Typography color="error">{error}</Typography>}

        <TextField
          fullWidth
          label="Tên Ví"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          sx={{ my: 2 }}
        />
        <TextField
          fullWidth
          type="number"
          label="Balance"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          sx={{ my: 2 }}
        />
        <Select fullWidth value={currency} onChange={(e) => setCurrency(e.target.value)} sx={{ my: 2 }}>
          <MenuItem value="VND">VND</MenuItem>
          <MenuItem value="USD">USD</MenuItem>
          <MenuItem value="EUR">EUR</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Hủy
        </Button>
        <Button variant="contained" color="primary" onClick={handleCreateWallet} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Tạo Ví"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateWallet;
