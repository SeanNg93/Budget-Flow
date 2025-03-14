import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, Button } from '@mui/material';

const WalletDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWalletDetails = async () => {
            try {
                const token = localStorage.getItem("userToken");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    navigate("/login");
                    return;
                }

                const response = await axios.get(`http://localhost:8080/api/wallets/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setWallet(response.data);
            } catch (error) {
                console.error("Lỗi tải thông tin ví:", error);
                setError("Không thể tải thông tin ví. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        fetchWalletDetails();
    }, [id, navigate]);

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4">{wallet.walletName}</Typography>
            <Typography variant="body1">Balance: {wallet.balance} {wallet.currency}</Typography>
            <Typography variant="body2">{wallet.description}</Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>Back to Wallets</Button>
        </Box>
    );
};

export default WalletDetails;
