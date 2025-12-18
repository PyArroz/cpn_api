import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  UserAccess,
  User,
} from '../models';
import {UserAccessRepository} from '../repositories';

export class UserAccessUserController {
  constructor(
    @repository(UserAccessRepository)
    public userAccessRepository: UserAccessRepository,
  ) { }

  @get('/user-accesses/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to UserAccess',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof UserAccess.prototype.id,
  ): Promise<User> {
    return this.userAccessRepository.user(id);
  }
}
