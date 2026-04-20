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

export async function getRatingDistribution() {
  const res = await axiosClient.get("/analytics/rating-distribution");
  return res.data;
}

export async function getTopDishes(topN = 10) {
  const res = await axiosClient.get("/analytics/top-dishes", { params: { top_n: topN } });
  return res.data;
}

export async function getAssociationRules(minSupport = 0.05, minConfidence = 0.3, dishType = null) {
  const params = { min_support: minSupport, min_confidence: minConfidence };
  if (dishType) params.dish_type = dishType;
  const res = await axiosClient.get("/analytics/association-rules", { params });
  return res.data;
}

export async function getRecommendationRate() {
  const res = await axiosClient.get("/analytics/recommendation-rate");
  return res.data;
}

export async function getClassification() {
  const res = await axiosClient.get("/analytics/classification");
  return res.data;
}

export async function getClustering(nClusters = 4) {
  const res = await axiosClient.get("/analytics/clustering", { params: { n_clusters: nClusters } });
  return res.data;
}

export async function getCorrelationRegression() {
  const res = await axiosClient.get("/analytics/correlation-regression");
  return res.data;
}
