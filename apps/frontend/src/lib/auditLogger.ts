import { execute } from './db';

let isTableInitialized = false;

async function ensureAuditTable() {
  if (isTableInitialized) return;
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(100),
        admin_email VARCHAR(150),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        details JSON,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    isTableInitialized = true;
  } catch (err) {
    console.error('Failed to ensure admin_audit_logs table:', err);
  }
}

export async function logAdminAction(params: {
  adminId?: string | number;
  adminEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string | number;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await ensureAuditTable();
    await execute(
      `INSERT INTO admin_audit_logs (admin_id, admin_email, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        params.adminId ? String(params.adminId) : null,
        params.adminEmail || null,
        params.action,
        params.entityType || null,
        params.entityId ? String(params.entityId) : null,
        params.details ? JSON.stringify(params.details) : null,
        params.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}
