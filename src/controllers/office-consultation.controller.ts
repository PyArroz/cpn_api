import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Office,
  Consultation,
} from '../models';
import {OfficeRepository} from '../repositories';

export class OfficeConsultationController {
  constructor(
    @repository(OfficeRepository) protected officeRepository: OfficeRepository,
  ) { }

  @get('/offices/{id}/consultations', {
    responses: {
      '200': {
        description: 'Array of Office has many Consultation',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Consultation)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Consultation>,
  ): Promise<Consultation[]> {
    return this.officeRepository.consultations(id).find(filter);
  }

  @post('/offices/{id}/consultations', {
    responses: {
      '200': {
        description: 'Office model instance',
        content: {'application/json': {schema: getModelSchemaRef(Consultation)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Office.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Consultation, {
            title: 'NewConsultationInOffice',
            exclude: ['id'],
            optional: ['officeId']
          }),
        },
      },
    }) consultation: Omit<Consultation, 'id'>,
  ): Promise<Consultation> {
    return this.officeRepository.consultations(id).create(consultation);
  }

  @patch('/offices/{id}/consultations', {
    responses: {
      '200': {
        description: 'Office.Consultation PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Consultation, {partial: true}),
        },
      },
    })
    consultation: Partial<Consultation>,
    @param.query.object('where', getWhereSchemaFor(Consultation)) where?: Where<Consultation>,
  ): Promise<Count> {
    return this.officeRepository.consultations(id).patch(consultation, where);
  }

  @del('/offices/{id}/consultations', {
    responses: {
      '200': {
        description: 'Office.Consultation DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Consultation)) where?: Where<Consultation>,
  ): Promise<Count> {
    return this.officeRepository.consultations(id).delete(where);
  }
}
