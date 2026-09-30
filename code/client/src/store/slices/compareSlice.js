import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  highlightDifferences: false,
};

export const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      if (state.products.length >= 4) return;
      const exists = state.products.some((p) => p._id === product._id || p.id === product.id);
      if (!exists) {
        state.products.push(product);
      }
    },
    removeFromCompare: (state, action) => {
      const id = action.payload;
      state.products = state.products.filter((p) => (p._id || p.id) !== id);
    },
    setCompareProducts: (state, action) => {
      state.products = action.payload.slice(0, 4);
    },
    toggleHighlightDifferences: (state) => {
      state.highlightDifferences = !state.highlightDifferences;
    },
    setHighlightDifferences: (state, action) => {
      state.highlightDifferences = action.payload;
    },
    clearCompare: (state) => {
      state.products = [];
    },
  },
});

export const {
  addToCompare,
  removeFromCompare,
  setCompareProducts,
  toggleHighlightDifferences,
  setHighlightDifferences,
  clearCompare,
} = compareSlice.actions;

export default compareSlice.reducer;
