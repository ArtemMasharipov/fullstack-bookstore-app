#!/bin/bash

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Function to update import paths in a file
update_imports() {
    local file=$1
    echo "Processing $file..."
    
    # Components imports
    sed -i 's#@/components/common/#@/components/ui/#g' "$file"
    sed -i 's#@/components/auth/#@/components/features/auth/#g' "$file"
    sed -i 's#@/components/authors/#@/components/features/authors/#g' "$file"
    sed -i 's#@/components/books/#@/components/features/books/#g' "$file"
    sed -i 's#@/components/cart/#@/components/features/cart/#g' "$file"
    sed -i 's#@/components/orders/#@/components/features/orders/#g' "$file"
    sed -i 's#@/components/UserManagement\.vue#@/components/features/UserManagement.vue#g' "$file"
    
    # API imports
    sed -i 's#@/api/#@/services/api/#g' "$file"
    
    # Store imports
    sed -i 's#@/stores/auth\.js#@/store/modules/auth/auth.js#g' "$file"
    sed -i 's#@/stores/authUi\.js#@/store/modules/auth/authUi.js#g' "$file"
    sed -i 's#@/stores/authors\.js#@/store/modules/authors/authors.js#g' "$file"
    sed -i 's#@/stores/authorsUi\.js#@/store/modules/authors/authorsUi.js#g' "$file"
    sed -i 's#@/stores/books\.js#@/store/modules/books/books.js#g' "$file"
    sed -i 's#@/stores/booksUi\.js#@/store/modules/books/booksUi.js#g' "$file"
    sed -i 's#@/stores/cart\.js#@/store/modules/cart/cart.js#g' "$file"
    sed -i 's#@/stores/orders\.js#@/store/modules/orders/orders.js#g' "$file"
    sed -i 's#@/stores/ordersUi\.js#@/store/modules/orders/ordersUi.js#g' "$file"
    sed -i 's#@/stores/users\.js#@/store/modules/users/users.js#g' "$file"
    sed -i 's#@/stores/usersUi\.js#@/store/modules/users/usersUi.js#g' "$file"
    sed -i 's#@/stores/ui\.js#@/store/modules/ui/ui.js#g' "$file"
    sed -i 's#@/stores/storeFactory\.js#@/store/modules/storeFactory.js#g' "$file"
    sed -i 's#@/stores/#@/store/#g' "$file"
    
    # Admin imports
    sed -i 's#@/admin/views/#@/views/admin/#g' "$file"
    sed -i 's#@/admin/components/#@/components/features/admin/#g' "$file"
    sed -i 's#@/admin/layouts/#@/components/layout/admin/#g' "$file"
    
    # Styles imports
    sed -i 's#@/styles/#@/assets/styles/#g' "$file"
}

# Find all Vue and JS files and update imports
echo "Updating imports in all Vue and JS files..."

find "$BASE_DIR" -name "*.vue" -o -name "*.js" | while read -r file; do
    update_imports "$file"
done

echo "Import paths update complete."
