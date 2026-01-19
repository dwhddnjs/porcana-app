import { api } from ".";

type SignupRequestTypes = {
    nickname: string;
    email: string;
    password: string;
}

type SignupResponseTypes = {
    accessToken: string;
    refreshToken: string;
}

export const signup = async ({ nickname, email, password }: SignupRequestTypes): Promise<SignupResponseTypes> => {
    try {
        // 디버깅용 - 문제 해결 후 삭제
        console.log("Signup request to:", api.defaults.baseURL + "auth/signup");
        
        const response = await api.post('/auth/signup', {
            nickname,
            email,
            password,
        });
        
        // TODO: 실제 API 연동 시 아래 mock 데이터 제거
        return response.data;
    } catch (error: any) {
        // 더 자세한 에러 정보 출력
        console.error("Signup Error Details:", {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
        });
        throw error;
    }
}