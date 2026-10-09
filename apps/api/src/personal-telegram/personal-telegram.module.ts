import { Global, Module, type DynamicModule } from '@nestjs/common';
import { PersonalTelegramSender, loadPersonalTelegramConfig } from './personal-telegram';

export const PERSONAL_TELEGRAM = Symbol('PERSONAL_TELEGRAM');

@Global()
@Module({})
export class PersonalTelegramModule {
  static register(env: NodeJS.ProcessEnv): DynamicModule {
    const config = loadPersonalTelegramConfig(env);
    return {
      module: PersonalTelegramModule,
      providers:
        config === null
          ? []
          : [{ provide: PERSONAL_TELEGRAM, useValue: new PersonalTelegramSender(config) }],
      exports: config === null ? [] : [PERSONAL_TELEGRAM],
    };
  }
}
