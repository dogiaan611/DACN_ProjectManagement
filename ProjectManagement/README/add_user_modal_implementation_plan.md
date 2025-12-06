# Admin Add User Modal Implementation Plan

## Objective
Implement an "Add User" modal in the Admin User List page to allow System Admins to directly create new users (Members or Admins) without going through the public registration process.

## 1. Backend Implementation (`UserController.cs`)

We need a new API endpoint that allows a System Admin to create a user directly.

- [ ] **Create DTO**: `AdminCreateUserDto`
    - `Name` (string, required)
    - `Email` (string, required)
    - `Password` (string, required)
    - `Role` (string, optional, default "Member")
- [ ] **Add Endpoint**: `POST /user/admin/create`
    - **Authorization**: `[Authorize(Roles = "system_admin")]`
    - **Logic**:
        1. Check if email already exists.
        2. Create `ApplicationUser` instance.
        3. Use `UserManager.CreateAsync` with the provided password.
        4. Assign the specified Role using `UserManager.AddToRoleAsync`.
        5. Update `SystemRole` property on the user entity.

## 2. Frontend HTML Structure (`adminUser.html`)

- [ ] **Add ID to Trigger Button**:
    - Locate the "Add User" button in the header.
    - Add `id="add-user-btn"` to it so JavaScript can attach the click event.
- [ ] **Create Modal HTML**:
    - Add a new Modal structure (similar to `edit-user-modal`) at the bottom of the file.
    - **ID**: `add-user-modal`
    - **Styling**: Use the documented "Premium" styles (Rounded-2xl, Shadow-2xl, clean header, black focus ring inputs).
    - **Fields**:
        - Name (text, required)
        - Email (email, required)
        - Password (password, required)
        - Role (select: Member / System Admin)
    - **Buttons**: Cancel, Create User.

## 3. Frontend JavaScript Logic (`admin-user-list.js`)

- [ ] **Initialize Modal**:
    - Add global variables for the add modal elements.
    - Create `initAddUserModal()` function.
- [ ] **Event Listeners**:
    - Wire up `#add-user-btn` to call `openAddUserModal()`.
    - Wire up Close/Cancel buttons.
    - Wire up Form Submit to `handleAddUserSubmit()`.
- [ ] **Implement `openAddUserModal()`**:
    - Reset form fields.
    - Show the modal.
- [ ] **Implement `handleAddUserSubmit()`**:
    - Prevent default form submission.
    - Gather data from inputs.
    - Call `POST /user/admin/create`.
    - Handle success: Alert user, close modal, reload user list.
    - Handle error: Alert error message.

## 4. Verification

- [ ] Run the app.
- [ ] Click "Add User" button -> Modal opens with correct styling.
- [ ] Fill form -> Submit.
- [ ] Verify new user appears in the list.
- [ ] Verify validation (duplicate email, weak password).
