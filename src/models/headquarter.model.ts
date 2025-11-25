import {Entity, hasMany, model, property} from '@loopback/repository';
import {Office} from './office.model';

@model()
export class Headquarter extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
  })
  address1?: string;

  @property({
    type: 'string',
  })
  address2?: string;

  @property({
    type: 'string',
  })
  zipCode?: string;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;

  @property({
    type: 'number',
    dataType: 'FLOAT'
  })
  citationFee?: number;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt?: string;

  @hasMany(() => Office)
  offices: Office[];

  constructor(data?: Partial<Headquarter>) {
    super(data);
  }
}

export interface HeadquarterRelations {
  // describe navigational properties here
}

export type HeadquarterWithRelations = Headquarter & HeadquarterRelations;
