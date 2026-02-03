import {
  Count,
  CountSchema,
  repository,
  Where
} from '@loopback/repository';
import {
  del,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {
  OwnedPackage,
  User
} from '../models';
import {UserRepository} from '../repositories';

export class UserOwnedPackageController {
  constructor(
    @repository(UserRepository) protected userRepository: UserRepository,
  ) { }

  @post('/users/{id}/owned-package', {
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(OwnedPackage)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof User.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OwnedPackage, {
            title: 'NewOwnedPackageInUser',
            exclude: ['id'],
            optional: ['userId']
          }),
        },
      },
    }) ownedPackage: Omit<OwnedPackage, 'id'>,
  ): Promise<OwnedPackage> {
    return this.userRepository.ownedPackages(id).create(ownedPackage);
  }

  @patch('/users/{id}/owned-package', {
    responses: {
      '200': {
        description: 'User.OwnedPackage PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(OwnedPackage, {partial: true}),
        },
      },
    })
    ownedPackage: Partial<OwnedPackage>,
    @param.query.object('where', getWhereSchemaFor(OwnedPackage)) where?: Where<OwnedPackage>,
  ): Promise<Count> {
    return this.userRepository.ownedPackages(id).patch(ownedPackage, where);
  }

  @del('/users/{id}/owned-package', {
    responses: {
      '200': {
        description: 'User.OwnedPackage DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(OwnedPackage)) where?: Where<OwnedPackage>,
  ): Promise<Count> {
    return this.userRepository.ownedPackages(id).delete(where);
  }
}
