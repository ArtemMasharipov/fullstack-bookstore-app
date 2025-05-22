# Import Path Migration Guide

## Components path updates
- @/components/common/* -> @/components/ui/*
- @/components/layout/* -> @/components/layout/*
- @/components/auth/* -> @/components/features/auth/*
- @/components/authors/* -> @/components/features/authors/*
- @/components/books/* -> @/components/features/books/*
- @/components/cart/* -> @/components/features/cart/*
- @/components/orders/* -> @/components/features/orders/*
- @/components/UserManagement.vue -> @/components/features/UserManagement.vue

## Store path updates
- @/stores/* -> @/store/* (base imports)
- @/stores/auth.js -> @/store/modules/auth/auth.js
- @/stores/authUi.js -> @/store/modules/auth/authUi.js
- @/stores/authors.js -> @/store/modules/authors/authors.js
- @/stores/authorsUi.js -> @/store/modules/authors/authorsUi.js
- @/stores/books.js -> @/store/modules/books/books.js
- @/stores/booksUi.js -> @/store/modules/books/booksUi.js
- @/stores/cart.js -> @/store/modules/cart/cart.js
- @/stores/orders.js -> @/store/modules/orders/orders.js
- @/stores/ordersUi.js -> @/store/modules/orders/ordersUi.js
- @/stores/users.js -> @/store/modules/users/users.js
- @/stores/usersUi.js -> @/store/modules/users/usersUi.js
- @/stores/ui.js -> @/store/modules/ui/ui.js
- @/stores/storeFactory.js -> @/store/modules/storeFactory.js

## API path updates
- @/api/* -> @/services/api/*

## Admin path updates
- @/admin/views/* -> @/views/admin/*
- @/admin/components/* -> @/components/features/admin/*
- @/admin/layouts/* -> @/components/layout/admin/*

## Assets path updates
- @/styles/* -> @/assets/styles/*

To update the imports in your project, search for the old paths in all files and replace them with the new corresponding paths.
