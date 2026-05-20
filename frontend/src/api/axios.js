import axios from "axios";

// Đọc BASE_URL từ env variable
// - Development: http://localhost:8000/api (từ .env hoặc vite proxy)
// - Production: https://YOUR_RENDER_URL.onrender.com/api (từ .env.production)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      const method = err?.config?.method?.toUpperCase?.() ?? "GET";
      const url = err?.config?.url ?? "";
      const status = err?.response?.status;
      // eslint-disable-next-line no-console
      console.error("[API ERROR]", { method, url, status, data: err?.response?.data });
    }

    if (!err?.response && err?.message === "Network Error") {
      err.message = "Không kết nối được API. Backend có thể đang khởi động (30 giây đầu).";
      return Promise.reject(err);
    }

    if (err?.response) {
      const msg =
        err.response.data?.message ||
        err.response.data?.detail ||
        err.response.data?.error ||
        `Request failed with status code ${err.response.status}`;
      err.message = msg;
    }
    return Promise.reject(err);
  },
);

export default axiosClient;
