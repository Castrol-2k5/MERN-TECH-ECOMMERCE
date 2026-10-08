import { Link } from 'react-router-dom';
import { Laptop, Smartphone, Cpu, Headphones, ArrowRight } from 'lucide-react';

export const CategoryHighlights = () => {
  const categories = [
    {
      title: 'Laptop chính hãng',
      subtitle: 'MacBook, Gaming, Văn phòng AI',
      slug: 'laptop',
      icon: Laptop,
      color: 'from-blue-500/10 to-indigo-500/10',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      image:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Smartphone Flagship',
      subtitle: 'iPhone 16, Galaxy S25, Xiaomi',
      slug: 'smartphone',
      icon: Smartphone,
      color: 'from-cyan-500/10 to-blue-500/10',
      borderColor: 'border-cyan-200',
      iconColor: 'text-cyan-600',
      image:
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Linh kiện PC',
      subtitle: 'CPU Core Ultra, RTX 50 Series, SSD',
      slug: 'linh-kien',
      icon: Cpu,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      image:
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80',
    },
    {
      title: 'Phụ kiện & Audio',
      subtitle: 'Tai nghe Hi-Res, Phím cơ, Chuột Gaming',
      slug: 'phu-kien',
      icon: Headphones,
      color: 'from-amber-500/10 to-orange-500/10',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <section className="my-14">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
            Mua sắm dễ dàng
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Khám phá theo danh mục
          </h2>
        </div>
        <Link
          to="/category/laptop"
          className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <span>Xem tất cả danh mục</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={`group relative overflow-hidden rounded-2xl border ${cat.borderColor} bg-gradient-to-br ${cat.color} p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white flex flex-col justify-between`}
            >
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-3">
                  <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{cat.subtitle}</p>
              </div>

              <div className="mt-6 flex justify-end">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-24 h-24 object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryHighlights;
