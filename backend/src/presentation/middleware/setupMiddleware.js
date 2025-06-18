import cookieParser from 'cookie-parser'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import methodOverride from 'method-override'
import logger from 'morgan'

export const setupMiddleware = app => {
  app.use(helmet())

  app.use(logger('dev'))

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: false, limit: '50mb' }))

  app.use(cookieParser())

  app.use(express.static('public'))

  app.use(methodOverride('_method'))

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  )
}
