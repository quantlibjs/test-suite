import { BusinessDayConvention, Period, SouthAfrica, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

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

describe('Business day convention tests', () => {
    it('Testing business day conventions...', () => {
        const testCases = [
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, new Date('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, new Date('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, new Date('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Following, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('2,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, new Date('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('25,March,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('28,April,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedFollowing, new Date('7,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('9,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, new Date('3,March,2015'), new Period().init1(-1, TimeUnit.Months), false, new Date('3,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, new Date('3,February,2015'), new Period().init1(-2, TimeUnit.Days), false, new Date('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, new Date('1,March,2015'), new Period().init1(-1, TimeUnit.Months), true, new Date('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Preceding, new Date('1,March,2015'), new Period().init1(-1, TimeUnit.Months), false, new Date('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, new Date('3,March,2015'), new Period().init1(-1, TimeUnit.Months), false, new Date('3,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, new Date('3,February,2015'), new Period().init1(-2, TimeUnit.Days), false, new Date('30,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, new Date('1,March,2015'), new Period().init1(-1, TimeUnit.Months), true, new Date('2,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.ModifiedPreceding, new Date('1,March,2015'), new Period().init1(-1, TimeUnit.Months), false, new Date('2,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, new Date('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, new Date('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, new Date('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Unadjusted, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('28,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, new Date('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), true, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('31,January,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('27,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('3,January,2015'), new Period().init1(1, TimeUnit.Weeks), false, new Date('12,January,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('21,March,2015'), new Period().init1(1, TimeUnit.Weeks), false, new Date('30,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.HalfMonthModifiedFollowing, new Date('7,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('9,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('3,February,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('3,March,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('3,February,2015'), new Period().init1(4, TimeUnit.Days), false, new Date('9,February,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('16,April,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('15,May,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('17,April,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('18,May,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('4,March,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('2,April,2015')),
            new SingleCase(new SouthAfrica(), BusinessDayConvention.Nearest, new Date('2,April,2015'), new Period().init1(1, TimeUnit.Months), false, new Date('4,May,2015'))
        ];
        const n = testCases.length;
        for (let i = 0; i < n; i++) {
            const calendar = testCases[i].calendar;
            const result = calendar.advance2(testCases[i].start, testCases[i].period, testCases[i].convention, testCases[i].endOfMonth);
            expect(result.valueOf()).toEqual(testCases[i].result.valueOf());
        }
    });
});
//# sourceMappingURL=businessdayconventions.js.map