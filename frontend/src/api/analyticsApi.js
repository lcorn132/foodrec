import axiosClient from "./axios";

export async function getOverview() {
  const res = await axiosClient.get("/analytics/overview");
  return res.data;
}

export async function getCategoryDistribution() {
  const res = await axiosClient.get("/analytics/category-distribution");
  return res.data;
}

export async function getPriceDistribution() {
  const res = await axiosClient.get("/analytics/price-distribution");
  return res.data;
}

export async function getTopDishes(topN = 10) {
  const res = await axiosClient.get("/analytics/top-dishes", { params: { top_n: topN } });
  return res.data;
}
