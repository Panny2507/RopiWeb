import { prisma } from './prisma';

export interface AuditLogParams {
  userId?: number | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        details: params.details ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error('Audit log rögzítési hiba:', error);
  }
}
