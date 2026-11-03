import { createSlice } from '@reduxjs/toolkit';

const getCleanSkuId = (id) => String(id?._id || id || '');

const initialState = {
  items: [],
  customerInfo: {
    fullName: '',
    phone: '',
    address: ''
  },
  discount: 0,
  customerPaid: 0,
  paymentMethod: 'CASH', // CASH | VNPAY
  note: ''
};

export const posCartSlice = createSlice({
  name: 'posCart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const p = action.payload;
      const skuId = getCleanSkuId(p.productSkuId || p.skuId || p._id);
      const existing = state.items.find((i) => getCleanSkuId(i.productSkuId) === skuId);

      if (existing) {
        existing.quantity += 1;
        if (p.serialNumber && !existing.serialsAssigned.includes(p.serialNumber)) {
          existing.serialsAssigned.push(p.serialNumber);
        }
      } else {
        state.items.push({
          productId: p.productId || p._id,
          productSkuId: skuId,
          name: p.name || p.productName,
          sku: p.sku || p.skuCode || 'SKU-GEN',
          price: p.price || 0,
          quantity: p.quantity || 1,
          hasSerial: Boolean(p.hasSerial),
          serialsAssigned: p.serialsAssigned || (p.serialNumber ? [p.serialNumber] : []),
          image: p.image || '',
          availableSerials: Array.isArray(p.availableSerials) ? p.availableSerials : []
        });
      }
    },
    addToPosCart: (state, action) => {
      posCartSlice.caseReducers.addItem(state, action);
    },
    updateQuantity: (state, action) => {
      const { productSkuId, quantity } = action.payload;
      const targetSkuId = getCleanSkuId(productSkuId);
      const item = state.items.find((i) => getCleanSkuId(i.productSkuId) === targetSkuId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => getCleanSkuId(i.productSkuId) !== targetSkuId);
        } else {
          item.quantity = quantity;
          if (item.serialsAssigned.length > quantity) {
            item.serialsAssigned = item.serialsAssigned.slice(0, quantity);
          }
        }
      }
    },
    updatePosItemQuantity: (state, action) => {
      posCartSlice.caseReducers.updateQuantity(state, action);
    },
    removeItem: (state, action) => {
      const targetSkuId = getCleanSkuId(action.payload);
      state.items = state.items.filter((i) => getCleanSkuId(i.productSkuId) !== targetSkuId);
    },
    removePosItem: (state, action) => {
      posCartSlice.caseReducers.removeItem(state, action);
    },
    assignSerials: (state, action) => {
      const { productSkuId, serials } = action.payload;
      const targetSkuId = getCleanSkuId(productSkuId);
      const item = state.items.find((i) => getCleanSkuId(i.productSkuId) === targetSkuId);
      if (item && Array.isArray(serials)) {
        item.serialsAssigned = serials;
      }
    },
    assignSerialToItem: (state, action) => {
      const { productSkuId, serialNumber } = action.payload;
      const targetSkuId = getCleanSkuId(productSkuId);
      const item = state.items.find((i) => getCleanSkuId(i.productSkuId) === targetSkuId);
      if (item && serialNumber && !item.serialsAssigned.includes(serialNumber)) {
        if (item.serialsAssigned.length < item.quantity) {
          item.serialsAssigned.push(serialNumber);
        }
      }
    },
    removeSerial: (state, action) => {
      const { productSkuId, serialNumber } = action.payload;
      const targetSkuId = getCleanSkuId(productSkuId);
      const item = state.items.find((i) => getCleanSkuId(i.productSkuId) === targetSkuId);
      if (item) {
        item.serialsAssigned = item.serialsAssigned.filter((s) => s !== serialNumber);
      }
    },
    removeSerialFromItem: (state, action) => {
      posCartSlice.caseReducers.removeSerial(state, action);
    },
    setCustomerInfo: (state, action) => {
      state.customerInfo = { ...state.customerInfo, ...action.payload };
    },
    setDiscount: (state, action) => {
      const subtotal = state.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const raw = Math.max(0, Number(action.payload) || 0);
      state.discount = subtotal > 0 ? Math.min(subtotal, raw) : raw;
    },
    setCustomerPaid: (state, action) => {
      state.customerPaid = Math.max(0, Number(action.payload) || 0);
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setNote: (state, action) => {
      state.note = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.discount = 0;
      state.customerPaid = 0;
      state.customerInfo = { fullName: '', phone: '', address: '' };
      state.note = '';
      state.paymentMethod = 'CASH';
    },
    resetPosCart: (state) => {
      posCartSlice.caseReducers.clearCart(state);
    }
  }
});

export const {
  addItem,
  addToPosCart,
  updateQuantity,
  updatePosItemQuantity,
  removeItem,
  removePosItem,
  assignSerials,
  assignSerialToItem,
  removeSerial,
  removeSerialFromItem,
  setCustomerInfo,
  setDiscount,
  setCustomerPaid,
  setPaymentMethod,
  setNote,
  clearCart,
  resetPosCart
} = posCartSlice.actions;

// Selectors
export const selectPosCart = (state) => state.posCart;

export const selectPosCartTotals = (state) => {
  const { items, discount, customerPaid } = state.posCart;
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const effectiveDiscount = Math.min(subtotal, Math.max(0, discount || 0));
  const tax = Math.round((subtotal - effectiveDiscount) * 0.1);
  const total = Math.max(0, subtotal - effectiveDiscount + (tax > 0 ? tax : 0));
  const change = customerPaid > 0 ? customerPaid - total : 0;

  return {
    subtotal,
    discount: effectiveDiscount,
    tax,
    total,
    customerPaid,
    change
  };
};

export const selectMissingSerialsCount = (state) => {
  return state.posCart.items.reduce((count, item) => {
    if (item.hasSerial) {
      const assigned = item.serialsAssigned?.length || 0;
      if (assigned < item.quantity) {
        return count + (item.quantity - assigned);
      }
    }
    return count;
  }, 0);
};

export default posCartSlice.reducer;
