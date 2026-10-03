/**
 * Quản lý chế độ dữ liệu (Mock Data vs Live Database)
 * Hỗ trợ chuyển đổi qua .env và ghi nhớ trong localStorage để tiện kiểm thử.
 */

const STORAGE_KEY = 'TECHONE_USE_MOCK_DATA';

export const isDevOrTest = () => {
  if (import.meta.env.PROD || import.meta.env.VITE_SHOW_DEV_TOOLS === 'false') {
    return false;
  }
  return import.meta.env.DEV || import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test';
};

export const isMockEnabled = () => {
  if (!isDevOrTest()) {
    return false;
  }
  const localSetting = localStorage.getItem(STORAGE_KEY);
  if (localSetting !== null) {
    return localSetting === 'true';
  }
  return import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
};

export const setMockEnabled = (enabled) => {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('techone:datamode-change', {
      detail: { isMock: Boolean(enabled) },
    })
  );
};
