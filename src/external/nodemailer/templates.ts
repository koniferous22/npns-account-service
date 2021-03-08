import { getConfig } from '../../config';

export const signUpTemplate = (token: string) => {
  const { webAppAddress } = getConfig();
  const fullAdress = webAppAddress + '/confirm/registration/' + token;
  return {
    subject: 'NPNS Regoostration code',
    text: 'Copy following address to confirm email:\n' + fullAdress,
    html:
      '<p>Click <a href="' + fullAdress + '">here</a> to confirm your email</p>'
  } as const;
};

export const pwdResetTemplate = (token: string) => {
  const { webAppAddress } = getConfig();
  const fullAdress = webAppAddress + '/confirm/passwordChange/' + token;
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
  const { webAppAddress } = getConfig();
  const fullAdress = webAppAddress + '/confirm/emailChange/' + token;
  return {
    subject: 'NPNS Email Change Link',
    text: 'Copy following address to confirm email:\n' + fullAdress,
    html:
      '<p>Click <a href="' +
      fullAdress +
      '">here</a> to confirm your newly chosen email adventurer</p>'
  } as const;
};

export const usernameChangeTemplate = (token: string) => {
  const { webAppAddress } = getConfig();
  const fullAdress = webAppAddress + '/confirm/usernameChange/' + token;
  return {
    subject: 'NPNS Username Change Link',
    text: 'Copy following address to confirm your new username:\n' + fullAdress,
    html:
      '<p>Click <a href="' +
      fullAdress +
      '">here</a> to confirm your new finely chosen username adventurer</p>'
  } as const;
};

// NOTE just for better ts resolution
export default {
  signUpTemplate,
  pwdResetTemplate,
  emailChangeTemplate,
  usernameChangeTemplate
};
