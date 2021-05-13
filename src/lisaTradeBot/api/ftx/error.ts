import { AxiosError } from 'axios';

// XXX Caution. There are issues with extending Error.
// https://stackoverflow.com/questions/41102060/typescript-extending-error-class
class ApiError extends Error {
  code: number | undefined;
  codeText: string | undefined;
  request: unknown;
  response: unknown;

  constructor(message?: string) {
    // 'Error' breaks prototype chain here
    super(message);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const createAxiosError = (axiosError: AxiosError): ApiError => {
  const error = new ApiError();

  if (!axiosError.response) {
    return error;
  }

  error.code = axiosError.response.status;
  error.codeText = axiosError.response.statusText;
  error.request = axiosError.response.config;
  error.response = axiosError.response.data;
  error.message = axiosError.response.data.error;

  return error;
};
