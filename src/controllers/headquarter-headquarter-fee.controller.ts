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
  HeadquarterFee,
} from '../models';
import {HeadquarterRepository} from '../repositories';

export class HeadquarterHeadquarterFeeController {
  constructor(
    @repository(HeadquarterRepository) protected headquarterRepository: HeadquarterRepository,
  ) { }

  @get('/headquarters/{id}/headquarter-fees', {
    responses: {
      '200': {
        description: 'Array of Headquarter has many HeadquarterFee',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(HeadquarterFee)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<HeadquarterFee>,
  ): Promise<HeadquarterFee[]> {
    return this.headquarterRepository.headquarterFees(id).find(filter);
  }

  @post('/headquarters/{id}/headquarter-fees', {
    responses: {
      '200': {
        description: 'Headquarter model instance',
        content: {'application/json': {schema: getModelSchemaRef(HeadquarterFee)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof Headquarter.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(HeadquarterFee, {
            title: 'NewHeadquarterFeeInHeadquarter',
            exclude: ['id'],
            optional: ['headquarterId']
          }),
        },
      },
    }) headquarterFee: Omit<HeadquarterFee, 'id'>,
  ): Promise<HeadquarterFee> {
    return this.headquarterRepository.headquarterFees(id).create(headquarterFee);
  }

  @patch('/headquarters/{id}/headquarter-fees', {
    responses: {
      '200': {
        description: 'Headquarter.HeadquarterFee PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(HeadquarterFee, {partial: true}),
        },
      },
    })
    headquarterFee: Partial<HeadquarterFee>,
    @param.query.object('where', getWhereSchemaFor(HeadquarterFee)) where?: Where<HeadquarterFee>,
  ): Promise<Count> {
    return this.headquarterRepository.headquarterFees(id).patch(headquarterFee, where);
  }

  @del('/headquarters/{id}/headquarter-fees', {
    responses: {
      '200': {
        description: 'Headquarter.HeadquarterFee DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(HeadquarterFee)) where?: Where<HeadquarterFee>,
  ): Promise<Count> {
    return this.headquarterRepository.headquarterFees(id).delete(where);
  }
}
