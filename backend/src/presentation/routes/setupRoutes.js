import indexRouter from './v1/index.js'

export const setupRoutes = app => {
  app.use('/api/v1', indexRouter)
}
