import { authFetch, clearToken } from './auth.js';
import { open as openSettingsModal } from './settings-modal.js';

let isInitialized = false;
let modal, outer, backdrop, avatarUser, userName, userEmail, settingBtn;

function initializeDropdown() {
    if (isInitialized) return;

    modal = document.getElementById("modal-dropdown");
    outer = document.getElementById("dropdown-modal-outer");
    avatarUser = document.getElementById("avatar-dropdown");
    userName = document.getElementById("dropdown-name");
    userEmail = document.getElementById("dropdown-email");
    backdrop = document.getElementById("dropdown-backdrop");
    // Lấy đúng nút settings bên trong dropdown
    settingBtn = document.getElementById("setting-dropdown"); 
    const signup = document.getElementById("signup-btn");
    const login = document.getElementById("login-btn");
    const logout = document.getElementById("logout-btn");
    if (!modal || !backdrop || !outer || !settingBtn) {
        console.error("Một hoặc nhiều phần tử của dropdown không được tìm thấy.");
        return;
    }

    signup?.addEventListener('click', () => {
        window.location.href = '/registerPage.html';
    });
    login?.addEventListener('click', () => {
        window.location.href = '/loginPage.html';
    });
    logout?.addEventListener('click', (e) => {
        e.preventDefault();
        clearToken(); // Xóa JWT token khỏi localStorage
        window.location.href = '/loginPage.html'; // Chuyển hướng về trang đăng nhập
    });
    // Gắn sự kiện để đóng modal
    outer?.addEventListener('click', (e) => {
        // Ngăn sự kiện click lan xuống các phần tử bên dưới
        e.stopPropagation(); 
        if (e.target === outer) {
            close();
        }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
    });
    backdrop?.addEventListener('click', close);

    // Gắn sự kiện mở settings modal
    settingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettingsModal();
        close(); // Đóng dropdown sau khi mở settings
    });


    
    isInitialized = true;
}

export async function open() {
    console.log('Dropdown open() được gọi');
    initializeDropdown(); // Đảm bảo mọi thứ đã được khởi tạo

    if (!modal || !outer) return;
    modal.classList.remove("hidden"); // Chỉ cần hiển thị modal cha là đủ
    backdrop.classList.remove("hidden");
    requestAnimationFrame(() => {
        modal.classList.add("scale-100", "opacity-100");
        modal.classList.remove("scale-95", "opacity-0");
    });

    
    try {
        const res = await authFetch('/user/read');
        if (!res.ok) throw new Error('Không thể đọc thông tin người dùng');
        const data = await res.json();
        userName.textContent = data.name ?? data.Name ?? 'User';
        userEmail.textContent = data.email ?? data.Email ?? 'Email';
        avatarUser.src = data.avatarUrl || ''; // Để trống nếu không có avatar
    } catch (error) {
        console.error('Không thể tải chi tiết người dùng cho dropdown:', error);
    }
}

function close() {
    if (!modal || !backdrop || !outer) return;
    modal.classList.add("scale-95", "opacity-0");
    modal.classList.remove("scale-100", "opacity-100");

    // Sau khi animation xong (200ms), ẩn hoàn toàn
    setTimeout(() => {
        modal.classList.add("hidden");
        backdrop.classList.add("hidden");
    }, 200);
}
