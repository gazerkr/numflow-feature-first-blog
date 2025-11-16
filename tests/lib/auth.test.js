import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../lib/auth.js'

describe('lib/auth.js', () => {
  describe('hashPassword', () => {
    it('should hash password', async () => {
      const plainPassword = 'mySecurePassword123'
      const hashed = await hashPassword(plainPassword)

      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(plainPassword)
      expect(hashed.length).toBeGreaterThan(0)
    })

    it('should create different hash each time for same password (salt)', async () => {
      const plainPassword = 'mySecurePassword123'
      const hash1 = await hashPassword(plainPassword)
      const hash2 = await hashPassword(plainPassword)

      expect(hash1).not.toBe(hash2)
    })

    it('should hash empty string', async () => {
      const hashed = await hashPassword('')
      expect(hashed).toBeDefined()
      expect(hashed.length).toBeGreaterThan(0)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'mySecurePassword123'
      const hashed = await hashPassword(plainPassword)

      const isValid = await verifyPassword(plainPassword, hashed)
      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const plainPassword = 'mySecurePassword123'
      const wrongPassword = 'wrongPassword456'
      const hashed = await hashPassword(plainPassword)

      const isValid = await verifyPassword(wrongPassword, hashed)
      expect(isValid).toBe(false)
    })

    it('should validate empty string password', async () => {
      const hashed = await hashPassword('')
      const isValid = await verifyPassword('', hashed)
      expect(isValid).toBe(true)
    })

    it('should be case sensitive', async () => {
      const plainPassword = 'MyPassword123'
      const hashed = await hashPassword(plainPassword)

      const isValid = await verifyPassword('mypassword123', hashed)
      expect(isValid).toBe(false)
    })
  })
})
