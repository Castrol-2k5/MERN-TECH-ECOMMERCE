import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addItem, 
  removeItem, 
  updateQuantity, 
  assignSerials, 
  removeSerial, 
  clearCart, 
  setDiscount, 
  setCustomerPaid, 
  setPaymentMethod, 
  setCustomerInfo,
  selectPosCart,
  selectPosCartTotals,
  selectMissingSerialsCount
} from '../../store/slices/posCartSlice';
import usePosAudio from '../../features/pos/hooks/usePosAudio';
import useBarcodeScanner from '../../features/pos/hooks/useBarcodeScanner';
import posService from '../../features/pos/services/posService';

import PosHeader from '../../features/pos/components/PosHeader';
import PosBarcodeBar from '../../features/pos/components/PosBarcodeBar';
import PosProductCatalog from '../../features/pos/components/PosProductCatalog';
import PosCartTable from '../../features/pos/components/PosCartTable';
import PosCheckoutPanel from '../../features/pos/components/PosCheckoutPanel';
import SerialAssignmentModal from '../../features/pos/components/SerialAssignmentModal';
import InvoiceK80Modal from '../../features/pos/components/InvoiceK80Modal';
import { toPosCheckoutPayload } from '../../features/orders/services/orderAdapter';

export const PosPage = () => {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);
  const cart = useSelector(selectPosCart);
  const totals = useSelector(selectPosCartTotals);
  const missingSerialCount = useSelector(selectMissingSerialsCount);

  const { playSuccessBeep, playErrorBeep } = usePosAudio();

  // Local state
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('TẤT CẢ');
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanNotification, setScanNotification] = useState(null);

  useEffect(() => {
    let ignore = false;
    posService.searchProducts().then((data) => {
      if (!ignore && Array.isArray(data)) {
        setProducts(data);
      }
    }).catch(() => {
      if (!ignore) setProducts([]);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Modals state
  const [activeSerialModalItem, setActiveSerialModalItem] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Refs for hotkeys
  const barcodeInputRef = useRef(null);
  const customerInputRef = useRef(null);
  const discountInputRef = useRef(null);

  // Search products when category changes
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setIsSearching(true);
    try {
      const data = await posService.searchProducts({ category });
      setProducts(data);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFilter = async (keyword) => {
    setIsSearching(true);
    try {
      const data = await posService.searchProducts({ keyword, category: selectedCategory });
      setProducts(data);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  // Handle barcode scanned from camera, hardware barcode scanner, or manual search submit
  const handleBarcodeScan = useCallback(async (barcode) => {
    setIsScanning(true);
    try {
      const result = await posService.scanBarcode(barcode);
      playSuccessBeep();

      if (result.type === 'SERIAL') {
        // Quét đúng mã Serial/IMEI của máy
        dispatch(addItem(result.product));
        dispatch(assignSerials({
          productSkuId: result.product.productSkuId,
          serials: [result.serialNumber]
        }));
        setScanNotification({
          type: 'success',
          message: `Đã thêm & gán mã Serial [${result.serialNumber}] cho sản phẩm ${result.product.name}`
        });
      } else {
        // Quét mã vạch sản phẩm / SKU Barcode
        dispatch(addItem(result.product));
        setScanNotification({
          type: 'success',
          message: `Đã thêm sản phẩm [${result.product.name}] vào giỏ`
        });
      }
    } catch (err) {
      playErrorBeep();
      setScanNotification({
        type: 'error',
        message: err.message || `Mã vạch [${barcode}] không hợp lệ!`
      });
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanNotification(null), 4000);
      barcodeInputRef.current?.focus();
    }
  }, [dispatch, playErrorBeep, playSuccessBeep]);

  // Handle clicking product in catalog
  const handleSelectProduct = (product) => {
    dispatch(addItem({
      _id: product._id,
      productSkuId: product.skuId,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      hasSerial: product.hasSerial,
      availableSerials: product.availableSerials || []
    }));
    playSuccessBeep();
  };

  // Perform POS Checkout
  const handleCheckout = async () => {
    if (cart.items.length === 0 || missingSerialCount > 0) return;

    setIsCheckingOut(true);
    try {
      const payload = toPosCheckoutPayload(cart, authUser?.branchId);

      const res = await posService.checkoutPos(payload);
      playSuccessBeep();

      setCompletedOrder({
        orderCode: res?.orderCode || res?.data?.orderCode,
        createdAt: res?.createdAt || res?.data?.createdAt || new Date().toISOString(),
        items: cart.items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        customerPaid: totals.customerPaid,
        change: totals.change,
        paymentMethod: cart.paymentMethod,
        customerInfo: cart.customerInfo
      });
    } catch (err) {
      playErrorBeep();
      setScanNotification({
        type: 'error',
        message: err.message || 'Thanh toán đơn hàng thất bại!'
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Reset to create new order
  const handleNewOrder = () => {
    dispatch(clearCart());
    setCompletedOrder(null);
    barcodeInputRef.current?.focus();
  };

  // Register hotkeys with useBarcodeScanner hook
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    onF2: () => barcodeInputRef.current?.focus(),
    onF4: () => customerInputRef.current?.click(),
    onF8: () => discountInputRef.current?.focus(),
    onF9: handleCheckout,
    onEscape: () => {
      setActiveSerialModalItem(null);
      if (completedOrder) handleNewOrder();
    }
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans select-none text-slate-100">
      {/* Top POS Header */}
      <PosHeader activeCartCount={cart.items.reduce((s, i) => s + i.quantity, 0)} />

      {/* Main Split Screen Workspace: Left (Catalog/Scan 60%) + Right (Cart/Checkout 40%) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* LEFT COLUMN: Barcode Search & Fast Product Catalog (60%) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 bg-slate-950">
          <PosBarcodeBar
            inputRef={barcodeInputRef}
            onScan={handleBarcodeScan}
            onSearch={handleSearchFilter}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            isScanning={isScanning}
          />

          {/* Alert Notification Toast */}
          {scanNotification && (
            <div
              className={`mx-3 mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-2 duration-200 ${
                scanNotification.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
              }`}
            >
              <span>{scanNotification.message}</span>
              <button
                onClick={() => setScanNotification(null)}
                className="opacity-70 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Product Catalog Grid */}
          <div className="flex-1 overflow-y-auto">
            <PosProductCatalog
              products={products}
              onSelectProduct={handleSelectProduct}
              loading={isSearching}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Cart Items Table & Checkout Panel (40%) */}
        <div className="w-full lg:w-[620px] xl:w-[680px] flex flex-col md:flex-row bg-slate-900 shrink-0">
          {/* Cart Table (md:flex-1) */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 min-h-0">
            <PosCartTable
              items={cart.items}
              onUpdateQuantity={(skuId, qty) => dispatch(updateQuantity({ productSkuId: skuId, quantity: qty }))}
              onRemoveItem={(skuId) => dispatch(removeItem(skuId))}
              onClearCart={() => dispatch(clearCart())}
              onOpenSerialModal={(item) => setActiveSerialModalItem(item)}
              onRemoveSerial={(skuId, sn) => dispatch(removeSerial({ productSkuId: skuId, serialNumber: sn }))}
            />
          </div>

          {/* Checkout Panel (w-full md:w-80) */}
          <PosCheckoutPanel
            customerInfo={cart.customerInfo}
            onUpdateCustomer={(info) => dispatch(setCustomerInfo(info))}
            subtotal={totals.subtotal}
            discount={totals.discount}
            tax={totals.tax}
            total={totals.total}
            customerPaid={totals.customerPaid}
            change={totals.change}
            onUpdateDiscount={(d) => dispatch(setDiscount(d))}
            onUpdateCustomerPaid={(p) => dispatch(setCustomerPaid(p))}
            paymentMethod={cart.paymentMethod}
            onSelectPaymentMethod={(m) => dispatch(setPaymentMethod(m))}
            onCheckout={handleCheckout}
            isProcessing={isCheckingOut}
            missingSerialCount={missingSerialCount}
            itemCount={cart.items.length}
            customerInputRef={customerInputRef}
            discountInputRef={discountInputRef}
          />
        </div>
      </div>

      {/* Serial Assignment Modal */}
      <SerialAssignmentModal
        isOpen={Boolean(activeSerialModalItem)}
        onClose={() => setActiveSerialModalItem(null)}
        item={activeSerialModalItem}
        onSaveSerials={(skuId, serials) => {
          dispatch(assignSerials({ productSkuId: skuId, serials }));
        }}
      />

      {/* K80 Thermal Invoice Modal */}
      <InvoiceK80Modal
        isOpen={Boolean(completedOrder)}
        onClose={() => setCompletedOrder(null)}
        orderData={completedOrder}
        onNewOrder={handleNewOrder}
      />
    </div>
  );
};

export default PosPage;
