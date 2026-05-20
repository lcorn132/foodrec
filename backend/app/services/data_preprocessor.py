"""
Báo cáo tiền xử lý dữ liệu set menu.

Thiết kế bám sát đề tài môn Khai phá dữ liệu:
- Dữ liệu thật: set menu được thu thập từ website Cơm Niêu Việt Nam.
- Làm sạch dữ liệu bằng code: xử lý chuỗi, tách item gộp, chuẩn hóa cách biểu diễn.
- Biến đổi dữ liệu: mỗi set menu trở thành một giao dịch TID → Items.
- Thu giảm dữ liệu: loại các item hiển nhiên/quá phổ biến khỏi tập khai phá để tránh luật tầm thường.
"""

from __future__ import annotations

import json
from pathlib import Path


DEFAULT_DB_DIR = Path(__file__).resolve().parents[2] / "database"
REPORT_FILE = "set_menu_preprocessing_report.json"
TRANSACTION_FILE = "set_menu_transactions_clean.csv"
RAW_FILE = "set_menu_items_raw.csv"
CLEAN_ITEMS_FILE = "set_menu_items_clean.csv"


def _prepare_if_missing(data_path: Path) -> None:
    report_path = data_path / REPORT_FILE
    tx_path = data_path / TRANSACTION_FILE
    clean_path = data_path / CLEAN_ITEMS_FILE
    if report_path.exists() and tx_path.exists() and clean_path.exists():
        return

    # Import theo đường dẫn tuyệt đối để vẫn chạy tốt khi deploy.
    scripts_dir = data_path.parent / "scripts"
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "prepare_set_menu_dataset", scripts_dir / "prepare_set_menu_dataset.py"
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Không thể nạp script prepare_set_menu_dataset.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.run()


def run_preprocessing(data_path: Path | None = None) -> dict:
    """Trả báo cáo tiền xử lý ở định dạng phù hợp cho dashboard."""
    data_path = Path(data_path) if data_path else DEFAULT_DB_DIR
    _prepare_if_missing(data_path)

    with (data_path / REPORT_FILE).open("r", encoding="utf-8") as f:
        report = json.load(f)

    summary = report.get("summary", {})
    transactions = report.get("transactions", {})

    return {
        "data_source": {
            "name": "Cơm Niêu Việt Nam — set menu công khai",
            "raw_file": RAW_FILE,
            "clean_items_file": CLEAN_ITEMS_FILE,
            "transactions_file": TRANSACTION_FILE,
            "note": "Mỗi set menu được xem là một giao dịch để khai phá luật kết hợp.",
            "real_collected_data": [
                "set_menu_items_raw.csv: danh sách món trong các set menu công khai thu thập từ website Cơm Niêu Việt Nam.",
                "set_menu_items_clean.csv và set_menu_transactions_clean.csv: dữ liệu dẫn xuất bằng code từ nguồn set menu thật.",
            ],
            "simulated_data": [
                "menu_expanded.csv, customers.csv, orders.csv, ratings.csv: dữ liệu mô phỏng phục vụ demo website, thống kê đơn hàng, khách hàng và rating.",
            ],
        },
        "summary": {
            "raw_rows": summary.get("raw_rows", 0),
            "set_menu_count": summary.get("set_menu_count", 0),
            "bundle_rows_split": summary.get("bundle_rows_split", 0),
            "missing_critical_fields": summary.get("missing_critical_fields", 0),
            "invalid_prices": summary.get("invalid_prices", 0),
            "invalid_item_orders": summary.get("invalid_item_orders", 0),
            "clean_item_rows": summary.get("clean_item_rows", 0),
            "service_items_rows": summary.get("service_items_rows", 0),
            "common_items_rows": summary.get("common_items_rows", 0),
            "mining_item_rows": summary.get("mining_item_rows", 0),
            "unique_clean_items": summary.get("unique_clean_items", 0),
            "unique_mining_items": summary.get("unique_mining_items", 0),
            "transactions_count": transactions.get("count", 0),
            "avg_items_per_transaction": transactions.get("avg_item_count", 0),
        },
        "cleaning": {
            "steps": [
                {
                    "name": "Kiểm tra trường bắt buộc",
                    "detail": "Loại bản ghi thiếu set_id, set_name hoặc raw_item_text.",
                    "count": summary.get("missing_critical_fields", 0),
                },
                {
                    "name": "Kiểm tra giá trị không hợp lệ",
                    "detail": "Ép kiểu price_vnd và item_order về số; giá trị lỗi được ghi nhận để không làm vỡ pipeline.",
                    "count": summary.get("invalid_prices", 0) + summary.get("invalid_item_orders", 0),
                },
                {
                    "name": "Chuẩn hóa biểu diễn tên món",
                    "detail": "Chuẩn hóa khoảng trắng, chữ hoa/thường và sửa một số cách viết không đồng nhất.",
                    "count": len(report.get("correction_examples", [])),
                },
                {
                    "name": "Chuẩn hóa giá bán",
                    "detail": "Chuyển price_vnd về số nguyên VND và giữ theo từng set menu trong dữ liệu giao dịch.",
                    "count": summary.get("set_menu_count", 0),
                },
                {
                    "name": "Tách dòng gộp",
                    "detail": "Tách 'Trái cây + Khăn lạnh + Trà đá' thành các item riêng.",
                    "count": summary.get("bundle_rows_split", 0),
                },
                {
                    "name": "Chống trùng lặp trong cùng set menu",
                    "detail": "Loại item trùng lặp sau chuẩn hóa theo khóa (set_id, item_name_clean).",
                    "count": summary.get("duplicate_items_removed", 0),
                },
            ],
            "correction_examples": report.get("correction_examples", []),
        },
        "transformation": {
            "description": "Chuyển set menu sạch sang cơ sở dữ liệu giao dịch TID → Items để chạy Apriori.",
            "transactions": {
                "count": transactions.get("count", 0),
                "min_item_count": transactions.get("min_item_count", 0),
                "max_item_count": transactions.get("max_item_count", 0),
                "avg_item_count": transactions.get("avg_item_count", 0),
                "preview": transactions.get("preview", []),
            },
        },
        "reduction": {
            "description": "Loại khỏi tập khai phá các item không giúp phân biệt set menu hoặc dễ sinh luật hiển nhiên.",
            "excluded_item_groups": [
                {
                    "group": "Món/phần phục vụ đi kèm",
                    "items": ["Trái cây", "Khăn lạnh", "Trà đá"],
                    "rows": summary.get("service_items_rows", 0),
                },
                {
                    "group": "Món xuất hiện trong mọi set",
                    "items": ["Cơm niêu"],
                    "rows": summary.get("common_items_rows", 0),
                },
            ],
            "items_used_for_mining": summary.get("mining_item_rows", 0),
            "top_repeated_items": transactions.get("top_repeated_items", []),
        },
        "method_notes": report.get("method_notes", []),
        "generated_on": report.get("generated_on"),
    }
