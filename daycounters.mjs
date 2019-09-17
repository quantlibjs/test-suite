import { Actual360, Actual365Fixed, ActualActual, Brazil, Business252, BusinessDayConvention, Canada, DateExt, Frequency, MakeSchedule, OneDayCounter, Period, QL_EPSILON, SimpleDayCounter, Thirty360, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class SingleCase {
    constructor(convention, start, end, refStart, refEnd, result) {
        this.convention = convention;
        this.start = start;
        this.end = end;
        this.refStart = refStart;
        this.refEnd = refEnd;
        this.result = result;
    }
}

describe('Day counter tests', () => {
    it('Testing actual/actual day counters...', () => {
        const testCases = [
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('1,November,2003'), DateExt.UTC('1,May,2004'), null, null, 0.497724380567),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('1,November,2003'), DateExt.UTC('1,May,2004'), DateExt.UTC('1,November,2003'), DateExt.UTC('1,May,2004'), 0.500000000000),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('1,November,2003'), DateExt.UTC('1,May,2004'), null, null, 0.497267759563),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('1,February,1999'), DateExt.UTC('1,July,1999'), null, null, 0.410958904110),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('1,February,1999'), DateExt.UTC('1,July,1999'), DateExt.UTC('1,July,1998'), DateExt.UTC('1,July,1999'), 0.410958904110),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('1,February,1999'), DateExt.UTC('1,July,1999'), null, null, 0.410958904110),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('1,July,1999'), DateExt.UTC('1,July,2000'), null, null, 1.001377348600),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('1,July,1999'), DateExt.UTC('1,July,2000'), DateExt.UTC('1,July,1999'), DateExt.UTC('1,July,2000'), 1.000000000000),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('1,July,1999'), DateExt.UTC('1,July,2000'), null, null, 1.000000000000),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('15,August,2002'), DateExt.UTC('15,July,2003'), null, null, 0.915068493151),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('15,August,2002'), DateExt.UTC('15,July,2003'), DateExt.UTC('15,January,2003'), DateExt.UTC('15,July,2003'), 0.915760869565),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('15,August,2002'), DateExt.UTC('15,July,2003'), null, null, 0.915068493151),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('15,July,2003'), DateExt.UTC('15,January,2004'), null, null, 0.504004790778),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('15,July,2003'), DateExt.UTC('15,January,2004'), DateExt.UTC('15,July,2003'), DateExt.UTC('15,January,2004'), 0.500000000000),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('15,July,2003'), DateExt.UTC('15,January,2004'), null, null, 0.504109589041),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('30,July,1999'), DateExt.UTC('30,January,2000'), null, null, 0.503892506924),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('30,July,1999'), DateExt.UTC('30,January,2000'), DateExt.UTC('30,July,1999'), DateExt.UTC('30,January,2000'), 0.500000000000),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('30,July,1999'), DateExt.UTC('30,January,2000'), undefined, undefined, 0.504109589041),
            new SingleCase(ActualActual.Convention.ISDA, DateExt.UTC('30,January,2000'), DateExt.UTC('30,June,2000'), null, null, 0.415300546448),
            new SingleCase(ActualActual.Convention.ISMA, DateExt.UTC('30,January,2000'), DateExt.UTC('30,June,2000'), DateExt.UTC('30,January,2000'), DateExt.UTC('30,July,2000'), 0.417582417582),
            new SingleCase(ActualActual.Convention.AFB, DateExt.UTC('30,January,2000'), DateExt.UTC('30,June,2000'), null, null, 0.41530054644),
        ];
        for (let i = 0; i < testCases.length; i++) {
            const dayCounter = new ActualActual(testCases[i].convention);
            const d1 = testCases[i].start, d2 = testCases[i].end, rd1 = testCases[i].refStart, rd2 = testCases[i].refEnd;
            const calculated = dayCounter.yearFraction(d1, d2, rd1, rd2);
            expect(Math.abs(calculated - testCases[i].result)).toBeLessThan(1.0e-10);
        }
    });
    it('Testing actual/actual day counter with schedule...', () => {
        const schedule = new MakeSchedule()
            .from(DateExt.UTC('17,January,2017'))
            .withFirstDate(DateExt.UTC('31,August,2017'))
            .to(DateExt.UTC('28,February,2026'))
            .withFrequency(Frequency.Semiannual)
            .withCalendar(new Canada())
            .withConvention(BusinessDayConvention.Unadjusted)
            .backwards()
            .endOfMonth()
            .f();
        const issueDate = schedule.date(0);
        const firstCouponDate = schedule.date(1);
        const quasiCouponDate1 = DateExt.UTC('31,August,2016');
        const quasiCouponDate2 = DateExt.UTC('28,February,2017');
        const dayCounter = new ActualActual(ActualActual.Convention.ISMA, schedule);
        let T = dayCounter.yearFraction(issueDate, firstCouponDate, quasiCouponDate2, firstCouponDate);
        const expected = 0.6160220994;
        expect(Math.abs(T - expected)).toBeLessThan(1.0e-10);
        const settlementDate = DateExt.UTC('29,January,2017');
        T = dayCounter.yearFraction(issueDate, settlementDate, quasiCouponDate2, firstCouponDate);
        const t1 = dayCounter.yearFraction(issueDate, settlementDate, quasiCouponDate1, quasiCouponDate2);
        expect(Math.abs(T - t1)).toBeLessThan(1.0e-10);
    });
    it('Testing simple day counter...', () => {
        const p = [
            new Period().init1(3, TimeUnit.Months),
            new Period().init1(6, TimeUnit.Months),
            new Period().init1(1, TimeUnit.Years)
        ];
        const expected = [0.25, 0.5, 1.0];
        const first = DateExt.UTC('1,January,2002');
        const last = DateExt.UTC('31,December,2005');
        const dayCounter = new SimpleDayCounter();
        for (const start = DateExt.fromDate(first); start.valueOf() <= last.valueOf(); DateExt.adda(start, 1)) {
            for (let i = 0; i < p.length; i++) {
                const end = DateExt.advance(start, p[i].length(), p[i].units());
                const calculated = dayCounter.yearFraction(start, end);
                expect(Math.abs(calculated - expected[i])).toBeLessThan(1.0e-12);
            }
        }
    });
    it('Testing 1/1 day counter...', () => {
        const p = [
            new Period().init1(3, TimeUnit.Months),
            new Period().init1(6, TimeUnit.Months),
            new Period().init1(1, TimeUnit.Years)
        ];
        const expected = [1.0, 1.0, 1.0];
        const first = DateExt.UTC('1,January,2004');
        const last = DateExt.UTC('31,December,2004');
        const dayCounter = new OneDayCounter();
        for (const start = DateExt.fromDate(first); start.valueOf() <= last.valueOf(); DateExt.adda(start, 1)) {
            for (let i = 0; i < p.length; i++) {
                const end = DateExt.advance(start, p[i].length(), p[i].units());
                const calculated = dayCounter.yearFraction(start, end);
                expect(Math.abs(calculated - expected[i])).toBeLessThan(1.0e-12);
            }
        }
    });
    it('Testing business/252 day counter...', () => {
        const testDates = [];
        testDates.push(DateExt.UTC('1,February,2002'));
        testDates.push(DateExt.UTC('4,February,2002'));
        testDates.push(DateExt.UTC('16,May,2003'));
        testDates.push(DateExt.UTC('17,December,2003'));
        testDates.push(DateExt.UTC('17,December,2004'));
        testDates.push(DateExt.UTC('19,December,2005'));
        testDates.push(DateExt.UTC('2,January,2006'));
        testDates.push(DateExt.UTC('13,March,2006'));
        testDates.push(DateExt.UTC('15,May,2006'));
        testDates.push(DateExt.UTC('17,March,2006'));
        testDates.push(DateExt.UTC('15,May,2006'));
        testDates.push(DateExt.UTC('26,July,2006'));
        testDates.push(DateExt.UTC('28,June,2007'));
        testDates.push(DateExt.UTC('16,September,2009'));
        testDates.push(DateExt.UTC('26,July,2016'));
        const expected = [
          0.0039682539683,
          1.2738095238095,
          0.6031746031746,
          0.9960317460317,
          1.0000000000000,
          0.0396825396825,
          0.1904761904762,
          0.1666666666667,
          -0.1507936507937,
          0.1507936507937,
          0.2023809523810,
          0.912698412698,
          2.214285714286,
          6.84126984127
        ];
        const dayCounter1 = new Business252(new Brazil());
        let calculated;
        for (let i = 1; i < testDates.length; i++) {
            calculated = dayCounter1.yearFraction(testDates[i - 1], testDates[i]);
            expect(Math.abs(calculated - expected[i - 1])).toBeLessThan(1.0e-12);
        }
        /*
        const dayCounter2 = new Business252();
        for (let i = 1; i < testDates.length; i++) {
            calculated = dayCounter2.yearFraction(testDates[i - 1], testDates[i]);
            expect(Math.abs(calculated - expected[i - 1])).toBeLessThan(1.0e-12);
        }
        */
    });
    it('Testing thirty/360 day counter (Bond Basis)...', () => {
        const dayCounter = new Thirty360(Thirty360.Convention.BondBasis);
        const testStartDates = [];
        const testEndDates = [];
        let calculated;
        testStartDates.push(DateExt.UTC('20,August,2006'));
        testEndDates.push(DateExt.UTC('20,February,2007'));
        testStartDates.push(DateExt.UTC('20,February,2007'));
        testEndDates.push(DateExt.UTC('20,August,2007'));
        testStartDates.push(DateExt.UTC('20,August,2007'));
        testEndDates.push(DateExt.UTC('20,February,2008'));
        testStartDates.push(DateExt.UTC('20,February,2008'));
        testEndDates.push(DateExt.UTC('20,August,2008'));
        testStartDates.push(DateExt.UTC('20,August,2008'));
        testEndDates.push(DateExt.UTC('20,February,2009'));
        testStartDates.push(DateExt.UTC('20,February,2009'));
        testEndDates.push(DateExt.UTC('20,August,2009'));
        testStartDates.push(DateExt.UTC('31,August,2006'));
        testEndDates.push(DateExt.UTC('28,February,2007'));
        testStartDates.push(DateExt.UTC('28,February,2007'));
        testEndDates.push(DateExt.UTC('31,August,2007'));
        testStartDates.push(DateExt.UTC('31,August,2007'));
        testEndDates.push(DateExt.UTC('29,February,2008'));
        testStartDates.push(DateExt.UTC('29,February,2008'));
        testEndDates.push(DateExt.UTC('31,August,2008'));
        testStartDates.push(DateExt.UTC('31,August,2008'));
        testEndDates.push(DateExt.UTC('28,February,2009'));
        testStartDates.push(DateExt.UTC('28,February,2009'));
        testEndDates.push(DateExt.UTC('31,August,2009'));
        testStartDates.push(DateExt.UTC('31,January,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('30,January,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('28,February,2006'));
        testEndDates.push(DateExt.UTC('3,March,2006'));
        testStartDates.push(DateExt.UTC('14,February,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('30,September,2006'));
        testEndDates.push(DateExt.UTC('31,October,2006'));
        testStartDates.push(DateExt.UTC('31,October,2006'));
        testEndDates.push(DateExt.UTC('28,November,2006'));
        testStartDates.push(DateExt.UTC('31,August,2007'));
        testEndDates.push(DateExt.UTC('28,February,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('28,August,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('30,August,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('31,August,2008'));
        testStartDates.push(DateExt.UTC('26,February,2007'));
        testEndDates.push(DateExt.UTC('28,February,2008'));
        testStartDates.push(DateExt.UTC('26,February,2007'));
        testEndDates.push(DateExt.UTC('29,February,2008'));
        testStartDates.push(DateExt.UTC('29,February,2008'));
        testEndDates.push(DateExt.UTC('28,February,2009'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('30,March,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('31,March,2008'));
        const expected = [
            180, 180, 180, 180, 180, 180, 178, 183, 179, 182, 178, 183, 28, 28,
            5, 14, 30, 28, 178, 180, 182, 183, 362, 363, 359, 32, 33
        ];
        for (let i = 0; i < testStartDates.length; i++) {
            calculated = dayCounter.dayCount(testStartDates[i], testEndDates[i]);
            expect(calculated).toEqual(expected[i]);
        }
    });
    it('Testing thirty/360 day counter (Eurobond Basis)...', () => {
        const dayCounter = new Thirty360(Thirty360.Convention.EurobondBasis);
        const testStartDates = [];
        const testEndDates = [];
        let calculated;
        testStartDates.push(DateExt.UTC('20,August,2006'));
        testEndDates.push(DateExt.UTC('20,February,2007'));
        testStartDates.push(DateExt.UTC('20,February,2007'));
        testEndDates.push(DateExt.UTC('20,August,2007'));
        testStartDates.push(DateExt.UTC('20,August,2007'));
        testEndDates.push(DateExt.UTC('20,February,2008'));
        testStartDates.push(DateExt.UTC('20,February,2008'));
        testEndDates.push(DateExt.UTC('20,August,2008'));
        testStartDates.push(DateExt.UTC('20,August,2008'));
        testEndDates.push(DateExt.UTC('20,February,2009'));
        testStartDates.push(DateExt.UTC('20,February,2009'));
        testEndDates.push(DateExt.UTC('20,August,2009'));
        testStartDates.push(DateExt.UTC('28,February,2006'));
        testEndDates.push(DateExt.UTC('31,August,2006'));
        testStartDates.push(DateExt.UTC('31,August,2006'));
        testEndDates.push(DateExt.UTC('28,February,2007'));
        testStartDates.push(DateExt.UTC('28,February,2007'));
        testEndDates.push(DateExt.UTC('31,August,2007'));
        testStartDates.push(DateExt.UTC('31,August,2007'));
        testEndDates.push(DateExt.UTC('29,February,2008'));
        testStartDates.push(DateExt.UTC('29,February,2008'));
        testEndDates.push(DateExt.UTC('31,August,2008'));
        testStartDates.push(DateExt.UTC('31,August,2008'));
        testEndDates.push(DateExt.UTC('28,February,2009'));
        testStartDates.push(DateExt.UTC('28,February,2009'));
        testEndDates.push(DateExt.UTC('31,August,2009'));
        testStartDates.push(DateExt.UTC('31,August,2009'));
        testEndDates.push(DateExt.UTC('28,February,2010'));
        testStartDates.push(DateExt.UTC('28,February,2010'));
        testEndDates.push(DateExt.UTC('31,August,2010'));
        testStartDates.push(DateExt.UTC('31,August,2010'));
        testEndDates.push(DateExt.UTC('28,February,2011'));
        testStartDates.push(DateExt.UTC('28,February,2011'));
        testEndDates.push(DateExt.UTC('31,August,2011'));
        testStartDates.push(DateExt.UTC('31,August,2011'));
        testEndDates.push(DateExt.UTC('29,February,2012'));
        testStartDates.push(DateExt.UTC('31,January,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('30,January,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('28,February,2006'));
        testEndDates.push(DateExt.UTC('3,March,2006'));
        testStartDates.push(DateExt.UTC('14,February,2006'));
        testEndDates.push(DateExt.UTC('28,February,2006'));
        testStartDates.push(DateExt.UTC('30,September,2006'));
        testEndDates.push(DateExt.UTC('31,October,2006'));
        testStartDates.push(DateExt.UTC('31,October,2006'));
        testEndDates.push(DateExt.UTC('28,November,2006'));
        testStartDates.push(DateExt.UTC('31,August,2007'));
        testEndDates.push(DateExt.UTC('28,February,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('28,August,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('30,August,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('31,August,2008'));
        testStartDates.push(DateExt.UTC('26,February,2007'));
        testEndDates.push(DateExt.UTC('28,February,2008'));
        testStartDates.push(DateExt.UTC('26,February,2007'));
        testEndDates.push(DateExt.UTC('29,February,2008'));
        testStartDates.push(DateExt.UTC('29,February,2008'));
        testEndDates.push(DateExt.UTC('28,February,2009'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('30,March,2008'));
        testStartDates.push(DateExt.UTC('28,February,2008'));
        testEndDates.push(DateExt.UTC('31,March,2008'));
        const expected = [
            180, 180, 180, 180, 180, 180, 182, 178, 182, 179, 181,
            178, 182, 178, 182, 178, 182, 179, 28, 28, 5, 14,
            30, 28, 178, 180, 182, 182, 362, 363, 359, 32, 32
        ];
        for (let i = 0; i < testStartDates.length; i++) {
            calculated = dayCounter.dayCount(testStartDates[i], testEndDates[i]);
            expect(calculated).toEqual(expected[i]);
        }
    });
    it('Testing intraday behavior of day counter ...', () => {
        const d1 = DateExt.UTC('12,February,2015');
        //fixfox is less flexible on date string
        const d2 = DateExt.UTC('2015-2-14 12:34:17.231');
        const tol = 100 * QL_EPSILON;
        const dayCounters = [new ActualActual(), new Actual365Fixed(), new Actual360()];
        for (let i = 0; i < dayCounters.length; ++i) {
            const dc = dayCounters[i];
            const expected = ((12 * 60 + 34) * 60 + 17 + 0.231) *
                dc.yearFraction(d1, DateExt.add(d1, 1)) / 86400 +
                dc.yearFraction(d1, DateExt.add(d1, 2));
            expect(Math.abs(dc.yearFraction(d1, d2) - expected)).toBeLessThan(tol);
            expect(Math.abs(dc.yearFraction(d2, d1) + expected)).toBeLessThan(tol);
        }
    });
});