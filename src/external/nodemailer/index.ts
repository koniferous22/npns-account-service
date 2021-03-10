import nodemailer from 'nodemailer';
import { Config } from '../../config';
import templates from './templates';
export class Nodemailer {
  private _config: Config = Config.getInstance();
  private _transporter!: ReturnType<typeof nodemailer['createTransport']>;
  private initTransporter() {
    return nodemailer.createTransport(this._config.getConfig().nodemailer);
  }
  constructor() {
    this._transporter = this.initTransporter();
  }
  async sendMail<T extends keyof typeof templates>(
    recipient: string,
    templateName: T,
    ...args: Parameters<typeof templates[T]>
  ) {
    const email = {
      from: this._config.getConfig().accountNotificationSenderEmail,
      to: recipient,
      // @ts-expect-error should work
      ...templates[templateName](...args)
    };
    await this._transporter.sendMail(email);
  }
}
