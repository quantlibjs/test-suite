import { Actual365Fixed, BermudanExercise, BusinessDayConvention, DateExt, DateGeneration, DiscountingSwapEngine, Euribor6M, FdG2SwaptionEngine, FdHullWhiteSwaptionEngine, Frequency, G2, HullWhite, Period, RelinkableHandle, SavedSettings, Schedule, Settings, Swaption, Thirty360, TimeUnit, TreeSwaptionEngine, VanillaSwap } from '/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';
class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.startYears = 1;
        this.length = 5;
        this.type = VanillaSwap.Type.Payer;
        this.nominal = 1000.0;
        this.settlementDays = 2;
        this.fixedConvention = BusinessDayConvention.Unadjusted;
        this.floatingConvention = BusinessDayConvention.ModifiedFollowing;
        this.fixedFrequency = Frequency.Annual;
        this.floatingFrequency = Frequency.Semiannual;
        this.fixedDayCount = new Thirty360();
        this.index = new Euribor6M(this.termStructure);
        this.calendar = this.index.fixingCalendar();
        this.today = this.calendar.adjust(new Date());
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
    }
    makeSwap(fixedRate) {
        const start = this.calendar.advance1(this.settlement, this.startYears, TimeUnit.Years);
        const maturity = this.calendar.advance1(start, length, TimeUnit.Years);
        const fixedSchedule = new Schedule().init2(start, maturity, new Period().init2(this.fixedFrequency), this.calendar, this.fixedConvention, this.fixedConvention, DateGeneration.Rule.Forward, false);
        const floatSchedule = new Schedule().init2(start, maturity, new Period().init2(this.floatingFrequency), this.calendar, this.floatingConvention, this.floatingConvention, DateGeneration.Rule.Forward, false);
        const swap = new VanillaSwap(this.type, this.nominal, fixedSchedule, fixedRate, this.fixedDayCount, floatSchedule, this.index, 0.0, this.index.dayCounter());
        swap.setPricingEngine(new DiscountingSwapEngine(this.termStructure));
        return swap;
    }
    dispose() {
        this.backup.dispose();
    }
}
describe('Bermudan swaption tests', () => {
    it('Testing Bermudan swaption with HW model against cached values...', () => {
        const vars = new CommonVars();
        vars.today = new Date('15-February-2002');
        Settings.evaluationDate.set(vars.today);
        vars.settlement = new Date('19-February-2002');
        vars.termStructure.linkTo(flatRate2(vars.settlement, 0.04875825, new Actual365Fixed()));
        const atmRate = vars.makeSwap(0.0).fairRate();
        const itmSwap = vars.makeSwap(0.8 * atmRate);
        const atmSwap = vars.makeSwap(atmRate);
        const otmSwap = vars.makeSwap(1.2 * atmRate);
        const a = 0.048696, sigma = 0.0058904;
        const model = new HullWhite(vars.termStructure, a, sigma);
        const exerciseDates = [];
        const leg = atmSwap.fixedLeg();
        for (let i = 0; i < leg.length; i++) {
            const coupon = leg[i];
            exerciseDates.push(coupon.accrualStartDate());
        }
        let exercise = new BermudanExercise(exerciseDates);
        const treeEngine = new TreeSwaptionEngine().tseInit1(model, 50);
        const fdmEngine = new FdHullWhiteSwaptionEngine(model);
        let itmValue = 42.2413, atmValue = 12.8789, otmValue = 2.4759;
        const itmValueFdm = 42.2111, atmValueFdm = 12.8879, otmValueFdm = 2.44443;
        const tolerance = 1.0e-4;
        let swaption = new Swaption(itmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - itmValue)).toBeLessThan(tolerance);
        swaption.setPricingEngine(fdmEngine);
        expect(Math.abs(swaption.NPV() - itmValueFdm)).toBeLessThan(tolerance);
        swaption = new Swaption(atmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - atmValue)).toBeLessThan(tolerance);
        swaption.setPricingEngine(fdmEngine);
        expect(Math.abs(swaption.NPV() - atmValueFdm)).toBeLessThan(tolerance);
        swaption = new Swaption(otmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - otmValue)).toBeLessThan(tolerance);
        swaption.setPricingEngine(fdmEngine);
        expect(Math.abs(swaption.NPV() - otmValueFdm)).toBeLessThan(tolerance);
        for (let j = 0; j < exerciseDates.length; j++) {
            exerciseDates[j] =
                vars.calendar.adjust(DateExt.sub(exerciseDates[j], 10));
        }
        exercise = new BermudanExercise(exerciseDates);
        itmValue = 42.1917;
        atmValue = 12.7788;
        otmValue = 2.4388;
        swaption = new Swaption(itmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - itmValue)).toBeLessThan(tolerance);
        swaption = new Swaption(atmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - atmValue)).toBeLessThan(tolerance);
        swaption = new Swaption(otmSwap, exercise);
        swaption.setPricingEngine(treeEngine);
        expect(Math.abs(swaption.NPV() - otmValue)).toBeLessThan(tolerance);
        vars.dispose();
    });
    it('Testing Bermudan swaption with G2 model against cached values...', () => {
        const vars = new CommonVars();
        vars.today = new Date('15-September-2016');
        Settings.evaluationDate.set(vars.today);
        vars.settlement = new Date('19-September-2016');
        vars.termStructure.linkTo(flatRate2(vars.settlement, 0.04875825, new Actual365Fixed()));
        const atmRate = vars.makeSwap(0.0).fairRate();
        const swaptions = [];
        for (let s = 0.5; s < 1.51; s += 0.25) {
            const swap = vars.makeSwap(s * atmRate);
            const exerciseDates = [];
            for (let i = 0; i < swap.fixedLeg().length; i++) {
                exerciseDates.push(swap.fixedLeg()[i].accrualStartDate());
            }
            swaptions.push(new Swaption(swap, new BermudanExercise(exerciseDates)));
        }
        const a = 0.1, sigma = 0.01, b = 0.2, eta = 0.013, rho = -0.5;
        const g2Model = new G2(vars.termStructure, a, sigma, b, eta, rho);
        const fdmEngine = new FdG2SwaptionEngine(g2Model, 50, 75, 75, 0, 1e-3);
        const treeEngine = new TreeSwaptionEngine().tseInit1(g2Model, 50);
        const expectedFdm = [103.231, 54.6519, 20.0475, 5.26941, 1.07097];
        const expectedTree = [103.253, 54.6685, 20.1399, 5.40517, 1.10642];
        const tol = 0.005;
        for (let i = 0; i < swaptions.length; ++i) {
            swaptions[i].setPricingEngine(fdmEngine);
            const calculatedFdm = swaptions[i].NPV();
            expect(Math.abs(calculatedFdm - expectedFdm[i])).toBeLessThan(tol);
            swaptions[i].setPricingEngine(treeEngine);
            const calculatedTree = swaptions[i].NPV();
            expect(Math.abs(calculatedTree - expectedTree[i])).toBeLessThan(tol);
        }
    });
});
//# sourceMappingURL=bermudanswaption.js.map