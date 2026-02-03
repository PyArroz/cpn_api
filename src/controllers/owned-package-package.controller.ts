import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  OwnedPackage,
  Package,
} from '../models';
import {OwnedPackageRepository} from '../repositories';

export class OwnedPackagePackageController {
  constructor(
    @repository(OwnedPackageRepository)
    public ownedPackageRepository: OwnedPackageRepository,
  ) { }

  @get('/owned-packages/{id}/package', {
    responses: {
      '200': {
        description: 'Package belonging to OwnedPackage',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Package),
          },
        },
      },
    },
  })
  async getPackage(
    @param.path.number('id') id: typeof OwnedPackage.prototype.id,
  ): Promise<Package> {
    return this.ownedPackageRepository.package(id);
  }
}
