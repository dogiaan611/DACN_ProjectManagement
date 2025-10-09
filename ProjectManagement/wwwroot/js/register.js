
    const passwordShow = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    togglePasswordButton.addEventListener('click', function() {
        const type = passwordShow.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordShow.setAttribute('type', type);
        // Đổi icon mắt
        if(type === 'password') {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        } else {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        }
    });
    // Xem trước ảnh upload
    const fileInput = document.getElementById('file-upload');
    const avatarPreview = document.getElementById('avatarPreview');
    const fileError = document.getElementById('file-error');

    fileInput.addEventListener('change', function(e) { //thêm sự kiện change khi chọn file hoặc hủy chọn 
        const file = e.target.files && e.target.files[0]; // lấy file đầu tiên được chọn
        fileError.textContent = ''; 
        if (!file) return;
        // Kiểm tra kiểu file có phải image ko 
        if (!file.type.startsWith('image/')) {
            fileError.textContent = 'Please select an image file.';
            fileInput.value = '';
            return;
        }
        // Kiểm tra kích thước file
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            fileError.textContent = 'Image is too large (max 2MB).';
            fileInput.value = '';
            return;
        }

        // Tạo url trỏ tới file
        const url = URL.createObjectURL(file);
        // tạo thẻ img gán src là url và add vào id avatarpreview 
        avatarPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Avatar preview';
        img.className = 'w-full h-full object-cover';
        avatarPreview.appendChild(img);

        // giải phóng bộ nhớ khi ảnh load xong
        img.onload = () => URL.revokeObjectURL(url);
    });

    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('name');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Ngăn chặn form submit mặc định

        messageDiv.textContent = ''; // Xóa thông báo cũ
        messageDiv.className = 'mt-4 text-center'; // Reset class

        const email = emailInput.value;
        const name = nameInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            messageDiv.textContent = 'Email và mật khẩu không được để trống.';
            messageDiv.classList.add('text-red-500');
            return;
        }

        try {
            const response = await fetch('/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Email: email, Password: password, Name: name })
            });

            const data = await response.json();

            if (response.ok) {
                // Hiển thị modal tải
                const loadingModal = document.getElementById('loadingModal');
                loadingModal.classList.remove('hidden');
                loadingModal.classList.add('flex');

                // Chờ 2 giây rồi chuyển trang đăng nhập
                setTimeout(() => {
                    loadingModal.classList.remove('flex');
                    loadingModal.classList.add('hidden');
                    window.location.href='/loginPage.html';
                },2000)
            } else {
                // Xử lý lỗi từ server
                let errorMessage = 'Đăng ký thất bại.';
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = data.errors.map(err => err.description).join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                messageDiv.textContent = errorMessage;
                messageDiv.classList.add('text-red-500');
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu:', error);
            messageDiv.textContent = 'Đã xảy ra lỗi mạng. Vui lòng thử lại sau.';
            messageDiv.classList.add('text-red-500');
        }
    });