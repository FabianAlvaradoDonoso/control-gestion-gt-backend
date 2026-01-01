import { Router } from 'express'
import { requirePermissions } from '@/core/middlewares/auth.middleware'

import { ManagementControlController } from './management-control.controller'

const router = Router()
const managementControlController = new ManagementControlController()

/**
 * @openapi
 * /api/management-control/kpis:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control KPIs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: KPIs data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/kpis', requirePermissions(['assignment.view']), managementControlController.getKpis)

/**
 * @openapi
 * /api/management-control/details:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control detailed data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Detailed data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/details',
  requirePermissions(['assignment.view']),
  managementControlController.getDetails
)

/**
 * @openapi
 * /api/management-control/responsible-users:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control responsible users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Responsible users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/responsible-users',
  requirePermissions(['assignment.view']),
  managementControlController.getResponsibleUsers
)

/**
 * @openapi
 * /api/management-control/responsible-users:
 *   put:
 *     tags:
 *       - Management Control
 *     summary: Update management control responsible users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - role
 *               - action
 *             properties:
 *               user_id:
 *                 type: string
 *               role:
 *                 type: string
 *               action:
 *                 type: string
 *     responses:
 *       200:
 *         description: Responsible users updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  '/responsible-users',
  requirePermissions(['assignment.view']),
  managementControlController.updateResponsibleUsers
)

/**
 * @openapi
 * /api/management-control/warnings:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control warnings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Warnings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/warnings',
  requirePermissions(['assignment.view']),
  managementControlController.getWarnings
)

/**
 * @openapi
 * /api/management-control/assignments:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/assignments',
  requirePermissions(['assignment.view']),
  managementControlController.getAssignments
)

/**
 * @openapi
 * /api/management-control/comments:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/comments',
  requirePermissions(['assignment.view']),
  managementControlController.getProjectComments
)

/**
 * @openapi
 * /api/management-control/comments:
 *   post:
 *     tags:
 *       - Management Control
 *     summary: Create a new project comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - content
 *               - parent_id
 *               - updated_at
 *             properties:
 *               id:
 *                 type: number
 *               content:
 *                 type: string
 *               parent_id:
 *                 type: number
 *               updated_at:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project comment created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/comments',
  requirePermissions(['assignment.view']),
  managementControlController.postProjectComment
)

/**
 * @openapi
 * /api/management-control/team-users:
 *   get:
 *     tags:
 *       - Management Control
 *     summary: Retrieve management control team users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Team users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/team-users',
  requirePermissions(['assignment.view']),
  managementControlController.getTeamUsers
)

/**
 * @openapi
 * /api/management-control/team-users:
 *   delete:
 *     tags:
 *       - Management Control
 *     summary: Delete a management control team user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: query
 *        name: project_id
 *        schema:
 *          type: string
 *        required: true
 *      - in: query
 *        name: userId
 *        schema:
 *          type: string
 *        required: true
 *     responses:
 *       200:
 *         description: Team user deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/team-users',
  requirePermissions(['assignment.view']),
  managementControlController.deleteTeamUser
)

export default router
