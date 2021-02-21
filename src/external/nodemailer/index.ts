import nodemailer from 'nodemailer';
import { getConfig } from '../../config';
import templates from './templates';

let transporter: ReturnType<typeof nodemailer['createTransport']>;

export const initTransport = () => {
  const transport = nodemailer.createTransport(getConfig().nodemailer);
  transporter = transport;
}
initTransport();

export async function sendMail<T extends keyof typeof templates>(
  recipient: string,
  templateName: T,
  ...args: Parameters<typeof templates[T]>
) {
  const email = {
    from: getConfig().accountNotificationSenderEmail,
    to: recipient,
    // @ts-expect-error should work
    ...templates[templateName](...args)
  };
  await transporter.sendMail(email);
}
