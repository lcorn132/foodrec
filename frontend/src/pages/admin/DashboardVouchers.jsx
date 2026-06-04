import { useEffect, useState } from "react";

import { createVoucher, getAdminVouchers, toggleVoucher, updateVoucher } from "../../api/vouchersApi.js";
import { formatCurrency } from "../../utils/format.js";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: "",
  applies_to: "all",
  usage_limit: "",
  is_active: 1,
};

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardVouchers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await getAdminVouchers();
    setItems(data.items || []);
  };

  useEffect(() => {
    load().catch((error) => setMessage(error?.message || "Không tải được voucher."));
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      discount_value: numberValue(form.discount_value),
      min_order_amount: numberValue(form.min_order_amount),
      max_discount_amount: form.max_discount_amount === "" ? null : numberValue(form.max_discount_amount),
      usage_limit: form.usage_limit === "" ? null : numberValue(form.usage_limit),
      is_active: Number(form.is_active) ? 1 : 0,
    };
    try {
      if (editingId) {
        await updateVoucher(editingId, payload);
        setMessage("Đã cập nhật voucher.");
      } else {
        await createVoucher(payload);
        setMessage("Đã thêm voucher mới.");
      }
      resetForm();
      await load();
    } catch (error) {
      setMessage(error?.message || "Không lưu được voucher.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      description: item.description || "",
      discount_type: item.discount_type || "percent",
      discount_value: item.discount_value || 0,
      min_order_amount: item.min_order_amount || 0,
      max_discount_amount: item.max_discount_amount ?? "",
      applies_to: item.applies_to || "all",
      usage_limit: item.usage_limit ?? "",
      is_active: item.is_active ? 1 : 0,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Quản lý voucher</h1>
        <p className="mt-1 text-sm text-slate-600">Bật tắt ưu đãi, chỉnh mức giảm và điều kiện áp dụng cho khách hàng.</p>
      </div>

      {message && <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{message}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">{editingId ? "Cập nhật voucher" : "Thêm voucher"}</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 lg:grid-cols-4">
          <input value={form.code} onChange={(e) => updateField("code", e.target.value)} placeholder="Mã: COMNIEU10" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold uppercase" required />
          <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Tên ưu đãi" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <select value={form.discount_type} onChange={(e) => updateField("discount_type", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="percent">Giảm theo %</option>
            <option value="fixed">Giảm số tiền</option>
          </select>
          <input type="number" value={form.discount_value} onChange={(e) => updateField("discount_value", e.target.value)} placeholder="Mức giảm" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={form.min_order_amount} onChange={(e) => updateField("min_order_amount", e.target.value)} placeholder="Đơn tối thiểu" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" value={form.max_discount_amount} onChange={(e) => updateField("max_discount_amount", e.target.value)} placeholder="Giảm tối đa" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={form.is_active} onChange={(e) => updateField("is_active", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value={1}>Đang bật</option>
            <option value={0}>Tạm tắt</option>
          </select>
          <input value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Câu mời gọi hiển thị bên khách" className="rounded-lg border border-slate-300 px-3 py-2 text-sm lg:col-span-4" />
          <div className="flex gap-3 lg:col-span-4">
            <button disabled={saving} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm voucher"}
            </button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold">Hủy sửa</button>}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">Danh sách voucher</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Voucher</th>
                <th className="px-3 py-2">Mức giảm</th>
                <th className="px-3 py-2">Điều kiện</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <div className="font-bold text-slate-950">{item.code}</div>
                    <div className="text-xs text-slate-500">{item.name}</div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800">
                    {item.discount_type === "fixed" ? formatCurrency(item.discount_value) : `${item.discount_value}%`}
                    {item.max_discount_amount ? <div className="text-xs text-slate-500">Tối đa {formatCurrency(item.max_discount_amount)}</div> : null}
                  </td>
                  <td className="px-3 py-3 text-slate-600">Đơn từ {formatCurrency(item.min_order_amount)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {item.is_active ? "Đang bật" : "Đã tắt"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => edit(item)} className="mr-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Sửa</button>
                    <button onClick={async () => { await toggleVoucher(item.id); await load(); }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                      {item.is_active ? "Tắt" : "Bật"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
