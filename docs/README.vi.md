<div align="center">
  <img src="https://raw.githubusercontent.com/chameleon-nexus/claude-code-vscode/main/media/icon.svg" alt="Chameleon Logo" width="120px">
  <h1>Trợ lý AI Chameleon</h1>
  <p>
    <strong>Khai thác AI tiên tiến để cách mạng hóa quy trình làm việc lập trình và sáng tạo. Trạm làm việc AI cục bộ mã nguồn mở và có thể mở rộng của bạn.</strong>
  </p>
  <p>
    <a href="../README.md">English</a> | <a href="./README.es.md">Español</a> | <a href="./README.ja.md">日本語</a> | <a href="./README.de.md">Deutsch</a> | <a href="./README.fr.md">Français</a> | <a href="./README.zh.md">简体中文</a> | <a href="./README.pt.md">Português</a> | <a href="./README.vi.md">Tiếng Việt</a> | <a href="./README.hi.md">हिन्दी</a> | <a href="./README.ko.md">한국어</a> | <a href="./README.ru.md">Русский</a> | <a href="./README.ar.md">العربية</a>
  </p>
</div>

---

## 🦎 Chameleon là gì?

Chameleon không chỉ là một cửa sổ chat AI khác. Đây là một tiện ích mở rộng VS Code mã nguồn mở mạnh mẽ biến đổi trình chỉnh sửa của bạn thành một notebook chuyên nghiệp, cục bộ và được điều khiển bởi AI.

Được thiết kế cho các nhà phát triển, nhà văn và nhà nghiên cứu, Chameleon trao lại quyền kiểm soát AI cho bạn. Nó tích hợp sâu vào quy trình làm việc của bạn, cho phép bạn kết nối liền mạch với bất kỳ nhà cung cấp AI bên thứ ba nào (như OpenAI, Google Gemini, DeepSeek, v.v.), quản lý các mô hình cục bộ và đám mây, và xây dựng chuỗi công cụ AI riêng tư của riêng bạn trong môi trường quen thuộc của VS Code.

## ✨ Tính năng chính

* **🎯 6 động cơ AI, 20+ mô hình được chọn lọc**: Giải phóng khỏi sự ràng buộc nhà cung cấp! Hỗ trợ OpenRouter, DeepSeek, Google, Volcengine, Azure, Ollama và 6 động cơ AI chính khác, bao gồm 20+ mô hình được chọn lọc cẩn thận, bao gồm GPT-4o, Claude 3.5 Sonnet, DeepSeek V3 mới nhất, v.v.
* **🧠 5 cấu hình mô hình chuyên biệt**: Cấu hình thông minh các mô hình văn bản ngắn, văn bản dài, suy nghĩ, hình ảnh và video, cho phép mỗi tác vụ sử dụng mô hình AI phù hợp nhất.
* **🎨 Hỗ trợ AI đa phương thức**: Không chỉ hỗ trợ hội thoại văn bản mà còn hiểu hình ảnh, phân tích video, nhận dạng OCR và các khả năng AI đa phương tiện khác.
* **⚡ Định tuyến mô hình thông minh**: Tự động chọn mô hình tốt nhất dựa trên độ phức tạp tác vụ, độ dài nội dung và loại phương thức để đạt được sự cân bằng hoàn hảo giữa hiệu suất và chi phí.
* **📓 Giao diện notebook chuyên nghiệp**: Vượt ra ngoài Q&A đơn giản. Tổ chức các tác vụ được điều khiển bởi AI trong một notebook văn bản phong phú kết hợp hoàn hảo Markdown, đoạn mã và lời nhắc AI.
* **🔒 Thiết kế ưu tiên quyền riêng tư**: Hỗ trợ thực thi mô hình cục bộ, cho bạn kiểm soát hoàn toàn về bảo mật dữ liệu trong khi vẫn cung cấp sự tiện lợi của các API đám mây.
* **🎛️ Tích hợp IDE sâu**: Cảm giác như một tính năng gốc của VS Code. Truy cập các công cụ AI mạnh mẽ trực tiếp thông qua menu ngữ cảnh, code lens và các panel thanh bên chuyên dụng.
* **🌍 Hỗ trợ 12 ngôn ngữ**: Trải nghiệm quốc tế hóa hoàn chỉnh bằng tiếng Trung, tiếng Anh, tiếng Nhật, tiếng Đức, tiếng Pháp, tiếng Tây Ban Nha, tiếng Bồ Đào Nha, tiếng Việt, tiếng Hindi, tiếng Hàn, tiếng Nga và tiếng Ả Rập.

