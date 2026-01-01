import { Router } from 'express'
import { requirePermissions } from '@/core/middlewares/auth.middleware'

import { LeaveController } from './leave.controller'

const router = Router()
const leaveController = new LeaveController()

/**
 * @openapi
 * /api/leaves/personal:
 *   post:
 *     tags:
 *       - Leaves
 *     summary: Process and store Buk leaves data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: date
 *        schema:
 *          type: string
 *        required: false
 *     responses:
 *       201:
 *         description: Leaves processed and stored successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/personal', requirePermissions(['assignment.view']), leaveController.saveBukLeaves)

/**
 * @openapi
 * /api/leaves/personal:
 *   get:
 *     tags:
 *       - Leaves
 *     summary: Get non-holiday leaves for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: user_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: A list of non-holiday leaves for the user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/personal', requirePermissions(['assignment.view']), leaveController.getLeavesByUserId)

/**
 * @openapi
 * /api/leaves/holidays:
 *   post:
 *     tags:
 *       - Leaves
 *     summary: Save holiday leaves for a specific year
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: year
 *        schema:
 *          type: integer
 *        required: true
 *     responses:
 *       201:
 *         description: Holiday leaves saved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/holidays', requirePermissions(['assignment.view']), leaveController.saveHolidayLeaves)

/**
 * @openapi
 * /api/leaves/holidays:
 *   get:
 *     tags:
 *       - Leaves
 *     summary: Get holiday leaves for a specific year
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: year
 *        schema:
 *          type: integer
 *        required: true
 *     responses:
 *       200:
 *         description: A list of holiday leaves for the year
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/holidays', requirePermissions(['assignment.view']), leaveController.getHolidayLeaves)

export default router
