import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Office} from './office.model';
import {User} from './user.model';

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

  /*

  El día y hora que toca la consulta, esta consulta es solamente de una hora

  */

  @property({
    type: 'date',
  })
  endDate?: string;

  /*

  endDate se utiliza para saber qué día dejan de aparecer las consultas recurrentes.

  */

  @property({
    type: 'boolean',
    default: false
  })
  isDeleted?: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  isCancelled?: boolean;

  /*

  isCancelled indica que esta consulta está cancelada.

  Para consultas flexibles (isFlex=true): Se marca el registro existente con isCancelled=true

  Para consultas fijas/recurrentes (isFlex=false):
  - Para cancelar una fecha específica futura, se crea un nuevo registro con:
    * isCancelled=true
    * firstId apuntando a la consulta recurrente original
    * startDate de la fecha específica a cancelar
  - Esto libera ese horario para que otros usuarios puedan reservar sin afectar las demás ocurrencias de la serie.

  */

  @property({
    type: 'date',
  })
  cancelledAt?: string;

  /*

  Fecha y hora en que se canceló la consulta

  */

  @property({
    type: 'string',
  })
  cancellationReason?: string;

  /*

  Motivo opcional de la cancelación

  */

  @property({
    type: 'boolean',
    default: true
  })
  isFlex?: boolean;

  /*

  isFlex indica si la consulta es flexible o fija.

  Si es flexible, entonces no es una consulta recurrente, sino que el usuario puede elegir cualquier día y hora disponible.

  Si es fija, entonces la consulta es recurrente y se repite cada semana en el mismo día y hora hasta endDate.

  En la base de datos, las consultas flexibles tendrán endDate igual a null.

  Las consultas fijas son las recurrentes, en el frontend se deberá ver lo siguiente:

  - la casilla marcada en el día y hora de la consulta, pero las próximas semanas la casilla se mostrará como (próximamente)
  sin embargo esas consultas futuras aún no estarán creadas en la base de datos, solo se crearán cuando llegue el día de la consulta.

  - No se podrán reservar otras consultas en ese mismo día y hora en el mismo consultorio aunque la consulta futura aún no esté creada
  en la base de datos.

  */

  @property({
    type: 'number',
  })
  firstId?: number;

  /*

  Si es una consulta fija, este es el id de la primera consulta recurrente.

  También se usa para las cancelaciones de fechas específicas:
  cuando isCancelled=true y firstId tiene valor, indica que esta es una
  cancelación de una fecha específica de la serie recurrente.

  */

  @property({
    type: 'number',
    default: 1
  })
  weeklyFrequency?: number;

  /*

  Frecuencia semanal para consultas recurrentes.
  Por ejemplo: 1 = cada semana, 2 = cada 2 semanas, 4 = cada 4 semanas.
  Solo aplica para consultas fijas (isFlex=false).

  */



  @belongsTo(() => Office)
  officeId: number;

  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<Consultation>) {
    super(data);
  }
}

export interface ConsultationRelations {
  // describe navigational properties here
}

export type ConsultationWithRelations = Consultation & ConsultationRelations;
