<!-- d38f8dfc-f92d-4ae1-a6c5-97da6465cba3 45c42b4d-6040-4a42-9f10-10e635c68254 -->
# User Settings Modal Component Plan

## Tổng quan

Tạo modal settings với cấu trúc split-view: sidebar menu bên trái để điều hướng giữa các mục settings, và phần nội dung bên phải hiển thị chi tiết settings của từng mục. Modal sẽ tích hợp với UserController để lấy và cập nhật thông tin user.

## Các file cần tạo mới

### 1. Component Files

- **`wwwroot/components/settings-sidebar-menu.html`** - Menu bên trái với các mục: Profile, Security, Preferences, Notifications
- **`wwwroot/components/user-settings-content.html`** - Nội dung chính hiển thị form settings tương ứng với menu item được chọn
- **`wwwroot/components/user-settings-modal.html`** - Modal container kết hợp settings-sidebar-menu và user-settings-content

### 2. JavaScript Files

- **`wwwroot/js/user-settings-modal.js`** - Quản lý modal (open/close), load components, điều hướng giữa các tabs, tích hợp API từ UserController

## Cấu trúc modal

```
┌─────────────────────────────────────────┐
│  User Settings              [X]         │
├──────────┬──────────────────────────────┤
│ Profile  │ Profile Information          │
│ Security │ - Name: [______]             │
│ Prefs    │ - Email: [______]            │
│ Notifs   │ - Phone: [______]            │
│          │ - Avatar: [______]           │
│          │                              │
│          │ [Cancel] [Save Changes]      │
└──────────┴──────────────────────────────┘
```

## Chi tiết implementation

### Settings Sidebar Menu (Bước 1)

- Danh sách menu items: Profile, Security, Preferences, Notifications
- Active state styling
- Click handler để switch giữa các sections

### User Settings Content (Bước 2)

Các sections dựa trên UserController:

1. **Profile** - `/user/read` và `/user/update`

   - Name (UpdateDto.Name)
   - Email (read-only, hiển thị từ response)
   - PhoneNumber (UpdateDto.PhoneNumber)
   - AvatarUrl (UpdateDto.AvatarUrl)

2. **Security**

   - Change password form (sẽ cần thêm endpoint hoặc dùng Identity)
   - Delete account button → `/user/delete`

3. **Preferences**

   - UI preferences (dark mode, language) - lưu local storage
   - Auto-save toggle

4. **Notifications**

   - Email notifications preferences
   - Push notifications settings

### User Settings Modal (Bước 3)

- Gộp settings-sidebar-menu và user-settings-content
- Fixed width ~800px, max-height để scroll được
- Backdrop để đóng modal
- ESC key để đóng

### JavaScript Logic

- `UserSettingsModal` class quản lý:
  - Load 3 HTML components vào DOM
  - Open/close modal
  - Tab navigation và switching content
  - API calls:
    - GET `/user/read` khi mở modal để fill data
    - PUT `/user/update` khi save Profile
    - DELETE `/user/delete` khi delete account
  - Form validation
  - Error handling và success messages

## Cập nhật sidebar chính

### File: `wwwroot/components/sidebar.html`

Thêm `id="settings-button"` vào button settings ở line 76-80:

```html
<div role="button" tabindex="0" id="settings-button" class="...">
```

### File: `wwwroot/js/sidebar.js`

Sau khi inject sidebar HTML, bind click event cho settings button:

```javascript
const settingsBtn = document.getElementById('settings-button');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    window.UserSettingsModal?.open();
  });
}
```

### File: `wwwroot/index.html`

Thêm script tag trước `</body>`:

```html
<script src="/js/user-settings-modal.js"></script>
```

## API Integration

Sử dụng các endpoints từ UserController:

- `GET /user/read` - Lấy thông tin user (line 200-209)
- `PUT /user/update` - Cập nhật profile (line 213-235)
- `DELETE /user/delete` - Xóa account (line 238-248)

Response format từ `/user/read`:

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatarUrl": "string",
  "phoneNumber": "string",
  "roles": ["string"]
}
```

Request format cho `/user/update`:

```json
{
  "name": "string",
  "avatarUrl": "string",
  "phoneNumber": "string"
}
```

## Styling

- Sử dụng Tailwind CSS giống project-modal
- Sidebar menu: width ~200px, border-right
- Content area: flex-1, padding, overflow-y-auto
- Responsive: stack vertically trên mobile (<768px)

### To-dos

- [ ] Tạo settings-sidebar-menu.html với menu items và styling
- [ ] Tạo user-settings-content.html với 4 sections (Profile, Security, Preferences, Notifications)
- [ ] Tạo user-settings-modal.html kết hợp sidebar menu và content area
- [ ] Tạo user-settings-modal.js với class quản lý modal, tab switching, và API integration
- [ ] Thêm id='settings-button' vào button settings trong sidebar.html
- [ ] Thêm event listener cho settings button trong sidebar.js
- [ ] Thêm script tag cho user-settings-modal.js vào index.html