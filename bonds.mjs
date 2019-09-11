import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, ActualActual, Australia, BlackIborCouponPricer, BondFunctions, Brazil, Business252, BusinessDayConvention, CashFlows, Compounding, DateExt, DateGeneration, DiscountingBondEngine, Duration, FixedRateBond, FloatingRateBond, Frequency, Handle, InterestRate, Month, NullCalendar, Period, SavedSettings, Schedule, setCouponPricer, Settings, SimpleQuote, TARGET, Thirty360, TimeUnit, UnitedKingdom, UnitedStates, USDLibor, ZeroCouponBond } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate1, flatRate2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.calendar = new TARGET();
        this.today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(this.today);
        this.faceAmount = 1000000.0;
        this.backup = new SavedSettings();
    }
    dispose() {
        this.backup.dispose();
    }
}

class test_case {
    constructor(settlementDate, testPrice, accruedAmount, NPV, yield_, duration, convexity) {
        this.settlementDate = settlementDate;
        this.testPrice = testPrice;
        this.accruedAmount = accruedAmount;
        this.NPV = NPV;
        this.yield = yield_;
        this.duration = duration;
        this.convexity = convexity;
    }
}

function ASSERT_CLOSE(name, settlement, calculated, expected, tolerance) {
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
}

describe('Bond tests', () => {
    it('Testing consistency of bond price/yield calculation...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-7;
        const maxEvaluations = 100;
        const issueMonths = [-24, -18, -12, -6, 0, 6, 12, 18, 24];
        const lengths = [3, 5, 10, 15, 20];
        const settlementDays = 3;
        const coupons = [0.02, 0.05, 0.08];
        const frequencies = [Frequency.Semiannual, Frequency.Annual];
        const bondDayCount = new Thirty360();
        const accrualConvention = BusinessDayConvention.Unadjusted;
        const paymentConvention = BusinessDayConvention.ModifiedFollowing;
        const redemption = 100.0;
        const yields = [0.03, 0.04, 0.05, 0.06, 0.07];
        const compounding = [Compounding.Compounded, Compounding.Continuous];
        for (let i = 0; i < issueMonths.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < coupons.length; k++) {
                    for (let l = 0; l < frequencies.length; l++) {
                        for (let n = 0; n < compounding.length; n++) {
                            const dated = vars.calendar.advance1(vars.today, issueMonths[i], TimeUnit.Months);
                            const issue = new Date(dated);
                            const maturity = vars.calendar.advance1(issue, lengths[j], TimeUnit.Years);
                            const sch = new Schedule().init2(dated, maturity, new Period().init2(frequencies[l]), vars.calendar, accrualConvention, accrualConvention, DateGeneration.Rule.Backward, false);
                            const bond = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, [coupons[k]], bondDayCount, paymentConvention, redemption, issue);
                            for (let m = 0; m < yields.length; m++) {
                                const price = BondFunctions.cleanPrice3(bond, yields[m], bondDayCount, compounding[n], frequencies[l]);
                                const calculated = BondFunctions.yield1(bond, price, bondDayCount, compounding[n], frequencies[l], null, tolerance, maxEvaluations);
                                if (Math.abs(yields[m] - calculated) > tolerance) {
                                    const price2 = BondFunctions.cleanPrice3(bond, calculated, bondDayCount, compounding[n], frequencies[l]);
                                    expect(Math.abs(price - price2) / price)
                                        .toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        vars.dispose();
    });
    it('Testing consistency of bond price/ATM rate calculation...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-7;
        const issueMonths = [-24, -18, -12, -6, 0, 6, 12, 18, 24];
        const lengths = [3, 5, 10, 15, 20];
        const settlementDays = 3;
        const coupons = [0.02, 0.05, 0.08];
        const frequencies = [Frequency.Semiannual, Frequency.Annual];
        const bondDayCount = new Thirty360();
        const accrualConvention = BusinessDayConvention.Unadjusted;
        const paymentConvention = BusinessDayConvention.ModifiedFollowing;
        const redemption = 100.0;
        const disc = new Handle(flatRate2(vars.today, 0.03, new Actual360()));
        const bondEngine = new DiscountingBondEngine(disc);
        for (let i = 0; i < issueMonths.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < coupons.length; k++) {
                    for (let l = 0; l < frequencies.length; l++) {
                        const dated = vars.calendar.advance1(vars.today, issueMonths[i], TimeUnit.Months);
                        const issue = new Date(dated);
                        const maturity = vars.calendar.advance1(issue, lengths[j], TimeUnit.Years);
                        const sch = new Schedule().init2(dated, maturity, new Period().init2(frequencies[l]), vars.calendar, accrualConvention, accrualConvention, DateGeneration.Rule.Backward, false);
                        const bond = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, [coupons[k]], bondDayCount, paymentConvention, redemption, issue);
                        bond.setPricingEngine(bondEngine);
                        const price = bond.cleanPrice1();
                        const calculated = BondFunctions.atmRate(bond, disc.currentLink(), bond.settlementDate(), price);
                        expect(Math.abs(coupons[k] - calculated)).toBeLessThan(tolerance);
                    }
                }
            }
        }
        vars.dispose();
    });
    it('Testing consistency of bond price/z-spread calculation...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-7;
        const maxEvaluations = 100;
        const discountCurve = new Handle(flatRate2(vars.today, 0.03, new Actual360()));
        const issueMonths = [-24, -18, -12, -6, 0, 6, 12, 18, 24];
        const lengths = [3, 5, 10, 15, 20];
        const settlementDays = 3;
        const coupons = [0.02, 0.05, 0.08];
        const frequencies = [Frequency.Semiannual, Frequency.Annual];
        const bondDayCount = new Thirty360();
        const accrualConvention = BusinessDayConvention.Unadjusted;
        const paymentConvention = BusinessDayConvention.ModifiedFollowing;
        const redemption = 100.0;
        const spreads = [-0.01, -0.005, 0.0, 0.005, 0.01];
        const compounding = [Compounding.Compounded, Compounding.Continuous];
        for (let i = 0; i < issueMonths.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < coupons.length; k++) {
                    for (let l = 0; l < frequencies.length; l++) {
                        for (let n = 0; n < compounding.length; n++) {
                            const dated = vars.calendar.advance1(vars.today, issueMonths[i], TimeUnit.Months);
                            const issue = new Date(dated);
                            const maturity = vars.calendar.advance1(issue, lengths[j], TimeUnit.Years);
                            const sch = new Schedule().init2(dated, maturity, new Period().init2(frequencies[l]), vars.calendar, accrualConvention, accrualConvention, DateGeneration.Rule.Backward, false);
                            const bond = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, [coupons[k]], bondDayCount, paymentConvention, redemption, issue);
                            for (let m = 0; m < spreads.length; m++) {
                                const price = BondFunctions.cleanPrice4(bond, discountCurve.currentLink(), spreads[m], bondDayCount, compounding[n], frequencies[l]);
                                const calculated = BondFunctions.zSpread(bond, price, discountCurve.currentLink(), bondDayCount, compounding[n], frequencies[l], null, tolerance, maxEvaluations);
                                if (Math.abs(spreads[m] - calculated) > tolerance) {
                                    const price2 = BondFunctions.cleanPrice4(bond, discountCurve.currentLink(), calculated, bondDayCount, compounding[n], frequencies[l]);
                                    expect(Math.abs(price - price2) / price)
                                        .toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        vars.dispose();
    });
    it('Testing theoretical bond price/yield calculation...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-7;
        const maxEvaluations = 100;
        const lengths = [3, 5, 10, 15, 20];
        const settlementDays = 3;
        const coupons = [0.02, 0.05, 0.08];
        const frequencies = [Frequency.Semiannual, Frequency.Annual];
        const bondDayCount = new Actual360();
        const accrualConvention = BusinessDayConvention.Unadjusted;
        const paymentConvention = BusinessDayConvention.ModifiedFollowing;
        const redemption = 100.0;
        const yields = [0.03, 0.04, 0.05, 0.06, 0.07];
        for (let j = 0; j < lengths.length; j++) {
            for (let k = 0; k < coupons.length; k++) {
                for (let l = 0; l < frequencies.length; l++) {
                    const dated = vars.today;
                    const issue = dated;
                    const maturity = vars.calendar.advance1(issue, lengths[j], TimeUnit.Years);
                    const rate = new SimpleQuote(0.0);
                    const discountCurve = new Handle(flatRate1(vars.today, rate, bondDayCount));
                    const sch = new Schedule().init2(dated, maturity, new Period().init2(frequencies[l]), vars.calendar, accrualConvention, accrualConvention, DateGeneration.Rule.Backward, false);
                    const bond = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, [coupons[k]], bondDayCount, paymentConvention, redemption, issue);
                    const bondEngine = new DiscountingBondEngine(discountCurve);
                    bond.setPricingEngine(bondEngine);
                    for (let m = 0; m < yields.length; m++) {
                        rate.setValue(yields[m]);
                        const price = BondFunctions.cleanPrice3(bond, yields[m], bondDayCount, Compounding.Continuous, frequencies[l]);
                        const calculatedPrice = bond.cleanPrice1();
                        expect(Math.abs(price - calculatedPrice)).toBeLessThan(tolerance);
                        const calculatedYield = BondFunctions.yield1(bond, calculatedPrice, bondDayCount, Compounding.Continuous, frequencies[l], bond.settlementDate(), tolerance, maxEvaluations);
                        expect(Math.abs(yields[m] - calculatedYield))
                            .toBeLessThan(tolerance);
                    }
                }
            }
        }
        vars.dispose();
    });
    it('Testing bond price/yield calculation against cached values...', () => {
        const vars = new CommonVars();
        const today = new Date('22,November,2004');
        Settings.evaluationDate.set(today);
        const bondCalendar = new NullCalendar();
        const bondDayCount = new ActualActual(ActualActual.Convention.ISMA);
        const settlementDays = 1;
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const freq = Frequency.Semiannual;
        const sch1 = new Schedule().init2(new Date('31,October,2004'), new Date('31,October,2006'), new Period().init2(freq), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const bond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch1, [0.025], bondDayCount, BusinessDayConvention.ModifiedFollowing, 100.0, new Date('1,November,2004'));
        const bondEngine = new DiscountingBondEngine(discountCurve);
        bond1.setPricingEngine(bondEngine);
        const marketPrice1 = 99.203125;
        const marketYield1 = 0.02925;
        const sch2 = new Schedule().init2(new Date('15,November,2004'), new Date('15,November,2009'), new Period().init2(freq), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const bond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch2, [0.035], bondDayCount, BusinessDayConvention.ModifiedFollowing, 100.0, new Date('15,November,2004'));
        bond2.setPricingEngine(bondEngine);
        const marketPrice2 = 99.6875;
        const marketYield2 = 0.03569;
        const cachedPrice1a = 99.204505, cachedPrice2a = 99.687192;
        const cachedPrice1b = 98.943393, cachedPrice2b = 101.986794;
        const cachedYield1a = 0.029257, cachedYield2a = 0.035689;
        const cachedYield1b = 0.029045, cachedYield2b = 0.035375;
        const cachedYield1c = 0.030423, cachedYield2c = 0.030432;
        const tolerance = 1.0e-6;
        let price, yield_;
        price = BondFunctions.cleanPrice3(bond1, marketYield1, bondDayCount, Compounding.Compounded, freq);
        expect(Math.abs(price - cachedPrice1a)).toBeLessThan(tolerance);
        price = bond1.cleanPrice1();
        expect(Math.abs(price - cachedPrice1b)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond1, marketPrice1, bondDayCount, Compounding.Compounded, freq);
        expect(Math.abs(yield_ - cachedYield1a)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond1, marketPrice1, bondDayCount, Compounding.Continuous, freq);
        expect(Math.abs(yield_ - cachedYield1b)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond1, bond1.cleanPrice1(), bondDayCount, Compounding.Continuous, freq, bond1.settlementDate());
        expect(Math.abs(yield_ - cachedYield1c)).toBeLessThan(tolerance);
        price = BondFunctions.cleanPrice3(bond2, marketYield2, bondDayCount, Compounding.Compounded, freq);
        expect(Math.abs(price - cachedPrice2a)).toBeLessThan(tolerance);
        price = bond2.cleanPrice1();
        expect(Math.abs(price - cachedPrice2b)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond2, marketPrice2, bondDayCount, Compounding.Compounded, freq);
        expect(Math.abs(yield_ - cachedYield2a)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond2, marketPrice2, bondDayCount, Compounding.Continuous, freq);
        expect(Math.abs(yield_ - cachedYield2b)).toBeLessThan(tolerance);
        yield_ = BondFunctions.yield1(bond2, bond2.cleanPrice1(), bondDayCount, Compounding.Continuous, freq, bond2.settlementDate());
        expect(Math.abs(yield_ - cachedYield2c)).toBeLessThan(tolerance);
        const sch3 = new Schedule().init2(new Date('30,November,2004'), new Date('30,November,2006'), new Period().init2(freq), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const bond3 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch3, [0.02875], new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        bond3.setPricingEngine(bondEngine);
        const marketYield3 = 0.02997;
        const settlementDate = new Date('30,November,2004');
        const cachedPrice3 = 99.764759;
        price = BondFunctions.cleanPrice3(bond3, marketYield3, bondDayCount, Compounding.Compounded, freq, settlementDate);
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        Settings.evaluationDate.set(new Date('22,November,2004'));
        price = BondFunctions.cleanPrice3(bond3, marketYield3, bondDayCount, Compounding.Compounded, freq);
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        vars.dispose();
    });
    it('Testing zero-coupon bond prices against cached values...', () => {
        const vars = new CommonVars();
        const today = new Date('22,November,2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const tolerance = 1.0e-6;
        const bond1 = new ZeroCouponBond(settlementDays, new UnitedStates(UnitedStates.Market.GovernmentBond), vars.faceAmount, new Date('30,November,2008'), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        const bondEngine = new DiscountingBondEngine(discountCurve);
        bond1.setPricingEngine(bondEngine);
        const cachedPrice1 = 88.551726;
        let price = bond1.cleanPrice1();
        expect(Math.abs(price - cachedPrice1)).toBeLessThan(tolerance);
        const bond2 = new ZeroCouponBond(settlementDays, new UnitedStates(UnitedStates.Market.GovernmentBond), vars.faceAmount, new Date('30,November,2007'), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        bond2.setPricingEngine(bondEngine);
        const cachedPrice2 = 91.278949;
        price = bond2.cleanPrice1();
        expect(Math.abs(price - cachedPrice2)).toBeLessThan(tolerance);
        const bond3 = new ZeroCouponBond(settlementDays, new UnitedStates(UnitedStates.Market.GovernmentBond), vars.faceAmount, new Date('30,November,2006'), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        bond3.setPricingEngine(bondEngine);
        const cachedPrice3 = 94.098006;
        price = bond3.cleanPrice1();
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        vars.dispose();
    });
    it('Testing fixed-coupon bond prices against cached values...', () => {
        const vars = new CommonVars();
        const today = new Date('22,November,2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const tolerance = 1.0e-6;
        const sch = new Schedule().init2(new Date('30,November,2004'), new Date('30,November,2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const bond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, [0.02875], new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        const bondEngine = new DiscountingBondEngine(discountCurve);
        bond1.setPricingEngine(bondEngine);
        const cachedPrice1 = 99.298100;
        let price = bond1.cleanPrice1();
        expect(Math.abs(price - cachedPrice1)).toBeLessThan(tolerance);
        const couponRates = [0.02875, 0.03, 0.03125, 0.0325];
        const bond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch, couponRates, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        bond2.setPricingEngine(bondEngine);
        const cachedPrice2 = 100.334149;
        price = bond2.cleanPrice1();
        expect(Math.abs(price - cachedPrice2)).toBeLessThan(tolerance);
        const sch3 = new Schedule().init2(new Date('30,November,2004'), new Date('30,March,2009'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false, null, new Date('30,November,2008'));
        const bond3 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, sch3, couponRates, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, 100.0, new Date('30,November,2004'));
        bond3.setPricingEngine(bondEngine);
        const cachedPrice3 = 100.382794;
        price = bond3.cleanPrice1();
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        vars.dispose();
    });
    it('Testing floating-rate bond prices against cached values...', () => {
        const vars = new CommonVars();
        const today = new Date('22,November,2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30,November,2004'), new Date('30,November,2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const bond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30,November,2004'));
        const bondEngine = new DiscountingBondEngine(riskFreeRate);
        bond1.setPricingEngine(bondEngine);
        setCouponPricer(bond1.cashflows(), pricer);
        const cachedPrice1 = 99.874645;
        let price = bond1.cleanPrice1();
        expect(Math.abs(price - cachedPrice1)).toBeLessThan(tolerance);
        const bond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30,November,2004'));
        const bondEngine2 = new DiscountingBondEngine(discountCurve);
        bond2.setPricingEngine(bondEngine2);
        setCouponPricer(bond2.cashflows(), pricer);
        const cachedPrice2 = 97.955904;
        price = bond2.cleanPrice1();
        expect(Math.abs(price - cachedPrice2)).toBeLessThan(tolerance);
        const spreads = [0.001, 0.0012, 0.0014, 0.0016];
        const bond3 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], spreads, [], [], false, 100.0, new Date('30,November,2004'));
        bond3.setPricingEngine(bondEngine2);
        setCouponPricer(bond3.cashflows(), pricer);
        const cachedPrice3 = 98.495458;
        price = bond3.cleanPrice1();
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        vars.dispose();
    });
    it('Testing Brazilian public bond prices against Andima cached values...', () => {
        const backup = new SavedSettings();
        const settlementDays = 1;
        const faceAmount = 1000.0;
        const redemption = 100.0;
        const today = new Date('6,June,2007');
        const issueDate = new Date('1,January,2007');
        const tolerance = 1.0e-4;
        Settings.evaluationDate.set(today);
        const maturityDates = [
            new Date('1,January,2008'), new Date('1,January,2010'),
            new Date('1,July,2010'), new Date('1,January,2012'),
            new Date('1,January,2014'), new Date('1,January,2017')
        ];
        const yields = [0.114614, 0.105726, 0.105328, 0.104283, 0.103218, 0.102948];
        const prices = [
            1034.63031372, 1030.09919487, 1029.98307160, 1028.13585068,
            1028.33383817, 1026.19716497
        ];
        const couponRates = [new InterestRate(0.1, new Thirty360(), Compounding.Compounded, Frequency.Annual)];
        for (let bondIndex = 0; bondIndex < maturityDates.length; bondIndex++) {
            const yield_ = new InterestRate(yields[bondIndex], new Business252(new Brazil()), Compounding.Compounded, Frequency.Annual);
            const schedule = new Schedule().init2(new Date('1,January,2007'), maturityDates[bondIndex], new Period().init2(Frequency.Semiannual), new Brazil(Brazil.Market.Settlement), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
            const bond = new FixedRateBond().frbInit3(settlementDays, faceAmount, schedule, couponRates, BusinessDayConvention.Following, redemption, issueDate);
            const cachedPrice = prices[bondIndex];
            const price = faceAmount *
                (BondFunctions.cleanPrice3(bond, yield_.rate(), yield_.dayCounter(), yield_.compounding(), yield_.frequency(), today) +
                    bond.accruedAmount(today)) /
                100.0;
            expect(Math.abs(price - cachedPrice)).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
    it('Testing ex-coupon UK Gilt price against market values...', () => {
        const calendar = new UnitedKingdom();
        const settlementDays = 3;
        const issueDate = new Date('29,February,1996');
        const startDate = new Date('29,February,1996');
        const firstCouponDate = new Date('07,June,1996');
        const maturityDate = new Date('07,June,2021');
        const coupon = 0.08;
        const tenor = new Period().init1(6, TimeUnit.Months);
        const exCouponPeriod = new Period().init1(6, TimeUnit.Days);
        const comp = Compounding.Compounded;
        const freq = Frequency.Semiannual;
        const dc = new ActualActual(ActualActual.Convention.ISMA);
        const bond = new FixedRateBond().frbInit1(settlementDays, 100.0, new Schedule().init2(startDate, maturityDate, tenor, new NullCalendar(), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, true, firstCouponDate), [coupon], dc, BusinessDayConvention.Unadjusted, 100.0, issueDate, calendar, exCouponPeriod, calendar);
        const leg = bond.cashflows();
        const cases = [
            new test_case(new Date('29,May,2013'), 103.0, 3.8021978, 106.8021978, 0.0749518, 5.6760445, 42.1531486),
            new test_case(new Date('30,May,2013'), 103.0, -0.1758242, 102.8241758, 0.0749618, 5.8928163, 43.7562186),
            new test_case(new Date('31,May,2013'), 103.0, -0.1538462, 102.8461538, 0.0749599, 5.8901860, 43.7239438)
        ];
        for (let i = 0; i < cases.length; ++i) {
            const accrued = bond.accruedAmount(cases[i].settlementDate);
            ASSERT_CLOSE('accrued amount', cases[i].settlementDate, accrued, cases[i].accruedAmount, 1e-6);
            const npv = cases[i].testPrice + accrued;
            ASSERT_CLOSE('NPV', cases[i].settlementDate, npv, cases[i].NPV, 1e-6);
            const yield_ = CashFlows.yield1(leg, npv, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('yield', cases[i].settlementDate, yield_, cases[i].yield, 1e-6);
            const duration = CashFlows.duration2(leg, yield_, dc, comp, freq, Duration.Type.Modified, false, cases[i].settlementDate);
            ASSERT_CLOSE('duration', cases[i].settlementDate, duration, cases[i].duration, 1e-6);
            const convexity = CashFlows.convexity2(leg, yield_, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('convexity', cases[i].settlementDate, convexity, cases[i].convexity, 1e-6);
            const calcnpv = CashFlows.npv3(leg, yield_, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('NPV from yield', cases[i].settlementDate, calcnpv, cases[i].NPV, 1e-6);
            const calcprice = calcnpv - accrued;
            ASSERT_CLOSE('price from yield', cases[i].settlementDate, calcprice, cases[i].testPrice, 1e-6);
        }
    });
    it('Testing ex-coupon Australian bond price against market values...', () => {
        const calendar = new Australia();
        const settlementDays = 3;
        const issueDate = new Date('10,June,2004');
        const startDate = new Date('15,February,2004');
        const firstCouponDate = new Date('15,August,2004');
        const maturityDate = new Date('15,February,2017');
        const coupon = 0.06;
        const tenor = new Period().init1(6, TimeUnit.Months);
        const exCouponPeriod = new Period().init1(7, TimeUnit.Days);
        const comp = Compounding.Compounded;
        const freq = Frequency.Semiannual;
        const dc = new ActualActual(ActualActual.Convention.ISMA);
        const bond = new FixedRateBond().frbInit1(settlementDays, 100.0, new Schedule().init2(startDate, maturityDate, tenor, new NullCalendar(), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, true, firstCouponDate), [coupon], dc, BusinessDayConvention.Unadjusted, 100.0, issueDate, calendar, exCouponPeriod, new NullCalendar());
        const leg = bond.cashflows();
        const cases = [
            new test_case(new Date('7,August,2014'), 103.0, 2.8670, 105.867, 0.04723, 2.26276, 6.54870),
            new test_case(new Date('8,August,2014'), 103.0, -0.1160, 102.884, 0.047235, 2.32536, 6.72531),
            new test_case(new Date('11,August,2014'), 103.0, -0.0660, 102.934, 0.04719, 2.31732, 6.68407)
        ];
        for (let i = 0; i < cases.length; ++i) {
            const accrued = bond.accruedAmount(cases[i].settlementDate);
            ASSERT_CLOSE('accrued amount', cases[i].settlementDate, accrued, cases[i].accruedAmount, 1e-3);
            const npv = cases[i].testPrice + accrued;
            ASSERT_CLOSE('NPV', cases[i].settlementDate, npv, cases[i].NPV, 1e-3);
            const yield_ = CashFlows.yield1(leg, npv, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('yield', cases[i].settlementDate, yield_, cases[i].yield, 1e-5);
            const duration = CashFlows.duration2(leg, yield_, dc, comp, freq, Duration.Type.Modified, false, cases[i].settlementDate);
            ASSERT_CLOSE('duration', cases[i].settlementDate, duration, cases[i].duration, 1e-5);
            const convexity = CashFlows.convexity2(leg, yield_, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('convexity', cases[i].settlementDate, convexity, cases[i].convexity, 1e-4);
            const calcnpv = CashFlows.npv3(leg, yield_, dc, comp, freq, false, cases[i].settlementDate);
            ASSERT_CLOSE('NPV from yield', cases[i].settlementDate, calcnpv, cases[i].NPV, 1e-3);
            const calcprice = calcnpv - accrued;
            ASSERT_CLOSE('price from yield', cases[i].settlementDate, calcprice, cases[i].testPrice, 1e-3);
        }
    });
    it('Testing South African R2048 bond price using ' +
        'Schedule constructor with Date vector...', () => {
        const backup = new SavedSettings();
        const calendar = new NullCalendar();
        const settlementDays = 3;
        const issueDate = new Date('29,June,2012');
        const today = new Date('7,September,2015');
        const evaluationDate = calendar.adjust(today);
        const settlementDate = calendar.advance1(evaluationDate, settlementDays, TimeUnit.Days);
        Settings.evaluationDate.set(evaluationDate);
        const maturityDate = new Date('29,February,2048');
        const coupon = 0.0875;
        const comp = Compounding.Compounded;
        const freq = Frequency.Semiannual;
        const dc = new ActualActual(ActualActual.Convention.Bond);
        const yield_ = new InterestRate(0.09185, dc, comp, freq);
        const tenor = new Period().init1(6, TimeUnit.Months);
        const exCouponPeriod = new Period().init1(10, TimeUnit.Days);
        let schedule = new Schedule().init2(issueDate, maturityDate, tenor, new NullCalendar(), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, true);
        const dates = [];
        for (let i = 0; i < schedule.size(); ++i) {
            const d = schedule.date(i);
            if (DateExt.month(d) === Month.February &&
                DateExt.dayOfMonth(d) === 29) {
                dates.push(new Date(DateExt.year(d), Month.February - 1, 28));
            }
            else {
                dates.push(d);
            }
        }
        schedule = new Schedule().init1(dates, schedule.calendar(), schedule.businessDayConvention(), schedule.terminationDateBusinessDayConvention(), schedule.tenor(), schedule.rule(), schedule.endOfMonth(), schedule.isRegular2());
        const bond = new FixedRateBond().frbInit1(0, 100.0, schedule, [coupon], dc, BusinessDayConvention.Following, 100.0, issueDate, calendar, exCouponPeriod, calendar, BusinessDayConvention.Unadjusted, false);
        const calculatedPrice = BondFunctions.dirtyPrice1(bond, yield_, settlementDate);
        const expectedPrice = 95.75706;
        const tolerance = 1e-5;
        expect(Math.abs(calculatedPrice - expectedPrice))
            .toBeLessThan(tolerance);
        backup.dispose();
    });
    it('Testing Thirty/360 bond with settlement on 31st of the month...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(new Date('28,July,2017'));
        const datedDate = new Date('13,February,2014');
        const settlement = new Date('31,July,2017');
        const maturity = new Date('13,August,2018');
        const dayCounter = new Thirty360(Thirty360.Convention.USA);
        const compounding = Compounding.Compounded;
        const fixedBondSchedule = new Schedule().init2(datedDate, maturity, new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, false);
        const fixedRateBond = new FixedRateBond().frbInit1(1, 100, fixedBondSchedule, [0.015], dayCounter, BusinessDayConvention.Unadjusted, 100.0);
        const cleanPrice = 100;
        const yield_ = BondFunctions.yield1(fixedRateBond, cleanPrice, dayCounter, compounding, Frequency.Semiannual, settlement);
        ASSERT_CLOSE('yield', settlement, yield_, 0.015, 1e-4);
        const duration = BondFunctions.duration1(fixedRateBond, new InterestRate(yield_, dayCounter, compounding, Frequency.Semiannual), Duration.Type.Macaulay, settlement);
        ASSERT_CLOSE('duration', settlement, duration, 1.022, 1e-3);
        const convexity = BondFunctions.convexity1(fixedRateBond, new InterestRate(yield_, dayCounter, compounding, Frequency.Semiannual), settlement) /
            100;
        ASSERT_CLOSE('convexity', settlement, convexity, 0.015, 1e-3);
        const accrued = BondFunctions.accruedAmount(fixedRateBond, settlement);
        ASSERT_CLOSE('accrued', settlement, accrued, 0.7, 1e-6);
        backup.dispose();
    });
});