import { Actual360, AmericanExercise, Array1D, BinomialConvertibleEngine, BinomialVanillaEngine, BlackConstantVol, BlackIborCouponPricer, BlackProcess, BlackScholesMertonProcess, BusinessDayConvention, ConvertibleFixedCouponBond, ConvertibleFloatingRateBond, ConvertibleZeroCouponBond, CoxRossRubinstein, DateExt, DateGeneration, DiscountingBondEngine, Euribor1Y, EuropeanExercise, FixedRateBond, FloatingRateBond, ForwardCurve, ForwardSpreadedTermStructure, Frequency, Handle, MakeSchedule, NullCalendar, Option, Period, PlainVanillaPayoff, SavedSettings, Schedule, setCouponPricer, Settings, SimpleQuote, TARGET, Thirty360, TimeUnit, UnitedStates, VanillaOption, ZeroCouponBond, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatVol2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.calendar = new TARGET();
        this.today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(this.today);
        this.dayCounter = new Actual360();
        this.frequency = Frequency.Annual;
        this.settlementDays = 3;
        this.issueDate = this.calendar.advance1(this.today, 2, TimeUnit.Days);
        this.maturityDate =
            this.calendar.advance1(this.issueDate, 10, TimeUnit.Years);
        this.issueDate =
            this.calendar.advance1(this.maturityDate, -10, TimeUnit.Years);
        this.underlying.linkTo(new SimpleQuote(50.0));
        this.dividendYield.linkTo(flatRate2(this.today, 0.02, this.dayCounter));
        this.riskFreeRate.linkTo(flatRate2(this.today, 0.05, this.dayCounter));
        this.volatility.linkTo(flatVol2(this.today, 0.15, this.dayCounter));
        this.process = new BlackScholesMertonProcess(this.underlying, this.dividendYield, this.riskFreeRate, this.volatility);
        this.creditSpread.linkTo(new SimpleQuote(0.005));
        this.faceAmount = 100.0;
        this.redemption = 100.0;
        this.conversionRatio =
            this.redemption / this.underlying.currentLink().value();
    }
}

