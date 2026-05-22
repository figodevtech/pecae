export interface IPushProvider {
  sendPush(token: string, title: string, body: string, data?: any): Promise<void>;
}

export const IPushProvider = Symbol('IPushProvider');
