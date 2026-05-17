/**
 * Tests for shared member write operations.
 *
 * Run: npx tsx --test packages/core/src/query/__tests__/member-ops.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DatabaseAdapter, PreparedStatement, RunResult } from '../../interfaces/database-adapter'
import { updateMemberAliases, mergeMembers, deleteMember, ensureAliasesColumn, ensureAvatarColumn } from '../member-ops'

function createInMemoryDb(): DatabaseAdapter & { rows: Map<string, Record<string, unknown>[]>; execLog: string[] } {
  const rows = new Map<string, Record<string, unknown>[]>()
  const execLog: string[] = []

  return {
    rows,
    execLog,
    exec(sql: string) {
      execLog.push(sql)
    },
    prepare(sql: string): PreparedStatement {
      return {
        get(..._params: unknown[]): Record<string, unknown> | undefined {
          return rows.get(sql)?.[0]
        },
        all(..._params: unknown[]): Record<string, unknown>[] {
          return rows.get(sql) ?? []
        },
        run(..._params: unknown[]): RunResult {
          execLog.push(`run:${sql.trim().substring(0, 50)}`)
          return { changes: 1 }
        },
      }
    },
    transaction<T>(fn: () => T): T {
      return fn()
    },
    pragma() {
      return undefined
    },
    close() {
      /* no-op */
    },
  }
}

describe('updateMemberAliases', () => {
  it('returns true on success', () => {
    const db = createInMemoryDb()
    const result = updateMemberAliases(db, 1, ['nickname1', 'nickname2'])
    assert.equal(result, true)
  })
})

describe('mergeMembers', () => {
  it('returns false for same id', () => {
    const db = createInMemoryDb()
    assert.equal(mergeMembers(db, 1, 1), false)
  })

  it('returns false when members not found', () => {
    const db = createInMemoryDb()
    assert.equal(mergeMembers(db, 1, 2), false)
  })
})

describe('deleteMember', () => {
  it('executes delete transaction', () => {
    const db = createInMemoryDb()
    const result = deleteMember(db, 42)
    assert.equal(result, true)
    assert.ok(db.execLog.some((s) => s.includes('DELETE FROM message')))
    assert.ok(db.execLog.some((s) => s.includes('DELETE FROM member')))
  })
})

describe('ensureAliasesColumn', () => {
  it('adds column when missing', () => {
    const db = createInMemoryDb()
    db.rows.set('PRAGMA table_info(member)', [{ name: 'id' }, { name: 'platform_id' }])
    const added = ensureAliasesColumn(db)
    assert.equal(added, true)
    assert.ok(db.execLog.some((s) => s.includes('ALTER TABLE member ADD COLUMN aliases')))
  })

  it('skips when column exists', () => {
    const db = createInMemoryDb()
    db.rows.set('PRAGMA table_info(member)', [{ name: 'id' }, { name: 'aliases' }])
    const added = ensureAliasesColumn(db)
    assert.equal(added, false)
  })
})

describe('ensureAvatarColumn', () => {
  it('adds column when missing', () => {
    const db = createInMemoryDb()
    db.rows.set('PRAGMA table_info(member)', [{ name: 'id' }])
    const added = ensureAvatarColumn(db)
    assert.equal(added, true)
    assert.ok(db.execLog.some((s) => s.includes('ALTER TABLE member ADD COLUMN avatar')))
  })

  it('skips when column exists', () => {
    const db = createInMemoryDb()
    db.rows.set('PRAGMA table_info(member)', [{ name: 'id' }, { name: 'avatar' }])
    const added = ensureAvatarColumn(db)
    assert.equal(added, false)
  })
})
