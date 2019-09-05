import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, ActualActual, ASX, BackwardFlat, BMAIndex, BMASwap, BMASwapRateHelper, BusinessDayConvention, Comparison, Compounding, ConvexMonotone, CubicInterpolation, DateExt, DateGeneration, DepositRateHelper, Discount, DiscountingBondEngine, DiscountingSwapEngine, Euribor, Euribor3M, Euribor6M, FixedRateBond, FixedRateBondHelper, FlatForward, ForwardRate, ForwardRateAgreement, FraRateHelper, Frequency, Futures, FuturesRateHelper, Handle, IMM, IterativeBootstrap, JointCalendar, Linear, LocalBootstrap, LogCubic, LogLinear, MakeSchedule, MakeVanillaSwap, Period, PiecewiseYieldCurve, Position, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, SwapRateHelper, TARGET, Thirty360, TimeUnit, USDLibor, ZeroYield } from '/ql.mjs';
class Datum {
    constructor(n, units, rate) {
        this.n = n;
        this.units = units;
        this.rate = rate;
    }
}
class BondDatum {
    constructor(n, units, length, frequency, coupon, price) {
        this.n = n;
        this.units = units;
        this.length = length;
        this.frequency = frequency;
        this.coupon = coupon;
        this.price = price;
    }
}
const depositData = [
    new Datum(1, TimeUnit.Weeks, 4.559), new Datum(1, TimeUnit.Months, 4.581),
    new Datum(2, TimeUnit.Months, 4.573), new Datum(3, TimeUnit.Months, 4.557),
    new Datum(6, TimeUnit.Months, 4.496), new Datum(9, TimeUnit.Months, 4.490)
];
const fraData = [
    new Datum(1, TimeUnit.Months, 4.581), new Datum(2, TimeUnit.Months, 4.573),
    new Datum(3, TimeUnit.Months, 4.557), new Datum(6, TimeUnit.Months, 4.496),
    new Datum(9, TimeUnit.Months, 4.490)
];
const immFutData = [
    new Datum(1, TimeUnit.Months, 4.581), new Datum(2, TimeUnit.Months, 4.573),
    new Datum(3, TimeUnit.Months, 4.557)
];
const asxFutData = [
    new Datum(1, TimeUnit.Months, 4.581), new Datum(2, TimeUnit.Months, 4.573),
    new Datum(3, TimeUnit.Months, 4.557)
];
const swapData = [
    new Datum(1, TimeUnit.Years, 4.54), new Datum(2, TimeUnit.Years, 4.63),
    new Datum(3, TimeUnit.Years, 4.75), new Datum(4, TimeUnit.Years, 4.86),
    new Datum(5, TimeUnit.Years, 4.99), new Datum(6, TimeUnit.Years, 5.11),
    new Datum(7, TimeUnit.Years, 5.23), new Datum(8, TimeUnit.Years, 5.33),
    new Datum(9, TimeUnit.Years, 5.41), new Datum(10, TimeUnit.Years, 5.47),
    new Datum(12, TimeUnit.Years, 5.60), new Datum(15, TimeUnit.Years, 5.75),
    new Datum(20, TimeUnit.Years, 5.89), new Datum(25, TimeUnit.Years, 5.95),
    new Datum(30, TimeUnit.Years, 5.96)
];
const bondData = [
    new BondDatum(6, TimeUnit.Months, 5, Frequency.Semiannual, 4.75, 101.320),
    new BondDatum(1, TimeUnit.Years, 3, Frequency.Semiannual, 2.75, 100.590),
    new BondDatum(2, TimeUnit.Years, 5, Frequency.Semiannual, 5.00, 105.650),
    new BondDatum(5, TimeUnit.Years, 11, Frequency.Semiannual, 5.50, 113.610),
    new BondDatum(10, TimeUnit.Years, 11, Frequency.Semiannual, 3.75, 104.070)
];
const bmaData = [
    new Datum(1, TimeUnit.Years, 67.56), new Datum(2, TimeUnit.Years, 68.00),
    new Datum(3, TimeUnit.Years, 68.25), new Datum(4, TimeUnit.Years, 68.50),
    new Datum(5, TimeUnit.Years, 68.81), new Datum(7, TimeUnit.Years, 69.50),
    new Datum(10, TimeUnit.Years, 70.44), new Datum(15, TimeUnit.Years, 71.69),
    new Datum(20, TimeUnit.Years, 72.69), new Datum(30, TimeUnit.Years, 73.81)
];
class CommonVars {
    constructor() {
        this.backup = new SavedSettings();
        this.calendar = new TARGET();
        this.settlementDays = 2;
        this.today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(this.today);
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        this.fixedLegConvention = BusinessDayConvention.Unadjusted;
        this.fixedLegFrequency = Frequency.Annual;
        this.fixedLegDayCounter = new Thirty360();
        this.bondSettlementDays = 3;
        this.bondDayCounter = new ActualActual();
        this.bondConvention = BusinessDayConvention.Following;
        this.bondRedemption = 100.0;
        this.bmaFrequency = Frequency.Quarterly;
        this.bmaConvention = BusinessDayConvention.Following;
        this.bmaDayCounter = new ActualActual();
        this.deposits = depositData.length;
        this.fras = fraData.length;
        this.immFuts = immFutData.length;
        this.asxFuts = asxFutData.length;
        this.swaps = swapData.length;
        this.bonds = bondData.length;
        this.bmas = bmaData.length;
        this.rates = new Array(this.deposits + this.swaps);
        this.fraRates = new Array(this.fras);
        this.immFutPrices = new Array(this.immFuts);
        this.asxFutPrices = new Array(this.asxFuts);
        this.prices = new Array(this.bonds);
        this.fractions = new Array(this.bmas);
        for (let i = 0; i < this.deposits; i++) {
            this.rates[i] = new SimpleQuote(depositData[i].rate / 100);
        }
        for (let i = 0; i < this.swaps; i++) {
            this.rates[i + this.deposits] = new SimpleQuote(swapData[i].rate / 100);
        }
        for (let i = 0; i < this.fras; i++) {
            this.fraRates[i] = new SimpleQuote(fraData[i].rate / 100);
        }
        for (let i = 0; i < this.bonds; i++) {
            this.prices[i] = new SimpleQuote(bondData[i].price);
        }
        for (let i = 0; i < this.immFuts; i++) {
            this.immFutPrices[i] = new SimpleQuote(100.0 - immFutData[i].rate);
        }
        for (let i = 0; i < this.asxFuts; i++) {
            this.asxFutPrices[i] = new SimpleQuote(100.0 - asxFutData[i].rate);
        }
        for (let i = 0; i < this.bmas; i++) {
            this.fractions[i] = new SimpleQuote(bmaData[i].rate / 100);
        }
        this.instruments = new Array(this.deposits + this.swaps);
        this.fraHelpers = new Array(this.fras);
        this.immFutHelpers = new Array(this.immFuts);
        this.asxFutHelpers = [];
        this.bondHelpers = new Array(this.bonds);
        this.schedules = new Array(this.bonds);
        this.bmaHelpers = new Array(this.bmas);
        const euribor6m = new Euribor6M();
        for (let i = 0; i < this.deposits; i++) {
            const r = new Handle(this.rates[i]);
            this.instruments[i] = new DepositRateHelper().drhInit3(r, new Euribor(new Period().init1(depositData[i].n, depositData[i].units)));
        }
        for (let i = 0; i < this.swaps; i++) {
            const r = new Handle(this.rates[i + this.deposits]);
            this.instruments[i + this.deposits] = new SwapRateHelper().srhInit2(r, new Period().init1(swapData[i].n, swapData[i].units), this.calendar, this.fixedLegFrequency, this.fixedLegConvention, this.fixedLegDayCounter, euribor6m);
        }
        const euribor3m = new Euribor3M();
        for (let i = 0; i < this.fras; i++) {
            const r = new Handle(this.fraRates[i]);
            this.fraHelpers[i] = new FraRateHelper().frahInit1(r, fraData[i].n, fraData[i].n + 3, euribor3m.fixingDays(), euribor3m.fixingCalendar(), euribor3m.businessDayConvention(), euribor3m.endOfMonth(), euribor3m.dayCounter());
        }
        let immDate = null;
        for (let i = 0; i < this.immFuts; i++) {
            const r = new Handle(this.immFutPrices[i]);
            immDate = IMM.nextDate1(immDate, false);
            if (euribor3m.fixingDate(immDate).valueOf() <
                Settings.evaluationDate.f().valueOf()) {
                immDate = IMM.nextDate1(immDate, false);
            }
            this.immFutHelpers[i] = new FuturesRateHelper().frhInit5(r, immDate, euribor3m, new Handle(), Futures.Type.IMM);
        }
        let asxDate = null;
        for (let i = 0; i < this.asxFuts; i++) {
            const r = new Handle(this.asxFutPrices[i]);
            asxDate = ASX.nextDate1(asxDate, false);
            if (euribor3m.fixingDate(asxDate).valueOf() <
                Settings.evaluationDate.f().valueOf()) {
                asxDate = ASX.nextDate1(asxDate, false);
            }
            if (euribor3m.fixingCalendar().isBusinessDay(asxDate)) {
                this.asxFutHelpers.push(new FuturesRateHelper().frhInit5(r, asxDate, euribor3m, new Handle(), Futures.Type.ASX));
            }
        }
        for (let i = 0; i < this.bonds; i++) {
            const p = new Handle(this.prices[i]);
            const maturity = this.calendar.advance1(this.today, bondData[i].n, bondData[i].units);
            const issue = this.calendar.advance1(maturity, -bondData[i].length, TimeUnit.Years);
            const coupons = [bondData[i].coupon / 100.0];
            this.schedules[i] = new Schedule().init2(issue, maturity, new Period().init2(bondData[i].frequency), this.calendar, this.bondConvention, this.bondConvention, DateGeneration.Rule.Backward, false);
            this.bondHelpers[i] = new FixedRateBondHelper(p, this.bondSettlementDays, this.bondRedemption, this.schedules[i], coupons, this.bondDayCounter, this.bondConvention, this.bondRedemption, issue);
        }
    }
}
function testCurveConsistency(vars, traits, interpolator = null, bootstrap = new IterativeBootstrap(traits, interpolator), tolerance = 1.0e-9) {
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit3(vars.settlement, vars.instruments, new Actual360());
    const curveHandle = new RelinkableHandle();
    curveHandle.linkTo(vars.termStructure);
    for (let i = 0; i < vars.deposits; i++) {
        const index = new Euribor(new Period().init1(depositData[i].n, depositData[i].units), curveHandle);
        const expectedRate = depositData[i].rate / 100, estimatedRate = index.fixing(vars.today);
        expect(Math.abs(expectedRate - estimatedRate)).toBeLessThan(tolerance);
    }
    const euribor6m = new Euribor6M(curveHandle);
    for (let i = 0; i < vars.swaps; i++) {
        const tenor = new Period().init1(swapData[i].n, swapData[i].units);
        const swap = new MakeVanillaSwap(tenor, euribor6m, 0.0)
            .withEffectiveDate(vars.settlement)
            .withFixedLegDayCount(vars.fixedLegDayCounter)
            .withFixedLegTenor(new Period().init2(vars.fixedLegFrequency))
            .withFixedLegConvention(vars.fixedLegConvention)
            .withFixedLegTerminationDateConvention(vars.fixedLegConvention)
            .f();
        const expectedRate = swapData[i].rate / 100, estimatedRate = swap.fairRate();
        const error = Math.abs(expectedRate - estimatedRate);
        expect(error).toBeLessThan(tolerance);
    }
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit3(vars.settlement, vars.bondHelpers, new Actual360());
    curveHandle.linkTo(vars.termStructure);
    for (let i = 0; i < vars.bonds; i++) {
        const maturity = vars.calendar.advance1(vars.today, bondData[i].n, bondData[i].units);
        const issue = vars.calendar.advance1(maturity, -bondData[i].length, TimeUnit.Years);
        const coupons = [bondData[i].coupon / 100.0];
        const bond = new FixedRateBond().frbInit1(vars.bondSettlementDays, 100.0, vars.schedules[i], coupons, vars.bondDayCounter, vars.bondConvention, vars.bondRedemption, issue);
        const bondEngine = new DiscountingBondEngine(curveHandle);
        bond.setPricingEngine(bondEngine);
        const expectedPrice = bondData[i].price, estimatedPrice = bond.cleanPrice1();
        const error = Math.abs(expectedPrice - estimatedPrice);
        expect(error).toBeLessThan(tolerance);
    }
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit3(vars.settlement, vars.fraHelpers, new Actual360());
    curveHandle.linkTo(vars.termStructure);
    const euribor3m = new Euribor3M(curveHandle);
    for (let i = 0; i < vars.fras; i++) {
        const start = vars.calendar.advance1(vars.settlement, fraData[i].n, fraData[i].units, euribor3m.businessDayConvention(), euribor3m.endOfMonth());
        const end = vars.calendar.advance1(start, 3, TimeUnit.Months, euribor3m.businessDayConvention(), euribor3m.endOfMonth());
        const fra = new ForwardRateAgreement(start, end, Position.Type.Long, fraData[i].rate / 100, 100.0, euribor3m, curveHandle);
        const expectedRate = fraData[i].rate / 100, estimatedRate = fra.forwardRate().f();
        expect(Math.abs(expectedRate - estimatedRate)).toBeLessThan(tolerance);
    }
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit3(vars.settlement, vars.immFutHelpers, new Actual360());
    curveHandle.linkTo(vars.termStructure);
    let immStart = null;
    for (let i = 0; i < vars.immFuts; i++) {
        immStart = IMM.nextDate1(immStart, false);
        if (euribor3m.fixingDate(immStart).valueOf() <
            Settings.evaluationDate.f().valueOf()) {
            immStart = IMM.nextDate1(immStart, false);
        }
        const end = vars.calendar.advance1(immStart, 3, TimeUnit.Months, euribor3m.businessDayConvention(), euribor3m.endOfMonth());
        const immFut = new ForwardRateAgreement(immStart, end, Position.Type.Long, immFutData[i].rate / 100, 100.0, euribor3m, curveHandle);
        const expectedRate = immFutData[i].rate / 100, estimatedRate = immFut.forwardRate().f();
        expect(Math.abs(expectedRate - estimatedRate)).toBeLessThan(tolerance);
    }
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit3(vars.settlement, vars.asxFutHelpers, new Actual360());
    curveHandle.linkTo(vars.termStructure);
    let asxStart = null;
    for (let i = 0; i < vars.asxFuts; i++) {
        asxStart = ASX.nextDate1(asxStart, false);
        if (euribor3m.fixingDate(asxStart).valueOf() <
            Settings.evaluationDate.f().valueOf()) {
            asxStart = ASX.nextDate1(asxStart, false);
        }
        if (euribor3m.fixingCalendar().isHoliday(asxStart)) {
            continue;
        }
        const end = vars.calendar.advance1(asxStart, 3, TimeUnit.Months, euribor3m.businessDayConvention(), euribor3m.endOfMonth());
        const asxFut = new ForwardRateAgreement(asxStart, end, Position.Type.Long, asxFutData[i].rate / 100, 100.0, euribor3m, curveHandle);
        const expectedRate = asxFutData[i].rate / 100, estimatedRate = asxFut.forwardRate().f();
        expect(Math.abs(expectedRate - estimatedRate)).toBeLessThan(tolerance);
    }
}
function testBMACurveConsistency(vars, traits, interpolator = null, bootstrap = new IterativeBootstrap(traits, interpolator), tolerance = 1.0e-9) {
    vars.calendar = new JointCalendar(new BMAIndex().fixingCalendar(), new USDLibor(new Period().init1(3, TimeUnit.Months)).fixingCalendar(), null, null, JointCalendar.JointCalendarRule.JoinHolidays);
    vars.today = vars.calendar.adjust(new Date());
    Settings.evaluationDate.set(vars.today);
    vars.settlement =
        vars.calendar.advance1(vars.today, vars.settlementDays, TimeUnit.Days);
    const riskFreeCurve = new Handle(new FlatForward().ffInit2(vars.settlement, 0.04, new Actual360()));
    const bmaIndex = new BMAIndex();
    const liborIndex = new USDLibor(new Period().init1(3, TimeUnit.Months), riskFreeCurve);
    for (let i = 0; i < vars.bmas; ++i) {
        const f = new Handle(vars.fractions[i]);
        vars.bmaHelpers[i] = new BMASwapRateHelper(f, new Period().init1(bmaData[i].n, bmaData[i].units), vars.settlementDays, vars.calendar, new Period().init2(vars.bmaFrequency), vars.bmaConvention, vars.bmaDayCounter, bmaIndex, liborIndex);
    }
    const w = DateExt.weekday(vars.today);
    const lastWednesday = (w >= 4) ? DateExt.sub(vars.today, (w - 4)) :
        DateExt.add(vars.today, (4 - w - 7));
    const lastFixing = bmaIndex.fixingCalendar().adjust(lastWednesday);
    bmaIndex.addFixing(lastFixing, 0.03);
    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit2(vars.today, vars.bmaHelpers, new Actual360(), 1.0e-12);
    const curveHandle = new RelinkableHandle();
    curveHandle.linkTo(vars.termStructure);
    const bma = new BMAIndex(curveHandle);
    const libor3m = new USDLibor(new Period().init1(3, TimeUnit.Months), riskFreeCurve);
    for (let i = 0; i < vars.bmas; i++) {
        const tenor = new Period().init1(bmaData[i].n, bmaData[i].units);
        const bmaSchedule = new MakeSchedule()
            .from(vars.settlement)
            .to(DateExt.advance(vars.settlement, tenor.length(), tenor.units()))
            .withFrequency(vars.bmaFrequency)
            .withCalendar(bma.fixingCalendar())
            .withConvention(vars.bmaConvention)
            .backwards()
            .f();
        const liborSchedule = new MakeSchedule()
            .from(vars.settlement)
            .to(DateExt.advance(vars.settlement, tenor.length(), tenor.units()))
            .withTenor(libor3m.tenor())
            .withCalendar(libor3m.fixingCalendar())
            .withConvention(libor3m.businessDayConvention())
            .endOfMonth(libor3m.endOfMonth())
            .backwards()
            .f();
        const swap = new BMASwap(BMASwap.Type.Payer, 100.0, liborSchedule, 0.75, 0.0, libor3m, libor3m.dayCounter(), bmaSchedule, bma, vars.bmaDayCounter);
        swap.setPricingEngine(new DiscountingSwapEngine(libor3m.forwardingTermStructure()));
        const expectedFraction = bmaData[i].rate / 100, estimatedFraction = swap.fairLiborFraction();
        const error = Math.abs(expectedFraction - estimatedFraction);
        expect(error).toBeLessThan(tolerance);
    }
}
function testCurveCopy(vars, traits, interpolator = null) {
    const curve = new PiecewiseYieldCurve(traits, interpolator)
        .pwycInit2(vars.settlement, vars.instruments, new Actual360(), 1.0e-12);
    curve.recalculate();
    let copiedCurve;
    Object.assign(copiedCurve, curve);
    const t = 2.718;
    const r1 = curve.zeroRate2(t, Compounding.Continuous).f();
    const r2 = copiedCurve.zeroRate2(t, Compounding.Continuous).f();
    if (!Comparison.close(r1, r2)) {
        throw new Error('failed to link original and copied curve');
    }
    for (let i = 0; i < vars.rates.length; ++i) {
        vars.rates[i].setValue(vars.rates[i].value() + 0.001);
    }
    const r3 = curve.zeroRate2(t, Compounding.Continuous).f();
    const r4 = copiedCurve.zeroRate2(t, Compounding.Continuous).f();
    if (Comparison.close(r1, r3)) {
        throw new Error('failed to modify original curve');
    }
    if (!Comparison.close(r2, r4)) {
        throw new Error('failed to break link between original and copied curve');
    }
}
describe('Piecewise yield curve tests', () => {
    it('Testing consistency of piecewise-log-cubic discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new Discount(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        testBMACurveConsistency(vars, new Discount(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-log-linear discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new Discount(), new LogLinear());
        testBMACurveConsistency(vars, new Discount(), new LogLinear());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-linear discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new Discount(), new Linear());
        testBMACurveConsistency(vars, new Discount(), new Linear());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-log-linear zero-yield curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ZeroYield(), new LogLinear());
        testBMACurveConsistency(vars, new ZeroYield(), new LogLinear());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-linear zero-yield curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ZeroYield(), new Linear());
        testBMACurveConsistency(vars, new ZeroYield(), new Linear());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-cubic zero-yield curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ZeroYield(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        testBMACurveConsistency(vars, new ZeroYield(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-linear forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ForwardRate(), new Linear());
        testBMACurveConsistency(vars, new ForwardRate(), new Linear());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-flat forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ForwardRate(), new BackwardFlat());
        testBMACurveConsistency(vars, new ForwardRate(), new BackwardFlat());
        vars.backup.dispose();
    });
    it('Testing consistency of piecewise-cubic forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ForwardRate(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        testBMACurveConsistency(vars, new ForwardRate(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });
    it('Testing consistency of convex monotone forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, new ForwardRate(), new ConvexMonotone());
        testBMACurveConsistency(vars, new ForwardRate(), new ConvexMonotone());
        vars.backup.dispose();
    });
    it('Testing consistency of local-bootstrap algorithm...', () => {
        const vars = new CommonVars();
        const traits = new ForwardRate();
        const interpolator = new ConvexMonotone();
        const bootstrap = new LocalBootstrap(traits, interpolator);
        testCurveConsistency(vars, traits, interpolator, bootstrap, 1.0e-7);
        testBMACurveConsistency(vars, traits, interpolator, bootstrap, 1.0e-7);
        vars.backup.dispose();
    });
    it('Testing observability of piecewise yield curve...', () => {
    });
    it('Testing use of today\'s LIBOR fixings in swap curve...', () => {
    });
    it('Testing bootstrap over JPY LIBOR swaps...', () => {
    });
    it('Testing copying of discount curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new Discount(), new LogLinear());
        vars.backup.dispose();
    });
    it('Testing copying of forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new ForwardRate(), new BackwardFlat());
    });
    it('Testing copying of zero-rate curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new ZeroYield(), new Linear());
        vars.backup.dispose();
    });
    it('Testing SwapRateHelper last relevant date...', () => {
    });
    it('Testing bootstrap starting from bad guess...', () => {
    });
});
//# sourceMappingURL=piecewiseyieldcurve.js.map