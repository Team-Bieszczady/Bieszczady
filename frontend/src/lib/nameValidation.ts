export const NAME_MAX_LENGTH = 60;

export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ -]\p{L}[\p{L}\p{M}]*)*$/u;

export const NAME_PATTERN_MESSAGE =
  'dozwolone są tylko litery, spacja i myślnik';

export function nameRules(label: string) {
  return {
    required: `${label} jest wymagane`,
    maxLength: {
      value: NAME_MAX_LENGTH,
      message: `${label} może mieć maksymalnie ${NAME_MAX_LENGTH} znaków`,
    },
    validate: (value: string) =>
      NAME_PATTERN.test(value.trim()) || `${label} — ${NAME_PATTERN_MESSAGE}`,
  };
}
