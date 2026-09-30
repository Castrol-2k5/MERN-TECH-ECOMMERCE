import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    {
      productId: '65f0a0000000000000000001',
      productSkuId: '65f0b0000000000000000001',
      name: 'iPhone 16 Pro Max 256GB - Sa Mạc Tự Nhiên',
      sku: 'IP16PM-256-DESERT',
      price: 34990000,
      quantity: 1,
      hasSerial: true,
      serialsAssigned: ['SN-IP16-VN-9081'],
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
      availableSerials: ['SN-IP16-VN-9081', 'SN-IP16-VN-9082', 'SN-IP16-VN-9083']
    }
  ],
  customerInfo: {
    fullName: 'Trần Minh Khang',
    phone: '0912345678',
    address: 'Quận 1, TP.HCM'
  },
  discount: 500000,
  customerPaid: 35000000,
  paymentMethod: 'CASH', // CASH | VNPAY
  note: ''
};

export const posCartSlice = createSlice({
  name: 'posCart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const p = action.payload;
      const skuId = p.productSkuId || p.skuId || p._id;
      const existing = state.items.find((i) => i.productSkuId === skuId);

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
          availableSerials: p.availableSerials || []
        });
      }
    },
    addToPosCart: (state, action) => {
      posCartSlice.caseReducers.addItem(state, action);
    },
    updateQuantity: (state, action) => {
      const { productSkuId, quantity } = action.payload;
      const item = state.items.find((i) => i.productSkuId === productSkuId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.productSkuId !== productSkuId);
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
      const productSkuId = action.payload;
      state.items = state.items.filter((i) => i.productSkuId !== productSkuId);
    },
    removePosItem: (state, action) => {
      posCartSlice.caseReducers.removeItem(state, action);
    },
    assignSerials: (state, action) => {
      const { productSkuId, serials } = action.payload;
      const item = state.items.find((i) => i.productSkuId === productSkuId);
      if (item && Array.isArray(serials)) {
        item.serialsAssigned = serials;
      }
    },
    assignSerialToItem: (state, action) => {
      const { productSkuId, serialNumber } = action.payload;
      const item = state.items.find((i) => i.productSkuId === productSkuId);
      if (item && serialNumber && !item.serialsAssigned.includes(serialNumber)) {
        if (item.serialsAssigned.length < item.quantity) {
          item.serialsAssigned.push(serialNumber);
        }
      }
    },
    removeSerial: (state, action) => {
      const { productSkuId, serialNumber } = action.payload;
      const item = state.items.find((i) => i.productSkuId === productSkuId);
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
      state.discount = action.payload || 0;
    },
    setCustomerPaid: (state, action) => {
      state.customerPaid = action.payload || 0;
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
      state.customerInfo = { fullName: 'Khách vãng lai', phone: '' };
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
  const tax = Math.round((subtotal - discount) * 0.1);
  const total = Math.max(0, subtotal - discount + (tax > 0 ? tax : 0));
  const change = Math.max(0, customerPaid - total);

  return {
    subtotal,
    discount,
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
