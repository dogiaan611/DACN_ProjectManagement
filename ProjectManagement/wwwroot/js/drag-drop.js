/**
 * Tìm phần tử phía sau vị trí con trỏ chuột để xác định nơi chèn phần tử đang kéo.
 * @param {HTMLElement} container - Vùng chứa các phần tử có thể kéo.
 * @param {number} clientX - Tọa độ X của chuột (cho cột).
 * @param {number} clientY - Tọa độ Y của chuột (cho task).
 * @returns {HTMLElement | null} - Phần tử đứng ngay sau vị trí thả, hoặc null nếu thả ở cuối.
 */
function getDragAfterElement(container, clientX, clientY) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Kiểm tra hướng kéo-thả (ngang cho cột, dọc cho task)
        const isHorizontal = container.classList.contains('board-container');
        const offset = isHorizontal
            ? clientX - box.left - box.width / 2
            : clientY - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Global dragover to ensure smooth movement (drag event on source can be choppy)
// We need to track the currently dragging element
document.addEventListener('dragover', e => {
    const dragging = document.querySelector('.dragging');
    if (dragging && dragging._dragPreview) {
        e.preventDefault(); // Allow drop
        // Update preview position
        // Note: e.clientX/Y are available here
        dragging._dragPreview.style.left = `${e.clientX - dragging._offsetX}px`;
        dragging._dragPreview.style.top = `${e.clientY - dragging._offsetY}px`;
    }
});

/**
 * Khởi tạo chức năng kéo và thả cho một tập hợp các phần tử.
 * @param {object} options - Các tùy chọn cấu hình.
 * @param {string} options.containerSelector - Selector cho vùng chứa các mục có thể kéo.
 * @param {string} options.draggableSelector - Selector cho các mục có thể kéo.
 * @param {function} options.onDrop - Hàm callback được thực thi khi một mục được thả.
 */
export function initializeDragAndDrop({ containerSelector, draggableSelector, onDrop }) {
    const containers = document.querySelectorAll(containerSelector);
    const draggables = document.querySelectorAll(draggableSelector);

    // Create an empty image for setDragImage to hide the default ghost
    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', e => {
            e.stopPropagation(); // Fix: Stop propagation to prevent parent drag

            // Calculate offset from mouse to element top-left
            const rect = draggable.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            // Create a custom drag preview (clone)
            try {
                const preview = draggable.cloneNode(true);
                // Styling for preview to look like a lifted card
                preview.style.boxSizing = 'border-box';
                preview.style.width = `${rect.width}px`;
                preview.style.height = `${rect.height}px`;
                preview.style.position = 'fixed'; // Use fixed to follow mouse easily
                preview.style.left = `${rect.left}px`;
                preview.style.top = `${rect.top}px`;
                preview.style.zIndex = '9999';
                preview.style.pointerEvents = 'none'; // Important: let events pass through to drop targets
                preview.style.transform = 'rotate(3deg)'; // Slight tilt for effect
                preview.style.boxShadow = '0 15px 30px rgba(0,0,0,0.25)';
                preview.style.borderRadius = getComputedStyle(draggable).borderRadius || '8px';
                preview.style.background = getComputedStyle(draggable).backgroundColor || '#fff';
                preview.style.opacity = '1'; // Ensure it's solid

                document.body.appendChild(preview);
                draggable._dragPreview = preview;
                draggable._offsetX = offsetX;
                draggable._offsetY = offsetY;

                // Hide default ghost
                if (e.dataTransfer && typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(emptyImage, 0, 0);
                }

                // EffectAllowed
                e.dataTransfer.effectAllowed = 'move';

            } catch (err) {
                console.warn('Failed to create custom drag preview', err);
            }

            // Delay adding the dragging class to avoid the browser hiding the original element immediately if we want to keep it visible for a split second, 
            // but usually we want to hide the original and show the preview.
            // Standard practice: add 'dragging' class which usually reduces opacity of original.
            setTimeout(() => {
                draggable.classList.add('dragging');
            }, 0);
        });

        // Update preview position
        draggable.addEventListener('drag', e => {
            const preview = draggable._dragPreview;
            if (preview && e.clientX !== 0 && e.clientY !== 0) {
                preview.style.left = `${e.clientX - draggable._offsetX}px`;
                preview.style.top = `${e.clientY - draggable._offsetY}px`;
            }
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');

            // Remove custom preview
            try {
                const preview = draggable._dragPreview;
                if (preview && preview.parentNode) {
                    preview.parentNode.removeChild(preview);
                }
                delete draggable._dragPreview;
                delete draggable._offsetX;
                delete draggable._offsetY;
            } catch (err) {
                // ignore
            }
        });
    });

    containers.forEach(container => {
        container.addEventListener('dragover', e => {
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;

            // Only allow drop if the dragging element matches the expected type for this container
            if (!dragging.matches(draggableSelector)) return;

            e.preventDefault();

            // Quan trọng: Ngăn lỗi HierarchyRequestError.
            // Nếu container (vùng thả) nằm bên trong phần tử đang kéo, thì không làm gì cả.
            if (dragging.contains(container)) return;

            const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
            if (afterElement == null) {
                const footer = container.querySelector('.list-group-footer');
                if (footer) {
                    container.insertBefore(dragging, footer);
                } else {
                    container.appendChild(dragging);
                }
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });

        if (onDrop) {
            container.addEventListener('drop', e => {
                e.preventDefault();
                onDrop(e);
            });
        }
    });
}