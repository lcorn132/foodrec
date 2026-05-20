import axiosClient from "./axios";

export async function getRecommendations(params = {}) {
  const res = await axiosClient.get("/recommendations/trending", { params });
  return res.data;
}

export async function getRecommendationsForDish(dishId, limit = 10) {
  const res = await axiosClient.post(`/recommendations/for-dish/${dishId}`, null, {
    params: { top_n: limit },
  });
  return res.data;
}

export async function getRecommendationsForCart(dishIds = [], limit = 10) {
  const res = await axiosClient.post("/recommendations/for-cart", {
    dish_ids: dishIds,
    top_n: limit,
  });
  return res.data;
}

export async function getTrending(topN = 10) {
  const res = await axiosClient.get("/recommendations/trending", {
    params: { top_n: topN },
  });
  return res.data;
}
