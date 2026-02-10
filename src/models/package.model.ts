import {Entity, model, property} from '@loopback/repository';

@model()
export class Package extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  hours?: number;

  @property({
    type: 'number',
  })
  cost?: number;

  @property({
    type: 'boolean',
    default: false
  })
  isFixed?: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;





  constructor(data?: Partial<Package>) {
    super(data);
  }
}

export interface PackageRelations {
  // describe navigational properties here
}

export type PackageWithRelations = Package & PackageRelations;
