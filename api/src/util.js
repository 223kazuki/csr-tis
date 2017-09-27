// http://stackoverflow.com/a/742588/472768
const simpleEmailRegex = /^[^@]+@[^@]+\.[^@]+$/;

const libphone = require('google-libphonenumber');
const PNF = libphone.PhoneNumberFormat;
const phoneUtil = libphone.PhoneNumberUtil.getInstance();

const utils = {
  errorWithStatus: (error, statusCode) => {
    const err = (error instanceof Error) ? error : new Error(error);
    if (!err.status)  // Is not already an `errorWithStatus`
      err.status = statusCode || 500;
    return err;
  },
  validEmail: emailString => simpleEmailRegex.test(emailString),
  stripPrefix: prefixedLayerID => {
    const pieces = prefixedLayerID.split('/');
    return pieces[pieces.length - 1];
  },
  addPrefix: (id, prefix) => {
    if (id.indexOf(prefix) >= 0)
      return id;
    else
      return `layer:///${prefix}/${id}`;
  },
  e164PhoneNumber: (input, countryCode='US') => {
    if (!input || input.length < 1)
      return input;
    return phoneUtil.format(phoneUtil.parse(input, countryCode), PNF.E164)
  }
};

module.exports = utils;