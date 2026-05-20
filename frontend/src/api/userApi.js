import axiosClient from "./axios";

// AUTH
export const sendOTP = (phone) => axiosClient.post("/auth/send-otp", { phone });
export const verifyOTP = (phone, otp) => axiosClient.post("/auth/verify-otp", { phone, otp });
export const registerUser = (name, phone) => axiosClient.post("/auth/register", { name, phone });
export const getProfile = (id) => axiosClient.get(`/auth/profile/${id}`);
export const updateProfile = (id, data) => axiosClient.put(`/auth/profile/${id}`, data);

// ORDERS
export const checkout = (data) => axiosClient.post("/orders/checkout", data);
export const getCustomerOrders = (customerId) => axiosClient.get(`/orders/customer/${customerId}`);
export const getAllOrders = (status) => axiosClient.get("/orders", { params: status ? { status } : {} });
export const updateOrderStatus = (orderId, status) => axiosClient.put(`/orders/${orderId}/status`, { status });

// RATINGS
export const createRating = (data) => axiosClient.post("/ratings", data);
export const getAllRatings = (limit = 100) => axiosClient.get("/ratings", { params: { limit } });
export const replyRating = (id, reply) => axiosClient.put(`/ratings/${id}/reply`, { reply });
export const deleteRating = (id) => axiosClient.delete(`/ratings/${id}`);
export const getDishRatings = (dishId) => axiosClient.get(`/dishes/${dishId}/ratings`);

// DISHES CRUD (admin)
export const createDish = (data) => axiosClient.post("/dishes/", data);
export const updateDish = (id, data) => axiosClient.put(`/dishes/${id}`, data);
export const deleteDish = (id) => axiosClient.delete(`/dishes/${id}`);
