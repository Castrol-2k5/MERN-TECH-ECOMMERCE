import { createSlice } from '@reduxjs/toolkit';

const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem('techone_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items) => {
  try {
    localStorage.setItem('techone_cart', JSON.stringify(items));
  } catch {
    // ignore
  }
};

const initialItems = loadCartFromStorage();

const initialState = {
  items: initialItems,
  totalQuantity: initialItems.reduce((sum, item) => sum + item.quantity, 0),
  totalAmount: initialItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find(
        (item) => item.productSkuId === newItem.productSkuId
      );

      if (!existingItem) {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1,
        });
      } else {
        existingItem.quantity += newItem.quantity || 1;
      }

      state.totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      saveCartToStorage(state.items);
    },
    removeFromCart: (state, action) => {
      const productSkuId = action.payload;
      state.items = state.items.filter((item) => item.productSkuId !== productSkuId);
      state.totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      saveCartToStorage(state.items);
    },
    updateQuantity: (state, action) => {
      const { productSkuId, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.productSkuId === productSkuId);
      if (existingItem) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.productSkuId !== productSkuId);
        } else {
          existingItem.quantity = quantity;
        }
      }
      state.totalQuantity = state.items.reduce((sum, i) => sum + i.quantity, 0);
      state.totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      saveCartToStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      saveCartToStorage([]);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
