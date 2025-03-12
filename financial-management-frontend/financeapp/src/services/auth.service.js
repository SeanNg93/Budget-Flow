import axiosInstance from "@/config/axiosInstance";

class AuthService {
    static async login(data) {
        const { username, password } = data;
        return await axiosInstance.post('/auth/login', { username, password });
    }

    static async getUserInfoGoogle(access_token) {
        const userInfo = await axiosInstance
            .get('https://www.googleapis.com/oauth2/v3/userinfo', {
                params: {
                    access_token: access_token,
                }
            })
        return userInfo.data;
    }
}

export default AuthService;