#!/bin/bash

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Create an array of old directories that should be removed once empty
old_dirs=(
  "$BASE_DIR/components/auth"
  "$BASE_DIR/components/authors"
  "$BASE_DIR/components/books"
  "$BASE_DIR/components/cart"
  "$BASE_DIR/components/common"
  "$BASE_DIR/components/orders"
  "$BASE_DIR/api"
  "$BASE_DIR/admin"
)

echo "Moving remaining components..."
# Move the remaining UserManagement.vue if it exists at root level
if [ -f "$BASE_DIR/components/UserManagement.vue" ]; then
  echo "Moving UserManagement.vue to features directory"
  cp "$BASE_DIR/components/UserManagement.vue" "$BASE_DIR/components/features/"
  rm "$BASE_DIR/components/UserManagement.vue"
fi

echo "Moving styles to assets/styles..."
# Move any styles that haven't been moved yet
if [ -d "$BASE_DIR/styles" ]; then
  mkdir -p "$BASE_DIR/assets/styles"
  cp -r "$BASE_DIR/styles/"* "$BASE_DIR/assets/styles/"
fi

echo "Checking for empty directories and removing them..."
# Check if old directories are empty and remove them
for dir in "${old_dirs[@]}"; do
  if [ -d "$dir" ] && [ -z "$(ls -A "$dir")" ]; then
    echo "Removing empty directory: $dir"
    rm -rf "$dir"
  elif [ -d "$dir" ]; then
    echo "Warning: Directory $dir is not empty. Contents:"
    ls -la "$dir"
  fi
done

echo "Cleanup complete."
