import { saveToken } from './auth.js';

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


// Login feature
        //lấy các phần tử cần thao tác
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password')
        const loginButton = document.getElementById('login-btn');
        let emailError = document.getElementById('email-msg');
        //Lắng nghe sự kiện click btn
        loginForm.addEventListener('submit', async function(e){
            e.preventDefault(); // Ngăn form submit

            const email = emailInput.value;
            const password = passwordInput.value;
            if(!email) {
                emailError.textContent = 'Email is required';
                return;
            }else if(!password){
                emailError.textContent = 'Password is required'
            }
            try{
                const response = await fetch('/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ Email: email, Password: password})
                });

                const data = await response.json();

                if(response.ok){
                    // Save JWT
                    try {
                        if (data && data.access_token) saveToken(data.access_token);
                    } catch {}
                    const loadingModal = document.getElementById('loadingModal');
                    loadingModal.classList.remove('hidden');
                    loadingModal.classList.add('flex');

                    //set timeout chuyen trang
                    setTimeout(()=>{
                        loadingModal.classList.remove('flex');
                        loadingModal.classList.add('hidden');
                        window.location.href='/index.html';
                    },2000)
                }else{
                    //xu ly loi
                    let errorMessage = 'Đăng nhập thất bại. Hãy kiểm tra email hoặc mật khẩu.';
                    if(data.errors && Array.isArray(data.errors)){
                        errorMessage = data.errors.map(err => err.description).join('\n');
                    }else if(data.message){
                        errorMessage = data.message;
                    }
                    emailError.textContent = errorMessage;
                }
            }catch(error){
                console.log('Lỗi khi gửi yêu cầu', error);
                emailError.textContent = 'Đã xảy ra lỗi mạng. vui lòng thử lại sau.';
            }
        });