#!/bin/bash

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Create necessary directories
mkdir -p "$BASE_DIR/components/ui"
mkdir -p "$BASE_DIR/components/layout"
mkdir -p "$BASE_DIR/components/features"
mkdir -p "$BASE_DIR/store/modules"
mkdir -p "$BASE_DIR/services/api"
mkdir -p "$BASE_DIR/utils"
mkdir -p "$BASE_DIR/router"
mkdir -p "$BASE_DIR/assets/images"
mkdir -p "$BASE_DIR/assets/styles"

# 1. Move UI components
echo "Moving common UI components..."
cp -r "$BASE_DIR/components/common/"* "$BASE_DIR/components/ui/"

# 2. Move layout components
echo "Moving layout components..."
cp -r "$BASE_DIR/components/layout/"* "$BASE_DIR/components/layout/"

# 3. Move feature components (auth, books, etc.)
echo "Moving feature-specific components..."
cp -r "$BASE_DIR/components/auth" "$BASE_DIR/components/features/"
cp -r "$BASE_DIR/components/authors" "$BASE_DIR/components/features/"
cp -r "$BASE_DIR/components/books" "$BASE_DIR/components/features/"
cp -r "$BASE_DIR/components/cart" "$BASE_DIR/components/features/"
cp -r "$BASE_DIR/components/orders" "$BASE_DIR/components/features/"
cp "$BASE_DIR/components/UserManagement.vue" "$BASE_DIR/components/features/"

# 4. Move API files to services
echo "Moving API files to services..."
cp -r "$BASE_DIR/api/"* "$BASE_DIR/services/api/"

# 5. Organize stores by feature
echo "Organizing store files..."
mkdir -p "$BASE_DIR/store/modules/auth"
mkdir -p "$BASE_DIR/store/modules/authors"
mkdir -p "$BASE_DIR/store/modules/books"
mkdir -p "$BASE_DIR/store/modules/cart"
mkdir -p "$BASE_DIR/store/modules/orders"
mkdir -p "$BASE_DIR/store/modules/users"
mkdir -p "$BASE_DIR/store/modules/ui"

# Move store files to their respective feature folders
cp "$BASE_DIR/stores/auth.js" "$BASE_DIR/store/modules/auth/"
cp "$BASE_DIR/stores/authUi.js" "$BASE_DIR/store/modules/auth/"
cp "$BASE_DIR/stores/authors.js" "$BASE_DIR/store/modules/authors/"
cp "$BASE_DIR/stores/authorsUi.js" "$BASE_DIR/store/modules/authors/"
cp "$BASE_DIR/stores/books.js" "$BASE_DIR/store/modules/books/"
cp "$BASE_DIR/stores/booksUi.js" "$BASE_DIR/store/modules/books/"
cp "$BASE_DIR/stores/cart.js" "$BASE_DIR/store/modules/cart/"
cp "$BASE_DIR/stores/orders.js" "$BASE_DIR/store/modules/orders/"
cp "$BASE_DIR/stores/ordersUi.js" "$BASE_DIR/store/modules/orders/"
cp "$BASE_DIR/stores/users.js" "$BASE_DIR/store/modules/users/"
cp "$BASE_DIR/stores/usersUi.js" "$BASE_DIR/store/modules/users/"
cp "$BASE_DIR/stores/ui.js" "$BASE_DIR/store/modules/ui/"
cp "$BASE_DIR/stores/storeFactory.js" "$BASE_DIR/store/modules/"
cp "$BASE_DIR/stores/index.js" "$BASE_DIR/store/"

# 6. Move admin views to views directory
echo "Moving admin views..."
mkdir -p "$BASE_DIR/views/admin"
cp -r "$BASE_DIR/admin/views/"* "$BASE_DIR/views/admin/"

# 7. Move admin components
echo "Moving admin components..."
mkdir -p "$BASE_DIR/components/features/admin"
cp -r "$BASE_DIR/admin/components/"* "$BASE_DIR/components/features/admin/"

# 8. Move admin layouts
echo "Moving admin layouts..."
mkdir -p "$BASE_DIR/components/layout/admin"
cp -r "$BASE_DIR/admin/layouts/"* "$BASE_DIR/components/layout/admin/"

# 9. Move styles to assets
echo "Moving styles..."
cp -r "$BASE_DIR/styles/"* "$BASE_DIR/assets/styles/"

# Echo completion message
echo "Project restructuring complete. Please update import statements in all files."
