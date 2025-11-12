import {Entity, model, property} from '@loopback/repository';

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


  constructor(data?: Partial<Headquarter>) {
    super(data);
  }
}

export interface HeadquarterRelations {
  // describe navigational properties here
}

export type HeadquarterWithRelations = Headquarter & HeadquarterRelations;
