#!/bin/bash

# Этот скрипт удаляет старые папки и файлы после реорганизации кодовой базы
# в соответствии с принципами Layered Architecture

BASE_DIR="e:/FrontEnd and BackEnd Education (2022-2025)/Freelancer_Lifestyle_Education/2025_Vue_JS_by_Andriy_Bryla_course/FINAL_PROJECT/v2/bookstore-app/frontend/src"

# Функция для безопасного удаления директории
safe_remove() {
    local dir=$1
    
    # Проверяем, существует ли директория
    if [ -d "$dir" ]; then
        echo "Проверяем директорию: $dir"
        
        # Проверяем, пуста ли директория
        if [ -z "$(ls -A "$dir")" ]; then
            echo "Удаляем пустую директорию: $dir"
            rm -rf "$dir"
        else
            echo "ВНИМАНИЕ: Директория не пуста: $dir"
            echo "Содержимое директории:"
            ls -la "$dir"
            
            # Спрашиваем пользователя, хочет ли он удалить не пустую директорию
            read -p "Хотите удалить эту директорию принудительно? (y/n): " choice
            case "$choice" in 
                y|Y ) 
                    echo "Удаляем директорию и все её содержимое: $dir"
                    rm -rf "$dir"
                    ;;
                * ) 
                    echo "Директория оставлена без изменений"
                    ;;
            esac
        fi
    else
        echo "Директория не существует: $dir"
    fi
}

# Функция для безопасного перемещения файла
safe_move() {
    local src=$1
    local dst=$2
    
    # Проверяем, существует ли исходный файл
    if [ -f "$src" ]; then
        # Проверяем, существует ли целевая директория
        local dst_dir=$(dirname "$dst")
        if [ ! -d "$dst_dir" ]; then
            mkdir -p "$dst_dir"
        fi
        
        # Перемещаем файл
        if [ -f "$dst" ]; then
            echo "ВНИМАНИЕ: Файл уже существует в целевой директории: $dst"
            echo "Исходный файл оставлен без изменений: $src"
        else
            echo "Перемещаем файл: $src -> $dst"
            cp "$src" "$dst" && rm "$src"
        fi
    else
        echo "Исходный файл не существует: $src"
    fi
}

echo "==================================================="
echo "Очистка проекта от старых файлов и папок"
echo "==================================================="

# 1. Перемещаем оставшийся файл UserManagement.vue
echo "Перемещаем UserManagement.vue..."
safe_move "$BASE_DIR/components/UserManagement.vue" "$BASE_DIR/components/features/UserManagement.vue"

# 2. Удаляем старые директории компонентов
echo "Удаляем старые директории компонентов..."
safe_remove "$BASE_DIR/components/auth"
safe_remove "$BASE_DIR/components/authors"
safe_remove "$BASE_DIR/components/books"
safe_remove "$BASE_DIR/components/cart"
safe_remove "$BASE_DIR/components/common"
safe_remove "$BASE_DIR/components/orders"

# 3. Удаляем старые директории корневого уровня
echo "Удаляем старые директории корневого уровня..."
safe_remove "$BASE_DIR/admin"
safe_remove "$BASE_DIR/api"
safe_remove "$BASE_DIR/stores"
safe_remove "$BASE_DIR/styles"

# 4. Удаляем скрипты реорганизации
echo "Удаляем вспомогательные скрипты..."
rm -f "$BASE_DIR/cleanup.sh" 
rm -f "$BASE_DIR/find_imports_to_update.sh" 
rm -f "$BASE_DIR/restructure_project.sh" 
rm -f "$BASE_DIR/update_imports.sh" 
rm -f "$BASE_DIR/verify_structure.sh"

echo "==================================================="
echo "Очистка проекта завершена"
echo "==================================================="
