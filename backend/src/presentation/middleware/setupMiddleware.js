import express from 'express'
import helmet from 'helmet'
import logger from 'morgan'

export const setupMiddleware = app => {
  app.use(helmet())

  app.use(logger('dev'))

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: false, limit: '50mb' }))

  app.use(express.static('public'))
}
