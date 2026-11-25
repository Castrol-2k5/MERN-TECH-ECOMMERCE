import apiClient from '../../../services/api';

export const posService = {
  // Quét barcode (có thể là Serial/IMEI cụ thể hoặc mã SKU sản phẩm)
  scanBarcode: async (barcode, branchId = '') => {
    const clean = String(barcode).trim();

    try {
      const res = await apiClient.get(`/serials/scan/${encodeURIComponent(clean)}`);
      const data = res?.data || res;

      if (data && data.serialNumber) {
        const sku = data.sku || {};
        const prod = data.product || {};
        return {
          type: 'SERIAL',
          serialNumber: data.serialNumber,
          product: {
            _id: prod._id,
            name: prod.name,
            sku: sku.sku || 'SKU-GEN',
            productSkuId: sku._id,
            price: sku.salePrice || sku.price || 0,
            hasSerial: true,
            image: sku.images?.[0] || prod.images?.[0] || '',
            availableSerials: [data.serialNumber]
          }
        };
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        const branchCatalog = await posService.searchProducts({ keyword: clean, branchId });
        const lowerClean = clean.toLowerCase();
        const matchedSku = branchCatalog.find(
          (p) =>
            p.sku?.toLowerCase() === lowerClean ||
            p.barcode?.toLowerCase() === lowerClean
        );
        if (matchedSku) {
          return {
            type: 'SKU',
            barcode: matchedSku.barcode,
            product: {
              _id: matchedSku._id,
              name: matchedSku.name,
              sku: matchedSku.sku,
              productSkuId: matchedSku.skuId,
              price: matchedSku.price,
              hasSerial: matchedSku.hasSerial,
              image: matchedSku.image,
              availableSerials: matchedSku.availableSerials || []
            }
          };
        }
      }

      if (import.meta.env.DEV) {
        console.error(`[posService.scanBarcode] Không tìm thấy serial/barcode "${clean}":`, err);
      }
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          `Không tìm thấy sản phẩm hay serial khả dụng khớp với mã [${clean}]`,
        { cause: err }
      );
    }

    throw new Error(`Không tìm thấy sản phẩm hay serial khớp với mã [${clean}]`);
  },

  // Tìm kiếm sản phẩm POS theo từ khóa / danh mục và tồn kho thực tế tại chi nhánh (branchId)
  searchProducts: async ({ keyword = '', category = '', branchId = '' } = {}) => {
    try {
      if (branchId) {
        const invRes = await apiClient.get(`/inventory/branch/${branchId}`);
        const rawInventories =
          invRes?.data?.inventories || (Array.isArray(invRes?.data) ? invRes.data : []);

        let mapped = rawInventories
          .filter((inv) => inv.productId && inv.productId.isActive !== false)
          .map((inv) => {
            const p = inv.productId || {};
            const skus = Array.isArray(p.skus) ? p.skus : [];
            const matchedSku =
              skus.find((s) => String(s._id) === String(inv.productSkuId)) || skus[0] || {};
            const inStockSerials = Array.isArray(inv.serials)
              ? inv.serials
                  .filter((s) => s.status === 'IN_STOCK')
                  .map((s) => s.serialNumber)
              : [];
            const hasSerial =
              p.isSerialManaged !== undefined
                ? p.isSerialManaged
                : matchedSku.inventoryTracking !== undefined
                ? matchedSku.inventoryTracking
                : true;
            const optionLabel = Array.isArray(matchedSku.optionValues)
              ? matchedSku.optionValues.map((ov) => ov.value).join(' / ')
              : '';

            return {
              _id: p._id,
              skuId: matchedSku._id || inv.productSkuId,
              sku: matchedSku.sku || matchedSku.code || 'SKU-GEN',
              barcode: matchedSku.sku || matchedSku.code || '8938500000000',
              name: optionLabel ? `${p.name} (${optionLabel})` : p.name,
              price: matchedSku.salePrice || matchedSku.price || p.price || 0,
              costPrice: Math.round((matchedSku.price || 0) * 0.85),
              stock: Number(inv.quantity ?? 0),
              hasSerial,
              category:
                typeof p.categoryId === 'object'
                  ? p.categoryId?.name || 'Thiết bị'
                  : p.category || 'Thiết bị',
              brand: p.brand || '',
              attributes: Array.isArray(p.attributes) ? p.attributes : [],
              description: p.description || '',
              categorySlug: typeof p.categoryId === 'object' ? p.categoryId?.slug || '' : '',
              image: matchedSku.images?.[0] || p.images?.[0] || '',
              availableSerials: inStockSerials
            };
          });

        if (category && category !== 'TẤT CẢ') {
          const catLower = category.toLowerCase();
          mapped = mapped.filter((item) => item.category?.toLowerCase().includes(catLower));
        }
        if (keyword && keyword.trim()) {
          const q = keyword.trim().toLowerCase();
          mapped = mapped.filter(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.sku?.toLowerCase().includes(q) ||
              item.barcode?.toLowerCase().includes(q) ||
              item.availableSerials?.some((sn) => sn.toLowerCase().includes(q))
          );
        }

        return mapped;
      }

      const params = {};
      if (keyword) params.search = keyword;
      if (category && category !== 'TẤT CẢ') params.category = category;
      const res = await apiClient.get('/products', { params });
      const rawProducts = res?.data?.products || (Array.isArray(res?.data) ? res.data : []);

      if (Array.isArray(rawProducts)) {
        return rawProducts.map((p) => {
          const skus = Array.isArray(p.skus) ? p.skus : [];
          const primarySku = skus[0] || {};
          return {
            _id: p._id,
            skuId: primarySku._id || p._id,
            sku: primarySku.sku || primarySku.code || 'SKU-GEN',
            barcode: primarySku.sku || primarySku.code || '8938500000000',
            name: p.name,
            price: primarySku.salePrice || primarySku.price || p.price || 0,
            costPrice: Math.round((primarySku.price || 0) * 0.85),
            stock: 0,
            hasSerial: p.isSerialManaged !== undefined ? p.isSerialManaged : true,
            category: typeof p.categoryId === 'object' ? p.categoryId?.name : p.category || 'Thiết bị',
            brand: p.brand || '',
            image: p.images?.[0] || '',
            availableSerials: []
          };
        });
      }
      return [];
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[posService.searchProducts] Lỗi tải sản phẩm POS từ API:', err);
      }
      return [];
    }
  },

  // Thanh toán POS checkout
  checkoutPos: async (payload) => {
    try {
      const res = await apiClient.post('/orders/pos/checkout', payload);
      const order = res?.data?.order || res?.data || res;
      return order;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[posService.checkoutPos] Lỗi thanh toán POS:', err);
      }
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.error?.message ||
          err.message ||
          'Thanh toán POS thất bại!',
        { cause: err }
      );
    }
  },

  // Tra cứu nhanh CRM khách hàng qua SĐT tại quầy POS (UC-POS-12)
  lookupCustomerByPhone: async (phone) => {
    const cleanPhone = String(phone || '').trim();
    const res = await apiClient.get('/users/lookup-customer', {
      params: { phone: cleanPhone }
    });
    return res?.data || { found: false };
  }
};

export default posService;
