import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Wallets = () => {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWallets = async () => {
            try {
                const token = localStorage.getItem("userToken");
    
                // 🔴 Kiểm tra nếu không có token, chuyển hướng login
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
    
                // 🔴 Nếu lỗi 401, yêu cầu đăng nhập lại
                if (error.response?.status === 401) {
                    alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                    localStorage.removeItem("userToken");
                    navigate("/login");
                } else {
                    alert("Không thể tải danh sách ví. Vui lòng thử lại.");
                }
            } finally {
                setLoading(false);
            }
        };
    
        fetchWallets();
    }, [navigate]);
    
    const handleWalletClick = (walletId) => {
        navigate(`/wallets/details/${walletId}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} /> My Wallets
            </Typography>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && (
                <>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/wallets/new')}
                        sx={{ mb: 2 }}
                    >
                        Add New Wallet
                    </Button>

                    <Grid container spacing={2}>
                        {wallets.length === 0 ? (
                            <Typography>No wallets found.</Typography>
                        ) : (
                            wallets.map((wallet) => (
                                <Grid item xs={12} sm={6} md={4} key={wallet.id}>
                                    <Card
                                        sx={{ boxShadow: 3, cursor: 'pointer' }}
                                        onClick={() => handleWalletClick(wallet.id)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6">{wallet.walletName}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {wallet.currency}: {wallet.balance.toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2">{wallet.description}</Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/wallets/edit/${wallet.id}`);
                                                }}
                                                sx={{ mt: 1 }}
                                            >
                                                Edit Wallet
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default Wallets;
