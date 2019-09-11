import { Actual365Fixed, BusinessDayConvention, DateGeneration, DiscountingSwapEngine, Euribor, Frequency, Period, RelinkableHandle, Schedule, Settings, Thirty360, TimeUnit, VanillaSwap } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.type = VanillaSwap.Type.Payer;
        this.settlementDays = 2;
        this.nominal = 100.0;
        this.fixedConvention = BusinessDayConvention.Unadjusted;
        this.floatingConvention = BusinessDayConvention.ModifiedFollowing;
        this.fixedFrequency = Frequency.Annual;
        this.floatingFrequency = Frequency.Semiannual;
        this.fixedDayCount = new Thirty360();
        this.index = new Euribor(new Period().init2(this.floatingFrequency), this.termStructure);
        this.calendar = this.index.fixingCalendar();
        this.today = this.calendar.adjust(Settings.evaluationDate.f());
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        this.termStructure.linkTo(flatRate2(this.settlement, 0.05, new Actual365Fixed()));
    }
    makeSwap(length, fixedRate, floatingSpread) {
        const maturity = this.calendar.advance1(this.settlement, length, TimeUnit.Years, this.floatingConvention);
        const fixedSchedule = new Schedule().init2(this.settlement, maturity, new Period().init2(this.fixedFrequency), this.calendar, this.fixedConvention, this.fixedConvention, DateGeneration.Rule.Forward, false);
        const floatSchedule = new Schedule().init2(this.settlement, maturity, new Period().init2(this.floatingFrequency), this.calendar, this.floatingConvention, this.floatingConvention, DateGeneration.Rule.Forward, false);
        const swap = new VanillaSwap(this.type, this.nominal, fixedSchedule, fixedRate, this.fixedDayCount, floatSchedule, this.index, floatingSpread, this.index.dayCounter());
        swap.setPricingEngine(new DiscountingSwapEngine(this.termStructure));
        return swap;
    }
}

describe('Swap tests', () => {
    it('Testing vanilla-swap calculation of fair fixed rate...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 5, 10, 20];
        const spreads = [-0.001, -0.01, 0.0, 0.01, 0.001];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < spreads.length; j++) {
                let swap = vars.makeSwap(lengths[i], 0.0, spreads[j]);
                swap = vars.makeSwap(lengths[i], swap.fairRate(), spreads[j]);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
            }
        }
    });
    it('Testing vanilla-swap calculation of fair floating spread...', () => {
    });
    it('Testing vanilla-swap dependency on fixed rate...', () => {
    });
    it('Testing vanilla-swap dependency on floating spread...', () => {
    });
    it('Testing in-arrears swap calculation...', () => {
    });
    it('Testing vanilla-swap calculation against cached value...', () => {
    });
});