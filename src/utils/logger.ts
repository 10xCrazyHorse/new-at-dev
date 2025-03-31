import pino from 'pino';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Logger {
  static create(name: string) {
    return pino({
      name,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:mm/dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    });
  }
}
