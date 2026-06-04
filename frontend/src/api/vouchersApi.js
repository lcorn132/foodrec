import axiosClient from "./axios";

export async function getAdminVouchers() {
  const res = await axiosClient.get("/vouchers/admin");
  return res.data;
}

export async function getActiveVouchers(subtotal = 0) {
  const res = await axiosClient.get("/vouchers/active", { params: { subtotal } });
  return res.data;
}

export async function createVoucher(payload) {
  const res = await axiosClient.post("/vouchers/admin", payload);
  return res.data;
}

export async function updateVoucher(id, payload) {
  const res = await axiosClient.put(`/vouchers/admin/${id}`, payload);
  return res.data;
}

export async function toggleVoucher(id) {
  const res = await axiosClient.patch(`/vouchers/admin/${id}/toggle`);
  return res.data;
}

export async function validateVoucher(payload) {
  const res = await axiosClient.post("/vouchers/validate", payload);
  return res.data;
}
