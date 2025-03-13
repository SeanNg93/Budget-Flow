import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, Typography, Card, CardContent, Grid, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const WalletList = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, [navigate]);

  const fetchWallets = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:8080/api/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWallets(response.data);
    } catch (error) {
      console.error("Lỗi tải danh sách ví:", error);
      alert("Không thể tải danh sách ví. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ví này không?")) return;

    try {
      const token = localStorage.getItem("userToken");
      await axios.delete(`http://localhost:8080/api/wallets/delete/${walletId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Xóa ví thành công!");
      fetchWallets(); // Refresh danh sách ví sau khi xóa
    } catch (error) {
      console.error("Lỗi khi xóa ví:", error);
      alert("Không thể xóa ví, vui lòng thử lại.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 🔹 Nút Quay lại Dashboard */}
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        Your Wallets
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => navigate("/create-wallet")}
        sx={{ mb: 2 }}
      >
        Create Wallet
      </Button>

      {loading ? (
        <Typography>Loading wallets...</Typography>
      ) : wallets.length === 0 ? (
        <Typography>No wallets found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {wallets.map((wallet) => (
            <Grid item xs={12} sm={6} md={4} key={wallet.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": { boxShadow: 6 },
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <AccountBalanceWalletIcon fontSize="large" />
                    <Typography variant="h6">{wallet.walletName}</Typography>
                  </Box>
                  <Typography color="textSecondary">Balance: {wallet.balance} {wallet.currency}</Typography>

                  {/* Nút Xóa Ví */}
                  <IconButton color="error" onClick={() => handleDeleteWallet(wallet.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default WalletList;
