import apiClient from '../../../services/api';

const normalizeBranchStock = (item) => {
  if (!item) return null;
  const b = item.branch || {};
  const qty = Number(item.quantity !== undefined ? item.quantity : 0);

  let badgeVariant = 'success';
  let statusLabel = `Còn ${qty} máy`;

  if (qty <= 0) {
    badgeVariant = 'danger';
    statusLabel = 'Hết hàng';
  } else if (qty <= 2) {
    badgeVariant = 'warning';
    statusLabel = `Còn ${qty} máy`;
  }

  return {
    branchId: b._id || b.id || item.branchId,
    branchName: b.name || b.branchName || 'TechOne Chi nhánh',
    isHeadquarter: Boolean(b.isHeadquarter || b.branchCode === 'BR-HQ'),
    address: b.address || '',
    phone: b.phone || '',
    location: b.location || item.location || null,
    quantity: qty,
    status: qty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
    statusLabel,
    badgeVariant,
  };
};

const normalizeBranchInventoryItem = (inv) => {
  if (!inv) return null;
  const prod = inv.productId || {};
  const skus = Array.isArray(prod.skus) ? prod.skus : [];
  const sku = skus.find((s) => String(s._id) === String(inv.productSkuId)) || skus[0] || {};
  const qty = Number(inv.quantity || 0);

  const rawSerials = Array.isArray(inv.serials)
    ? inv.serials.map((s) => ({
        ...s,
        importDate: s.importDate || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '—')
      }))
    : [];

  return {
    _id: inv._id,
    branchId: inv.branchId?._id || inv.branchId,
    productId: prod._id || inv.productId,
    productSkuId: inv.productSkuId,
    sku: sku.sku || sku.code || 'SKU-GEN',
    barcode: sku.sku || sku.code || '8938500000000',
    productName: prod.name || 'Sản phẩm công nghệ',
    category:
      typeof prod.categoryId === 'object'
        ? prod.categoryId?.name || 'Thiết bị'
        : prod.category || 'Thiết bị',
    shelfLocation: inv.shelfLocation || 'Kệ A-01',
    quantityPhysical: qty,
    quantityReserved: 0,
    quantityAvailable: qty,
    lowStockThreshold: 3,
    unitPrice: sku.salePrice || sku.price || 0,
    hasSerial: prod.isSerialManaged !== undefined ? prod.isSerialManaged : true,
    serials: rawSerials,
  };
};

export const inventoryService = {
  getBranchesWithSkuStock: async (skuId) => {
    if (!skuId || !/^[0-9a-fA-F]{24}$/.test(String(skuId))) {
      return [];
    }

    try {
      const response = await apiClient.get(`/inventory/sku/${skuId}`);
      const rawList =
        response?.data?.availableBranches ||
        response?.availableBranches ||
        (Array.isArray(response?.data) ? response.data : []);

      if (Array.isArray(rawList)) {
        return rawList.map(normalizeBranchStock).filter(Boolean);
      }
      return [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`[inventoryService.getBranchesWithSkuStock] Lỗi tải tồn kho SKU ${skuId}:`, err);
      }
      return [];
    }
  },

  getBranchInventory: async (
    branchId,
    { search = '', category = '', status = '' } = {}
  ) => {
    if (!branchId) return [];

    try {
      const res = await apiClient.get(`/inventory/branch/${branchId}`);
      const rawInventories = res?.data?.inventories || res?.inventories || [];
      let items = rawInventories.map(normalizeBranchInventoryItem).filter(Boolean);

      if (search) {
        const q = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.shelfLocation.toLowerCase().includes(q)
        );
      }
      if (category && category !== 'TẤT CẢ') {
        items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
      }
      if (status) {
        if (status === 'OUT_OF_STOCK') items = items.filter((i) => i.quantityAvailable <= 0);
        else if (status === 'LOW_STOCK')
          items = items.filter(
            (i) => i.quantityAvailable > 0 && i.quantityAvailable <= i.lowStockThreshold
          );
        else if (status === 'IN_STOCK')
          items = items.filter((i) => i.quantityAvailable > i.lowStockThreshold);
      }
      return items;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`[inventoryService.getBranchInventory] Lỗi tải tồn kho chi nhánh ${branchId}:`, err);
      }
      throw err;
    }
  },

  getStocktakes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/inventory/stocktakes${query ? `?${query}` : ''}`);
    return res?.data?.stocktakes || [];
  },

  createStocktake: async (payload = {}) => {
    const res = await apiClient.post('/inventory/stocktakes', payload);
    return res?.data?.stocktake || null;
  },

  getStocktakeDetail: async (id) => {
    const res = await apiClient.get(`/inventory/stocktakes/${id}`);
    return res?.data?.stocktake || null;
  },

  scanStocktakeSerials: async (id, payload) => {
    const res = await apiClient.post(`/inventory/stocktakes/${id}/scan`, payload);
    return res?.data || null;
  },

  completeStocktake: async (id, payload = {}) => {
    const res = await apiClient.patch(`/inventory/stocktakes/${id}/complete`, payload);
    return res?.data?.stocktake || null;
  },

  getTransferRequests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/inventory/transfer-requests${query ? `?${query}` : ''}`);
    return res?.data?.requests || [];
  },

  createTransferRequest: async (payload) => {
    const res = await apiClient.post('/inventory/transfer-requests', payload);
    return res?.data?.request || null;
  },

  approveTransferRequest: async (id, payload = {}) => {
    const res = await apiClient.patch(`/inventory/transfer-requests/${id}/approve`, payload);
    return res?.data || null;
  },

  rejectTransferRequest: async (id, payload = {}) => {
    const res = await apiClient.patch(`/inventory/transfer-requests/${id}/reject`, payload);
    return res?.data?.request || null;
  },

  getDefectiveSerials: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/inventory/rma-outbound/defective-serials${query ? `?${query}` : ''}`);
    return res?.data?.serials || [];
  },

  getRmaOutbounds: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await apiClient.get(`/inventory/rma-outbound${query ? `?${query}` : ''}`);
    return res?.data?.rmaOutbounds || [];
  },

  createRmaOutbound: async (payload) => {
    const res = await apiClient.post('/inventory/rma-outbound', payload);
    return res?.data?.rmaOutbound || null;
  },

  adjustStock: async (payload) => {
    const res = await apiClient.post('/inventory/adjust', payload);
    return res?.data || res;
  },

  bulkImport: async (payload) => {
    const res = await apiClient.post('/inventory/bulk-import', payload);
    return res?.data || res;
  },

  getSerials: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.productSkuId) query.append('productSkuId', params.productSkuId);
      if (params.branchId) query.append('branchId', params.branchId);
      if (params.status) query.append('status', params.status);
      if (params.search) query.append('search', params.search);

      const res = await apiClient.get(`/serials?${query.toString()}`);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res?.data?.serials || res?.serials || [];
      return list.map((s) => ({
        ...s,
        importDate: s.importDate || (s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '—')
      }));
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[inventoryService.getSerials] Lỗi tải serials:', err);
      }
      return [];
    }
  },
};

export default inventoryService;
