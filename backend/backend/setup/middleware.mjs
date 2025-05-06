import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import session from 'express-session';

export const setupMiddleware = (app) => {
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static('public'));
  app.use(methodOverride('_method'));
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
};
