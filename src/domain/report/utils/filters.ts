import type { SelectQueryBuilder } from 'typeorm'
import type { Project } from '@/domain/project/project.entity'

export function buildProjectFilters(
  query: SelectQueryBuilder<Project>,
  startDate?: string,
  endDate?: string,
  clientId?: string
): SelectQueryBuilder<Project> {
  // Siempre filtrar por proyectos activos
  query.where('project.is_active = :isActive', { isActive: true })

  // Filtrar por fecha de inicio si se proporciona
  if (startDate) {
    try {
      // Validar que la fecha sea válida
      const startDateObj = new Date(startDate)
      if (!isNaN(startDateObj.getTime())) {
        query.andWhere('project.start_date >= :startDate', { startDate })
      }
    } catch (error) {
      // Ignorar error de parsing
      console.log('Invalid startDate format:', error)
    }
  }

  // Filtrar por fecha de fin si se proporciona
  if (endDate) {
    try {
      // Validar que la fecha sea válida
      const endDateObj = new Date(endDate)
      if (!isNaN(endDateObj.getTime())) {
        query.andWhere('project.end_date <= :endDate', { endDate })
      }
    } catch (error) {
      // Ignorar error de parsing
      console.log('Invalid endDate format:', error)
    }
  }

  // Filtrar por cliente si se proporciona
  if (clientId) {
    query.andWhere('project.client_id = :clientId', { clientId })
  }

  return query
}
