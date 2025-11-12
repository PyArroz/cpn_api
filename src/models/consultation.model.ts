import {Entity, model, property} from '@loopback/repository';

@model()
export class Consultation extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  startDate?: string;

  @property({
    type: 'date',
  })
  endDate?: string;

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;


  constructor(data?: Partial<Consultation>) {
    super(data);
  }
}

export interface ConsultationRelations {
  // describe navigational properties here
}

export type ConsultationWithRelations = Consultation & ConsultationRelations;
