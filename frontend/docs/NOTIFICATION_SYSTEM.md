# 📝 Документация по системе уведомлений

## 📚 Обзор

Система уведомлений (toast) построена на основе компонентов Vuetify и следует принципам чистой архитектуры, обеспечивая:

-   🎯 **Лаконичность** - минимальный код для максимальной функциональности
-   🧩 **Совместимость** - легкая интеграция с существующим кодом
-   🎨 **Элегантность** - профессиональный дизайн и плавные анимации
-   🔧 **Расширяемость** - простое добавление новых типов уведомлений
-   🔄 **Консистентность** - единый стиль всех уведомлений
-   🔊 **Звуковые уведомления** - настраиваемые звуки для разных типов уведомлений

## 🔍 Структура компонентов

Система состоит из трех основных частей:

1. **`useNotifications.js`** - композабл с ядром функциональности
2. **`NotificationContainer.vue`** - компонент для отображения уведомлений
3. **`notificationService.js`** - сервис с предустановленными типами уведомлений

## 🚀 Как использовать

### Базовое использование (Композабл)

```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications'

const notifications = useNotifications()

function showSuccessMessage() {
    notifications.success('Операция выполнена успешно')
}

function showError() {
    notifications.error('Произошла ошибка')
}
</script>
```

### Сервис уведомлений (Рекомендуемый способ)

```vue
<script setup>
import { notificationService as toast } from '@/services/notificationService'

function submitForm() {
    try {
        // Код отправки формы
        toast.success('Данные отправлены успешно')
    } catch (error) {
        toast.error(error.message)
    }
}
</script>
```

### Использование полезных утилитарных функций

```javascript
// Уведомления для работы с корзиной
toast.addedToCart('Книга: Vue.js 3 в действии')
toast.removedFromCart('Книга: Vue.js 3 в действии')
toast.cartUpdated()
toast.orderPlaced()

// Уведомления для CRUD операций
toast.itemCreated('Пользователь')
toast.itemUpdated('Книга')
toast.itemDeleted('Заказ')

// Уведомления для авторизации
toast.loginSuccess()
toast.logoutSuccess()
toast.registrationSuccess()

// Уведомления для API
toast.apiError('Сервер недоступен')
toast.apiSuccess('Данные загружены')
```

### Расширенное использование

```javascript
// Уведомление с настраиваемым временем отображения
notifications.success('Сообщение', { timeout: 8000 })

// Постоянное уведомление (не исчезает автоматически)
notifications.warning('Важное предупреждение', { persistent: true })

// Уведомление с HTML содержимым
notifications.info('Добавлена <strong>новая</strong> книга', { html: true })

// Уведомление с действием
notifications.show({
    message: 'Файл загружен',
    type: 'success',
    actions: [
        {
            label: 'Открыть',
            handler: () => openFile(),
        },
    ],
})

// Уведомление с несколькими действиями
notifications.show({
    message: 'Удалить элемент?',
    type: 'warning',
    persistent: true,
    actions: [
        {
            label: 'Отмена',
            handler: () => console.log('Отменено'),
        },
        {
            label: 'Удалить',
            handler: () => deleteItem(),
        },
    ],
})

// Группировка уведомлений
// При отображении нового уведомления с тем же group, предыдущее закрывается
notifications.show({
    message: 'Обновление данных...',
    type: 'info',
    group: 'data-update',
})

// Очередь уведомлений
// Если отображается слишком много уведомлений, новые встают в очередь
// и показываются после закрытия текущих
for (let i = 1; i <= 10; i++) {
    notifications.info(`Уведомление ${i}`)
}
```

## 🎨 Типы уведомлений

Система поддерживает 4 основных типа уведомлений:

| Тип                | Метод       | Цвет    | Иконка | Описание                              |
| ------------------ | ----------- | ------- | ------ | ------------------------------------- |
| **Успех**          | `success()` | Зеленый | ✓      | Для подтверждения успешных операций   |
| **Ошибка**         | `error()`   | Красный | ⚠      | Для отображения ошибок и проблем      |
| **Предупреждение** | `warning()` | Желтый  | ⚠      | Для предупреждений о важных действиях |
| **Информация**     | `info()`    | Синий   | ℹ      | Для информационных сообщений          |

## 🔊 Звуковые уведомления

Система поддерживает звуковые уведомления для улучшения пользовательского опыта:

### Использование

Звуки уведомлений включены по умолчанию, но могут быть отключены пользователем:

```javascript
// Включение/выключение звука программно
const notifications = useNotifications()
notifications.toggleSound() // Переключает состояние звука
const isEnabled = notifications.getSoundEnabled() // Получает текущее состояние
```

