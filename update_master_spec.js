const fs = require('fs');
const targetFile = 'C:/Users/Song Quyen/.gemini/antigravity/brain/b57aaa6d-f757-4cdd-aeaf-d8b21cec7039/master_19_views_spec.md';
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /### 5\. Phân hệ `CMS-05` \(Vận Hành & Xử Lý Báo Cáo - Operations & Moderation\) — 2 Views\s*\* \*\*`CMS-05\.1` \[Main View\] Dashboard thống kê vận hành & Sức khỏe:\*\*[\s\S]*?\* \*\*`CMS-05\.2` \[Modal\] Xử lý tin bị Report \(Reported Jobs Moderation\):\*\*[\s\S]*?(?=\n---)/u;

const newSection = `### 5. Phân hệ \`CMS-05\` (Vận Hành & Xử Lý Báo Cáo - Operations & Moderation) — 2 Views
* **\`CMS-05.1\` [Main View] Operations Dashboard & System Configs:**
  * Thống kê số lượng: Tổng link đã quét, số job active, số đơn ứng tuyển, báo cáo tỷ lệ khớp chuẩn xác thực tế (% Precision Rate).
  * **6 THÔNG SỐ CẤU HÌNH GLOBAL (UI Operations Panel):**
    1. **Emergency Kill Switch:** Nút gạt ON/OFF ngắt cào dữ liệu toàn hệ thống lập tức khi có sự cố.
    2. **Crawler/Discovery Cron:** Cấu hình tần suất quét dữ liệu (UI Dropdown chọn giờ/ngày).
    3. **AI Score Thresholds:** Mốc điểm soft_score (0-9). Auto-publish (>= 7), Auto-reject (<= 3). Các job ở giữa -> \`need_action\`.
    4. **Job Expiry Duration:** Số ngày tự động đổi trạng thái job cũ sang Expired (VD: 30 ngày).
    5. **Report Suspension Limit:** Số lượt bị user report tối đa trước khi hệ thống tự động gỡ tin (VD: 3 lượt).
    6. **Push Notification Threshold:** Mốc % độ phù hợp để kích hoạt gửi thông báo đẩy (VD: >= 85%). *(Note: Phase 1 chỉ dựng UI và lưu Database, chưa tích hợp hạ tầng FCM/APNs)*.
    * *(Note ẩn: Tính năng Giới hạn AI Draft Limit không hiển thị lên giao diện để tối giản UI, Backend tự hardcode mặc định 3 lượt/ngày/user).*
* **\`CMS-05.2\` [Modal] Xử lý tin bị Report (Reported Jobs Moderation):**
  * Danh sách các tin bị \`>= 3\` dancer báo xấu (\`SUSPENDED\`).
  * Cho phép Admin sửa nhanh tiêu đề, thù lao, deadline và bấm \`Khôi phục ACTIVE\` hoặc \`Gỡ vĩnh viễn (REJECTED)\`.`;

if (regex.test(content)) {
    content = content.replace(regex, newSection);
    fs.writeFileSync(targetFile, content);
    console.log("Master spec updated successfully.");
} else {
    console.log("Could not find the section to replace in master_19_views_spec.md");
    // Print what we matched or trying to find
    console.log("Trying to find starting with: ### 5. Phân hệ `CMS-05`");
}
