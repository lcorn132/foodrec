/**
 * [V6] DashboardDishes — CRUD món ăn
 * - Upload ảnh từ máy tính (Base64) thay URL
 * - formatCurrency chuẩn
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getUploadedDishes } from "../../api/dishesApi";
import Loading from "../../components/Loading";
import { formatCurrency } from "../../utils/format";

const EMPTY = { name: "", category: "", price: 0, price_range: "moderate", description: "", image_url: "" };
const CATEGORIES = ["Khai vị", "Rau", "Bò", "Heo", "Gà / Vịt", "Hải sản", "Lẩu", "Cơm", "Canh", "Đậu hũ - Trứng", "Đồ thêm", "Tráng miệng"];
const PRICE_RANGES = [
  { v: "budget", l: "Bình dân" },
  { v: "affordable", l: "Vừa phải" },
  { v: "moderate", l: "Trung bình" },
  { v: "premium", l: "Cao cấp" },
];

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== (value || "")) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  const sync = () => onChange(editorRef.current?.innerHTML || "");
  const run = (command, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  };

  const tools = [
    { label: "B", title: "In đậm", action: () => run("bold") },
    { label: "I", title: "In nghiêng", action: () => run("italic") },
    { label: "U", title: "Gạch chân", action: () => run("underline") },
    { label: "H2", title: "Tiêu đề", action: () => run("formatBlock", "h3") },
    { label: "•", title: "Danh sách chấm", action: () => run("insertUnorderedList") },
    { label: "1.", title: "Danh sách số", action: () => run("insertOrderedList") },
  ];

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}>
      <div className="flex flex-wrap gap-1 p-2" style={{ borderBottom: "1px solid #E8DDD4", background: "white" }}>
        {tools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onClick={tool.action}
            className="h-8 min-w-8 px-2 rounded-md text-xs font-bold cursor-pointer"
            style={{ border: "1px solid #E8DDD4", background: "#FFFAF3", color: "#3E2723" }}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          title="Xóa định dạng"
          onClick={() => run("removeFormat")}
          className="h-8 px-2 rounded-md text-xs font-bold cursor-pointer"
          style={{ border: "1px solid #E8DDD4", background: "#FFFAF3", color: "#5D4037" }}
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={sync}
        className="min-h-[130px] px-3 py-2 text-sm outline-none prose-lite"
        style={{ color: "#2C1810" }}
      />
    </div>
  );
}

export default function DashboardDishes() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imagePreview, setImagePreview] = useState(null);

  const load = () => {
    setLoading(true);
    getUploadedDishes().then(r => setDishes(Array.isArray(r) ? r : r?.items || []))
      .catch(() => setDishes([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = dishes.filter(d => {
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && d.category !== catFilter) return false;
    return true;
  });
  const categoryOptions = Array.from(new Set(dishes.map(d => d.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));

  const openAdd = () => { setForm(EMPTY); setImagePreview(null); setModal("add"); };
  const openEdit = (d) => { setForm({ ...d }); setImagePreview(d.image_url || null); setModal(d); };
  const close = () => { setModal(null); setImagePreview(null); };

  // [V6] Upload ảnh — convert to Base64
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Ảnh quá lớn (tối đa 2MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setForm(p => ({ ...p, image_url: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    alert("Dữ liệu món ăn được lấy từ file upload. Hãy upload file mới và chạy pipeline để thay đổi danh sách món.");
  };

  const handleDelete = async (id) => {
    alert("Dữ liệu món ăn được lấy từ file upload. Hãy upload file mới và chạy pipeline để thay đổi danh sách món.");
  };

  if (loading) return <Loading label="Đang tải món ăn..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>🍽️ Quản Lý Món Ăn</h1>
          <p className="text-sm" style={{ color: "#8D6E63" }}>{dishes.length} món ăn đang quản lý</p>
        </div>
        <div className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "#FDF3D7", color: "#8D6E63" }}>
          Nguồn: dữ liệu upload đã xử lý
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm tên món..."
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm outline-none" style={{ border: "1.5px solid #E8DDD4", background: "white" }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ border: "1.5px solid #E8DDD4" }}>
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl" style={{ border: "1px solid #E8DDD4" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead><tr>
            {["ID", "Tên món", "Danh mục", "Giá", "Trang khách", "Nguồn"].map(h =>
              <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5" style={{ color: "#4E342E", background: "#FDF6EC", borderBottom: "2px solid #E8DDD4" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.slice(0, 50).map(d => (
              <tr key={d.id} className="hover:bg-gold-100/20 transition-colors">
                <td className="px-3 py-2.5" style={{ color: "#8D6E63", borderBottom: "1px solid #EFEBE9" }}>{d.id}</td>
                <td className="px-3 py-2.5 font-semibold" style={{ color: "#3E2723", borderBottom: "1px solid #EFEBE9" }}>{d.name}</td>
                <td className="px-3 py-2.5" style={{ color: "#5D4037", borderBottom: "1px solid #EFEBE9" }}>{d.category}</td>
                <td className="px-3 py-2.5 font-bold" style={{ color: "#D4A017", borderBottom: "1px solid #EFEBE9" }}>{formatCurrency(d.price)}</td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid #EFEBE9" }}>
                  <Link to={`/dish/${d.id}`} className="text-[11px] font-semibold hover:underline" style={{ color: "#16A34A" }}>
                    Xem trên web
                  </Link>
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid #EFEBE9" }}>
                  {d.source_url ? (
                    <a href={d.source_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold hover:underline" style={{ color: "#3B82F6" }}>
                      Xem nguồn
                    </a>
                  ) : (
                    <span className="text-[11px]" style={{ color: "#A1887F" }}>File upload</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD */}
      {modal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={close}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-[560px] max-h-[85vh] overflow-y-auto" style={{ border: "1px solid #E8DDD4" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>
              {modal === "add" ? "➕ Thêm món mới" : `✏️ Sửa: ${form.name}`}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Tên món *</label>
                  <input value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Danh mục</label>
                  <select value={form.category || ""} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}>
                    <option value="">Chọn...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Giá (VNĐ)</label>
                  <input type="number" value={form.price || ""} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Mức giá</label>
                  <select value={form.price_range || ""} onChange={e => setForm(p => ({ ...p, price_range: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}>
                    {PRICE_RANGES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                  </select>
                </div>
              </div>

              {/* [V6] Upload ảnh — thay thế ô nhập URL */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Hình ảnh món ăn</label>
                <div className="flex items-start gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:bg-brown-50"
                         style={{ border: "2px dashed #E8DDD4", background: "#FFFAF3" }}>
                    <span className="text-lg">📷</span>
                    <span className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>
                      {imagePreview ? "Đổi ảnh khác" : "Chọn ảnh từ máy tính"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #E8DDD4" }}>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#A1887F" }}>Tối đa 2MB. Hỗ trợ JPG, PNG, WebP.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "#4E342E" }}>Mô tả</label>
                <RichTextEditor
                  value={form.description || ""}
                  onChange={(description) => setForm(p => ({ ...p, description }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #E8DDD4" }}>
              <button onClick={close} className="px-5 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: "#EFEBE9", color: "#5D4037", border: "none" }}>Hủy</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                style={{ background: "#E6B422", color: "#3E2723", border: "none" }}>💾 Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
