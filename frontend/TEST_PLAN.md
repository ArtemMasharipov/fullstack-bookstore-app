# Admin Panel CRUD Operations Test Plan

This test plan outlines the steps to verify that all CRUD operations for books and authors have been correctly moved from public components to the admin panel.

## Book Management Tests

### Public Area Tests

1. **BookList Component**
   - Verify that the "Manage Books" button only appears for users with `admin:access` permission
   - Confirm that clicking the "Manage Books" button navigates to `/admin/books`
   - Verify that no "Create New Book", "Edit", or "Delete" buttons appear in the public area

2. **BookCard Component**
   - Verify that no direct "Edit" or "Delete" buttons appear on book cards
   - Confirm that admin users see a "Manage in Admin" button that navigates to the admin books section
   - Verify that clicking a book card still navigates to book details
   - Confirm "Add to Cart" functionality still works correctly

3. **BookDetails Component**
   - Verify that edit/delete actions are not available directly
   - Confirm that admin users see a "Manage in Admin" button that navigates to the admin panel

### Admin Area Tests

1. **AdminBooksView Component**
   - Verify that "Add Book" button opens the book form modal
   - Confirm that book list shows edit/delete actions for each book
   - Verify editing a book opens the form with pre-populated data
   - Confirm deleting a book shows confirmation dialog before removing
   - Verify that pagination, search and filtering functionality works correctly

## Author Management Tests

### Public Area Tests

1. **AuthorList Component**
   - Verify that the "Manage Authors" button only appears for users with `admin:access` permission
   - Confirm that clicking this button navigates to `/admin/authors`
   - Verify that no author creation form appears in the public area

2. **AuthorListItem Component**
   - Verify that no direct "Edit" or "Delete" buttons appear on author items
   - Confirm that admin users see a "Manage in Admin" button
   - Verify that clicking an author item still navigates to author details

3. **AuthorDetails Component**
   - Verify that edit/delete actions are not available directly
   - Confirm that admin users see a "Manage in Admin" button that navigates to the admin panel

### Admin Area Tests

1. **AdminAuthorsView Component**
   - Verify that "Add Author" button opens the author form modal
   - Confirm that author list shows edit/delete actions for each author
   - Verify editing an author opens the form with pre-populated data
   - Confirm deleting an author shows confirmation dialog before removing

## User Role Tests

1. **Regular User (without admin:access permission)**
   - Verify that no admin management buttons or links are visible
   - Confirm that attempting to navigate directly to admin routes is blocked

2. **Admin User (with admin:access permission)**
   - Verify that all admin management buttons and links are visible
   - Confirm access to all admin routes works correctly

## Navigation Tests

1. **NavBar Component**
   - Verify that Admin Panel link only appears for users with `admin:access` permission
   - Confirm that clicking the Admin Panel link navigates to `/admin`

## Error Handling Tests

1. **Access Control**
   - Verify that users without admin permissions cannot access admin routes
   - Confirm appropriate error messages are displayed when unauthorized access is attempted
