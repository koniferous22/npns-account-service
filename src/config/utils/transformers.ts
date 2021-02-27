import { URL } from 'url';

export const getUrl = (env: string, configPath: string) => {
  try {
    new URL(env);
    return env;
  } catch (e) {
    throw new Error(
      `Invalid config value for "${configPath}" expected URL format, got "${env}"`
    );
  }
};

export const getNumber = (env: string, configPath: string) => {
  const number = parseInt(env, 10);
  if (Number.isNaN(number)) {
    throw new Error(
      `Invalid config value for "${configPath}" expected number, got "${env}"`
    );
  }
  return number;
};

export const getEndpoint = (env: string, configPath: string) => {
  // TODO validate allowed url characters
  if (!env.startsWith('/')) {
    throw new Error(
      `Invalid config value for "${configPath}" expected endpoint, got "${env}"`
    );
  }
  return env;
};

export const getEmail = (env: string, configPath: string) => {
  const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const lowerCaseEmail = env.toLowerCase();
  if (!res.test(lowerCaseEmail)) {
    throw new Error(
      `Invalid config value for "${configPath}" expected email, got "${env}"`
    );
  }
  return lowerCaseEmail;
}