import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center">
      <div className="text-7xl font-black text-blue-600 mb-4">404</div>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Trang không tồn tại</h1>
      <p className="text-xs text-slate-500 mb-6">
        Đường dẫn bạn yêu cầu không khả dụng hoặc đã được thay đổi vị trí.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về trang chủ TechOne</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
