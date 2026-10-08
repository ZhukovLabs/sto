export const SMS = Symbol('SMS');
export type SMS = SmsSender;

export interface SmsConfig {
  login: string;
  password: string;
  sender?: string;
}

export interface SmsSendResult {
  ok: boolean;
  id?: number;
  count?: number;
  cost?: string;
  balance?: string;
  error?: string;
}

export function smsConfigFromEnv(variables: NodeJS.ProcessEnv): SmsConfig | null {
  const login = variables.SMSC_LOGIN?.trim();
  const password = variables.SMSC_PASSWORD?.trim();
  if (!login || !password) {
    return null;
  }
  const sender = variables.SMSC_SENDER?.trim();
  return { login, password, sender: sender || undefined };
}

export class SmsSender {
  private readonly baseUrl = 'https://smscentre.by/sys/send.php';

  constructor(private readonly config: SmsConfig) {}

  /** SMS на номер телефона. */
  async send(phone: string, text: string): Promise<SmsSendResult> {
    return this.sendViaGateway(phone, text, false);
  }

  /** Viber-сообщение на номер телефона (тот же шлюз, viber=1). */
  async sendViber(phone: string, text: string): Promise<SmsSendResult> {
    return this.sendViaGateway(phone, text, true);
  }

  private async sendViaGateway(
    phone: string,
    text: string,
    viber: boolean,
  ): Promise<SmsSendResult> {
    const params = this.baseParams(phone, text, viber, '3');
    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await response.json()) as {
        id?: number;
        cnt?: number;
        cost?: string;
        balance?: string;
        error?: string;
        error_code?: number;
      };
      if (body.error) {
        return { ok: false, error: `SMSC ${body.error_code}: ${body.error}` };
      }
      return {
        ok: true,
        id: body.id,
        count: body.cnt,
        cost: body.cost,
        balance: body.balance,
      };
    } catch (error: unknown) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /** Общие параметры запроса к шлюзу. cost: 1 — только цена, 3 — отправка с ценой. */
  private baseParams(phone: string, text: string, viber: boolean, cost: string): URLSearchParams {
    const params = new URLSearchParams({
      login: this.config.login,
      psw: this.config.password,
      phones: `+${phone.replace(/\D/g, '')}`,
      mes: text,
      charset: 'utf-8',
      fmt: '3',
      cost,
    });
    if (viber) {
      params.set('viber', '1');
      // Viber-канал отклоняет сообщения без отправителя — общий SMSC работает.
      params.set('sender', this.config.sender ?? 'SMSC');
    } else if (this.config.sender) {
      params.set('sender', this.config.sender);
    }
    return params;
  }

  async getBalance(): Promise<{ available: boolean; balance?: string; error?: string }> {
    const params = new URLSearchParams({
      login: this.config.login,
      psw: this.config.password,
      fmt: '3',
    });
    try {
      const response = await fetch(`https://smscentre.by/sys/balance.php?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as { balance?: string; error?: string };
      if (body.balance === undefined) {
        return { available: false, error: body.error ?? 'шлюз не вернул баланс' };
      }
      return { available: true, balance: body.balance };
    } catch (error: unknown) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Цена одного сообщения без отправки: send.php с cost=1 ничего не шлёт. */
  async getPrice(phone: string, text: string, viber: boolean): Promise<string | null> {
    const params = this.baseParams(phone, text, viber, '1');
    try {
      const response = await fetch(`https://smscentre.by/sys/send.php?${params.toString()}`, {
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as { cost?: string | number };
      return body.cost === undefined ? null : String(body.cost);
    } catch {
      return null;
    }
  }
}
