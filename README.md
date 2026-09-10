# Phase 1 MVP - Prototypes & Mockups

## Bản rà soát ngày 09/09/2026

Mở `index.html` trực tiếp trên trình duyệt. Bản này có Dancer App và Admin CMS dùng chung dữ liệu mẫu, lưu local trên máy; không kết nối staging/production.

- [Báo cáo BA / field mapping 19 views / Design / QC / PM](review/BA_DESIGN_QC_REVIEW.md)
- [ERD snapshot từ link được cung cấp](review/erd.snapshot.dbml)
- [Kết quả automation](review/test-results.json)
- Chạy lại kiểm thử: `node prototype.test.cjs`.
- Bản HTML trước khi chỉnh: `.local-review/2026-09-09/index.before.html`.

**Quan trọng:** một số chức năng SOW chưa có model trong ERD. Prototype giữ chúng trong `extensions` để review flow, không xác nhận backend đã triển khai. Các đề xuất cần chốt được ghi rõ trong báo cáo. Danh sách cũ dưới đây chỉ là ghi chú lịch sử; mapping hiện hành nằm trong báo cáo 19 views.

Thư mục này chứa các thiết kế, giao diện mẫu (mockups) và prototype tương tác cho **Phase 1 MVP (Hammer Job Agent)**.

---

## 📱 1. Luồng Dancer (Mobile App)
* **Screen 1: Age Gate 18+** (Màn hình xác thực độ tuổi & điều khoản chặn trẻ vị thành niên).
* **Screen 2: Job Feed & Match Score** (Bảng tin việc làm hiển thị % điểm match).
* **Screen 3: AI Pitch Draft Modal** (Trình soạn nháp thư/tin nhắn ứng tuyển 1-click copy/edit).
* **Screen 4: User Link Submission** (Dancer tự dán link tuyển dụng ngoài vào hệ thống).
* **Screen 5: Job Reporting** (Nút gắn cờ báo cáo tin rác/lừa đảo).

---

## 🖥️ 2. Luồng Admin (CMS Portal)
* **Screen 6: Ingested Job Pipeline** (Danh sách việc làm đã cào & nguồn crawler).
* **Screen 7: User Submissions Review** (Duyệt link việc làm dancer gửi lên).
* **Screen 8: Match-rate & Precision Dashboard** (Đo lường tỷ lệ khớp việc AI).
* **Screen 9: AI Token & Operational Metrics Widget** (Thống kê token tiêu thụ & chỉ số vận hành).
