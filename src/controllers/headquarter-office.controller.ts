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
  Headquarter,
  Office,
} from '../models';
import {HeadquarterRepository} from '../repositories';

export class HeadquarterOfficeController {
  constructor(
    @repository(HeadquarterRepository) protected headquarterRepository: HeadquarterRepository,
  ) { }

  @get('/headquarters/{id}/offices', {
    responses: {
      '200': {
        description: 'Array of Headquarter has many Office',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Office)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<Office>,
  ): Promise<Office[]> {
    return this.headquarterRepository.offices(id).find(filter);
  }

  @post('/headquarters/{id}/offices', {
    responses: {
      '200': {
        description: 'Headquarter model instance',
        content: {'application/json': {schema: getModelSchemaRef(Office)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Headquarter.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Office, {
            title: 'NewOfficeInHeadquarter',
            exclude: ['id'],
            optional: ['headquarterId']
          }),
        },
      },
    }) office: Omit<Office, 'id'>,
  ): Promise<Office> {
    return this.headquarterRepository.offices(id).create(office);
  }

  @patch('/headquarters/{id}/offices', {
    responses: {
      '200': {
        description: 'Headquarter.Office PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Office, {partial: true}),
        },
      },
    })
    office: Partial<Office>,
    @param.query.object('where', getWhereSchemaFor(Office)) where?: Where<Office>,
  ): Promise<Count> {
    return this.headquarterRepository.offices(id).patch(office, where);
  }

  @del('/headquarters/{id}/offices', {
    responses: {
      '200': {
        description: 'Headquarter.Office DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(Office)) where?: Where<Office>,
  ): Promise<Count> {
    return this.headquarterRepository.offices(id).delete(where);
  }
}
