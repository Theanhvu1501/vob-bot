/**
 * Các hằng số và cấu hình cho ứng dụng
 */

// Danh sách các chủ đề từ vựng được định nghĩa trước
const PREDEFINED_TOPICS = [
  // Chủ đề giao tiếp hàng ngày
  "Greetings", // Chào hỏi
  "Small Talk", // Giao tiếp xã giao
  "Daily Activities", // Hoạt động hàng ngày
  "Family", // Gia đình
  "Food & Dining", // Ăn uống
  "Shopping", // Mua sắm
  "Travel", // Du lịch
  "Transportation", // Phương tiện đi lại
  "Weather", // Thời tiết
  "Housing", // Nhà ở
  
  // Chủ đề học thuật/công việc
  "Business", // Kinh doanh
  "Technology", // Công nghệ
  "Education", // Giáo dục
  "Science", // Khoa học
  "Health", // Sức khỏe
  "Environment", // Môi trường
  "Politics", // Chính trị
  "Economics", // Kinh tế
  "Law", // Luật pháp
  "Media", // Truyền thông
  
  // Chủ đề giải trí
  "Entertainment", // Giải trí
  "Sports", // Thể thao
  "Music", // Âm nhạc
  "Movies", // Phim ảnh
  "Arts", // Nghệ thuật
  "Literature", // Văn học
  "Hobbies", // Sở thích
  "Social Media", // Mạng xã hội
  
  // Chủ đề tình cảm/xã hội
  "Relationships", // Mối quan hệ
  "Emotions", // Cảm xúc
  "Personal Development", // Phát triển bản thân
  "Culture", // Văn hóa
  "Ethics", // Đạo đức
  "Religion", // Tôn giáo
  
  // Chủ đề khác
  "Idioms", // Thành ngữ
  "Slang", // Tiếng lóng
  "Academic Vocabulary", // Từ vựng học thuật
  "General", // Chung
];

// Mô tả ngắn gọn cho mỗi chủ đề
const TOPIC_DESCRIPTIONS = {
  "Greetings": "Từ vựng về chào hỏi, giới thiệu bản thân",
  "Small Talk": "Từ vựng dùng trong giao tiếp xã giao hàng ngày",
  "Daily Activities": "Từ vựng về các hoạt động thường ngày",
  "Family": "Từ vựng về gia đình, quan hệ họ hàng",
  "Food & Dining": "Từ vựng về thực phẩm, ăn uống, nhà hàng",
  "Shopping": "Từ vựng về mua sắm, giá cả, sản phẩm",
  "Travel": "Từ vựng về du lịch, địa điểm, trải nghiệm",
  "Transportation": "Từ vựng về phương tiện đi lại, giao thông",
  "Weather": "Từ vựng về thời tiết, khí hậu, mùa",
  "Housing": "Từ vựng về nhà ở, thuê nhà, nội thất",
  "Business": "Từ vựng về kinh doanh, công việc, văn phòng",
  "Technology": "Từ vựng về công nghệ, máy tính, internet",
  "Education": "Từ vựng về giáo dục, học tập, trường học",
  "Science": "Từ vựng về khoa học, nghiên cứu, phát minh",
  "Health": "Từ vựng về sức khỏe, y tế, bệnh tật",
  "Environment": "Từ vựng về môi trường, thiên nhiên, sinh thái",
  "Politics": "Từ vựng về chính trị, chính phủ, bầu cử",
  "Economics": "Từ vựng về kinh tế, tài chính, thị trường",
  "Law": "Từ vựng về luật pháp, tòa án, hợp đồng",
  "Media": "Từ vựng về truyền thông, báo chí, tin tức",
  "Entertainment": "Từ vựng về giải trí, sự kiện, lễ hội",
  "Sports": "Từ vựng về thể thao, thi đấu, vận động viên",
  "Music": "Từ vựng về âm nhạc, nhạc cụ, thể loại nhạc",
  "Movies": "Từ vựng về phim ảnh, diễn viên, thể loại phim",
  "Arts": "Từ vựng về nghệ thuật, hội họa, điêu khắc",
  "Literature": "Từ vựng về văn học, sách, tác giả",
  "Hobbies": "Từ vựng về sở thích, thời gian rảnh",
  "Social Media": "Từ vựng về mạng xã hội, chia sẻ trực tuyến",
  "Relationships": "Từ vựng về các mối quan hệ, tình bạn, tình yêu",
  "Emotions": "Từ vựng về cảm xúc, tâm trạng, tình cảm",
  "Personal Development": "Từ vựng về phát triển bản thân, mục tiêu",
  "Culture": "Từ vựng về văn hóa, phong tục, truyền thống",
  "Ethics": "Từ vựng về đạo đức, giá trị, nguyên tắc",
  "Religion": "Từ vựng về tôn giáo, tín ngưỡng, nghi lễ",
  "Idioms": "Các thành ngữ, cụm từ cố định trong tiếng Anh",
  "Slang": "Từ lóng, tiếng lóng hiện đại",
  "Academic Vocabulary": "Từ vựng học thuật, chuyên ngành",
  "General": "Từ vựng chung, không thuộc chủ đề cụ thể",
};

module.exports = {
  PREDEFINED_TOPICS,
  TOPIC_DESCRIPTIONS
};