import { Router } from 'express'
import { requirePermissions } from '@/core/middlewares/auth.middleware'

import { AuditController } from './audit.controller'

const router = Router()
const auditController = new AuditController()

/**
 * @openapi
 * /api/audits:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Retrieve audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: entity_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', requirePermissions(['assignment.view']), auditController.listAudits)

export default router
