
    //chức năng hiển thị mật khẩu
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


    //chức năng đăng kýký
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('name');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');
    const requestOtpButton = document.getElementById('requestOtpButton');
    const otpInput = document.getElementById('otp');
    const registerButton = document.getElementById('registerButton');
    //tạo bộ đếm ngượcngược
    let countdownInterval;
    let timeLeft = 0;
    let originalRequestOtpButtonContent = ''; // Biến để lưu nội dung gốc của nút

    // Hàm bắt đầu bộ đếm ngược
    function startCountdown(duration) {
        timeLeft = duration;
        requestOtpButton.disabled = true;
        // Giữ lại icon phong bì và thêm số giây
        requestOtpButton.innerHTML = `<i class="far fa-envelope mr-1"></i>${timeLeft}s`; 
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                requestOtpButton.disabled = false;
                requestOtpButton.innerHTML = originalRequestOtpButtonContent; // Khôi phục nội dung gốc khi hết giờ
            } else {
                requestOtpButton.innerHTML = `<i class="far fa-envelope mr-1"></i>${timeLeft}s`;
            }
        }, 1000);
    }

    registerButton.disabled = true; // Ban đầu nút đăng ký sẽ bị vô hiệu hóa

    // Lắng nghe sự kiện click cho nút "Nhận Code" (requestOtpButton)
    requestOtpButton.addEventListener('click', async function(e) {
        e.preventDefault();

        messageDiv.textContent = '';
        messageDiv.className = 'mt-1 text-center'; // Giữ nguyên các class ban đầu, chỉ reset text và màu

        const email = emailInput.value.trim();

        if (!email) {
            messageDiv.textContent = 'Hãy nhập email của bạn.';
            messageDiv.classList.add('text-red-500');
            return;
        }

        // Kiểm tra nếu đang trong thời gian đếm ngược
        if (timeLeft > 0) {
            messageDiv.textContent = `Vui lòng chờ ${timeLeft} giây trước khi gửi lại mã.`;
            messageDiv.classList.add('text-red-500');
            return;
        }

        originalRequestOtpButtonContent = requestOtpButton.innerHTML;
        
        requestOtpButton.disabled = true;
        requestOtpButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang gửi...';

        try {
            const response = await fetch('/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Email: email })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message;
                messageDiv.classList.add('text-green-500');

                startCountdown(60);
                registerButton.disabled = false; // Kích hoạt nút đăng ký

            } else {
                let errorMessage = 'Yêu cầu mã OTP thất bại.';
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = data.errors.map(err => err.description).join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                messageDiv.textContent = errorMessage;
                messageDiv.classList.add('text-red-500');

                requestOtpButton.disabled = false;
                requestOtpButton.innerHTML = originalRequestOtpButtonContent;
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu mã OTP:', error);
            messageDiv.textContent = 'Email đã được sử dụng. Vui lòng chọn email khác!'; // Khôi phục thông báo lỗi mạng
            messageDiv.classList.add('text-red-500');

            requestOtpButton.disabled = false;
            requestOtpButton.innerHTML = originalRequestOtpButtonContent;
        }
    });

    // Lắng nghe sự kiện click cho nút đăng ký
    registerButton.addEventListener('click', async function(e) {
        e.preventDefault();

        messageDiv.textContent = '';
        messageDiv.className = 'mt-1 text-center'; // Giữ nguyên các class ban đầu, chỉ reset text và màu

        const otp = otpInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value;

        if (!otp || !name || !password) {
            messageDiv.textContent = 'Mã OTP, tên và mật khẩu là bắt buộc.';
            messageDiv.classList.add('text-red-500');
            return;
        }

        try {
            const response = await fetch('/user/register/otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Otp: otp, Name: name, Password: password })
            });

            const data = await response.json();

            if (response.ok) {
                const loadingModal = document.getElementById('loadingModal'); 
                if (loadingModal) {
                    loadingModal.classList.remove('hidden');
                    loadingModal.classList.add('flex');
                }

                setTimeout(() => {
                    if (loadingModal) {
                        loadingModal.classList.remove('flex');
                        loadingModal.classList.add('hidden');
                    }
                    window.location.href = '/loginPage.html';
                }, 2000);
            } else {
                let errorMessage = 'Xác nhận OTP thất bại.';
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = data.errors.map(err => err.description).join('\n');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                messageDiv.textContent = errorMessage;
                messageDiv.classList.add('text-red-500');
            }
        } catch (error) {
            console.error('Lỗi khi xác nhận OTP:', error);
            messageDiv.textContent = 'Đã xảy ra lỗi mạng. Vui lòng thử lại sau.';
            messageDiv.classList.add('text-red-500');
        }
    });