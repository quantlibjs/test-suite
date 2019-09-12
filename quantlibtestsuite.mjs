import { Settings } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
export function configure(evaluationDate = new Date('16-September-2015')) {
    Settings.evaluationDate.set(evaluationDate);
}
configure();