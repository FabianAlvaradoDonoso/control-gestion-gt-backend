import { User } from '@/domain/user/user.entity'
import { Area } from '@/shared/entities/area.entity'
import { Client } from '@/domain/client/client.entity'
import { AppDataSource } from '@/core/config/database'
import { Project } from '@/domain/project/project.entity'
import { TimeBlock } from '@/shared/entities/time-blocks.entity'
import { Assignment } from '@/domain/assignment/assignment.entity'

import { buildProjectFilters } from './utils/filters'

import type {
  ProjectByType,
  WorkloadByUser,
  HoursComparison,
  ProjectByStatus,
  ProjectCountByArea,
} from './report.schema'

export class ReportRepository {
  private repository = AppDataSource.getRepository(Project)
  private clientRepository = AppDataSource.getRepository(Client)
  private userRepository = AppDataSource.getRepository(User)

  private buildFilters(startDate?: string, endDate?: string, clientId?: string, areaId?: string) {
    let query = this.repository.createQueryBuilder('project')
    query = buildProjectFilters(query, startDate, endDate, clientId)

    if (areaId !== undefined) {
      query.andWhere('project.area_id = :areaId', { areaId })
    }

    return query
  }

  async getActiveProjectsCount(
    startDate?: string,
    endDate?: string,
    clientId?: string
  ): Promise<number> {
    const query = this.repository.createQueryBuilder('project')
    buildProjectFilters(query, startDate, endDate, clientId)

    const result = await query.select('COUNT(project.id)', 'count').getRawOne()

    return parseInt(result?.count || '0')
  }

  async getTotalPlannedHours(
    startDate?: string,
    endDate?: string,
    clientId?: string
  ): Promise<number> {
    const query = this.repository.createQueryBuilder('project')
    buildProjectFilters(query, startDate, endDate, clientId)

    const result = await query.select('SUM(project.planned_hours)', 'total').getRawOne()

    return parseFloat(result?.total || '0')
  }

  async getTotalExecutedHours(
    startDate?: string,
    endDate?: string,
    clientId?: string
  ): Promise<number> {
    const query = this.repository.createQueryBuilder('project')
    buildProjectFilters(query, startDate, endDate, clientId)

    const result = await query.select('SUM(project.executed_hours)', 'total').getRawOne()

    return parseFloat(result?.total || '0')
  }

  async getProjectsCountByArea(
    startDate?: string,
    endDate?: string,
    clientId?: string
  ): Promise<ProjectCountByArea[]> {
    let query = this.repository.createQueryBuilder('project')
    query = buildProjectFilters(query, startDate, endDate, clientId)

    return query
      .select([
        'area.id AS area_id',
        'area.name AS area_name',
        'COUNT(project.id) AS project_count',
      ])
      .innerJoin(Area, 'area', 'project.area_id = area.id')
      .groupBy('area.id, area.name')
      .orderBy('COUNT(project.id)', 'DESC')
      .getRawMany()
  }

