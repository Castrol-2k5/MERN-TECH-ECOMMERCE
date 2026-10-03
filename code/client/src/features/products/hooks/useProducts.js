import { useState, useEffect } from 'react';
import productService from '../services/productService.js';

export const useProducts = (initialParams = {}) => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const paramsKey = JSON.stringify(initialParams);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productService.getProducts(initialParams);
        if (isMounted) {
          setProducts(data.products || []);
          setMeta(data.meta || { total: data.products?.length || 0, page: 1, limit: 12 });
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = async (params = {}) => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts(params);
      setProducts(data.products || []);
      setMeta(data.meta || { total: data.products?.length || 0, page: 1, limit: 12 });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    meta,
    isLoading,
    error,
    refetch,
  };
};

export default useProducts;
