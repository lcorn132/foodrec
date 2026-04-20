@echo off
chcp 65001 >nul
echo ============================================
echo    FoodRec v3 - Cài đặt tự động (Windows)
echo    Nhóm 10 - Đồ án Khai phá dữ liệu
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Chưa cài Python! Download tại: https://python.org/downloads
    pause
    exit /b 1
)
echo [OK] Python đã cài

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Chưa cài Node.js! Download tại: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js đã cài

echo.
echo === Bước 1: Cài thư viện Backend ===
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Có lỗi khi cài pip. Thử tiếp...
)

echo.
echo === Bước 2: Cấu hình dùng SQLite ===
:: Tạo .env dùng SQLite nếu chưa có config PostgreSQL
echo DATABASE_URL=sqlite:///./app.db > .env.local
echo SECRET_KEY=foodrec-secret-key >> .env.local
echo ALGORITHM=HS256 >> .env.local
echo ACCESS_TOKEN_EXPIRE_MINUTES=1440 >> .env.local

:: Nếu người dùng muốn dùng SQLite, copy .env.local
echo Bạn muốn dùng SQLite (đơn giản) hay PostgreSQL?
echo   1 = SQLite (không cần cài thêm gì)
echo   2 = PostgreSQL (cần đã cài sẵn)
set /p choice="Chọn (1 hoặc 2): "

if "%choice%"=="2" (
    echo.
    set /p pgpass="Nhập mật khẩu PostgreSQL: "
    echo DATABASE_URL=postgresql://postgres:%pgpass%@localhost:5432/foodrec > .env
    echo SECRET_KEY=foodrec-secret-key >> .env
    echo ALGORITHM=HS256 >> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=1440 >> .env
    echo [OK] Đã cấu hình PostgreSQL. Đảm bảo đã tạo database "foodrec"!
) else (
    copy /y .env.local .env >nul
    echo [OK] Đã cấu hình SQLite
)

echo.
echo === Bước 3: Cài thư viện Frontend ===
cd ..\frontend
call npm install

echo.
echo ============================================
echo    CÀI ĐẶT HOÀN TẤT!
echo ============================================
echo.
echo Để chạy project, mở 2 cửa sổ Terminal:
echo.
echo   Terminal 1 (Backend):
echo     cd backend
echo     python -m uvicorn app.main:app --reload --port 8000
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo Sau đó mở trình duyệt:
echo   Trang web:    http://localhost:5173
echo   Dashboard:    http://localhost:5173/dashboard
echo   API docs:     http://localhost:8000/docs
echo.
pause
