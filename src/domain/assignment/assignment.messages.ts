export class AssignmentMessages {
  static PROJECT_NOT_FOUND = 'El proyecto especificado no existe.'
  static USER_NOT_FOUND = 'El usuario especificado no existe.'
  static FINISH_SUCCESSFULLY = 'Las asignaciones se han completado exitosamente.'
  static ASSIGN_BY_USER_NOT_FOUND = 'El usuario que asigna no existe.'
  static ASSIGNMENT_NOT_FOUND_FOR_EDIT =
    'No se encontró un assignment para editar con el usuario y proyecto especificados.'
  static ASSIGNMENT_SIMULATION_COMPLETED =
    'La simulación del assignment ha sido completada exitosamente.'
  static SIMULATION_START_DATE_BEFORE_PROJECT_START =
    'La fecha de inicio de la simulación no puede ser anterior a la fecha de inicio del proyecto.'
  static SIMULATION_EXCEEDS_ONE_YEAR =
    'No se pudieron asignar todas las horas en un año. Verifique la disponibilidad del usuario.'

  static TIME_BLOCK_OVERLAP(date: string, start_time: string, end_time: string): string {
    return `El bloque de tiempo ${date} ${start_time}-${end_time} se solapa con un bloque de tiempo existente.`
  }

  static TIME_BLOCK_INVALID_TIME_RANGE(date: string, start_time: string, end_time: string): string {
    return `El bloque de tiempo ${date} tiene un rango de tiempo inválido: la hora de inicio (${start_time}) debe ser anterior a la hora de fin (${end_time}).`
  }

  static TIME_BLOCK_COMMENT_REQUIRED(
    date: string,
    start_time: string,
    end_time: string,
    max_hours: number,
    max_overtime_hours: number
  ): string {
    return `El bloque de tiempo ${date} ${start_time}-${end_time} requiere un comentario porque la duración está entre ${max_hours} y ${max_overtime_hours} horas.`
  }

  static TIME_BLOCK_OUTSIDE_PROJECT_DATES(
    date: string,
    project_start_date: string,
    project_end_date: string
  ): string {
    return `El bloque de tiempo ${date} está fuera del rango de fechas del proyecto (${project_start_date} a ${project_end_date}) y requiere un comentario.`
  }

  static TIME_BLOCK_EXCEEDS_DAILY_LIMIT(date: string, hours: number): string {
    return `La suma de las horas de los bloques de tiempo para el día ${date} excede el límite diario de ${hours} horas.`
  }
}
