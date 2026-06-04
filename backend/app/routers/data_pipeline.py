from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.data_pipeline_service import (
    pipeline_status,
    processed_dishes,
    resolve_chart_path,
    run_processing_pipeline,
    save_uploaded_files,
)


router = APIRouter(prefix="/api/data-pipeline", tags=["Data Pipeline"])


@router.get("/status")
def status():
    """Trạng thái dữ liệu raw/processed, thống kê và danh sách biểu đồ."""
    return pipeline_status()


@router.get("/dishes")
def uploaded_dishes():
    """Danh sách món ăn đọc trực tiếp từ dishes_clean.csv của lần upload/pipeline mới nhất."""
    dishes = processed_dishes()
    return {"items": dishes, "total": len(dishes), "source": "processed/dishes_clean.csv"}


@router.post("/upload")
async def upload_raw_files(
    files: list[UploadFile] = File(...),
    clear_existing: bool = Query(False, description="Xóa file raw cũ trước khi lưu file mới"),
):
    """Upload các file Excel raw vào backend/database/raw."""
    payload: list[tuple[str, bytes]] = []
    for file in files:
        content = await file.read()
        if not content:
            continue
        payload.append((file.filename or "uploaded.xlsx", content))

    if not payload:
        raise HTTPException(status_code=400, detail="Không có file hợp lệ để upload.")

    try:
        return save_uploaded_files(payload, clear_existing=clear_existing)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/run")
def run_pipeline(
    load_to_db: bool = Query(True, description="Nạp dishes_clean.csv vào bảng dishes sau khi xử lý"),
    db: Session = Depends(get_db),
):
    """Chạy pipeline: tiền xử lý menu thật -> K-Means -> content-based recommendations -> biểu đồ -> nạp DB."""
    try:
        return run_processing_pipeline(load_to_db=load_to_db, db=db)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}") from exc


@router.get("/charts/{filename}")
def chart(filename: str):
    """Trả về file biểu đồ SVG đã sinh từ dữ liệu processed."""
    try:
        path = resolve_chart_path(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Không tìm thấy biểu đồ.") from exc
    return FileResponse(path, media_type="image/svg+xml")
