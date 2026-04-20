/**
 * [V6] Format tiền tệ chuẩn Tiếng Việt
 * Sử dụng Intl.NumberFormat với locale vi-VN
 * Output: "150.000 ₫"
 */
export function formatCurrency(value) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}
