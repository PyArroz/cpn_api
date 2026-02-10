import {Entity, model, property} from '@loopback/repository';

@model()
export class HeadquarterFee extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  fee: number;

  @property({
    type: 'date',
  })
  created?: string;

  @property({
    type: 'number',
  })
  headquarterId?: number;

  constructor(data?: Partial<HeadquarterFee>) {
    super(data);
  }
}

export interface HeadquarterFeeRelations {
  // describe navigational properties here
}

export type HeadquarterFeeWithRelations = HeadquarterFee & HeadquarterFeeRelations;
