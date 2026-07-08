/** Tight US phone regex: optional +1, optional area code parens/separators, then 10 digits */
export const PHONE_RE = /^(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
