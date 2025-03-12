import axiosInstance from "@/config/axiosInstance";

class AuthService {
    static async login(data) {
        try {
            const { username, password } = data;
            
            // Make sure we're calling the correct endpoint with the correct data format
            const response = await axiosInstance.post('/auth/login', { 
                username, 
                password 
            });
            
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async getUserInfoGoogle(access_token) {
        try {
            const userInfo = await axiosInstance
                .get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    params: {
                        access_token: access_token,
                    }
                });
            return userInfo.data;
        } catch (error) {
            throw error;
        }
    }

    static async getCurrentUser() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    }

    static async logout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
    }

    static isAuthenticated() {
        return localStorage.getItem('userToken') !== null;
    }
}

export default AuthService;