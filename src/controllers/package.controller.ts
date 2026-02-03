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
import {Package} from '../models';
import {PackageRepository} from '../repositories';

export class PackageController {
  constructor(
    @repository(PackageRepository)
    public packageRepository: PackageRepository,
  ) { }

  @post('/packages')
  @response(200, {
    description: 'Package model instance',
    content: {'application/json': {schema: getModelSchemaRef(Package)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Package, {
            title: 'NewPackage',
            exclude: ['id'],
          }),
        },
      },
    })
    packageData: Omit<Package, 'id'>,
  ): Promise<Package> {
    return this.packageRepository.create(packageData);
  }

  @get('/packages/count')
  @response(200, {
    description: 'Package model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Package) where?: Where<Package>,
  ): Promise<Count> {
    return this.packageRepository.count(where);
  }

  @get('/packages')
  @response(200, {
    description: 'Array of Package model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Package, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Package) filter?: Filter<Package>,
  ): Promise<Package[]> {
    return this.packageRepository.find(filter);
  }

  @patch('/packages')
  @response(200, {
    description: 'Package PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Package, {partial: true}),
        },
      },
    })
    packageData: Package,
    @param.where(Package) where?: Where<Package>,
  ): Promise<Count> {
    return this.packageRepository.updateAll(packageData, where);
  }

  @get('/packages/{id}')
  @response(200, {
    description: 'Package model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Package, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Package, {exclude: 'where'}) filter?: FilterExcludingWhere<Package>
  ): Promise<Package> {
    return this.packageRepository.findById(id, filter);
  }

  @patch('/packages/{id}')
  @response(204, {
    description: 'Package PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Package, {partial: true}),
        },
      },
    })
    packageData: Package,
  ): Promise<void> {
    await this.packageRepository.updateById(id, packageData);
  }

  @put('/packages/{id}')
  @response(204, {
    description: 'Package PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() packageData: Package,
  ): Promise<void> {
    await this.packageRepository.replaceById(id, packageData);
  }

  @del('/packages/{id}')
  @response(204, {
    description: 'Package DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.packageRepository.deleteById(id);
  }
}
