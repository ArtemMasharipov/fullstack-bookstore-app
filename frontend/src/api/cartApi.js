import baseApi from './baseApi';

export const fetchCart = async () => {
  const response = await baseApi.get('/cart');
  return response.data;
};

export const addToCart = async (item) => {
  const response = await baseApi.post('/cart/add', item);
  return response.data;
};

export const removeFromCart = async (itemId) => {
  const response = await baseApi.post('/cart/remove', { itemId });
  return response.data;
};

export const updateQuantity = async (payload) => {
  const response = await baseApi.post('/cart/update', payload);
  return response.data;
};

export const clearCart = async () => {
  const response = await baseApi.post('/cart/clear');
  return response.data;
};

export const syncCart = async (cart) => {
  const response = await baseApi.post('/cart/sync', { cart });
  return response.data;
};