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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Office} from '../models';
import {OfficeRepository} from '../repositories';

export class OfficeController {
  constructor(
    @repository(OfficeRepository)
    public officeRepository: OfficeRepository,
  ) { }

  @post('/offices')
  @response(200, {
    description: 'Office model instance',
    content: {'application/json': {schema: getModelSchemaRef(Office)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Office, {
            title: 'NewOffice',
            exclude: ['id'],
          }),
        },
      },
    })
    office: Omit<Office, 'id'>,
  ): Promise<Office> {
    return this.officeRepository.create(office);
  }

  @get('/offices/count')
  @response(200, {
    description: 'Office model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Office) where?: Where<Office>,
  ): Promise<Count> {
    return this.officeRepository.count(where);
  }

  @get('/offices')
  @response(200, {
    description: 'Array of Office model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Office, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Office) filter?: Filter<Office>,
  ): Promise<Office[]> {
    return this.officeRepository.find({
      ...filter,
      include: ['headquarter'],
    });
  }

  @patch('/offices')
  @response(200, {
    description: 'Office PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Office, {partial: true}),
        },
      },
    })
    office: Office,
    @param.where(Office) where?: Where<Office>,
  ): Promise<Count> {
    return this.officeRepository.updateAll(office, where);
  }

  @get('/offices/{id}')
  @response(200, {
    description: 'Office model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Office, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Office, {exclude: 'where'}) filter?: FilterExcludingWhere<Office>
  ): Promise<Office> {
    return this.officeRepository.findById(id, filter);
  }

  @patch('/offices/{id}')
  @response(204, {
    description: 'Office PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Office, {partial: true}),
        },
      },
    })
    office: Office,
  ): Promise<void> {
    await this.officeRepository.updateById(id, office);
  }

  @put('/offices/{id}')
  @response(204, {
    description: 'Office PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() office: Office,
  ): Promise<void> {
    await this.officeRepository.replaceById(id, office);
  }

  @del('/offices/{id}')
  @response(204, {
    description: 'Office DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.officeRepository.deleteById(id);
  }
}
