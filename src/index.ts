import {ApplicationConfig, CpnApplication} from './application';
import {DbInitializer} from './services/db-initializer';
import {RecurringConsultationSchedulerService} from './services/recurring-consultation-scheduler.service';
import cron from 'node-cron';

export * from './application';

/** Programa el cron diario de reagendado de consultas recurrentes (ejecución a la 01:00). */
function scheduleRecurringConsultationsCron(app: CpnApplication) {
  const task = cron.schedule(
    '0 1 * * *', // Todos los días a la 01:00
    async () => {
      try {
        const scheduler = await app.get<RecurringConsultationSchedulerService>(
          'services.RecurringConsultationScheduler',
        );
        const result = await scheduler.scheduleNextOccurrences({futureWindowDays: 90});
        if (result.created > 0 || result.seriesProcessed > 0) {
          console.log(
            `[Cron] Reagendado: ${result.created} consulta(s) creada(s), ${result.seriesProcessed} serie(s) procesada(s).`,
          );
        }
      } catch (err) {
        console.error('[Cron] Error en reagendado de consultas recurrentes:', err);
      }
    },
    {scheduled: true, timezone: process.env.TZ ?? 'America/Mexico_City'},
  );
  return task;
}

export async function main(options: ApplicationConfig = {}) {
  const app = new CpnApplication(options);
  await app.boot();
  await app.migrateSchema();
  const dbInitializer = new DbInitializer(await app.get('repositories.RoleRepository'), await app.get('repositories.UserRepository'));
  await dbInitializer.initialize();

  await app.start();

  scheduleRecurringConsultationsCron(app);
  console.log('Cron de consultas recurrentes: diario a las 01:00 (TZ:', process.env.TZ ?? 'America/Mexico_City', ')');

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3500),
      host: process.env.HOST !== undefined ? process.env.HOST : '127.0.0.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
