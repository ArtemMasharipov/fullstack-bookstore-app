#!/bin/bash

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Find import statements with paths that need to be updated
echo "Finding import statements that need to be updated..."

# Check for imports from old components paths
echo "Imports from components/common:"
grep -r "from ['\"]@/components/common" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/layout:"
grep -r "from ['\"]@/components/layout" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/auth:"
grep -r "from ['\"]@/components/auth" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/authors:"
grep -r "from ['\"]@/components/authors" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/books:"
grep -r "from ['\"]@/components/books" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/cart:"
grep -r "from ['\"]@/components/cart" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Imports from components/orders:"
grep -r "from ['\"]@/components/orders" "$BASE_DIR" --include="*.vue" --include="*.js"

# Check for imports from old api paths
echo "Imports from api:"
grep -r "from ['\"]@/api" "$BASE_DIR" --include="*.vue" --include="*.js"

# Check for imports from old store paths
echo "Imports from stores:"
grep -r "from ['\"]@/stores" "$BASE_DIR" --include="*.vue" --include="*.js"

# Check for imports from admin paths
echo "Imports from admin:"
grep -r "from ['\"]@/admin" "$BASE_DIR" --include="*.vue" --include="*.js"

echo "Import path analysis complete. Use this information to update import statements in affected files."
