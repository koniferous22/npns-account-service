import { Config } from '../../config';

export const signUpTemplate = (token: string) => {
  const { webAppAddress } = Config.getInstance().getConfig();
  const fullAdress = webAppAddress + '/confirm/sign-up/' + token;
  return {
    subject: 'NPNS Regoostration code',
    text: 'Copy following address to confirm email:\n' + fullAdress,
    html:
      '<p>Click <a href="' + fullAdress + '">here</a> to confirm your email</p>'
  } as const;
};

export const pwdResetTemplate = (token: string) => {
  const { webAppAddress } = Config.getInstance().getConfig();
  const fullAdress = webAppAddress + '/confirm/password-reset/' + token;
  return {
    subject: 'NPNS Password Reset Link',
    text: 'Copy following address to reset ur password:\n' + fullAdress,
    html:
      '<p>Click <a href="' +
      fullAdress +
      '">here</a> to confirm your new password</p>'
  } as const;
};

export const emailChangeTemplate = (token: string) => {
  const { webAppAddress } = Config.getInstance().getConfig();
  const fullAdress = webAppAddress + '/confirm/change-email/' + token;
  return {
    subject: 'NPNS Email Change Link',
    text: 'Copy following address to confirm email:\n' + fullAdress,
    html:
      '<p>Click <a href="' +
      fullAdress +
      '">here</a> to confirm your updated email</p>'
  } as const;
};

export const notificationUsernameChangedTemplate = (
  oldAlias: string | null,
  newAlias: string
) => {
  const { webAppAddress } = Config.getInstance().getConfig();
  const fullAdress = webAppAddress + '/me';
  return {
    subject: 'NPNS Username Change Notification',
    text: oldAlias
      ? `IMPORTANT: your public username was changed from "${oldAlias}" to "${newAlias}". If you are not aware of this change, please go to ${fullAdress} to fix the changes.`
      : `IMPORTANT: your public username was changed to "${newAlias}". If you are not aware of this change, please go to ${fullAdress} to fix the changes.`,
    html: oldAlias
      ? `<p>IMPORTANT: your public username was changed from "${oldAlias}" to "${newAlias}". If you are not aware of this change, please go to <a href="${fullAdress}">your profile</a> to fix the changes.</p>`
      : `<p>IMPORTANT: your public username was changed to "${newAlias}". If you are not aware of this change, please go to <a href="${fullAdress}">your profile</a> to fix the changes.</p>`
  } as const;
};

// NOTE just for better ts resolution
export default {
  signUpTemplate,
  pwdResetTemplate,
  emailChangeTemplate,
  notificationUsernameChangedTemplate
};
