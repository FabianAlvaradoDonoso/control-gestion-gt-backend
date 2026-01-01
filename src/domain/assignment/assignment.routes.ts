import { Router } from 'express'

import { AssignmentController } from './assignment.controller'

const router = Router()
const assignmentController = new AssignmentController()

/**
 * @openapi
 * /api/assignments:
 *   get:
 *     tags:
 *       - Assignment
 *     summary: Get all assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_datetime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_datetime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Client details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', assignmentController.getAll)

/**
 * @openapi
 * /api/assignments/fixed-blocks:
 *   post:
 *     tags:
 *       - Assignment
 *     summary: Create a new fixed block assignment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FixedBlockInput'
 *     responses:
 *       201:
 *         description: The created fixed block assignment
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/fixed-blocks', assignmentController.createFixedBlock)

/**
 * @openapi
 * /api/assignments/simulate-cascade:
 *   post:
 *     tags:
 *       - Assignment
 *     summary: Create a new fixed block assignment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SimulatedCascadeInput'
 *     responses:
 *       201:
 *         description: The created fixed block assignment
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/simulate-cascade', assignmentController.simulateCascade)

/**
 * @openapi
 * /api/assignments/used-hours-percentage/{user_id}:
 *   get:
 *     tags:
 *       - Assignment
 *     summary: Get used hours percentage for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Used hours percentage details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/used-hours-percentage/:user_id', assignmentController.userHoursPorcentage)

export default router
