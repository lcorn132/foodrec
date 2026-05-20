/**
 * [V6] Form validation helpers
 * Logic tương đương zod + react-hook-form nhưng lightweight
 */

export function validateCheckout(fields) {
  const errors = {};

  if (!fields.address || fields.address.trim().length < 10) {
    errors.address = "Vui lòng nhập địa chỉ giao hàng hợp lệ (ít nhất 10 ký tự)";
  }

  if (!fields.customerName || fields.customerName.trim().length < 2) {
    errors.customerName = "Vui lòng nhập họ tên (ít nhất 2 ký tự)";
  }

  if (!fields.customerPhone || !/^0\d{8,9}$/.test(fields.customerPhone.trim())) {
    errors.customerPhone = "Số điện thoại không hợp lệ (VD: 0912345678)";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProfile(fields) {
  const errors = {};

  if (!fields.name || fields.name.trim().length < 2) {
    errors.name = "Họ tên phải có ít nhất 2 ký tự";
  }

  if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Email không hợp lệ";
  }

  if (fields.phone && !/^0\d{8,9}$/.test(fields.phone.trim())) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
