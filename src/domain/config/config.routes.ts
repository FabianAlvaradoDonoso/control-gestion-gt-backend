import { Router } from 'express'
import { requirePermissions } from '@/core/middlewares/auth.middleware'

import { ConfigController } from './config.controller'

const router = Router()
const configController = new ConfigController()

/**
 * @openapi
 * /api/configs/season:
 *   get:
 *     tags:
 *       - Configs
 *     summary:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns season mode config
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/season', requirePermissions(['config.view']), configController.getSeason)

/**
 * @openapi
 * /api/configs/season:
 *   put:
 *     tags:
 *       - Configs
 *     summary: Update the season mode config
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeasonConfigValues'
 *     responses:
 *       200:
 *         description: The updated season mode config
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 * */
router.put('/season', requirePermissions(['config.view']), configController.updateSeason)

/**
 * @openapi
 * /api/configs/working-hours:
 *   get:
 *     tags:
 *       - Configs
 *     summary: Get working hours config
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of non-holiday leaves for the user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/working-hours', requirePermissions(['config.view']), configController.getWorkingHours)

export default router
