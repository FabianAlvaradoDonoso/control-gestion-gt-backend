import type { Application } from 'express'

import userRoutes from '@/domain/user/user.routes'
import leaveRoutes from '@/domain/leave/leave.routes'
import auditRoutes from '@/domain/audit/audit.routes'
import clientRoutes from '@/domain/client/client.routes'
import configRoutes from '@/domain/config/config.routes'
import projectRoutes from '@/domain/project/project.routes'
import assignmentRoutes from '@/domain/assignment/assignment.routes'
import managementControlRoutes from '@/domain/management-control/management-control.routes'

/**
 * Configura todas las rutas de la aplicación
 */
export const setupRoutes = (app: Application): void => {
  // API Routes
  app.use('/api/clients', clientRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/leaves', leaveRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/management-control', managementControlRoutes)
  app.use('/api/audits', auditRoutes)
  app.use('/api/assignments', assignmentRoutes)
  app.use('/api/configs', configRoutes)

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
}
