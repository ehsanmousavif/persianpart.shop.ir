import { pool } from '../db'
import type { AuditAction, AuditActorType } from '@persianpart/contract'

export interface CreateAuditParams {
  actorType: AuditActorType
  actorId: string
  actorName?: string
  action: AuditAction
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

export async function logAuditEvent(params: CreateAuditParams): Promise<void> {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await pool.query(
      `INSERT INTO audit_events (id, actor_type, actor_id, actor_name, action, entity_type, entity_id, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        id,
        params.actorType,
        params.actorId,
        params.actorName || null,
        params.action,
        params.entityType,
        params.entityId,
        JSON.stringify(params.metadata || {}),
      ]
    )
  } catch (err) {
    console.error('[Audit Event Error]: Failed to persist audit log:', err)
  }
}