## 🚀 Cài đặt và cấu hình

Chọn đường dẫn cài đặt phù hợp với bạn:

### Tùy chọn 1: Cho người dùng cuối (Được khuyến nghị)

Làm theo các bước này để cài đặt và sử dụng tiện ích mở rộng Chameleon từ VS Code Marketplace.

**Bước 1: Cài đặt các phụ thuộc**

Chameleon yêu cầu `Claude Code` và `Claude Code Router` để hoạt động. Chúng tôi đã làm cho điều này trở nên dễ dàng:
1. Đầu tiên, cài đặt tiện ích mở rộng này trong VS Code (xem Bước 2).
2. Mở bảng lệnh (`Ctrl+Shift+P` hoặc `Cmd+Shift+P`).
3. Chạy lệnh `Chameleon: Mở hướng dẫn cài đặt`.
4. Làm theo các bước chi tiết trong hướng dẫn để hoàn thành việc cài đặt Node.js, Git và các điều kiện tiên quyết khác.

**Bước 2: Cài đặt tiện ích mở rộng**

1. Mở Visual Studio Code.
2. Đi đến chế độ xem tiện ích mở rộng (`Ctrl+Shift+X`).
3. Tìm kiếm **"Chameleon - 智能文档助手"**.
4. Nhấp vào "Cài đặt".

**Bước 3: Cấu hình nhà cung cấp AI**

1. Mở bảng lệnh (`Ctrl+Shift+P`).
2. Chạy lệnh `Chameleon: Mở cài đặt AI`.
3. Chọn nhà cung cấp AI bạn muốn sử dụng và nhập khóa API của bạn.
4. Cấu hình hoàn tất! Nhấp vào biểu tượng Chameleon trong thanh hoạt động VS Code để bắt đầu.

### Tùy chọn 2: Cho nhà phát triển (Từ mã nguồn)

Làm theo các bước này nếu bạn muốn chạy tiện ích mở rộng từ mã nguồn hoặc đóng góp cho dự án.

**Điều kiện tiên quyết:**
* Git đã được cài đặt.
* Node.js đã được cài đặt (khuyến nghị v16 trở lên).
* Tất cả các phụ thuộc từ **Hướng dẫn cài đặt** (`Claude Code`, `Claude Code Router`, v.v.) phải được cài đặt và cấu hình.

**Các bước:**

1. **Sao chép kho lưu trữ:**
   ```bash
   git clone https://github.com/chameleon-nexus/claude-code-vscode.git
   cd claude-code-vscode
   ```

2. **Cài đặt các phụ thuộc dự án:**
   ```bash
   npm install
   ```

3. **Biên dịch mã:**
   * Biên dịch một lần: `npm run compile`
   * Theo dõi thay đổi tệp và biên dịch tự động: `npm run watch`

4. **Chạy tiện ích mở rộng:**
   * Mở thư mục dự án này trong VS Code.
   * Nhấn `F5` để khởi chạy cửa sổ "Extension Development Host" mới với tiện ích mở rộng Chameleon đang chạy.

## 🎯 Động cơ AI và mô hình được hỗ trợ

Chameleon hỗ trợ **6 động cơ AI chính** thông qua Claude Code Router, bao gồm **20+ mô hình được chọn lọc cẩn thận** cho các khả năng AI cấp chuyên nghiệp:

### 🔥 Động cơ AI văn bản

#### **OpenRouter**
- **Claude 3.5 Sonnet**: Khả năng suy luận mạnh nhất
- **Claude 3 Haiku**: Phiên bản nhanh và nhẹ
- **GPT-4o**: Mô hình đa phương thức mới nhất
- **GPT-4o-mini**: Phiên bản nhẹ với hiệu suất chi phí tuyệt vời
- **Llama 3.1 405B**: Mô hình lớn mã nguồn mở
- **Gemini Pro 1.5**: Chuyên gia ngữ cảnh dài

