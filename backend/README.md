# 📚 Bookstore Backend API

Clean MVC architecture для fullstack приложения книжного магазина.

## 🏗️ Архитектура

```
backend/
├── controllers/       # HTTP обработчики (тонкий слой)
├── services/         # Бизнес-логика
├── models/           # Mongoose схемы
├── routes/           # Определения маршрутов
├── middleware/       # Middleware (auth, errors, async)
├── utils/            # Утилиты (ошибки)
└── server-clean-mvc.js  # Точка входа
```

### Слои приложения

**Model** → **Service** → **Controller** → **Routes**

- **Models**: Схемы данных, валидация, виртуальные поля
- **Services**: Вся бизнес-логика, выбрасывает ошибки
- **Controllers**: HTTP request/response, вызывает сервисы
- **Routes**: Определения endpoint'ов + middleware

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте `.env` файл:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bookstore

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
```

### 3. Запуск сервера

```bash
# Production
npm start

# Development (с автоперезагрузкой)
npm run dev
```

Сервер запустится на: `http://localhost:5000`

## 📦 Модули

### 1. Books (Книги)
- ✅ CRUD операции
- ✅ Поиск и фильтрация
- ✅ Управление категориями
- ✅ Связь с авторами

### 2. Authors (Авторы)
- ✅ CRUD операции
- ✅ Статистика по авторам
- ✅ Список книг автора

### 3. Users/Auth (Пользователи/Авторизация)
- ✅ Регистрация и логин
- ✅ JWT токены
- ✅ Управление профилем
- ✅ Роли: user, admin, moderator

### 4. Cart (Корзина)
- ✅ Добавление/удаление товаров
- ✅ Синхронизация цен
- ✅ Валидация перед оформлением

### 5. Orders (Заказы)
- ✅ Создание заказов
- ✅ Статусы заказов
- ✅ История заказов
- ✅ Админ-панель

## 🔌 API Endpoints

### Auth (Авторизация)
```
POST   /api/v1/auth/register      - Регистрация
POST   /api/v1/auth/login         - Вход
GET    /api/v1/auth/me            - Текущий пользователь (🔒)
PUT    /api/v1/auth/password      - Смена пароля (🔒)
PUT    /api/v1/auth/profile       - Обновление профиля (🔒)
POST   /api/v1/auth/logout        - Выход (🔒)
```

### Books (Книги)
```
GET    /api/v1/books              - Список книг
GET    /api/v1/books/:id          - Книга по ID
GET    /api/v1/books/category/:c  - Книги категории
GET    /api/v1/books/author/:id   - Книги автора
POST   /api/v1/books              - Создать книгу (🔒 Admin)
PUT    /api/v1/books/:id          - Обновить книгу (🔒 Admin)
PATCH  /api/v1/books/:id/stock    - Обновить склад (🔒 Admin)
DELETE /api/v1/books/:id          - Удалить книгу (🔒 Admin)
```

### Authors (Авторы)
```
GET    /api/v1/authors            - Список авторов
GET    /api/v1/authors/:id        - Автор по ID
GET    /api/v1/authors/:id/books  - Книги автора
GET    /api/v1/authors/:id/stats  - Статистика
POST   /api/v1/authors            - Создать автора (🔒 Admin)
PUT    /api/v1/authors/:id        - Обновить автора (🔒 Admin)
DELETE /api/v1/authors/:id        - Удалить автора (🔒 Admin)
```

### Cart (Корзина)
```
GET    /api/v1/cart               - Получить корзину (🔒)
POST   /api/v1/cart               - Добавить в корзину (🔒)
PUT    /api/v1/cart/:bookId       - Обновить количество (🔒)
DELETE /api/v1/cart/:bookId       - Удалить из корзины (🔒)
DELETE /api/v1/cart               - Очистить корзину (🔒)
GET    /api/v1/cart/validate      - Валидация корзины (🔒)
POST   /api/v1/cart/sync          - Синхронизация цен (🔒)
```

### Orders (Заказы)
```
# Пользовательские
POST   /api/v1/orders             - Создать заказ (🔒)
GET    /api/v1/orders             - Мои заказы (🔒)
GET    /api/v1/orders/:id         - Заказ по ID (🔒)
PATCH  /api/v1/orders/:id/cancel  - Отменить заказ (🔒)

# Админские
GET    /api/v1/orders/admin/all   - Все заказы (🔒 Admin)
GET    /api/v1/orders/admin/stats - Статистика (🔒 Admin)
PATCH  /api/v1/orders/:id/status  - Обновить статус (🔒 Admin)
PATCH  /api/v1/orders/:id/pay     - Пометить оплаченным (🔒 Admin)
```

### Users (Пользователи - Admin)
```
GET    /api/v1/users              - Список пользователей (🔒 Admin)
GET    /api/v1/users/:id          - Пользователь по ID (🔒 Admin)
GET    /api/v1/users/stats        - Статистика (🔒 Admin)
POST   /api/v1/users              - Создать пользователя (🔒 Admin)
PUT    /api/v1/users/:id          - Обновить пользователя (🔒 Admin)
PATCH  /api/v1/users/:id/status   - Вкл/выкл пользователя (🔒 Admin)
DELETE /api/v1/users/:id          - Мягкое удаление (🔒 Admin)
DELETE /api/v1/users/:id/permanent - Полное удаление (🔒 Admin)
```

