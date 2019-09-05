import { Period, PeriodParser, TimeUnit } from '/ql.mjs';
describe('Period tests', () => {
    it('Testing period algebra on years/months...', () => {
        const OneYear = new Period().init1(1, TimeUnit.Years);
        const SixMonths = new Period().init1(6, TimeUnit.Months);
        const ThreeMonths = new Period().init1(3, TimeUnit.Months);
        let n = 4;
        expect(Period.equal(OneYear.div(n), ThreeMonths)).toEqual(true);
        n = 2;
        expect(Period.equal(OneYear.div(n), SixMonths)).toEqual(true);
        const sum = ThreeMonths;
        sum.adda(SixMonths);
        expect(Period.equal(sum, new Period().init1(9, TimeUnit.Months)))
            .toEqual(true);
        sum.adda(OneYear);
        expect(Period.equal(sum, new Period().init1(21, TimeUnit.Months)))
            .toEqual(true);
        const TwelveMonths = new Period().init1(12, TimeUnit.Months);
        expect(TwelveMonths.length()).toEqual(12);
        expect(TwelveMonths.units()).toEqual(TimeUnit.Months);
        const NormalizedTwelveMonths = new Period().init1(12, TimeUnit.Months);
        NormalizedTwelveMonths.normalize();
        expect(NormalizedTwelveMonths.length()).toEqual(1);
        expect(NormalizedTwelveMonths.units()).toEqual(TimeUnit.Years);
    });
    it('Testing period algebra on weeks/days...', () => {
        const TwoWeeks = new Period().init1(2, TimeUnit.Weeks);
        const OneWeek = new Period().init1(1, TimeUnit.Weeks);
        const ThreeDays = new Period().init1(3, TimeUnit.Days);
        const OneDay = new Period().init1(1, TimeUnit.Days);
        let n = 2;
        expect(Period.equal(TwoWeeks.div(n), OneWeek)).toEqual(true);
        n = 7;
        expect(Period.equal(OneWeek.div(n), OneDay)).toEqual(true);
        const sum = ThreeDays;
        sum.adda(OneDay);
        expect(Period.equal(sum, new Period().init1(4, TimeUnit.Days)))
            .toEqual(true);
        sum.adda(OneWeek);
        expect(Period.equal(sum, new Period().init1(11, TimeUnit.Days)))
            .toEqual(true);
        const SevenDays = new Period().init1(7, TimeUnit.Days);
        expect(SevenDays.length()).toEqual(7);
        expect(SevenDays.units()).toEqual(TimeUnit.Days);
    });
    it('Testing period parsing...', () => {
        const p1 = PeriodParser.parseOnePeriod('3 M');
        const p2 = new Period().init1(3, TimeUnit.Months);
        expect(Period.equal(p1, p2)).toBeTruthy();
        const p3 = PeriodParser.parseOnePeriod('-5y');
        const p4 = new Period().init1(-5, TimeUnit.Years);
        expect(Period.equal(p3, p4)).toBeTruthy();
        const p5 = PeriodParser.parse('1w-4d');
        const p6 = new Period().init1(3, TimeUnit.Days);
        expect(Period.equal(p5, p6)).toBeTruthy();
    });
});
//# sourceMappingURL=period.js.map