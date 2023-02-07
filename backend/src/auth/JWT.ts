import jwt from 'jsonwebtoken'
import CONFIG from '@/config/'
import { CustomJwtPayload } from './CustomJwtPayload'
import LogError from '@/server/LogError'

export const decode = (token: string): CustomJwtPayload | null => {
  if (!token) throw new LogError('401 Unauthorized')
  try {
    return <CustomJwtPayload>jwt.verify(token, CONFIG.JWT_SECRET)
  } catch (err) {
    return null
  }
}

export const encode = (gradidoID: string): string => {
  const token = jwt.sign({ gradidoID }, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRES_IN,
  })
  return token
}
