import { authFetch } from '../auth/auth.js';

export class UserSettingsAutoSave {
    constructor() {
        this.debounceTimer = null;
        this.isSaving = false;
        this.hasUnsavedChanges = false;
        this.originalData = {};

        this.init();
    }

    init() {
        this.bindEvents();
        this.saveOriginalData();
        this.setupAutoSaveIndicator();
    }

    bindEvents() {
        // Lắng nghe thay đổi trên các input fields
        // Sử dụng selector cụ thể hơn để tránh conflict với sidebar
        const inputs = [
            { selector: 'input#us-name', name: 'name' },
            { selector: 'input#us-phone', name: 'phone' }
        ];

        inputs.forEach(({ selector, name }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.handleInputChange(e.target);
                });

                element.addEventListener('blur', (e) => {
                    this.handleInputBlur(e.target);
                });
                console.log('Events bound for:', selector);
            }
        });
    }

    saveOriginalData() {
        this.originalData = {
            name: document.querySelector('input#us-name')?.value || '',
            phone: document.querySelector('input#us-phone')?.value || ''
        };
    }

    handleInputChange(input) {
        console.log('Input changed:', input.id, input.value);
        this.hasUnsavedChanges = true;
        this.showAutoSaveIndicator();

        // Debounce auto save
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            console.log('Auto saving...');
            this.autoSave();
        }, 2000); // Auto save sau 2 giây không có thay đổi
    }

    handleInputBlur(input) {
        console.log('Input blur:', input.id, input.value);
        // Save ngay lập tức khi blur khỏi input
        if (this.hasUnsavedChanges) {
            clearTimeout(this.debounceTimer);
            console.log('Blur save triggered');
        }
    }

    async autoSave() {
        if (this.isSaving) return;

        this.isSaving = true;
        this.updateSaveIndicator('saving');

        try {
            const data = this.collectFormData();
            const response = await authFetch('/user/update', {
                method: 'PUT',
                body: JSON.stringify({
                    name: data.name, // Make sure backend DTO matches
                    phoneNumber: data.phone
                })
            });

            if (response.ok) {
                this.hasUnsavedChanges = false;
                this.updateSaveIndicator('saved');
                this.saveOriginalData();

                // Ẩn indicator sau 2 giây
                setTimeout(() => {
                    this.hideAutoSaveIndicator();
                    this.hideStatusIndicator();
                }, 2000);
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            console.error('Auto save failed:', error);
            this.updateSaveIndicator('error');

            // Ẩn error indicator sau 3 giây
            setTimeout(() => {
                this.hideAutoSaveIndicator();
                this.hideStatusIndicator();
            }, 3000);
        } finally {
            this.isSaving = false;
        }
    }

    async autoSaveAvatar(file) {
        if (this.isSaving) return;

        this.isSaving = true;
        this.updateSaveIndicator('saving');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await authFetch('/user/upload-avatar', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.updateAvatarPreview(result.avatarUrl);
                this.hasUnsavedChanges = false;
                this.updateSaveIndicator('saved');

                setTimeout(() => {
                    this.hideAutoSaveIndicator();
                    this.hideStatusIndicator();
                }, 2000);
            } else {
                throw new Error('Avatar save failed');
            }
        } catch (error) {
            console.error('Avatar auto save failed:', error);
            this.updateSaveIndicator('error');

            setTimeout(() => {
                this.hideAutoSaveIndicator();
                this.hideStatusIndicator();
            }, 3000);
        } finally {
            this.isSaving = false;
        }
    }

    collectFormData() {
        return {
            name: document.querySelector('input#us-name')?.value || '',
            phone: document.querySelector('input#us-phone')?.value || ''
        };
    }

    updateAvatarPreview(avatarUrl) {
        const preview = document.getElementById('us-avatar-preview');
        const initial = document.getElementById('us-avatar-initial');

        if (preview && initial) {
            preview.src = avatarUrl;
            preview.style.display = 'block';
            initial.style.display = 'none';
        }
    }

    setupAutoSaveIndicator() {
        // Tạo indicator element
        const indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 opacity-0 transform translate-y-[-10px]';
        indicator.style.zIndex = '9999';
        document.body.appendChild(indicator);
    }

    showAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateY(0)';
        }
    }

    hideAutoSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            indicator.style.transform = 'translateY(-10px)';
        }
    }

    hideStatusIndicator() {
        const statusElement = document.getElementById('auto-save-status');
        if (statusElement) {
            statusElement.classList.add('hidden');
        }
    }

    updateSaveIndicator(status) {
        const indicator = document.getElementById('auto-save-indicator');
        const statusElement = document.getElementById('auto-save-status');

        if (indicator) {
            switch (status) {
                case 'saving':
                    indicator.textContent = 'Đang lưu...';
                    indicator.className = 'fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-blue-100 text-blue-700 border border-blue-200';
                    break;
                case 'saved':
                    indicator.textContent = 'Đã lưu tự động';
                    indicator.className = 'fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-green-100 text-green-700 border border-green-200';
                    break;
                case 'error':
                    indicator.textContent = 'Lỗi khi lưu';
                    indicator.className = 'fixed top-4 right-4 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-red-100 text-red-700 border border-red-200';
                    break;
            }
        }

        if (statusElement) {
            switch (status) {
                case 'saving':
                    statusElement.className = 'text-sm text-blue-500';
                    statusElement.innerHTML = '<span class="inline-flex items-center gap-1"><svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Đang lưu...</span>';
                    statusElement.classList.remove('hidden');
                    break;
                case 'saved':
                    statusElement.className = 'text-sm text-green-500';
                    statusElement.innerHTML = '<span class="inline-flex items-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></span>';
                    statusElement.classList.remove('hidden');
                    break;
                case 'error':
                    statusElement.className = 'text-sm text-red-500';
                    statusElement.innerHTML = '<span class="inline-flex items-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>Lỗi khi lưu</span>';
                    statusElement.classList.remove('hidden');
                    break;
            }
        }
    }

    // Method để force save (có thể gọi từ button Save)
    async forceSave() {
        clearTimeout(this.debounceTimer);
        await this.autoSave();
    }
}

// Method để khởi tạo auto save cho modal
export function initUserSettingsAutoSave() {
    if (window.userSettingsAutoSave) {
        // Cleanup existing instance
        window.userSettingsAutoSave = null;
    }

    // Retry mechanism để đảm bảo elements đã sẵn sàng
    let retryCount = 0;
    const maxRetries = 5;

    const initAutoSave = () => {
        const nameElement = document.querySelector('input#us-name');
        const phoneElement = document.querySelector('input#us-phone');

        if (nameElement && phoneElement) {
            console.log('Elements found, initializing auto save');
            window.userSettingsAutoSave = new UserSettingsAutoSave();
        } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Elements not ready, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(initAutoSave, 200);
        } else {
            console.error('Failed to find required elements after retries');
        }
    };

    initAutoSave();
};
