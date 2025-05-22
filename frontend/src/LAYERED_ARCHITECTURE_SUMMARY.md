# Frontend Layered Architecture Reorganization

## New Structure
The frontend code has been reorganized according to Layered Architecture principles:

### Components Layer (`/src/components/`)
- **UI Components** (`/components/ui/`): Reusable UI components like buttons and modals
  - BaseModal.vue
  - ConfirmModal.vue
  - ErrorMessage.vue
  - LoadingSpinner.vue
- **Layout Components** (`/components/layout/`): Components defining page structure
  - Includes admin layouts in `/components/layout/admin/`
- **Feature Components** (`/components/features/`): Components related to specific features
  - Authentication (`/components/features/auth/`)
  - Authors (`/components/features/authors/`)
  - Books (`/components/features/books/`)
  - Cart (`/components/features/cart/`)
  - Orders (`/components/features/orders/`)
  - Admin (`/components/features/admin/`)
  - UserManagement.vue

### Views Layer (`/src/views/`)
- Page-level components tied to routes
  - HomeView.vue
  - BookDetailsView.vue
  - etc.
- Admin views (`/views/admin/`)
  - AdminDashboardView.vue
  - AdminBooksView.vue
  - etc.

### Store Layer (`/src/store/`)
- Store modules organized by features (`/store/modules/`)
  - Auth (`/store/modules/auth/`)
    - auth.js
    - authUi.js
  - Authors (`/store/modules/authors/`)
  - Books (`/store/modules/books/`)
  - Cart (`/store/modules/cart/`)
  - Orders (`/store/modules/orders/`)
  - Users (`/store/modules/users/`)
  - UI (`/store/modules/ui/`)
  - storeFactory.js
- Root store configuration (`/store/index.js`)

### Services Layer (`/src/services/`)
- API clients (`/services/api/`)
  - apiFactory.js
  - authApi.js
  - baseApi.js
  - booksApi.js
  - etc.
- Toast notification services
  - enhancedToast.js
  - toastHelpers.js

### Utils Layer (`/src/utils/`)
- Utility functions
  - index.js
  - stateHelpers.js
  - storeComposable.js
  - toastSync.js

### Router Layer (`/src/router/`)
- Route configuration
  - index.js
  - routes.js
  - authGuard.js

### Assets Layer (`/src/assets/`)
- Images (`/assets/images/`)
- Styles (`/assets/styles/`)

## Import Path Changes
All import paths have been updated to reflect the new structure:

- Components: 
  - `@/components/common/*` → `@/components/ui/*`
  - `@/components/auth/*` → `@/components/features/auth/*`
  - etc.

- Stores:
  - `@/stores/*` → `@/store/modules/*`
  - Feature-specific stores moved to feature subdirectories

- API:
  - `@/api/*` → `@/services/api/*`

- Admin:
  - `@/admin/views/*` → `@/views/admin/*`
  - `@/admin/components/*` → `@/components/features/admin/*`
  - `@/admin/layouts/*` → `@/components/layout/admin/*`

- Styles:
  - `@/styles/*` → `@/assets/styles/*`

## Architecture Benefits
This reorganization enforces proper separation of concerns:
1. **Components** are decoupled from API calls
2. **Services** handle data fetching and API interaction
3. **Stores** manage application state
4. **Views** compose components and connect to stores/services
5. **Utils** provide shared functionality across all layers

## Additional Improvements
1. Consider implementing facade patterns in services layer to further abstract API complexity
2. Add comprehensive JSDoc documentation to clarify the responsibility of each module
3. Implement strict TypeScript interfaces between layers
4. Add unit tests specifically focused on validating layer boundaries
