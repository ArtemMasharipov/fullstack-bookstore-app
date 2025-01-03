import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import session from 'express-session';

export const setupMiddleware = (app) => {
  // Логирование запросов
  app.use(logger('dev'));

  // Настройка лимитов для JSON и URL-кодированных данных
  app.use(express.json({ limit: '20mb' })); // Увеличение лимита для JSON
  app.use(express.urlencoded({ extended: false, limit: '20mb' })); // Увеличение лимита для URL-кодированных данных

  // Cookie Parser и статические файлы
  app.use(cookieParser());
  app.use(express.static('public'));

  // Переопределение методов (для RESTful API)
  app.use(methodOverride('_method'));

  // Лог запросов
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Глобальная обработка ошибок
  app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err.stack);
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large' });
    }
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Internal Server Error' });
  });

  // Настройка сессий
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );
};