describe(`Convertible bond tests ${version}`, () => {
    it('Testing out-of-the-money convertible bonds against vanilla bonds...', () => {
        const vars = new CommonVars();
        vars.conversionRatio = 1.0e-16;
        const euExercise = new EuropeanExercise(vars.maturityDate);
        const amExercise = new AmericanExercise().init1(vars.issueDate, vars.maturityDate);
        const timeSteps = 1001;
        const engine = new BinomialConvertibleEngine(new CoxRossRubinstein())
            .bceInit(vars.process, timeSteps);
        const discountCurve = new Handle(new ForwardSpreadedTermStructure(vars.riskFreeRate, vars.creditSpread));
        let schedule = new MakeSchedule()
            .from(vars.issueDate)
            .to(vars.maturityDate)
            .withFrequency(Frequency.Once)
            .withCalendar(vars.calendar)
            .backwards()
            .f();
        const euZero = new ConvertibleZeroCouponBond(euExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, vars.dayCounter, schedule, vars.redemption);
        euZero.setPricingEngine(engine);
        const amZero = new ConvertibleZeroCouponBond(amExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, vars.dayCounter, schedule, vars.redemption);
        amZero.setPricingEngine(engine);
        const zero = new ZeroCouponBond(vars.settlementDays, vars.calendar, 100.0, vars.maturityDate, BusinessDayConvention.Following, vars.redemption, vars.issueDate);
        const bondEngine = new DiscountingBondEngine(discountCurve);
        zero.setPricingEngine(bondEngine);
        let tolerance = 1.0e-2 * (vars.faceAmount / 100.0);
        let error = Math.abs(euZero.NPV() - zero.settlementValue1());
        expect(error).toBeLessThan(tolerance);
        error = Math.abs(amZero.NPV() - zero.settlementValue1());
        expect(error).toBeLessThan(tolerance);
        const coupons = [0.05];
        schedule = new MakeSchedule()
            .from(vars.issueDate)
            .to(vars.maturityDate)
            .withFrequency(vars.frequency)
            .withCalendar(vars.calendar)
            .backwards()
            .f();
        const euFixed = new ConvertibleFixedCouponBond(euExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, coupons, vars.dayCounter, schedule, vars.redemption);
        euFixed.setPricingEngine(engine);
        const amFixed = new ConvertibleFixedCouponBond(amExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, coupons, vars.dayCounter, schedule, vars.redemption);
        amFixed.setPricingEngine(engine);
        const fixed = new FixedRateBond().frbInit1(vars.settlementDays, vars.faceAmount, schedule, coupons, vars.dayCounter, BusinessDayConvention.Following, vars.redemption, vars.issueDate);
        fixed.setPricingEngine(bondEngine);
        tolerance = 2.0e-2 * (vars.faceAmount / 100.0);
        error = Math.abs(euFixed.NPV() - fixed.settlementValue1());
        expect(error).toBeLessThan(tolerance);
        error = Math.abs(amFixed.NPV() - fixed.settlementValue1());
        expect(error).toBeLessThan(tolerance);
        const index = new Euribor1Y(discountCurve);
        const fixingDays = 2;
        const gearings = [1.0];
        const spreads = [];
        const euFloating = new ConvertibleFloatingRateBond(euExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, index, fixingDays, spreads, vars.dayCounter, schedule, vars.redemption);
        euFloating.setPricingEngine(engine);
        const amFloating = new ConvertibleFloatingRateBond(amExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, index, fixingDays, spreads, vars.dayCounter, schedule, vars.redemption);
        amFloating.setPricingEngine(engine);
        const pricer = new BlackIborCouponPricer(new Handle());
        const floatSchedule = new Schedule().init2(vars.issueDate, vars.maturityDate, new Period().init2(vars.frequency), vars.calendar, BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Backward, false);
        const floating = new FloatingRateBond().frbInit1(vars.settlementDays, vars.faceAmount, floatSchedule, index, vars.dayCounter, BusinessDayConvention.Following, fixingDays, gearings, spreads, [], [], false, vars.redemption, vars.issueDate);
        floating.setPricingEngine(bondEngine);
        setCouponPricer(floating.cashflows(), pricer);
        tolerance = 2.0e-2 * (vars.faceAmount / 100.0);
        error = Math.abs(euFloating.NPV() - floating.settlementValue1());
        expect(error).toBeLessThan(tolerance);
        error = Math.abs(amFloating.NPV() - floating.settlementValue1());
        expect(error).toBeLessThan(tolerance);
    });
    it('Testing zero-coupon convertible bonds against vanilla option...', () => {
        const vars = new CommonVars();
        const euExercise = new EuropeanExercise(vars.maturityDate);
        vars.settlementDays = 0;
        const timeSteps = 2001;
        const engine = new BinomialConvertibleEngine(new CoxRossRubinstein())
            .bceInit(vars.process, timeSteps);
        const vanillaEngine = new BinomialVanillaEngine(new CoxRossRubinstein())
            .bveInit(vars.process, timeSteps);
        vars.creditSpread.linkTo(new SimpleQuote(0.0));
        const conversionStrike = vars.redemption / vars.conversionRatio;
        const payoff = new PlainVanillaPayoff(Option.Type.Call, conversionStrike);
        const schedule = new MakeSchedule()
            .from(vars.issueDate)
            .to(vars.maturityDate)
            .withFrequency(Frequency.Once)
            .withCalendar(vars.calendar)
            .backwards()
            .f();
        const euZero = new ConvertibleZeroCouponBond(euExercise, vars.conversionRatio, vars.no_dividends, vars.no_callability, vars.creditSpread, vars.issueDate, vars.settlementDays, vars.dayCounter, schedule, vars.redemption);
        euZero.setPricingEngine(engine);
        const euOption = new VanillaOption(payoff, euExercise);
        euOption.setPricingEngine(vanillaEngine);
        const tolerance = 5.0e-2 * (vars.faceAmount / 100.0);
        const expected = vars.faceAmount / 100.0 *
            (vars.redemption *
                vars.riskFreeRate.currentLink().discount1(vars.maturityDate) +
                vars.conversionRatio * euOption.NPV());
        const error = Math.abs(euZero.NPV() - expected);
        expect(error).toBeLessThan(tolerance);
    });
    it('Testing fixed-coupon convertible bond in known regression case...', () => {
        const backup = new SavedSettings();
        const today = new Date('23-December-2008');
        const tomorrow = DateExt.add(today, 1);
        Settings.evaluationDate.set(tomorrow);
        const u = new Handle(new SimpleQuote(2.9084382818797443));
        const dates = new Array(25);
        const forwards = new Array(25);
        dates[0] = new Date('29-December-2008');
        forwards[0] = 0.0025999342800;
        dates[1] = new Date('5-January-2009');
        forwards[1] = 0.0025999342800;
        dates[2] = new Date('29-January-2009');
        forwards[2] = 0.0053123275500;
        dates[3] = new Date('27-February-2009');
        forwards[3] = 0.0197049598721;
        dates[4] = new Date('30-March-2009');
        forwards[4] = 0.0220524845296;
        dates[5] = new Date('29-June-2009');
        forwards[5] = 0.0217076395643;
        dates[6] = new Date('29-December-2009');
        forwards[6] = 0.0230349627478;
        dates[7] = new Date('29-December-2010');
        forwards[7] = 0.0087631647476;
        dates[8] = new Date('29-December-2011');
        forwards[8] = 0.0219084299499;
        dates[9] = new Date('31-December-2012');
        forwards[9] = 0.0244798766219;
        dates[10] = new Date('30-December-2013');
        forwards[10] = 0.0267885498456;
        dates[11] = new Date('29-December-2014');
        forwards[11] = 0.0266922867562;
        dates[12] = new Date('29-December-2015');
        forwards[12] = 0.0271052126386;
        dates[13] = new Date('29-December-2016');
        forwards[13] = 0.0268829891648;
        dates[14] = new Date('29-December-2017');
        forwards[14] = 0.0264594744498;
        dates[15] = new Date('31-December-2018');
        forwards[15] = 0.0273450367424;
        dates[16] = new Date('30-December-2019');
        forwards[16] = 0.0294852614749;
        dates[17] = new Date('29-December-2020');
        forwards[17] = 0.0285556119719;
        dates[18] = new Date('29-December-2021');
        forwards[18] = 0.0305557764659;
        dates[19] = new Date('29-December-2022');
        forwards[19] = 0.0292244738422;
        dates[20] = new Date('29-December-2023');
        forwards[20] = 0.0263917004194;
        dates[21] = new Date('29-December-2028');
        forwards[21] = 0.0239626970243;
        dates[22] = new Date('29-December-2033');
        forwards[22] = 0.0216417108090;
        dates[23] = new Date('29-December-2038');
        forwards[23] = 0.0228343838422;
        dates[24] = new Date('31-December-2199');
        forwards[24] = 0.0228343838422;
        const r = new Handle(new ForwardCurve().curveInit1(dates, forwards, new Actual360()));
        const sigma = new Handle(new BlackConstantVol().bcvInit1(tomorrow, new NullCalendar(), 21.685235548092248, new Thirty360(Thirty360.Convention.BondBasis)));
        const process = new BlackProcess(u, r, sigma);
        const spread = new Handle(new SimpleQuote(0.11498700678012874));
        const issueDate = new Date('23-July-2008');
        const maturityDate = new Date('1-August-2013');
        const calendar = new UnitedStates();
        const schedule = new MakeSchedule()
            .from(issueDate)
            .to(maturityDate)
            .withTenor(new Period().init1(6, TimeUnit.Months))
            .withCalendar(calendar)
            .withConvention(BusinessDayConvention.Unadjusted)
            .f();
        const settlementDays = 3;
        const exercise = new EuropeanExercise(maturityDate);
        const conversionRatio = 100.0 / 20.3175;
        const coupons = Array1D.fromSizeValue(schedule.size() - 1, 0.05);
        const dayCounter = new Thirty360(Thirty360.Convention.BondBasis);
        const no_callability = [];
        const no_dividends = [];
        const redemption = 100.0;
        const bond = new ConvertibleFixedCouponBond(exercise, conversionRatio, no_dividends, no_callability, spread, issueDate, settlementDays, coupons, dayCounter, schedule, redemption);
        bond.setPricingEngine(new BinomialConvertibleEngine(new CoxRossRubinstein())
            .bceInit(process, 600));
        expect(() => bond.NPV()).toThrow();
        backup.dispose();
    });
});