import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOrderUserId,
  assertOrderAccess,
  generateTempOrderNumber,
} from '../order.helpers'

const mockErrors = {
  NOT_FOUND: () => {
    const err = new Error('NOT_FOUND')
    ;(err as any).code = 'NOT_FOUND'
    return err
  },
}

test('getOrderUserId correctly extracts user ID from number or populated relation', () => {
  assert.strictEqual(getOrderUserId({ id: 1, user: 42 }), 42)
  assert.strictEqual(getOrderUserId({ id: 2, user: { id: 84, fullName: 'مشتری آزمایشی' } }), 84)
  assert.strictEqual(getOrderUserId({ id: 3, user: null }), null)
  assert.strictEqual(getOrderUserId({ id: 4 }), null)
})

test('assertOrderAccess allows owner customer to access their own order', () => {
  const orderDoc = { id: 10, user: 123 }
  const customerUser = { id: 123, role: 'customer' }

  assert.doesNotThrow(() => {
    assertOrderAccess(orderDoc, customerUser, mockErrors)
  })
})

test('assertOrderAccess throws NOT_FOUND when non-owner customer attempts IDOR access', () => {
  const orderDoc = { id: 10, user: 123 }
  const maliciousCustomer = { id: 999, role: 'customer' }

  assert.throws(
    () => {
      assertOrderAccess(orderDoc, maliciousCustomer, mockErrors)
    },
    (err: any) => {
      assert.strictEqual(err.code, 'NOT_FOUND')
      return true
    }
  )
})

test('assertOrderAccess permits admin and superadmin to access any order', () => {
  const orderDoc = { id: 10, user: 123 }
  const adminUser = { id: 5, role: 'admin' }
  const superAdminUser = { id: 1, role: 'superadmin' }

  assert.doesNotThrow(() => {
    assertOrderAccess(orderDoc, adminUser, mockErrors)
  })

  assert.doesNotThrow(() => {
    assertOrderAccess(orderDoc, superAdminUser, mockErrors)
  })
})

test('assertOrderAccess throws NOT_FOUND when user is unauthenticated (null)', () => {
  const orderDoc = { id: 10, user: 123 }

  assert.throws(
    () => {
      assertOrderAccess(orderDoc, null, mockErrors)
    },
    (err: any) => {
      assert.strictEqual(err.code, 'NOT_FOUND')
      return true
    }
  )
})

test('generateTempOrderNumber creates unique identifiers prefixed with ptp-tmp-', () => {
  const num1 = generateTempOrderNumber()
  const num2 = generateTempOrderNumber()

  assert.ok(num1.startsWith('ptp-tmp-'))
  assert.ok(num2.startsWith('ptp-tmp-'))
  assert.notStrictEqual(num1, num2)
})
