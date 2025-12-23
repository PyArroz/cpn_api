import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Consultation} from '../models';
import {ConsultationRepository} from '../repositories';

export class ConsultationController {
  constructor(
    @repository(ConsultationRepository)
    public consultationRepository: ConsultationRepository,
  ) { }

  @post('/consultations')
  @response(200, {
    description: 'Consultation model instance',
    content: {'application/json': {schema: getModelSchemaRef(Consultation)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Consultation, {
            title: 'NewConsultation',
            exclude: ['id'],
          }),
        },
      },
    })
    consultation: Omit<Consultation, 'id'>,
  ): Promise<Consultation> {
    // Verificar conflictos de horario en el mismo consultorio
    await this.checkTimeConflict(
      consultation.officeId,
      consultation.startDate,
      undefined
    );

    return this.consultationRepository.create(consultation);
  }

  @get('/consultations/count')
  @response(200, {
    description: 'Consultation model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Consultation) where?: Where<Consultation>,
  ): Promise<Count> {
    return this.consultationRepository.count(where);
  }

  @get('/consultations')
  @response(200, {
    description: 'Array of Consultation model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Consultation, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Consultation) filter?: Filter<Consultation>,
  ): Promise<Consultation[]> {
    return this.consultationRepository.find({
      ...filter,
      where: {...filter?.where, isDeleted: false, isCancelled: false}
    });
  }

  @patch('/consultations')
  @response(200, {
    description: 'Consultation PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Consultation, {partial: true}),
        },
      },
    })
    consultation: Consultation,
    @param.where(Consultation) where?: Where<Consultation>,
  ): Promise<Count> {
    return this.consultationRepository.updateAll(consultation, where);
  }

  @get('/consultations/{id}')
  @response(200, {
    description: 'Consultation model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Consultation, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Consultation, {exclude: 'where'}) filter?: FilterExcludingWhere<Consultation>
  ): Promise<Consultation> {
    return this.consultationRepository.findById(id, {
      ...filter
    });
  }

  @patch('/consultations/{id}')
  @response(204, {
    description: 'Consultation PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Consultation, {partial: true}),
        },
      },
    })
    consultation: Consultation,
  ): Promise<void> {
    // Si se actualiza officeId o startDate, verificar conflictos
    if (consultation.officeId || consultation.startDate) {
      const existing = await this.consultationRepository.findById(id);
      await this.checkTimeConflict(
        consultation.officeId || existing.officeId,
        consultation.startDate || existing.startDate,
        id
      );
    }

    await this.consultationRepository.updateById(id, consultation);
  }

  @put('/consultations/{id}')
  @response(204, {
    description: 'Consultation PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() consultation: Consultation,
  ): Promise<void> {
    await this.consultationRepository.replaceById(id, consultation);
  }

  @del('/consultations/{id}')
  @response(204, {
    description: 'Consultation soft DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.consultationRepository.updateById(id, {isDeleted: true});
  }

  @patch('/consultations/{id}/cancel')
  @response(204, {
    description: 'Consultation CANCEL success',
  })
  async cancelById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              cancellationReason: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body?: {cancellationReason?: string},
  ): Promise<void> {
    await this.consultationRepository.updateById(id, {
      isCancelled: true,
      cancelledAt: new Date().toISOString(),
      cancellationReason: body?.cancellationReason,
    });
  }

  @post('/consultations/{id}/cancel-date')
  @response(200, {
    description: 'Cancel a specific future date from a recurring consultation',
    content: {'application/json': {schema: getModelSchemaRef(Consultation)}},
  })
  async cancelRecurringDate(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['startDate'],
            properties: {
              startDate: {
                type: 'string',
                format: 'date-time',
              },
              cancellationReason: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body: {startDate: string; cancellationReason?: string},
  ): Promise<Consultation> {
    // Obtener la consulta original para copiar sus datos
    const originalConsultation = await this.consultationRepository.findById(id);

    if (originalConsultation.isFlex) {
      throw new HttpErrors.BadRequest(
        'Solo se pueden cancelar fechas específicas de consultas fijas/recurrentes'
      );
    }

    // Determinar el firstId (usar el firstId de la consulta o su propio id si es la primera)
    const recurringId = originalConsultation.firstId || id;

    // Verificar si ya existe una cancelación para esta fecha
    const existingCancellation = await this.consultationRepository.findOne({
      where: {
        firstId: recurringId,
        startDate: body.startDate,
        isCancelled: true,
      },
    });

    if (existingCancellation) {
      throw new HttpErrors.Conflict(
        'Ya existe una cancelación para esta fecha'
      );
    }

    // Crear un registro de cancelación para esta fecha específica
    const cancellation = await this.consultationRepository.create({
      firstId: recurringId,
      startDate: body.startDate,
      officeId: originalConsultation.officeId,
      userId: originalConsultation.userId,
      isCancelled: true,
      isFlex: false,
      cancelledAt: new Date().toISOString(),
      cancellationReason: body.cancellationReason,
    });

    return cancellation;
  }

  @post('/consultations/{id}/cancel-from-date')
  @response(200, {
    description: 'Cancel a specific date and all subsequent dates from a recurring consultation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            cancelledCount: {type: 'number'},
            message: {type: 'string'},
          },
        },
      },
    },
  })
  async cancelRecurringFromDate(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['startDate'],
            properties: {
              startDate: {
                type: 'string',
                format: 'date-time',
              },
              cancellationReason: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    body: {startDate: string; cancellationReason?: string},
  ): Promise<{cancelledCount: number; message: string}> {
    // Obtener la consulta original
    const originalConsultation = await this.consultationRepository.findById(id);

    if (originalConsultation.isFlex) {
      throw new HttpErrors.BadRequest(
        'Solo se pueden cancelar fechas de consultas fijas/recurrentes'
      );
    }

    if (!originalConsultation.endDate) {
      throw new HttpErrors.BadRequest(
        'La consulta debe tener una fecha de fin (endDate) definida'
      );
    }

    // Determinar el firstId (usar el firstId de la consulta o su propio id si es la primera)
    const recurringId = originalConsultation.firstId || id;

    // Obtener la frecuencia semanal (por defecto 1 semana)
    const weeklyFrequency = originalConsultation.weeklyFrequency || 1;

    // Calcular todas las fechas futuras desde startDate hasta endDate
    const cancelStartDate = new Date(body.startDate);
    const endDate = new Date(originalConsultation.endDate);
    const futureDates: Date[] = [];

    let currentDate = new Date(cancelStartDate);
    while (currentDate <= endDate) {
      futureDates.push(new Date(currentDate));
      // Avanzar según la frecuencia semanal
      currentDate.setDate(currentDate.getDate() + (7 * weeklyFrequency));
    }

    // Crear registros de cancelación para cada fecha futura
    let cancelledCount = 0;
    for (const futureDate of futureDates) {
      const futureDateISO = futureDate.toISOString();

      // Verificar si ya existe una cancelación o una consulta para esta fecha
      const existingCancellation = await this.consultationRepository.findOne({
        where: {
          or: [
            {id: recurringId},
            {firstId: recurringId},
          ],
          startDate: futureDateISO,
        },
      });

      if (existingCancellation) {
        // Si existe, actualizar a cancelada
        await this.consultationRepository.updateById(existingCancellation.id!, {
          isCancelled: true,
          cancelledAt: new Date().toISOString(),
          cancellationReason: body.cancellationReason,
        });
        cancelledCount++;
      } else {
        // Si no existe, crear un registro de cancelación
        await this.consultationRepository.create({
          firstId: recurringId,
          startDate: futureDateISO,
          officeId: originalConsultation.officeId,
          userId: originalConsultation.userId,
          isCancelled: true,
          isFlex: false,
          weeklyFrequency: weeklyFrequency,
          cancelledAt: new Date().toISOString(),
          cancellationReason: body.cancellationReason,
        });
        cancelledCount++;
      }
    }

    return {
      cancelledCount,
      message: `Se cancelaron ${cancelledCount} consulta(s) desde la fecha ${body.startDate}`,
    };
  }

  @get('/consultations/{id}/cancelled-dates')
  @response(200, {
    description: 'Get all cancelled dates for a recurring consultation',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Consultation),
        },
      },
    },
  })
  async getRecurringCancelledDates(
    @param.path.number('id') id: number,
  ): Promise<Consultation[]> {
    const consultation = await this.consultationRepository.findById(id);
    const recurringId = consultation.firstId || id;

    return this.consultationRepository.find({
      where: {
        firstId: recurringId,
        isCancelled: true,
      },
    });
  }

  // Método privado para verificar conflictos de horario
  private async checkTimeConflict(
    officeId: number,
    startDate: string | undefined,
    excludeId?: number
  ): Promise<void> {
    if (!startDate) return;

    // Buscar consultas activas (no eliminadas, no canceladas)
    const where: any = {
      officeId: officeId,
      startDate: startDate,
      isDeleted: false,
      isCancelled: false,
    };

    // Excluir la consulta actual si estamos actualizando
    if (excludeId) {
      where.id = {neq: excludeId};
    }

    const conflictingConsultations = await this.consultationRepository.find({
      where: where,
    });

    if (conflictingConsultations.length > 0) {
      // Verificar si hay una cancelación para alguna de las consultas fijas
      for (const consultation of conflictingConsultations) {
        if (!consultation.isFlex && consultation.firstId) {
          // Es una consulta recurrente, verificar si tiene cancelación para esta fecha
          const hasCancellation = await this.consultationRepository.findOne({
            where: {
              firstId: consultation.firstId,
              startDate: startDate,
              isCancelled: true,
            },
          });

          if (hasCancellation) {
            // Hay una cancelación, este horario está disponible
            continue;
          }
        }

        // Si llegamos aquí, hay un conflicto real
        throw new HttpErrors.Conflict(
          'Ya existe una cita agendada en este consultorio a la misma hora'
        );
      }
    }
  }
}
