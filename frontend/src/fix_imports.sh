#!/bin/bash

# This script updates all imports from @/stores to @/store in Vue and JS files

BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# List of files to update
FILES=(
  "$BASE_DIR/components/layout/admin/AdminLayout.vue"
  "$BASE_DIR/components/features/auth/RegisterForm.vue"
  "$BASE_DIR/components/features/orders/OrdersList.vue"
  "$BASE_DIR/components/features/cart/CartList.vue"
  "$BASE_DIR/components/features/books/BookCard.vue"
  "$BASE_DIR/components/features/cart/CartItem.vue"
  "$BASE_DIR/components/features/books/BookDetails.vue"
  "$BASE_DIR/components/features/orders/OrderForm.vue"
  "$BASE_DIR/components/features/books/BookForm.vue"
  "$BASE_DIR/components/features/books/BookList.vue"
  "$BASE_DIR/components/features/authors/AuthorDetails.vue"
  "$BASE_DIR/components/features/authors/AuthorListItem.vue"
  "$BASE_DIR/components/features/authors/AuthorList.vue"
  "$BASE_DIR/components/features/authors/AuthorForm.vue"
)

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    sed -i 's|from '"'"'@/stores'"'"'|from '"'"'@/store'"'"'|g' "$file"
    echo "Updated: $file"
  else
    echo "File not found: $file"
  fi
done

echo "All import paths have been updated from @/stores to @/store"
