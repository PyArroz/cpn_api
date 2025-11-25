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
      where: {...filter?.where, isDeleted: false}
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

  // Método privado para verificar conflictos de horario
  private async checkTimeConflict(
    officeId: number,
    startDate: string | undefined,
    excludeId?: number
  ): Promise<void> {
    if (!startDate) return;

    const where: any = {
      officeId: officeId,
      startDate: startDate,
      isDeleted: false,
    };

    // Excluir la consulta actual si estamos actualizando
    if (excludeId) {
      where.id = {neq: excludeId};
    }

    const conflictingConsultations = await this.consultationRepository.find({
      where: where,
    });

    if (conflictingConsultations.length > 0) {
      throw new HttpErrors.Conflict(
        'Ya existe una cita agendada en este consultorio a la misma hora'
      );
    }
  }
}
