import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Package} from './package.model';

@model({settings: {strict: false}})
export class OwnedPackage extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  ownDate?: string;

  @property({
    type: 'number',
  })
  userId?: number;

  @belongsTo(() => Package)
  packageId: number;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<OwnedPackage>) {
    super(data);
  }
}

export interface OwnedPackageRelations {
  // describe navigational properties here
}

export type OwnedPackageWithRelations = OwnedPackage & OwnedPackageRelations;