  async getClientById(clientId: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { id: clientId },
    })
  }

  async getProjectsByStatus(
    startDate?: string,
    endDate?: string,
    clientId?: string,
    areaId?: string
  ): Promise<ProjectByStatus[]> {
    const query = this.buildFilters(startDate, endDate, clientId, areaId)

    return query
      .select(['project.status AS status', 'COUNT(project.id) AS count'])
      .groupBy('project.status')
      .orderBy('COUNT(project.id)', 'DESC')
      .getRawMany()
  }

  async getProjectsByType(
    startDate?: string,
    endDate?: string,
    clientId?: string,
    areaId?: string
  ): Promise<ProjectByType[]> {
    const query = this.buildFilters(startDate, endDate, clientId, areaId)

    return query
      .select(['project.type AS type', 'COUNT(project.id) AS count'])
      .groupBy('project.type')
      .orderBy('COUNT(project.id)', 'DESC')
      .getRawMany()
  }

  async getHoursComparison(
    startDate?: string,
    endDate?: string,
    clientId?: string,
    areaId?: string,
    limit: number = 20
  ): Promise<HoursComparison[]> {
    const query = this.buildFilters(startDate, endDate, clientId, areaId)

    return query
      .select([
        'project.id AS project_id',
        'project.name AS project_name',
        'project.internal_code AS internal_code',
        'project.planned_hours AS planned_hours',
        'project.executed_hours AS executed_hours',
        'area.name AS area_name',
      ])
      .innerJoin(Area, 'area', 'project.area_id = area.id')
      .andWhere('project.planned_hours IS NOT NULL')
      .andWhere('project.executed_hours IS NOT NULL')
      .orderBy('project.planned_hours', 'DESC')
      .limit(limit)
      .getRawMany()
  }

  async getWorkloadByUser(areaId?: string): Promise<WorkloadByUser[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id AS user_id',
        'user.name AS user_name',
        'area.name AS area_name',
        'user.role AS role_in_system',
        'project.id AS project_id',
        'project.name AS project_name',
        'project.internal_code AS internal_code',
        'assignment.role AS project_role',
        'project.status AS project_status',
        'project.priority AS project_priority',
        'COALESCE(SUM(time_block.duration_hours), 0) AS assigned_hours',
      ])
      .innerJoin(Assignment, 'assignment', 'assignment.user_id = user.id')
      .innerJoin(Project, 'project', 'assignment.project_id = project.id')
      .innerJoin(Area, 'area', 'user.area_id = area.id')
      .leftJoin(TimeBlock, 'time_block', 'time_block.assignment_id = assignment.id')
      .where('assignment.status = :status', { status: 'active' })

    if (areaId !== undefined) {
      query.andWhere('user.area_id = :areaId', { areaId })
    }

    return query
      .groupBy(
        'user.id, user.name, area.name, user.role, project.id, project.name, project.internal_code, assignment.role, project.status, project.priority'
      )
      .orderBy('COUNT(project.id)', 'DESC')
      .getRawMany()
  }
}

// from uuid import UUID

// from sqlalchemy import func, select
// from sqlalchemy.engine import Row

// from app.models.area_model import AreaModel
// from app.models.assignment_model import AssignmentModel
// from app.models.client_model import ClientModel
// from app.models.project_model import ProjectModel
// from app.models.time_blocks_model import TimeBlocksModel
// from app.models.user_model import UserModel
// from app.utils.filters import build_project_filters

// class ReportRepository:
//     def __init__(self, db):
//         self.db = db

//     def _build_filters(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//         area_id: int | None = None,
//     ) -> list:
//         """Construye filtros comunes para consultas de proyectos."""
//         filters = build_project_filters(start_date, end_date, client_id)
//         if area_id is not None:
//             filters.append(ProjectModel.area_id == area_id)
//         return filters

//     # Métodos existentes
//     def get_active_projects_count(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//     ) -> int:
//         filters = build_project_filters(start_date, end_date, client_id)
//         stmt = select(func.count(ProjectModel.id)).where(*filters)
//         result = self.db.execute(stmt).scalar()
//         return result or 0

//     def get_total_planned_hours(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//     ) -> int:
//         filters = build_project_filters(start_date, end_date, client_id)
//         stmt = select(func.sum(ProjectModel.planned_hours)).where(*filters)
//         result = self.db.execute(stmt).scalar()
//         return result or 0

//     def get_total_executed_hours(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//     ) -> int:
//         filters = build_project_filters(start_date, end_date, client_id)
//         stmt = select(func.sum(ProjectModel.executed_hours)).where(*filters)
//         result = self.db.execute(stmt).scalar()
//         return result or 0

//     def get_projects_count_by_area(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//     ) -> list[Row]:
//         filters = build_project_filters(start_date, end_date, client_id)
//         stmt = (
//             select(
//                 AreaModel.id.label("area_id"),
//                 AreaModel.name.label("area_name"),
//                 func.count(ProjectModel.id).label("project_count"),
//             )
//             .join(ProjectModel, ProjectModel.area_id == AreaModel.id)
//             .where(*filters)
//             .group_by(AreaModel.id, AreaModel.name)
//             .order_by(func.count(ProjectModel.id).desc())
//         )
//         result = self.db.execute(stmt)
//         return result.all()

//     def get_client_by_id(self, client_id: UUID) -> ClientModel | None:
//         stmt = select(ClientModel).where(ClientModel.id == client_id)
//         result = self.db.execute(stmt).scalar_one_or_none()
//         return result

