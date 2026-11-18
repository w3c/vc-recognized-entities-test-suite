export default function validate(credential, options) {
  const known = ['chain', 'action', 'evaluationDateTime'];
  for(const name of Object.keys(options)) {
    if(!known.includes(name)) {
      const error = new Error('Unrecognized option "' + name + '".');
      error.type =
        'https://www.w3.org/TR/vc-data-model#UNRECOGNIZED_OPTION_ERROR';
      throw error;
    }
  }
  return {valid: true, errors: [], warnings: []};
}
