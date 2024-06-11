import _ from 'lodash';

export function createError(errorMessage: string, title?: string) {
  const error = new Error(errorMessage);
  if (title) {
    error.name = title;
  }

  return error;
}

export function getError(error: Error | string | unknown): Error {
  if (error instanceof Error) {
    return {
      message: _.capitalize(error.message),
      name: _.capitalize(error?.name),
    };
  }

  return {
    message:
      typeof error === 'string' ? _.capitalize(error) : JSON.stringify(error),
    name: '',
  };
}
