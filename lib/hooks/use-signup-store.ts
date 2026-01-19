import { create } from 'zustand';

interface SignupState {
  nickname: string;
  email: string;
  password: string;
  setNickname: (nickname: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  reset: () => void;
}

const initialState = {
  nickname: '',
  email: '',
  password: '',
};

export const useSignupStore = create<SignupState>((set) => ({
  ...initialState,
  setNickname: (nickname) => set({ nickname }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  reset: () => set(initialState),
}));
