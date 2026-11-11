import axiosClient from '../../../services/axiosClient.js';

const toSyncPayload = (items = [], branchId = undefined) => {
  const cleanItems = (items || [])
    .filter((i) => i?.productId && i?.productSkuId)
    .map((i) => ({
      productId: String(i.productId),
      productSkuId: String(i.productSkuId),
      quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
    }));

  const payload = { items: cleanItems };
  if (branchId !== undefined) {
    payload.branchId = branchId || null;
  }
  return payload;
};

export const cartService = {
  getMyCart: async (branchId = null) => {
    const res = await axiosClient.get('/cart', {
      params: branchId ? { branchId } : {},
    });
    return res?.data?.cart || null;
  },

  mergeCart: async (items = [], branchId = undefined) => {
    const res = await axiosClient.post('/cart/merge', toSyncPayload(items, branchId));
    return res?.data?.cart || null;
  },

  syncCart: async (items = [], branchId = undefined) => {
    const res = await axiosClient.put('/cart', toSyncPayload(items, branchId));
    return res?.data?.cart || null;
  },

  previewCart: async (items = [], branchId = null) => {
    const res = await axiosClient.post('/cart/preview', toSyncPayload(items, branchId));
    return res?.data?.cart || null;
  },
};
