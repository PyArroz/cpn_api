import {Entity, model, property} from '@loopback/repository';

@model()
export class NonWorkingDay extends Entity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  day: string;

  @property({
    type: 'boolean',
  })
  everyWeek?: boolean;


  constructor(data?: Partial<NonWorkingDay>) {
    super(data);
  }
}

export interface NonWorkingDayRelations {
  // describe navigational properties here
}

export type NonWorkingDayWithRelations = NonWorkingDay & NonWorkingDayRelations;
