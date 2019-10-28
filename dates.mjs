import { ASX, DateExt, ECB, IMM, Month, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Date tests ${version}`, () => {
    it('Testing ECB dates...', () => {
        const knownDates = ECB.knownDates();
        expect(knownDates).not.toBeNull();
        expect(knownDates.size).toBeGreaterThan(0);
        const n = ECB.nextDates1(DateExt.minDate()).length;
        expect(n).toEqual(knownDates.size);
        let i;
        const knownDatesArray = Array.from(knownDates).map(d=>new Date(d));
        let previousEcbDate = DateExt.minDate(), currentEcbDate, ecbDateMinusOne;
        for (i = 0; i < knownDatesArray.length; ++i) {
            currentEcbDate = knownDatesArray[i];
            expect(ECB.isECBdate(currentEcbDate)).toBeTruthy();
            ecbDateMinusOne = DateExt.sub(currentEcbDate, 1);
            expect(ECB.isECBdate(ecbDateMinusOne)).toBeFalsy();
            expect(ECB.nextDate1(ecbDateMinusOne).valueOf())
                .toEqual(currentEcbDate.valueOf());
            expect(ECB.nextDate1(previousEcbDate).valueOf())
                .toEqual(currentEcbDate.valueOf());
            previousEcbDate = currentEcbDate;
        }
        const knownDate = knownDatesArray[0];
        ECB.removeDate(knownDate);
        expect(ECB.isECBdate(knownDate)).toBeFalsy();
        ECB.addDate(knownDate);
        expect(ECB.isECBdate(knownDate)).toBeTruthy();
    });

    it('Testing IMM dates...', () => {
        const IMMcodes = [
            'F0', 'G0', 'H0', 'J0', 'K0', 'M0', 'N0', 'Q0', 'U0', 'V0', 'X0', 'Z0',
            'F1', 'G1', 'H1', 'J1', 'K1', 'M1', 'N1', 'Q1', 'U1', 'V1', 'X1', 'Z1',
            'F2', 'G2', 'H2', 'J2', 'K2', 'M2', 'N2', 'Q2', 'U2', 'V2', 'X2', 'Z2',
            'F3', 'G3', 'H3', 'J3', 'K3', 'M3', 'N3', 'Q3', 'U3', 'V3', 'X3', 'Z3',
            'F4', 'G4', 'H4', 'J4', 'K4', 'M4', 'N4', 'Q4', 'U4', 'V4', 'X4', 'Z4',
            'F5', 'G5', 'H5', 'J5', 'K5', 'M5', 'N5', 'Q5', 'U5', 'V5', 'X5', 'Z5',
            'F6', 'G6', 'H6', 'J6', 'K6', 'M6', 'N6', 'Q6', 'U6', 'V6', 'X6', 'Z6',
            'F7', 'G7', 'H7', 'J7', 'K7', 'M7', 'N7', 'Q7', 'U7', 'V7', 'X7', 'Z7',
            'F8', 'G8', 'H8', 'J8', 'K8', 'M8', 'N8', 'Q8', 'U8', 'V8', 'X8', 'Z8',
            'F9', 'G9', 'H9', 'J9', 'K9', 'M9', 'N9', 'Q9', 'U9', 'V9', 'X9', 'Z9'
        ];
        let counter = DateExt.minDate();
        const last = DateExt.advance(DateExt.maxDate(), -121, TimeUnit.Months);
        let imm;
        while (counter.valueOf() <= last.valueOf()) {
            imm = IMM.nextDate1(counter, false);
            expect(imm.valueOf()).toBeGreaterThan(counter.valueOf());
            expect(IMM.isIMMdate(imm, false)).toBeTruthy();
            expect(imm.valueOf())
                .toBeLessThanOrEqual(IMM.nextDate1(counter, true).valueOf());
            expect(IMM.date(IMM.code(imm), counter).valueOf()).toEqual(imm.valueOf());
            for (let i = 0; i < 120; ++i) {
                expect(IMM.date(IMMcodes[i], counter).valueOf())
                    .toBeGreaterThanOrEqual(counter.valueOf());
            }
            counter = DateExt.add(counter, 1);
        }
    });

    it('Testing ASX dates...', () => {
        const ASXcodes = [
            'F0', 'G0', 'H0', 'J0', 'K0', 'M0', 'N0', 'Q0', 'U0', 'V0', 'X0', 'Z0',
            'F1', 'G1', 'H1', 'J1', 'K1', 'M1', 'N1', 'Q1', 'U1', 'V1', 'X1', 'Z1',
            'F2', 'G2', 'H2', 'J2', 'K2', 'M2', 'N2', 'Q2', 'U2', 'V2', 'X2', 'Z2',
            'F3', 'G3', 'H3', 'J3', 'K3', 'M3', 'N3', 'Q3', 'U3', 'V3', 'X3', 'Z3',
            'F4', 'G4', 'H4', 'J4', 'K4', 'M4', 'N4', 'Q4', 'U4', 'V4', 'X4', 'Z4',
            'F5', 'G5', 'H5', 'J5', 'K5', 'M5', 'N5', 'Q5', 'U5', 'V5', 'X5', 'Z5',
            'F6', 'G6', 'H6', 'J6', 'K6', 'M6', 'N6', 'Q6', 'U6', 'V6', 'X6', 'Z6',
            'F7', 'G7', 'H7', 'J7', 'K7', 'M7', 'N7', 'Q7', 'U7', 'V7', 'X7', 'Z7',
            'F8', 'G8', 'H8', 'J8', 'K8', 'M8', 'N8', 'Q8', 'U8', 'V8', 'X8', 'Z8',
            'F9', 'G9', 'H9', 'J9', 'K9', 'M9', 'N9', 'Q9', 'U9', 'V9', 'X9', 'Z9'
        ];
        let counter = DateExt.minDate();
        const last = DateExt.advance(DateExt.maxDate(), -121, TimeUnit.Months);
        let asx;
        while (counter.valueOf() <= last.valueOf()) {
            asx = ASX.nextDate1(counter, false);
            expect(asx.valueOf()).toBeGreaterThan(counter.valueOf());
            expect(ASX.isASXdate(asx, false)).toBeTruthy();
            expect(asx.valueOf())
                .toBeLessThanOrEqual(ASX.nextDate1(counter, true).valueOf());
            expect(ASX.date(ASX.code(asx), counter).valueOf()).toEqual(asx.valueOf());
            for (let i = 0; i < 120; ++i) {
                expect(ASX.date(ASXcodes[i], counter).valueOf())
                    .toBeGreaterThanOrEqual(counter.valueOf());
            }
            counter = DateExt.add(counter, 1);
        }
    });

    it('Testing dates...', () => {
        const minDate = DateExt.serialNumber(DateExt.minDate()) + 1,
              maxDate = DateExt.serialNumber(DateExt.maxDate());
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
                    `: ${d}` +
                    `: ${m}` +
                    `: ${y}` +
                    `: ${wd}` +
                    `previous: ${dyold}` +
                    `: ${dold}` +
                    `: ${mold}` +
                    `: ${yold}` +
                    `: ${wdold}`);
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
            const s = new Date(Date.UTC(y, m - 1, d));
            serial = DateExt.serialNumber(s);
            expect(serial).toEqual(i);
        }
    });

    it('Testing ISO dates...', () => {
        const input_date = '2006-01-15';
        const d = new Date(input_date);
        expect(DateExt.dayOfMonth(d)).toEqual(15);
        expect(DateExt.month(d)).toEqual(1);
        expect(DateExt.year(d)).toEqual(2006);
    });

    it('Testing parsing of dates...', () => {
        let d = Date.parse('2006-01-15');
        expect(d).toEqual(new Date(Date.UTC(2006, 0, 15)).valueOf());
        // firefox doesn't parse below format welll
        //d = Date.parse('2-Dec-2012');
        //expect(d).toEqual(new Date(2012, 11, 2).valueOf());
    });

    it('Testing intraday information of dates...', () => {
        const d1 = new Date(Date.UTC(2015, Month.February - 1, 12, 10, 45, 12, 1234));
        expect(DateExt.year(d1)).toEqual(2015);
        expect(DateExt.month(d1)).toEqual(Month.February);
        expect(DateExt.dayOfMonth(d1)).toEqual(12);
        expect(DateExt.hours(d1)).toEqual(10);
        expect(DateExt.minutes(d1)).toEqual(45);
        expect(DateExt.seconds(d1)).toEqual(13);

        expect(DateExt.fractionOfSecond(d1)).toEqual(0.234);

        expect(DateExt.milliseconds(d1)).toEqual(234);

        const d2 = new Date(Date.UTC(2015, Month.February - 1, 28, 50, 165, 476, 1234));
        expect(DateExt.year(d2)).toEqual(2015);
        expect(DateExt.month(d2)).toEqual(Month.March);
        expect(DateExt.dayOfMonth(d2)).toEqual(2);
        expect(DateExt.hours(d2)).toEqual(4);
        expect(DateExt.minutes(d2)).toEqual(52);
        expect(DateExt.seconds(d2)).toEqual(57);

        expect(DateExt.milliseconds(d2)).toEqual(234);

        const s = new Date(Date.UTC(2015, Month.February - 1, 7, 1, 4, 2, 3))
            .toISOString();
        expect(s).toEqual('2015-02-07T01:04:02.003Z');
    });
});