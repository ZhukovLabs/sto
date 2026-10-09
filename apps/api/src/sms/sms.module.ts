import { DynamicModule, Global, Module } from '@nestjs/common';
import { SMS, SmsSender, smsConfigFromEnv } from './sms';

@Global()
@Module({})
export class SmsModule {
  public static register(variables: NodeJS.ProcessEnv): DynamicModule {
    const config = smsConfigFromEnv(variables);
    if (config === null) {
      return { module: SmsModule };
    }
    const sender = new SmsSender(config);
    return {
      module: SmsModule,
      providers: [{ provide: SMS, useValue: sender }],
      exports: [SMS],
    };
  }
}
