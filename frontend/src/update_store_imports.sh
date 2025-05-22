#!/bin/bash

# Script to update all imports from @/stores to @/store after reorganization

# Define base directory
BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Update all imports from @/stores to @/store
find "$BASE_DIR" -name "*.vue" -o -name "*.js" | xargs sed -i 's|from '"'"'@/stores'"'"'|from '"'"'@/store'"'"'|g'

echo "All imports from @/stores updated to @/store"
