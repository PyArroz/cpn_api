import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {MysqldbDataSource} from '../datasources';
import {OwnedPackage, OwnedPackageRelations, Package} from '../models';
import {PackageRepository} from './package.repository';

export class OwnedPackageRepository extends DefaultCrudRepository<
  OwnedPackage,
  typeof OwnedPackage.prototype.id,
  OwnedPackageRelations
> {

  public readonly package: BelongsToAccessor<Package, typeof OwnedPackage.prototype.id>;

  constructor(
    @inject('datasources.mysqldb') dataSource: MysqldbDataSource, @repository.getter('PackageRepository') protected packageRepositoryGetter: Getter<PackageRepository>,
  ) {
    super(OwnedPackage, dataSource);
    this.package = this.createBelongsToAccessorFor('package', packageRepositoryGetter,);
    this.registerInclusionResolver('package', this.package.inclusionResolver);
  }
}
