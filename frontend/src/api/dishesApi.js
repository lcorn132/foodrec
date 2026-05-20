import axiosClient from "./axios";

export async function getDishes(params = {}) {
  const res = await axiosClient.get("/dishes", { params });
  return res.data;
}

export async function getDishById(id) {
  const res = await axiosClient.get(`/dishes/${id}`);
  return res.data;
}

export async function getCategories() {
  const res = await axiosClient.get("/dishes/categories");
  return res.data;
}