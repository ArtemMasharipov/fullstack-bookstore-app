#!/bin/bash

# This script updates all imports from @/stores to @/store in documentation files

BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend"

# List of documentation files to update
FILES=(
  "$BASE_DIR/docs/PINIA_USAGE_GUIDELINES.md"
  "$BASE_DIR/docs/TOAST_NOTIFICATION_SYSTEM.md"
  "$BASE_DIR/NOTIFICATION_SYSTEM.md"
  "$BASE_DIR/MIGRATION.md"
  "$BASE_DIR/ENHANCED_NOTIFICATION_SYSTEM.md"
)

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    sed -i 's|from '"'"'@/stores'"'"'|from '"'"'@/store'"'"'|g' "$file"
    sed -i 's|from "@/stores"|from "@/store"|g' "$file"
    echo "Updated: $file"
  else
    echo "File not found: $file"
  fi
done

echo "All import paths have been updated from @/stores to @/store in documentation"