### Настройка звуков

Звуки для разных типов уведомлений настраиваются в файле `soundUtils.js`:

```javascript
export const NOTIFICATION_SOUNDS = {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3',
}
```

### Отключение звука для конкретного уведомления

```javascript
// Отображение уведомления без звука, даже если звуки включены
notifications.show({
    message: 'Тихое уведомление',
    type: 'info',
    sound: false,
})

// Принудительное включение звука для важного уведомления
notifications.show({
    message: 'Важное уведомление',
    type: 'warning',
    sound: true,
})
```

### Пользовательский интерфейс для управления звуком

Система предоставляет встроенный пользовательский интерфейс для управления звуковыми уведомлениями:

1. **Кнопка включения/выключения звука** - отображается в правом верхнем углу экрана
2. **Диалог настроек звука** - позволяет:
    - Переключать состояние звука
    - Тестировать звуки для разных типов уведомлений

Настройки звука сохраняются в localStorage и применяются при последующих визитах.

### Тестирование звуков

Для проверки звуков в вашем коде:

```javascript
import { playNotificationSound } from '@/utils/soundUtils'

// Воспроизведение конкретного звука
playNotificationSound('success') // Возможные значения: 'success', 'error', 'warning', 'info'
```

## 🧪 Демонстрационная страница

Для просмотра всех типов и вариантов уведомлений:

1. Запустите приложение: `npm run dev`
2. Откройте в браузере: http://localhost:5173/notifications

## 🔧 Настройка и кастомизация

### Изменение стилей

Стили можно изменить в компоненте `NotificationContainer.vue`:

```css
.notification-snackbar {
    margin-bottom: 8px; /* Расстояние между уведомлениями */
}

:deep(.v-snackbar__wrapper) {
    border-radius: 8px; /* Закругление углов */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Тень */
}
```

### Добавление новых типов уведомлений

В файле `notificationService.js` можно добавить новые типы уведомлений:

```javascript
// Пример добавления нового типа уведомления
this.paymentSuccess = () => this.success('Оплата прошла успешно')
this.paymentFailed = (error) => this.error(`Ошибка оплаты: ${error}`)
```

## 📈 Преимущества

-   ✅ **Нет внешних зависимостей** - использует только Vuetify
-   ✅ **Минимальный размер бандла** - не увеличивает размер приложения
-   ✅ **Высокая производительность** - оптимизировано для Vue 3 и Composition API
-   ✅ **Простая поддержка** - чистая структура кода и подробная документация
-   ✅ **Умная очередь** - автоматическое управление большим количеством уведомлений
-   ✅ **Группировка** - возможность заменять уведомления в одной группе

## 🔄 Миграция со старой системы

Если вы использовали предыдущую систему уведомлений, миграция очень простая:

1. Импорты остаются теми же: `import { notificationService as toast } from '@/services/notificationService'`
2. Вызовы методов идентичны: `toast.success()`, `toast.error()` и т.д.
3. Дополнительные методы доступны без изменений: `toast.addedToCart()`, `toast.apiError()` и т.д.

## 🧪 Тестирование

Система уведомлений легко тестируется с помощью стандартных инструментов Vue:

```javascript
import { mount } from '@vue/test-utils'
import { useNotifications } from '@/composables/useNotifications'
import { vi } from 'vitest'

test('shows success notification', async () => {
    // Arrange
    const wrapper = mount(YourComponent)
    const notifications = useNotifications()
    vi.spyOn(notifications, 'success')

    // Act
    await wrapper.find('button').trigger('click')

    // Assert
    expect(notifications.success).toHaveBeenCalledWith('Успешная операция')
})
```

## 🚀 Расширенные возможности

### HTML-содержимое

Вы можете включить HTML-разметку в сообщения:

```javascript
notifications.show({
    message: 'Книга <strong>Vue.js 3</strong> добавлена в <em>избранное</em>',
    type: 'info',
    html: true,
})
```

### Группировка уведомлений

Группировка помогает избежать дублирования сообщений одного типа:

```javascript
// При загрузке данных
notifications.show({
    message: 'Загрузка данных...',
    type: 'info',
    group: 'data-loading',
})

// После завершения загрузки это уведомление заменит предыдущее
notifications.show({
    message: 'Данные успешно загружены',
    type: 'success',
    group: 'data-loading',
})
```

### Управление очередью

Система автоматически ставит новые уведомления в очередь, если на экране уже отображается максимальное количество. Это позволяет избежать переполнения экрана и гарантирует, что пользователь увидит все сообщения.

## 👨‍💻 Контрибьюторы

-   Команда разработки Vue.js Bookstore App