🔒 - Требуется авторизация (JWT токен в заголовке `Authorization: Bearer <token>`)

**Всего: 46 endpoints**

## 🧪 Тестирование API

### 1. Регистрация
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Логин
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "password123"
  }'
```

Сохраните полученный `token` для дальнейших запросов.

### 3. Создание автора (Admin)
```bash
curl -X POST http://localhost:5000/api/v1/authors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Leo",
    "lastName": "Tolstoy",
    "country": "Russia",
    "biography": "Great Russian writer"
  }'
```

### 4. Создание книги (Admin)
```bash
curl -X POST http://localhost:5000/api/v1/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "War and Peace",
    "authorId": "AUTHOR_ID_HERE",
    "publicationYear": 1869,
    "price": 29.99,
    "category": "Classic",
    "stock": 100,
    "description": "Epic historical novel"
  }'
```

### 5. Добавить в корзину
```bash
curl -X POST http://localhost:5000/api/v1/cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "BOOK_ID_HERE",
    "quantity": 2
  }'
```

### 6. Оформить заказ
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "New York",
      "postalCode": "10001",
      "country": "USA",
      "phone": "+1234567890"
    },
    "paymentMethod": "card"
  }'
```

## 🔐 Авторизация

### JWT токены

После успешного логина сервер возвращает JWT токен:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

Используйте токен в заголовке для защищённых endpoint'ов:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Роли пользователей

- **user** - обычный пользователь (покупки, корзина, заказы)
- **moderator** - модератор (дополнительные права)
- **admin** - администратор (полный доступ)

## 📊 Формат ответов

### Успешный ответ
```json
{
  "success": true,
  "data": { ... }
}
```

### Ответ с пагинацией
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Ошибка
```json
{
  "success": false,
  "error": "Описание ошибки"
}
```

## 🛡️ Обработка ошибок

Все ошибки обрабатываются глобальным middleware:

- **ValidationError** (400) - ошибки валидации
- **UnauthorizedError** (401) - не авторизован
- **ForbiddenError** (403) - недостаточно прав
- **NotFoundError** (404) - ресурс не найден
- **ConflictError** (409) - конфликт данных
- **AppError** (500) - общая ошибка приложения

## 🗄️ База данных

### MongoDB коллекции

- `books` - книги
- `authors` - авторы
- `users` - пользователи
- `carts` - корзины
- `orders` - заказы

### Индексы

Созданы индексы для оптимизации:

- **books**: текстовый поиск по title/description, индекс category
- **authors**: текстовый поиск, индекс country
- **users**: уникальные email/username
- **carts**: уникальный userId
- **orders**: индекс userId, orderNumber

## 📝 Зависимости

### Production
```json
{
  "bcrypt": "^5.1.1",           // Хеширование паролей
  "cors": "^2.8.5",             // CORS
  "dotenv": "^16.4.7",          // Переменные окружения
  "express": "^4.21.2",         // Web фреймворк
  "helmet": "^8.0.0",           // Безопасность
  "jsonwebtoken": "^9.0.2",     // JWT токены
  "mongoose": "^8.9.2",         // MongoDB ODM
  "morgan": "^1.10.0"           // HTTP логирование
}
```

### Development
```json
{
  "nodemon": "^3.1.9"           // Автоперезагрузка
}
```

## 📖 Документация

- **CLEAN_MVC_GUIDE.md** - Руководство по архитектуре
- **PROGRESS.md** - История разработки
- **REFACTORING_COMPLETE.md** - Итоги рефакторинга

## 🎯 Особенности

- ✅ Clean MVC архитектура
- ✅ Полное разделение слоёв
- ✅ Централизованная обработка ошибок
- ✅ JWT авторизация
- ✅ Ролевой доступ (RBAC)
- ✅ Пагинация
- ✅ Полнотекстовый поиск
- ✅ Валидация данных
- ✅ Безопасность (helmet, CORS)
- ✅ HTTP логирование (morgan)
- ✅ Асинхронная обработка

## 🧹 Структура кода

### Паттерн MVC

```javascript
// Model (models/Book.js)
const bookSchema = new Schema({
  title: String,
  // ...
});

// Service (services/bookService.js)
export async function getBooks(filters) {
  // Бизнес-логика
  const books = await Book.find(filters);
  return books;
}

// Controller (controllers/bookController.js)
export async function getBooks(req, res) {
  const books = await bookService.getBooks(req.query);
  res.json({ success: true, data: books });
}

// Routes (routes/books.js)
router.get('/', asyncHandler(bookController.getBooks));
```

## 🚦 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (валидация)
- `401` - Unauthorized (не авторизован)
- `403` - Forbidden (недостаточно прав)
- `404` - Not Found
- `409` - Conflict (дубликат)
- `500` - Internal Server Error

## 💡 Советы

1. **Всегда используйте JWT токен** для защищённых endpoint'ов
2. **Первый пользователь становится admin** - создайте его первым
3. **Используйте пагинацию** с параметрами `?page=1&limit=20`
4. **Проверяйте роли** перед admin операциями
5. **Обрабатывайте ошибки** - сервер всегда возвращает JSON

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 License

ISC

---

**Сделано с ❤️ и Clean MVC**
