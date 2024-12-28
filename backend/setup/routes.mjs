import indexRouter from '../src/v1/routes/index.mjs';

export const setupRoutes = (app) => {
  app.use('/api/v1', indexRouter);
};
