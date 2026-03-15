import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' })
})

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`)
  console.log(`📍 Environment: ${config.nodeEnv}`)
  console.log(`🔗 API URL: http://localhost:${config.port}/api`)
})

export default app