#### **DeepSeek**
- **DeepSeek Chat**: Mô hình hội thoại chung
- **DeepSeek Coder**: Tạo mã chuyên nghiệp

#### **Google Gemini**
- **Gemini Pro**: Mô hình suy luận chung
- **Gemini Pro Vision**: Mô hình hiểu hình ảnh

#### **Volcengine**
- **DeepSeek V3**: Phiên bản Volcengine (ngữ cảnh dài 128K token)

#### **Azure OpenAI**
- **GPT-4**: Mô hình suy luận tiên tiến cổ điển
- **GPT-4 Turbo**: Mô hình suy luận hiệu suất cao
- **GPT-3.5 Turbo**: Mô hình phản hồi nhanh

#### **Ollama** (Triển khai cục bộ)
- **Llama 3.1**: Mô hình hội thoại mã nguồn mở
- **CodeLlama**: Mô hình chuyên về mã
- **Mistral**: Mô hình suy luận hiệu quả
- **Gemma**: Mô hình nhẹ

### 🎨 Động cơ AI đa phương thức

#### **Động cơ hiểu hình ảnh - Seedream**
- Phân tích hình ảnh chuyên nghiệp, nhận dạng OCR, hiểu biểu đồ
- Hỗ trợ nhiều định dạng hình ảnh và tác vụ thị giác phức tạp

#### **Động cơ xử lý video - Seedance**
- Phân tích nội dung video chuyên nghiệp và tạo tóm tắt
- Hỗ trợ hiểu video dài và nhận dạng hành động

### ⚙️ Cấu hình mô hình thông minh

Chameleon hỗ trợ **5 cấu hình mô hình chuyên biệt** để chọn mô hình AI phù hợp nhất cho các tình huống khác nhau:

#### **1. Mô hình văn bản ngắn** (Phản hồi nhanh)
- Phù hợp cho: Q&A đơn giản, hoàn thành mã, dịch nhanh
- Được khuyến nghị: GPT-3.5-turbo, Claude 3 Haiku, DeepSeek Chat

#### **2. Mô hình văn bản dài** (Ngữ cảnh lớn)
- Phù hợp cho: Phân tích tài liệu dài, đánh giá mã, suy luận phức tạp
- Được khuyến nghị: GPT-4o, Claude 3.5 Sonnet, DeepSeek V3

#### **3. Mô hình suy nghĩ** (Suy luận sâu)
- Phù hợp cho: Giải quyết vấn đề phức tạp, thiết kế kiến trúc, tính toán toán học
- Được khuyến nghị: Claude 3.5 Sonnet, GPT-4, Llama 3.1 405B

#### **4. Mô hình hình ảnh** (Hiểu thị giác)
- Phù hợp cho: Phân tích hình ảnh, OCR, hiểu biểu đồ
- Được khuyến nghị: Động cơ Seedream

#### **5. Mô hình video** (Xử lý video)
- Phù hợp cho: Tóm tắt video, phân tích nội dung, nhận dạng hành động
- Được khuyến nghị: Động cơ Seedance

### 🚀 Chiến lược định tuyến mô hình

Hệ thống định tuyến thông minh của Chameleon tự động chọn mô hình tốt nhất dựa trên:

- **Độ phức tạp tác vụ**: Tác vụ đơn giản → mô hình nhanh, tác vụ phức tạp → mô hình suy luận
- **Độ dài nội dung**: Văn bản ngắn → mô hình nhẹ, tài liệu dài → mô hình ngữ cảnh lớn
- **Loại phương thức**: Văn bản → mô hình ngôn ngữ, hình ảnh → động cơ Seedream, video → động cơ Seedance
- **Tùy chọn người dùng**: Chỉ định thủ công các mô hình cụ thể
- **Tối ưu hóa chi phí**: Cân bằng hoàn hảo giữa hiệu suất và chi phí

## 🏗️ Kiến trúc

### Thành phần
```
Tiện ích mở rộng Chameleon
├── Panel chào mừng          # Giao diện giới thiệu
├── Panel cài đặt           # Cấu hình nhà cung cấp AI
├── Panel chat              # Giao diện hội thoại AI
├── Panel hướng dẫn cài đặt # Hướng dẫn cài đặt
├── Panel cài đặt hệ thống  # Cài đặt ngôn ngữ và chủ đề
└── Claude Client          # Tích hợp mô hình AI
```

