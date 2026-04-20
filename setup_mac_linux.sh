#!/bin/bash
echo "============================================"
echo "   FoodRec v3 - Cài đặt tự động (Mac/Linux)"
echo "   Nhóm 10 - Đồ án Khai phá dữ liệu"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[LỖI] Chưa cài Python3!"
    exit 1
fi
echo "[OK] Python3 đã cài: $(python3 --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "[LỖI] Chưa cài Node.js!"
    exit 1
fi
echo "[OK] Node.js đã cài: $(node --version)"

echo ""
echo "=== Bước 1: Cài thư viện Backend ==="
cd backend
pip3 install -r requirements.txt

echo ""
echo "Bạn muốn dùng DB nào?"
echo "  1 = SQLite (đơn giản, không cần cài thêm)"
echo "  2 = PostgreSQL (cần đã cài sẵn)"
read -p "Chọn (1 hoặc 2): " choice

if [ "$choice" = "2" ]; then
    read -p "Nhập mật khẩu PostgreSQL: " pgpass
    cat > .env << EOF
DATABASE_URL=postgresql://postgres:${pgpass}@localhost:5432/foodrec
SECRET_KEY=foodrec-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF
    echo "[OK] Đã cấu hình PostgreSQL. Đảm bảo đã tạo database 'foodrec'!"
else
    cat > .env << EOF
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=foodrec-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF
    echo "[OK] Đã cấu hình SQLite"
fi

echo ""
echo "=== Bước 2: Cài thư viện Frontend ==="
cd ../frontend
npm install

echo ""
echo "============================================"
echo "   CÀI ĐẶT HOÀN TẤT!"
echo "============================================"
echo ""
echo "Để chạy project, mở 2 Terminal:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    python3 -m uvicorn app.main:app --reload --port 8000"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "Mở trình duyệt:"
echo "  Trang web:    http://localhost:5173"
echo "  Dashboard:    http://localhost:5173/dashboard"
echo "  API docs:     http://localhost:8000/docs"
