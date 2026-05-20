import axiosClient from "./axios";

export async function getRecommendations(params = {}) {
  const res = await axiosClient.get("/recommendations", { params });
  return res.data;
}

export async function getRecommendationsForDish(dishId, limit = 10) {
  const res = await axiosClient.get(`/dishes/${dishId}/recommendations`, {
    params: { limit },
  });
  return res.data;
}

export async function getRecommendationsForCart(dishIds = [], limit = 10) {
  const res = await axiosClient.post("/recommendations/cart", {
    dishIds,
    limit,
  });
  return res.data;
}

export async function getTrending(topN = 10) {
  const res = await axiosClient.get("/recommendations/trending", {
    params: { top_n: topN },
  });
  return res.data;
}