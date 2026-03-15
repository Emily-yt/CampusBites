import { Response } from 'express'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
}

export function successResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  })
}

export function errorResponse(res: Response, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({
    success: false,
    message,
  })
}
