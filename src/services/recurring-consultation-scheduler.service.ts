import {repository} from '@loopback/repository';
import {Consultation} from '../models';
import {ConsultationRepository} from '../repositories';

/**
 * Servicio que crea las próximas ocurrencias de consultas recurrentes (reagendado).
 * Las consultas fijas (isFlex=false) se repiten según weeklyFrequency hasta endDate;
 * según el modelo, las ocurrencias futuras "solo se crearán cuando llegue el día".
 * Este servicio debe ejecutarse periódicamente (p. ej. diario) para crear esas ocurrencias.
 */
export class RecurringConsultationSchedulerService {
  constructor(
    @repository(ConsultationRepository)
    private consultationRepository: ConsultationRepository,
  ) {}

  /**
   * Crea las próximas ocurrencias faltantes de todas las series recurrentes
   * hasta una ventana futura (p. ej. 90 días) o hasta endDate de cada serie.
   * Respeta cancelaciones: no crea una ocurrencia en una fecha ya cancelada.
   */
  async scheduleNextOccurrences(options?: {
    /** Ventana en días hacia el futuro para crear ocurrencias (default 90). */
    futureWindowDays?: number;
  }): Promise<{created: number; seriesProcessed: number}> {
    const futureWindowDays = options?.futureWindowDays ?? 90;
    const now = new Date();
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + futureWindowDays);

    // Series recurrentes que son "raíz": isFlex=false, (firstId null o firstId = id), no eliminadas, no canceladas
    const allFixed = await this.consultationRepository.find({
      where: {
        isFlex: false,
        isDeleted: false,
        isCancelled: false,
      },
    });

    const rootIds = new Set<number>();
    for (const c of allFixed) {
      if (c.id == null) continue;
      if (c.firstId == null || c.firstId === c.id) rootIds.add(c.id);
    }

    let created = 0;
    for (const rootId of rootIds) {
      const root = await this.consultationRepository.findById(rootId);
      if (!root.endDate) continue;
      const seriesEnd = new Date(root.endDate);
      if (seriesEnd < now) continue;

      const frequency = root.weeklyFrequency ?? 1;
      const stepMs = frequency * 7 * 24 * 60 * 60 * 1000;

      // Última ocurrencia conocida (la de startDate más reciente de la serie)
      const occurrences = await this.consultationRepository.find({
        where: {
          or: [{id: rootId}, {firstId: rootId}],
          isCancelled: false,
        },
        order: ['startDate DESC'],
        limit: 1,
      });

      const lastStart = occurrences[0]?.startDate;
      const baseStart = lastStart ? new Date(lastStart) : new Date(root.startDate!);

      let nextStart = new Date(baseStart.getTime() + stepMs);

      while (nextStart <= seriesEnd && nextStart <= windowEnd) {
        const nextStartISO = nextStart.toISOString();

        const existing = await this.consultationRepository.findOne({
          where: {
            or: [
              {firstId: rootId, startDate: nextStartISO},
              {id: rootId, startDate: nextStartISO},
            ],
          },
        });

        if (!existing) {
          await this.consultationRepository.create({
            startDate: nextStartISO,
            endDate: root.endDate,
            officeId: root.officeId,
            userId: root.userId,
            isFlex: false,
            firstId: rootId,
            weeklyFrequency: frequency,
            isDeleted: false,
            isCancelled: false,
          });
          created++;
        }

        nextStart = new Date(nextStart.getTime() + stepMs);
      }
    }

    return {created, seriesProcessed: rootIds.size};
  }
}
