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
  User,
  UserAccess,
} from '../models';
import {UserRepository} from '../repositories';

export class UserUserAccessController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) { }

  @get('/users/{id}/user-accesses', {
    responses: {
      '200': {
        description: 'Array of User has many UserAccess',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(UserAccess)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<UserAccess>,
  ): Promise<UserAccess[]> {
    return this.userRepository.userAccesses(id).find(filter);
  }

  @post('/users/{id}/user-accesses', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(UserAccess)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof User.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserAccess, {
            title: 'NewUserAccessInUser',
            exclude: ['id'],
            optional: ['userId']
          }),
        },
      },
    }) userAccess: Omit<UserAccess, 'id'>,
  ): Promise<UserAccess> {
    return this.userRepository.userAccesses(id).create(userAccess);
  }

  @patch('/users/{id}/user-accesses', {
    responses: {
      '200': {
        description: 'User.UserAccess PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserAccess, {partial: true}),
        },
      },
    })
    userAccess: Partial<UserAccess>,
    @param.query.object('where', getWhereSchemaFor(UserAccess)) where?: Where<UserAccess>,
  ): Promise<Count> {
    return this.userRepository.userAccesses(id).patch(userAccess, where);
  }

  @del('/users/{id}/user-accesses', {
    responses: {
      '200': {
        description: 'User.UserAccess DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(UserAccess)) where?: Where<UserAccess>,
  ): Promise<Count> {
    return this.userRepository.userAccesses(id).delete(where);
  }
}
