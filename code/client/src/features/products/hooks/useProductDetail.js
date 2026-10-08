import { useState, useEffect } from 'react';
import productService from '../services/productService.js';

export const useProductDetail = (slug) => {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  return { product, isLoading, error };
};

export default useProductDetail;
