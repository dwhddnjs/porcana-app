import axios from 'axios';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const api = axios.create({
  baseURL: envUrl ? `${envUrl}/api/v1/` : 'http://localhost:3000/app/v1/',
});
