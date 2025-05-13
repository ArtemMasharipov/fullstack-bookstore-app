# Toast Notification System Documentation

## Overview

Система уведомлений в приложении Bookstore использует библиотеку `vue-toast-notification` с дополнительным слоем абстракции для обеспечения консистентности, упрощения использования и соблюдения принципов DRY, SOLID и KISS.

## Архитектура системы

### 1. Базовый компонент: vue-toast-notification

Основа системы - библиотека `vue-toast-notification`, подключенная глобально в `main.js`:

```javascript
// In main.js
import ToastPlugin from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-bootstrap.css'

app.use(ToastPlugin, {
  position: 'top-right',
  duration: 5000,
  dismissible: true,
  pauseOnHover: true
})
```

### 2. Абстракция для изоляции библиотеки: enhancedToast.js

Сервис `enhancedToast.js` оборачивает библиотеку, предоставляя единый интерфейс и защищая от изменений:

```javascript
import { useToast } from 'vue-toast-notification'

// Централизованные настройки по типам уведомлений
const TYPE_CONFIG = {
  success: { duration: 4000 },
  error: { duration: 8000 },
  warning: { duration: 6000 },
  info: { duration: 3000 }
}

// Шаблоны сообщений для типовых операций
const MESSAGES = {
  crud: {
    createSuccess: entity => `${entity} успешно создан`,
    // ... другие шаблоны сообщений
  }
}

// Ключевые функции
export function showSuccess(message, options = {}) {...}
export function showError(message, error, options = {}) {...}
// ... другие базовые функции

// CRUD хелперы
export function withToast(operation, messages, options = {}) {...}
export function createWithToast(entityName, displayName, createFn, options = {}) {...}
// ... другие хелперы

export const toast = { success, error, warning, info, ...other }
```

### 3. Вспомогательный слой: toastHelpers.js

Дополнительный слой для упрощения типичных сценариев использования уведомлений:

```javascript
import { toast } from './enhancedToast';

// Хелперы для типичных CRUD-операций
export async function handleCreate({...}) {...}
export async function handleUpdate({...}) {...}
export async function handleDelete({...}) {...}
export async function handleLoad({...}) {...}
```

### 4. Глобальный экспорт через stores/index.js

```javascript
// Импорт и экспорт улучшенного toast сервиса
import toast from '@/services/enhancedToast'
export { toast }

// Импорт и экспорт вспомогательных функций для toast
import toastHelpers from '@/services/toastHelpers'
export { toastHelpers }
```

## Использование системы уведомлений

### Базовое использование

Система предоставляет интуитивный API для основных уведомлений:

```javascript
import { toast } from '@/stores';

// Простые уведомления
toast.success('Операция успешно выполнена');
toast.error('Произошла ошибка');
toast.warning('Внимание!');
toast.info('Информационное сообщение');

// С расширенными настройками
toast.success('Особое сообщение', { duration: 10000, position: 'top-center' });

// С передачей объекта ошибки
toast.error('Ошибка загрузки данных', error);
```

### Использование с предопределенными шаблонами

```javascript
// Использование шаблонов сообщений
toast.success(toast.messages.crud.createSuccess('Пользователь "Иван"'));
toast.error(toast.messages.crud.updateError('Книга'));
```

### Использование хелперов для CRUD-операций

```javascript
import { toastHelpers } from '@/stores';

// Пример с операцией создания
async function createUser(userData) {
  return toastHelpers.handleCreate({
    entityName: 'Пользователь',
    displayName: userData.name || userData.email || 'Новый пользователь',
    operation: () => userApi.create(userData),
    onSuccess: (result) => {
      // Дополнительные действия после успеха
      router.push(`/users/${result.id}`);
    },
  });
}

// Пример с операцией обновления
async function updateBook(id, bookData) {
  return toastHelpers.handleUpdate({
    entityName: 'Книга',
    displayName: bookData.title || id,
    operation: () => bookApi.update(id, bookData)
  });
}

// Пример с операцией удаления
async function deleteAuthor(id, authorName) {
  return toastHelpers.handleDelete({
    entityName: 'Автор',
    displayName: authorName,
    operation: () => authorApi.delete(id)
  });
}

// Пример с загрузкой данных
async function loadOrders() {
  return toastHelpers.handleLoad({
    entityName: 'Заказы',
    operation: () => orderApi.fetchAll(),
    silent: true // Не показывать уведомление при успехе
  });
}
```

### Продвинутое использование с withToast

```javascript
import { toast } from '@/stores';

// Универсальная обертка для асинхронных операций
async function processComplexOperation() {
  return toast.withToast(
    // Операция
    async () => {
      const result1 = await api.step1();
      const result2 = await api.step2(result1.id);
      return result2;
    },
    // Сообщения
    {
      success: 'Сложная операция успешно выполнена',
      error: 'Ошибка при выполнении сложной операции'
    }
  );
}
```

## Преимущества системы

1. **Консистентность**: Единый стиль и настройки для всех уведомлений
2. **DRY**: Минимизация повторения кода благодаря централизованным настройкам и шаблонам
3. **SOLID**: Разделение ответственности и открытость для расширения
4. **KISS**: Простой и интуитивный интерфейс для базовых сценариев
5. **Изоляция библиотеки**: Легкая замена базовой библиотеки без изменения кода приложения
6. **Типизированные интерфейсы**: Повышение удобства разработки и уменьшение ошибок

## Заключение

Улучшенная система уведомлений обеспечивает консистентный пользовательский опыт и удобный API для разработчиков, соблюдая принципы чистого кода и лучшие практики.
