const fs = require('fs');

const moreWords = {
  // Tooltips
  'Processing state of the extracted job, separate from moderation visibility.': 'Trạng thái xử lý của công việc, độc lập với hiển thị kiểm duyệt.',
  'Whether an admin has hidden or removed this job.': 'Admin có ẩn hoặc xóa công việc này hay không.',
  'Crawl priority: 1 is highest and 5 is lowest.': 'Độ ưu tiên cào: 1 là cao nhất, 5 là thấp nhất.',
  'Whether this source is enabled for crawling.': 'Nguồn này có đang bật để cào dữ liệu không.',
  'Latest crawl outcome. Unchanged means existing content did not need extraction.': 'Kết quả cào mới nhất. Unchanged nghĩa là nội dung không đổi nên không cần trích xuất.',
  'Response code returned by the source, such as 200 for success or 503 for unavailable.': 'Mã phản hồi từ nguồn, ví dụ 200 (thành công) hoặc 503 (lỗi mạng).',
  'Whether the run was started manually or by a schedule.': 'Lượt chạy này được kích hoạt thủ công hay tự động theo lịch.',
  'Number of sources included in this crawl run.': 'Số lượng nguồn tham gia vào lượt cào này.',
  'New page records stored by this run; unchanged content is excluded.': 'Số trang mới được lưu trong lượt chạy này; bỏ qua các nội dung không thay đổi.',
  'New opportunity records created by this run, including incomplete records.': 'Số cơ hội việc làm mới được tạo từ lượt chạy này.',
  'Review decision for the submitted source. Approval adds a crawler source, not a public job.': 'Quyết định kiểm duyệt. Chấp thuận sẽ thêm vào danh sách cào, không phải đăng bài tuyển dụng.',
  'Whether the dancer is open to work.': 'Vũ công có đang bật chế độ tìm việc hay không.',
  'Declared eligibility for Job Agent. This is not document-based identity verification.': 'Cam kết đủ tuổi tham gia Job Agent. Đây không phải xác minh danh tính bằng giấy tờ.',
  'Job Agent access only. Suspension does not disable Hammer classes or wallet.': 'Quyền truy cập Job Agent. Khóa chức năng này không làm ảnh hưởng đến tài khoản Hammer.',
  'Recorded individual source crawl attempts, including failures.': 'Số lượt thử cào dữ liệu, bao gồm cả các lượt thất bại.',
  'Jobs currently available under prototype visibility rules.': 'Công việc hiện đang mở.',
  'Jobs with a recorded draft copy, not confirmed applications.': 'Các công việc đã copy thư nháp, chưa xác nhận nộp đơn.',
  'Jobs marked as applied by dancers, not verified submissions to employers.': 'Công việc được vũ công tự đánh dấu là đã ứng tuyển.',
  'Pending reports await review. Resolved reports have an admin decision.': 'Các báo cáo đang chờ xử lý. Các báo cáo đã giải quyết sẽ có quyết định của Admin.',

  // Additional UI strings not caught yet
  'Search title, organization, city or URL': 'Tìm tiêu đề, tổ chức, thành phố hoặc URL',
  'All statuses': 'Tất cả trạng thái',
  'Total sources': 'Tổng số nguồn',
  'Total keywords': 'Tổng số từ khóa',
  'Discovery history': 'Lịch sử khám phá',
  'Jobs': 'Việc làm',
  'Settings': 'Cài đặt',
  'Preferences': 'Tuỳ chọn',
  'Open to work': 'Đang tìm việc',
  'Match score': 'Độ phù hợp',
  'Date': 'Ngày tháng',
  'Time': 'Thời gian',
  'Back to jobs': 'Quay lại danh sách',
  'Review saved draft': 'Xem lại thư nháp',
  'Undo applied status': 'Hủy đánh dấu ứng tuyển',
  'Original listing': 'Xem bài gốc',
  'Submit it through the original listing.': 'Hãy nộp đơn qua link bài gốc.',
  'Draft copied.': 'Đã sao chép thư nháp.',
  
  // Headers / Tables / Fields
  'New pages': 'Trang mới',
  'New jobs': 'Job mới',
  'Message': 'Thông điệp',
  'Last run': 'Chạy lần cuối',
  'Next run': 'Chạy lần tới',
  'Crawl status': 'Trạng thái cào',
  'Priority': 'Độ ưu tiên',
  'Enabled': 'Trạng thái Bật/Tắt',
  'Trigger': 'Phương thức kích hoạt',
  'Sources checked': 'Nguồn đã quét',
  'HTTP status': 'Mã HTTP',
  'Availability': 'Mức độ sẵn sàng',
  '18+ declaration': 'Xác thực 18+',
  'Agent access': 'Quyền truy cập',
  'Crawl attempts': 'Số lượt cào'
};

let content = fs.readFileSync('i18n.js', 'utf8');

// Simple regex replace on the dictionary object
let dictMatch = content.match(/window\.i18nDict = \{([\s\S]*?)\};/);
if (dictMatch) {
    let dictInner = dictMatch[1];
    for (let [k, v] of Object.entries(moreWords)) {
        if (!dictInner.includes('"' + k + '"')) {
            // escape any existing double quotes in keys or values just in case, though there are none here
            dictInner += ',\n  "' + k + '": "' + v + '"';
        }
    }
    content = content.replace(dictMatch[1], dictInner);
    fs.writeFileSync('i18n.js', content);
    console.log('Added ' + Object.keys(moreWords).length + ' words to i18n.js');
}
