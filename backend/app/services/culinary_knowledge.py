"""Domain knowledge used by the hybrid recommendation engine.

The rules below are an engineering interpretation of the cited references,
not verbatim claims or a nutrition diagnosis.
"""

CULINARY_KNOWLEDGE_SOURCES = [
    {
        "id": "tran_ngoc_them_1999",
        "author": "Trần Ngọc Thêm",
        "title": "Cơ sở văn hóa Việt Nam",
        "publisher": "Nhà xuất bản Giáo dục",
        "year": 1999,
        "applied_to": "Diễn giải cấu trúc bữa ăn thành món nền tảng, món đạm đưa cơm và rau/canh cân bằng.",
    },
    {
        "id": "nguyen_nha_2009",
        "author": "Nguyễn Nhã",
        "title": "Bản sắc ẩm thực Việt Nam",
        "publisher": "Nhà xuất bản Thông Tấn",
        "year": 2009,
        "applied_to": "Xây dựng nguyên tắc phối hợp món đậm, chiên/kho với món thanh, rau và canh.",
    },
    {
        "id": "nni_four_food_groups",
        "author": "Viện Dinh dưỡng Quốc gia",
        "title": "Ăn đa dạng và đảm bảo đủ bốn nhóm thực phẩm",
        "publisher": "Bộ Y tế",
        "year": 2019,
        "url": "https://chuyentrang.viendinhduong.vn/vi/10-loi-khuyen-dinh-duong-hop-ly/loi-khuyen-so-1-an-da-dang-nhieu-loai-thuc-pham-va-dam-bao-du-4-nhom-chat-bot-chat-dam-chat-beo-vitamin-va-muoi-khoang.html",
        "applied_to": "Định hướng kiểm tra độ phủ nhóm bột đường, chất đạm, chất béo, vitamin và khoáng chất.",
    },
]


MEAL_ROLE_LABELS = {
    "foundation": "Món nền tảng và nhóm bột đường",
    "savory": "Món đạm đưa cơm",
    "fresh": "Rau/canh cân bằng",
    "feast": "Món khai vị, lẩu, tiệc hoặc món bổ sung",
}


# Missing-role matrix for an ordinary Vietnamese shared meal.
ROLE_COMPLETION_RULES = {
    frozenset({"foundation", "savory"}): (
        {"fresh"},
        {"rau", "canh"},
        "Bổ sung rau/canh để cân bằng món nền và món đạm.",
    ),
    frozenset({"savory", "fresh"}): (
        {"foundation"},
        {"com"},
        "Bổ sung món nền thuộc nhóm bột đường.",
    ),
    frozenset({"foundation", "fresh"}): (
        {"savory"},
        {"heo", "ga", "bo", "ca", "hai san"},
        "Bổ sung món đạm để hoàn thiện cấu trúc bữa ăn.",
    ),
}


COMPLETE_MEAL_CATEGORIES = {"khai vi", "trang mieng", "appetizer_drink"}
HOT_POT_EXTRA_CATEGORIES = {"khai vi", "mon them", "trang mieng", "appetizer_drink"}
