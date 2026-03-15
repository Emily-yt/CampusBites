import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message || 'Validation Error' })
    return
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ success: false, message: err.message || 'Unauthorized' })
    return
  }

  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' })
}
