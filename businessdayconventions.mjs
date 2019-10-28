import { BusinessDayConvention, DateExt, Period, SouthAfrica, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class SingleCase {
    constructor(calendar, convention, start, period, endOfMonth, result) {
        this.calendar = calendar;
        this.convention = convention;
        this.start = start;
        this.period = period;
        this.endOfMonth = endOfMonth;
        this.result = result;
    }
}

describe(`Business day convention tests ${version}`, () => {
    it('Testing business day conventions...', () => {
        const testCases = [
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, DateExt.UTC('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, DateExt.UTC('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, DateExt.UTC('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('2,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, DateExt.UTC('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('25,March,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('28,April,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, DateExt.UTC('7,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('9,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, DateExt.UTC('3,March,2015'), new Period().init1(-1, TimeUnit.Months), false, DateExt.UTC('3,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, DateExt.UTC('3,February,2015'), new Period().init1(-2, TimeUnit.Days), false, DateExt.UTC('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, DateExt.UTC('1,March,2015'), new Period().init1(-1, TimeUnit.Months), true, DateExt.UTC('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, DateExt.UTC('1,March,2015'), new Period().init1(-1, TimeUnit.Months), false, DateExt.UTC('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, DateExt.UTC('3,March,2015'), new Period().init1(-1, TimeUnit.Months), false, DateExt.UTC('3,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, DateExt.UTC('3,February,2015'), new Period().init1(-2, TimeUnit.Days), false, DateExt.UTC('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, DateExt.UTC('1,March,2015'), new Period().init1(-1, TimeUnit.Months), true, DateExt.UTC('2,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, DateExt.UTC('1,March,2015'), new Period().init1(-1, TimeUnit.Months), false, DateExt.UTC('2,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, DateExt.UTC('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, DateExt.UTC('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, DateExt.UTC('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('28,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, DateExt.UTC('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('3,January,2015'), new Period().init1(1, TimeUnit.Weeks), false, DateExt.UTC('12,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('21,March,2015'), new Period().init1(1, TimeUnit.Weeks), false, DateExt.UTC('30,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, DateExt.UTC('7,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('9,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, DateExt.UTC('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('16,April,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('15,May,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('17,April,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('18,May,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('4,March,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('2,April,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, DateExt.UTC('2,April,2015'), new Period().init1(1, TimeUnit.Months), false, DateExt.UTC('4,May,2015'))
        ];
        const n = testCases.length;
        for (let i = 0; i < n; i++) {
            const calendar = testCases[i].calendar;
            const result = calendar.advance2(testCases[i].start, testCases[i].period, testCases[i].convention, testCases[i].endOfMonth);
            expect(result.valueOf()).toEqual(testCases[i].result.valueOf());
        }
    });
});