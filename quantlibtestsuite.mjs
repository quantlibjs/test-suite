import { Settings } from '/ql.mjs';
export function configure(evaluationDate = new Date('16-September-2015')) {
    Settings.evaluationDate.set(evaluationDate);
}
configure();