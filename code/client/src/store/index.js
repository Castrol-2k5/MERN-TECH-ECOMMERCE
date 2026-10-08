import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import cartReducer from './slices/cartSlice.js';
import compareReducer from './slices/compareSlice.js';
import posCartReducer from './slices/posCartSlice.js';
import { injectStore } from '../services/axiosClient.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    compare: compareReducer,
    posCart: posCartReducer,
  },
});

injectStore(store);

export default store;
