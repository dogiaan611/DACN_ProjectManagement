import { authFetch } from "../auth/auth.js";

// Lấy danh sách tất cả tag của project
export async function getProjectTags(projectId) {
    try {
        const res = await authFetch(`/projects/${projectId}/tags`);
        if (!res.ok) throw new Error('Failed to fetch tags');
        return await res.json();
    } catch (err) {
        console.error('Error fetching project tags:', err);
        return [];
    }
}

// Tạo tag mới cho project
export async function createProjectTag(projectId, name, color = '#3B82F6') {
    try {
        const res = await authFetch(`/projects/${projectId}/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, color })
        });
        if (!res.ok) throw new Error('Failed to create tag');
        return await res.json();
    } catch (err) {
        console.error('Failed to add tag:', err);
        throw err;
    }
}

// Sửa tag
export async function updateProjectTag(projectId, tagId, name, color) {
    try {
        const res = await authFetch(`/projects/${projectId}/tags/${tagId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, color })
        });
        if (!res.ok) throw new Error('Failed to update tag');
        return await res.json();
    } catch (err) {
        console.error('failed to edit tag: ', err);
        throw err;
    }
}

// Xóa tag
export async function deleteProjectTag(projectId, tagId) {
    try {
        const res = await authFetch(`/projects/${projectId}/tags/${tagId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete tag');
        return await res.json();
    } catch (err) {
        console.error('failed to delete tag: ', err);
        throw err;
    }
}