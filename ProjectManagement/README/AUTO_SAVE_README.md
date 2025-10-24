# Auto Save Feature - User Settings

## Tổng quan
Tính năng auto save cho phép tự động lưu thông tin người dùng khi họ thay đổi nội dung trong form settings mà không cần nhấn nút "Save changes".

## Cách hoạt động

### 1. Auto Save cho Text Fields
- **Trigger**: Khi người dùng thay đổi nội dung trong các trường `Name` và `Phone`
- **Debounce**: Tự động lưu sau 2 giây không có thay đổi
- **Blur Save**: Lưu ngay lập tức khi người dùng rời khỏi trường input

### 2. Auto Save cho Avatar
- **Trigger**: Khi người dùng chọn file ảnh mới
- **Immediate Save**: Lưu ngay lập tức sau khi chọn file

### 3. Visual Indicators
- **Đang lưu**: Hiển thị spinner và text "Đang lưu..."
- **Đã lưu**: Hiển thị checkmark và text "Tự động lưu"
- **Lỗi**: Hiển thị warning icon và text "Lỗi khi lưu"

## Files liên quan

### JavaScript Files
- `wwwroot/js/user-settings-autosave.js` - Logic chính của auto save
- `wwwroot/js/settings-modal.js` - Tích hợp auto save với modal

### HTML Files
- `wwwroot/components/user_settings.html` - Form settings với auto save indicators
- `wwwroot/index.html` - Include script auto save

## API Endpoints được sử dụng

### Update Profile
```
PUT /user/update
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "string",
  "phoneNumber": "string"
}
```

### Upload Avatar
```
POST /user/upload-avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

## Cấu hình

### Debounce Time
```javascript
// Trong user-settings-autosave.js
this.debounceTimer = setTimeout(() => {
    this.autoSave();
}, 2000); // 2 giây
```

### Auto Save Indicators
- **Floating indicator**: Xuất hiện ở góc trên bên phải màn hình
- **Inline status**: Hiển thị trong form settings
- **Auto hide**: Tự động ẩn sau 2-3 giây

## Tích hợp với Save Button

Khi người dùng nhấn nút "Save changes":
1. Nếu có thay đổi chưa lưu, sẽ force save
2. Nếu đã lưu tự động, chỉ đóng modal
3. Fallback về manual save nếu auto save không khả dụng

## Error Handling

- **Network errors**: Hiển thị error indicator
- **Validation errors**: Log lỗi và hiển thị error state
- **Retry logic**: Có thể thử lại bằng cách thay đổi nội dung

## Browser Compatibility

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **ES6+ features**: Arrow functions, async/await, classes
- **File API**: Cho avatar upload

## Performance

- **Debouncing**: Tránh quá nhiều request
- **Single instance**: Chỉ một auto save instance tại một thời điểm
- **Memory cleanup**: Clear timers khi cần thiết
