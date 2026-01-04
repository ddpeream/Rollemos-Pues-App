import { useCallback, useState } from "react";
import { createProducto, deleteProducto, getProductos } from "../services/marketplace";

export const useMarketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProductos();
      setProducts(data);
      return { success: true, data };
    } catch (err) {
      setError(err?.message || "Error al cargar productos");
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts]);

  const addProduct = useCallback(async (productData, userId) => {
    try {
      const data = await createProducto(productData, userId);
      setProducts((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, []);

  const removeProduct = useCallback(async (productId, userId) => {
    try {
      await deleteProducto(productId, userId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      return { success: true };
    } catch (err) {
      return { success: false, error: err?.message };
    }
  }, []);

  return {
    products,
    loading,
    refreshing,
    error,
    loadProducts,
    refreshProducts,
    addProduct,
    removeProduct,
  };
};

export default useMarketplace;
