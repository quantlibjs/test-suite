import { DateExt } from '/ql.mjs';

describe('Date tests', () => {
    it('Testing dates...', () => {
        const minDate = DateExt.serialNumber(DateExt.minDate()) + 1;
        const maxDate = DateExt.serialNumber(DateExt.maxDate());
        let dyold = DateExt.dayOfYear(DateExt.fromSerial(minDate - 1));
        let dold = DateExt.dayOfMonth(DateExt.fromSerial(minDate - 1));
        let mold = DateExt.month(DateExt.fromSerial(minDate - 1));
        let yold = DateExt.year(DateExt.fromSerial(minDate - 1));
        let wdold = DateExt.weekday(DateExt.fromSerial(minDate - 1));
        for (let i = minDate; i <= maxDate; i++) {
            const t = DateExt.fromSerial(i);
            let serial = DateExt.serialNumber(t);
            if (serial !== i) {
                throw new Error('inconsistent serial number:\n' +
                    `    original:      ${i}\n` +
                    `    date:          ${t}\n` +
                    `    serial number: ${serial}`);
            }
            const dy = DateExt.dayOfYear(t);
            const d = DateExt.dayOfMonth(t);
            const m = DateExt.month(t);
            const y = DateExt.year(t);
            const wd = DateExt.weekday(t);
            if (!((dy === dyold + 1) ||
                (dy === 1 && dyold === 365 && !DateExt.isLeap(yold)) ||
                (dy === 1 && dyold === 366 && DateExt.isLeap(yold)))) {
                throw new Error('wrong day of year increment: \n' +
                    `date: ${t}\n` +
                    `day of year: ${dy}\n` +
                    `previous: ${dyold}`);
            }
            dyold = dy;
            if (!((d === dold + 1 && m === mold && y === yold) ||
                (d === 1 && m === mold + 1 && y === yold) ||
                (d === 1 && m === 1 && y === yold + 1))) {
                throw new Error('wrong day,month,year increment: \n' +
                    `date: ${t}\n` +
                    `day,month,year: ${d},${m},${y}\n` +
                    `previous: ${dold},${mold},${yold}`);
            }
            dold = d;
            mold = m;
            yold = y;
            if (m < 1 || m > 12) {
                throw new Error(`invalid month: date: ${t}\ month: ${m}`);
            }
            if (d < 1) {
                throw new Error(`invalid day of month: date:  ${t} day: ${d}`);
            }
            if (!((m === 1 && d <= 31) || (m === 2 && d <= 28) ||
                (m === 2 && d === 29 && DateExt.isLeap(y)) ||
                (m === 3 && d <= 31) || (m === 4 && d <= 30) ||
                (m === 5 && d <= 31) || (m === 6 && d <= 30) ||
                (m === 7 && d <= 31) || (m === 8 && d <= 31) ||
                (m === 9 && d <= 30) || (m === 10 && d <= 31) ||
                (m === 11 && d <= 30) || (m === 12 && d <= 31))) {
                throw new Error(`invalid day of month: date: ${t} day: ${d}`);
            }
            if (!((wd === wdold + 1) || (wd === 1 && wdold === 7))) {
                throw new Error('invalid weekday: \n' +
                    `date: ${t}\n` +
                    `weekday:  ${wd}\n` +
                    `previous: ${wdold}`);
            }
            wdold = wd;
            const s = new Date(y, m - 1, d);
            serial = DateExt.serialNumber(s);
            expect(serial).toEqual(i);
        }
    });
    it('Testing parsing of dates...', () => {
        let d = Date.parse('2006-01-15');
        expect(d).toEqual(new Date(Date.UTC(2006, 0, 15)).valueOf());
        d = Date.parse('2-Dec-2012');
        expect(d).toEqual(new Date(2012, 11, 2).valueOf());
    });
});
//# sourceMappingURL=dates.js.map