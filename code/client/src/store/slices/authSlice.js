import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = Boolean(accessToken);
    },
    updateAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
