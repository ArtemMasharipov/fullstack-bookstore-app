#!/bin/bash

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Function to check directory and list files
check_directory() {
  local dir=$1
  local desc=$2
  
  echo "==========================================="
  echo "$desc ($dir)"
  echo "==========================================="
  
  if [ -d "$dir" ]; then
    ls -la "$dir" | grep -v "^\."
    echo ""
    
    # List subdirs if they exist
    for subdir in "$dir"/*/ ; do
      if [ -d "$subdir" ]; then
        echo "--- ${subdir##*/} ---"
        ls -la "$subdir" | grep -v "^\."
        echo ""
      fi
    done
  else
    echo "Directory does not exist"
  fi
  
  echo ""
}

echo "FINAL DIRECTORY STRUCTURE AFTER LAYERED ARCHITECTURE REORGANIZATION"
echo "=================================================================="
echo ""

# Check all the reorganized directories
check_directory "$BASE_DIR/components/ui" "UI Components"
check_directory "$BASE_DIR/components/layout" "Layout Components"
check_directory "$BASE_DIR/components/features" "Feature Components"
check_directory "$BASE_DIR/views" "Views"
check_directory "$BASE_DIR/views/admin" "Admin Views"
check_directory "$BASE_DIR/store" "Store"
check_directory "$BASE_DIR/store/modules" "Store Modules"
check_directory "$BASE_DIR/services" "Services"
check_directory "$BASE_DIR/services/api" "API Services"
check_directory "$BASE_DIR/utils" "Utils"
check_directory "$BASE_DIR/router" "Router"
check_directory "$BASE_DIR/assets" "Assets"

# Check if old directories still exist
echo "==========================================="
echo "Checking if old directories still exist"
echo "==========================================="
old_dirs=(
  "components/auth"
  "components/authors"
  "components/books"
  "components/cart"
  "components/common"
  "components/orders"
  "api"
  "admin"
  "styles"
)

for dir in "${old_dirs[@]}"; do
  if [ -d "$BASE_DIR/$dir" ]; then
    echo "WARNING: Old directory still exists: $dir"
    ls -la "$BASE_DIR/$dir" | grep -v "^\."
    echo ""
  else
    echo "✓ $dir has been properly migrated"
  fi
done
