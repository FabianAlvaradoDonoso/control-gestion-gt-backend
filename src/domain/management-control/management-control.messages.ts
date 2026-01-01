export class ManagementControlMessages {
  static PROJECT_ID_REQUIRED = 'Se requiere el ID del proyecto para obtener los datos'
  static COMMENT_CONTENT_REQUIRED = 'El contenido del comentario es obligatorio para guardarlo'
  static RESPONSIBLE_USERS_PROJECT_ID_REQUIRED =
    'Se requiere el ID del proyecto para obtener los usuarios responsables'

  static PROJECT_NOT_FOUND = 'El proyecto especificado no existe.'
  static COMMENT_NOT_FOUND = 'El comentario especificado no existe.'
  static COMMENT_EDIT_PERMISSION_DENIED = 'No tienes permiso para editar este comentario.'
  static RESPONSIBLE_USER_CANNOT_REMOVE_PRIMARY =
    'No se puede eliminar un usuario responsable que es primario, debe asignar otro primario primero.'
  static INVALID_RESPONSIBLE_USER_ACTION =
    'La acción especificada para el usuario responsable no es válida.'

  static WARNINGS_PROJECT_ID_REQUIRED =
    'Se requiere el ID del proyecto para obtener las advertencias'
  static WARNINGS_DATE_PASSED_TITLE = 'Fecha de fin del proyecto pasada'
  static WARNINGS_DATE_PASSED_DESCRIPTION =
    'La fecha de fin del proyecto ha pasado. Se recomienda revisar el estado del proyecto.'
  static WARNINGS_DATE_WITHIN_X_DAYS_TITLE = 'Fecha de fin del proyecto próxima'
  static WARNINGS_LEAVE_ASSIGNMENT_OVERLAP_TITLE =
    'Usuario con licencia o permiso durante asignación'

  static USER_ID_REQUIRED = 'Se requiere el ID del usuario para esta operación.'
  static USER_NOT_FOUND = 'El usuario especificado no existe.'

  static WARNINGS_DATE_WITHIN_X_DAYS_DESCRIPTION(days: number): string {
    return `La fecha de fin del proyecto está dentro de los próximos ${days} días.`
  }

  static WARNINGS_LEAVE_ASSIGNMENT_OVERLAP_DESCRIPTION(data: {
    userName: string
    leaveStart: string
    leaveEnd: string
    assignmentDate: string
  }): string {
    return (
      `El usuario <b>${data.userName}</b> tiene una licencia o permiso desde ` +
      `${data.leaveStart} hasta ${data.leaveEnd}, que coincide con su asignación el ${data.assignmentDate}.`
    )
  }
}
