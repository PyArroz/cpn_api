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
  Headquarter,
} from '../models';
import {UserAccessRepository} from '../repositories';

export class UserAccessHeadquarterController {
  constructor(
    @repository(UserAccessRepository)
    public userAccessRepository: UserAccessRepository,
  ) { }

  @get('/user-accesses/{id}/headquarter', {
    responses: {
      '200': {
        description: 'Headquarter belonging to UserAccess',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Headquarter),
          },
        },
      },
    },
  })
  async getHeadquarter(
    @param.path.number('id') id: typeof UserAccess.prototype.id,
  ): Promise<Headquarter> {
    return this.userAccessRepository.headquarter(id);
  }
}
