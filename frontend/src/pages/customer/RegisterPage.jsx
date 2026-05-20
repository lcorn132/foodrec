import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("info"); // info | otp
  const [form, setForm] = useState({ name: "", phone: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const formatPhone = (val) => val.replace(/\D/g, "").slice(0, 10);

  const canProceed = form.name.trim().length >= 2 && form.phone.length >= 9;

  const handleSendOTP = async () => {
    if (!canProceed) return;
    setLoading(true);
    try {
      const { registerUser } = await import("../../api/userApi.js");
      await registerUser(form.name, form.phone);
      setStep("otp");
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((p) => { if (p <= 1) { clearInterval(timer); return 0; } return p - 1; });
      }, 1000);
    } catch {}
    setLoading(false);
  };

  const handleOtpChange = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`rotp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) document.getElementById(`rotp-${idx - 1}`)?.focus();
  };

  const handleVerify = async () => {
    if (otp.join("").length < 6) return;
    setLoading(true);
    try {
      const { verifyOTP } = await import("../../api/userApi.js");
      const res = await verifyOTP(form.phone, otp.join(""));
      const userData = res.data?.user;
      if (userData) {
        localStorage.setItem("foodrec_user", JSON.stringify(userData));
      }
      navigate("/");
    } catch (e) {
      alert(e?.response?.data?.detail || "OTP không hợp lệ");
    }
    setLoading(false);
  };

  const inputStyle = {
    border: "1.5px solid #E8DDD4", background: "#FFFAF3", color: "#2C1810",
    fontFamily: "Be Vietnam Pro, sans-serif",
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#FFFAF3" }}>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-3xl p-8 sm:p-10" style={{ border: "1px solid #E8DDD4", boxShadow: "0 12px 40px rgba(62,39,35,0.1)" }}>
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
                   style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", boxShadow: "0 4px 16px rgba(230,180,34,0.35)" }}>
                🍜
              </div>
              <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Tạo Tài Khoản</h1>
              <p className="text-sm mt-2" style={{ color: "#8D6E63" }}>
                {step === "info" ? "Đăng ký để nhận gợi ý ẩm thực cá nhân hóa" : `Nhập mã OTP đã gửi đến ${form.phone}`}
              </p>
            </div>

            {step === "info" ? (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4E342E" }}>Họ và tên</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#E6B422"; e.target.style.boxShadow = "0 0 0 3px rgba(230,180,34,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E8DDD4"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4E342E" }}>Số điện thoại</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}>
                    <span className="text-base flex-shrink-0" style={{ color: "#5D4037" }}>🇻🇳 +84</span>
                    <div className="w-px h-6 flex-shrink-0" style={{ background: "#E8DDD4" }} />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                      placeholder="912 345 678"
                      className="flex-1 outline-none text-base font-medium bg-transparent"
                      style={{ color: "#2C1810", fontFamily: "Be Vietnam Pro, sans-serif" }}
                    />
                  </div>
                </div>

                {/* Terms */}
                <p className="text-[12px] leading-relaxed" style={{ color: "#8D6E63" }}>
                  Bằng việc đăng ký, bạn đồng ý với{" "}
                  <span className="font-semibold" style={{ color: "#D4A017" }}>Điều khoản sử dụng</span> và{" "}
                  <span className="font-semibold" style={{ color: "#D4A017" }}>Chính sách bảo mật</span> của FoodRec.
                </p>

                <button
                  onClick={handleSendOTP}
                  disabled={!canProceed || loading}
                  className="w-full py-3.5 rounded-xl text-base font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none", boxShadow: "0 4px 16px rgba(230,180,34,0.35)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-brown-900/30 border-t-brown-900 rounded-full animate-spin" />
                      Đang gửi...
                    </span>
                  ) : "Gửi mã OTP"}
                </button>
              </div>
            ) : (
              /* OTP STEP */
              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-3 text-center" style={{ color: "#4E342E" }}>Nhập mã xác thực</label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i} id={`rotp-${i}`} type="text" inputMode="numeric" maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                        style={{
                          border: digit ? "2px solid #E6B422" : "1.5px solid #E8DDD4",
                          background: digit ? "#FDF3D7" : "#FFFAF3",
                          color: "#3E2723", fontFamily: "Be Vietnam Pro, sans-serif",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleVerify}
                  disabled={otp.join("").length < 6 || loading}
                  className="w-full py-3.5 rounded-xl text-base font-bold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none", boxShadow: "0 4px 16px rgba(230,180,34,0.35)" }}
                >
                  {loading ? "Đang xác thực..." : "Hoàn tất đăng ký"}
                </button>
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm" style={{ color: "#8D6E63" }}>Gửi lại mã sau <strong style={{ color: "#D4A017" }}>{countdown}s</strong></p>
                  ) : (
                    <button onClick={handleSendOTP} className="text-sm font-semibold cursor-pointer bg-transparent border-none" style={{ color: "#D4A017" }}>Gửi lại mã OTP</button>
                  )}
                  <button onClick={() => { setStep("info"); setOtp(["","","","","",""]); }} className="block mx-auto mt-2 text-sm cursor-pointer bg-transparent border-none" style={{ color: "#8D6E63" }}>← Quay lại</button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "#E8DDD4" }} />
              <span className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>hoặc</span>
              <div className="flex-1 h-px" style={{ background: "#E8DDD4" }} />
            </div>
            <p className="text-center text-sm" style={{ color: "#8D6E63" }}>
              Đã có tài khoản? <Link to="/login" className="font-semibold no-underline" style={{ color: "#D4A017" }}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer minimal />
    </div>
  );
}