### Cấu trúc tệp
```
chameleon/
├── src/
│   ├── extension.ts           # Điểm vào chính của tiện ích mở rộng
│   ├── webviews/              # Panel UI
│   │   ├── settingsPanel.ts   # Cài đặt AI
│   │   ├── chatPanel.ts       # Giao diện chat
│   │   ├── installGuidePanel.ts # Hướng dẫn cài đặt
│   │   └── systemSettingsPanel.ts # Cài đặt hệ thống
│   └── utils/                 # Hàm tiện ích
│       ├── i18n.ts           # Quốc tế hóa
│       └── claudeClient.ts   # Client AI
├── l10n/                     # Tệp dịch thuật
├── package.json              # Manifest tiện ích mở rộng
└── README.md                 # Tệp này
```

## 🌍 Quốc tế hóa

Chameleon hỗ trợ 12 ngôn ngữ:
- English (en)
- 简体中文 (zh)
- 日本語 (ja)
- Deutsch (de)
- Français (fr)
- Español (es)
- Português (pt)
- Tiếng Việt (vi)
- हिन्दी (hi)
- 한국어 (ko)
- Русский (ru)
- العربية (ar)

## 🔧 Khắc phục sự cố

### Vấn đề thường gặp

1. **Tiện ích mở rộng không kích hoạt**:
   - Kiểm tra bảng điều khiển nhà phát triển VS Code (Trợ giúp > Chuyển đổi công cụ nhà phát triển)
   - Xác nhận rằng tiện ích mở rộng đã được kích hoạt
   - Kiểm tra các tiện ích mở rộng xung đột

2. **Vấn đề kết nối nhà cung cấp AI**:
   - Xác nhận rằng khóa API được cấu hình đúng
   - Kiểm tra kết nối mạng
   - Xem xét cài đặt timeout API
   - Sử dụng chức năng kiểm tra kết nối tích hợp

3. **Hướng dẫn cài đặt không hoạt động**:
   - Xác nhận quyền quản trị viên (Windows)
   - Kiểm tra rằng Node.js và Git được cài đặt đúng
   - Thử cài đặt thủ công theo hướng dẫn

### Chế độ debug

Kích hoạt ghi log debug:
1. Mở cài đặt VS Code
2. Tìm kiếm "chameleon.debug"
3. Kích hoạt chế độ debug
4. Kiểm tra log "Chameleon" trong panel đầu ra

## 🤝 Đóng góp

Chameleon là một dự án mã nguồn mở được xây dựng cho cộng đồng. Chúng tôi hoan nghênh mọi loại đóng góp! Vui lòng xem [Hướng dẫn đóng góp](CONTRIBUTING.md) của chúng tôi để biết chi tiết.

### Thiết lập phát triển

1. Fork kho lưu trữ
2. Tạo nhánh tính năng
3. Thực hiện thay đổi
4. Thêm kiểm tra nếu có thể áp dụng
5. Gửi pull request

## 📄 Giấy phép mã nguồn mở

Dự án này là mã nguồn mở theo giấy phép MIT - xem tệp [LICENSE](LICENSE) để biết chi tiết.

## 🆘 Hỗ trợ

- **Báo cáo vấn đề**: [GitHub Issues](https://github.com/chameleon-nexus/claude-code-vscode/issues)
- **Thảo luận**: [GitHub Discussions](https://github.com/chameleon-nexus/claude-code-vscode/discussions)
- **Tài liệu**: [Wiki](https://github.com/chameleon-nexus/claude-code-vscode/wiki)

## 📝 Nhật ký thay đổi

### v0.1.0 (Phát hành ban đầu)
- Hỗ trợ nhà cung cấp AI phổ quát
- Giao diện notebook chuyên nghiệp
- Tích hợp IDE sâu
- Thiết kế ưu tiên quyền riêng tư
- Quốc tế hóa hoàn chỉnh (12 ngôn ngữ)
- Hướng dẫn cài đặt toàn diện

---

**Được tạo với ❤️ cho cộng đồng nhà phát triển**