//     def get_projects_by_status(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//         area_id: int | None = None,
//     ) -> list[Row]:
//         """Obtiene el conteo de proyectos agrupados por estado."""
//         filters = self._build_filters(start_date, end_date, client_id, area_id)
//         stmt = (
//             select(
//                 ProjectModel.status,
//                 func.count(ProjectModel.id).label("count"),
//             )
//             .where(*filters)
//             .group_by(ProjectModel.status)
//             .order_by(func.count(ProjectModel.id).desc())
//         )
//         result = self.db.execute(stmt)
//         return result.all()

//     def get_projects_by_type(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//         area_id: int | None = None,
//     ) -> list[Row]:
//         """Obtiene el conteo de proyectos agrupados por tipo."""
//         filters = self._build_filters(start_date, end_date, client_id, area_id)
//         stmt = (
//             select(
//                 ProjectModel.type,
//                 func.count(ProjectModel.id).label("count"),
//             )
//             .where(*filters)
//             .group_by(ProjectModel.type)
//             .order_by(func.count(ProjectModel.id).desc())
//         )
//         result = self.db.execute(stmt)
//         return result.all()

//     def get_hours_comparison(
//         self,
//         start_date: str | None = None,
//         end_date: str | None = None,
//         client_id: UUID | None = None,
//         area_id: int | None = None,
//         limit: int = 20,
//     ) -> list[Row]:
//         """Obtiene comparación de horas planificadas vs ejecutadas."""
//         filters = self._build_filters(start_date, end_date, client_id, area_id)
//         filters.append(ProjectModel.planned_hours.isnot(None))
//         filters.append(ProjectModel.executed_hours.isnot(None))

//         stmt = (
//             select(
//                 ProjectModel.id.label("project_id"),
//                 ProjectModel.name.label("project_name"),
//                 ProjectModel.internal_code,
//                 ProjectModel.planned_hours,
//                 ProjectModel.executed_hours,
//                 AreaModel.name.label("area_name"),
//             )
//             .join(AreaModel, ProjectModel.area_id == AreaModel.id)
//             .where(*filters)
//             .order_by(ProjectModel.planned_hours.desc())
//             .limit(limit)
//         )
//         result = self.db.execute(stmt)
//         return result.all()

//     def get_workload_by_user(self, area_id: int | None = None) -> list[Row]:
//         """Obtiene la carga de trabajo por usuario con detalles de proyectos asignados."""
//         filters = [AssignmentModel.status == "active"]
//         if area_id is not None:
//             filters.append(UserModel.area_id == area_id)

//         # busca usuarios con asignaciones activas en la tabla assignments y time_blocks
//         stmt = (
//             select(
//                 UserModel.id.label("user_id"),
//                 UserModel.name.label("user_name"),
//                 AreaModel.name.label("area_name"),
//                 UserModel.role.label("role_in_system"),
//                 ProjectModel.id.label("project_id"),
//                 ProjectModel.name.label("project_name"),
//                 ProjectModel.internal_code,
//                 AssignmentModel.role.label("project_role"),
//                 ProjectModel.status.label("project_status"),
//                 ProjectModel.priority.label("project_priority"),
//                 func.coalesce(func.sum(TimeBlocksModel.duration_hours), 0).label("assigned_hours"),
//             )
//             .join(AssignmentModel, AssignmentModel.user_id == UserModel.id)
//             .join(ProjectModel, AssignmentModel.project_id == ProjectModel.id)
//             .join(AreaModel, UserModel.area_id == AreaModel.id)
//             .outerjoin(TimeBlocksModel, TimeBlocksModel.assignment_id == AssignmentModel.id)
//             .where(*filters)
//             .group_by(
//                 UserModel.id,
//                 UserModel.name,
//                 AreaModel.name,
//                 UserModel.role,
//                 ProjectModel.id,
//                 ProjectModel.name,
//                 ProjectModel.internal_code,
//                 AssignmentModel.role,
//                 ProjectModel.status,
//                 ProjectModel.priority,
//             )
//             .order_by(func.count(ProjectModel.id).desc())
//         )
//         result = self.db.execute(stmt)
//         return result.all()
