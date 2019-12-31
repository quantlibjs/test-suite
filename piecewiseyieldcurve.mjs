/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import '/test-suite/quantlibtestsuite.mjs';
import { Flag } from '/test-suite/utilities.mjs';
import { Actual360, Actual365Fixed, ActualActual, ASX, BackwardFlat, BMAIndex, BMASwap, BMASwapRateHelper, BusinessDayConvention, Comparison, Compounding, ConvexMonotone, CubicInterpolation, DateExt, DateGeneration, DepositRateHelper, Discount, DiscountingBondEngine, DiscountingSwapEngine, Euribor, Euribor1M, Euribor3M, Euribor6M, FixedRateBond, FixedRateBondHelper, FlatForward, ForwardRate, ForwardRateAgreement, FraRateHelper, Frequency, Futures, FuturesRateHelper, Handle, IMM, IterativeBootstrap, Japan, JointCalendar, JPYLibor, Linear, LocalBootstrap, LogCubic, LogLinear, MakeSchedule, MakeVanillaSwap, Period, PiecewiseYieldCurve, Position, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, SwapRateHelper, TARGET, Thirty360, TimeUnit, UnitedStates, USDLibor, ZeroYield, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

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
        this.today = this.calendar.adjust(DateExt.UTC());
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

// enum Traits
var T;
(function (T) {
    T[T["Discount"] = 0] = "Discount";
    T[T["ZeroYield"] = 1] = "ZeroYield";
    T[T["ForwardRate"] = 2] = "ForwardRate";
})(T || (T = {}));
function createTrait(t) {
    switch (t) {
        case T.Discount:
            return new Discount();
        case T.ZeroYield:
            return new ZeroYield();
        case T.ForwardRate:
            return new ForwardRate();
        default:
            throw new Error('wrong Traits');
    }
}

// enum Interpolator
var I;
(function (I) {
    I[I["LogLinear"] = 0] = "LogLinear";
    I[I["Linear"] = 1] = "Linear";
    I[I["BackwardFlat"] = 2] = "BackwardFlat";
    I[I["ConvexMonotone"] = 3] = "ConvexMonotone";
    I[I["LogCubic"] = 4] = "LogCubic";
})(I || (I = {}));
function createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV) {
    switch (i) {
        case I.LogLinear:
            return new LogLinear();
        case I.Linear:
            return new Linear();
        case I.BackwardFlat:
            return new BackwardFlat();
        case I.ConvexMonotone:
            return new ConvexMonotone();
        case I.LogCubic:
            return new LogCubic(da, monotonic, leftC, leftV, rightC, rightV);
        default:
            throw new Error('wrong Interpolator');
    }
}

// enum Bootstrap
var B;
(function (B) {
    B[B["IterativeBootstrap"] = 0] = "IterativeBootstrap";
    B[B["LocalBootstrap"] = 1] = "LocalBootstrap";
})(B || (B = {}));
function createBootstrap(b, t, i) {
    switch (b) {
        case B.IterativeBootstrap:
            return new IterativeBootstrap(t, i);
        case B.LocalBootstrap:
            return new LocalBootstrap(t, i);
        default:
            throw new Error('wrong bootstrap');
    }
}

function testCurveConsistency(vars, t, i, b, tolerance = 1.0e-9, da, monotonic, leftC, leftV, rightC, rightV) {
    let traits = createTrait(t);
    let interpolator = createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV);
    let bootstrap = createBootstrap(b, traits, interpolator);
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
    traits = createTrait(t);
    interpolator = createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV);
    bootstrap = createBootstrap(b, traits, interpolator);
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
    traits = createTrait(t);
    interpolator = createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV);
    bootstrap = createBootstrap(b, traits, interpolator);
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
    traits = createTrait(t);
    interpolator = createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV);
    bootstrap = createBootstrap(b, traits, interpolator);
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
    traits = createTrait(t);
    interpolator = createInterpolator(i, da, monotonic, leftC, leftV, rightC, rightV);
    bootstrap = createBootstrap(b, traits, interpolator);
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
    // re-adjust settlement
    vars.calendar = new JointCalendar(new BMAIndex().fixingCalendar(),
                                      new USDLibor(new Period().init1(3, TimeUnit.Months)).fixingCalendar());
    vars.today = vars.calendar.adjust(DateExt.UTC());
    Settings.evaluationDate.set(vars.today);
    vars.settlement =
        vars.calendar.advance1(vars.today, vars.settlementDays, TimeUnit.Days);

    const riskFreeCurve = new Handle(new FlatForward()
                            .ffInit2(vars.settlement, 0.04, new Actual360()));

    const bmaIndex = new BMAIndex();
    const liborIndex = new USDLibor(new Period().init1(3, TimeUnit.Months),
                                    riskFreeCurve);
    for (let i = 0; i < vars.bmas; ++i) {
        const f = new Handle(vars.fractions[i]);
        vars.bmaHelpers[i]
          = new BMASwapRateHelper(f,
                                  new Period().init1(bmaData[i].n, bmaData[i].units),
                                  vars.settlementDays,
                                  vars.calendar,
                                  new Period().init2(vars.bmaFrequency),
                                  vars.bmaConvention,
                                  vars.bmaDayCounter,
                                  bmaIndex,
                                  liborIndex);
    }

    const w = DateExt.weekday(vars.today);
    const lastWednesday = (w >= 4) ? DateExt.sub(vars.today, (w - 4)) :
        DateExt.add(vars.today, (4 - w - 7));
    const lastFixing = bmaIndex.fixingCalendar().adjust(lastWednesday);
    bmaIndex.addFixing(lastFixing, 0.03);

    vars.termStructure =
        new PiecewiseYieldCurve(traits, interpolator, bootstrap)
            .pwycInit2(vars.today, vars.bmaHelpers,
                       new Actual360(), 1.0e-12);

    const curveHandle = new RelinkableHandle();
    curveHandle.linkTo(vars.termStructure);

    // check BMA swaps
    const bma = new BMAIndex(curveHandle);
    const libor3m = new USDLibor(new Period().init1(3, TimeUnit.Months),
                                 riskFreeCurve);
    for (let i = 0; i < vars.bmas; i++) {
        const tenor = new Period().init1(bmaData[i].n, bmaData[i].units);

        const bmaSchedule = new MakeSchedule()
            .from(vars.settlement)
            .to(DateExt.addPeriod(vars.settlement, tenor))
            .withFrequency(vars.bmaFrequency)
            .withCalendar(bma.fixingCalendar())
            .withConvention(vars.bmaConvention)
            .backwards()
            .f();
        const liborSchedule = new MakeSchedule()
            .from(vars.settlement)
            .to(DateExt.addPeriod(vars.settlement, tenor))
            .withTenor(libor3m.tenor())
            .withCalendar(libor3m.fixingCalendar())
            .withConvention(libor3m.businessDayConvention())
            .endOfMonth(libor3m.endOfMonth())
            .backwards()
            .f();

        const swap = new BMASwap(BMASwap.Type.Payer, 100.0,
                                 liborSchedule, 0.75, 0.0,
                                 libor3m, libor3m.dayCounter(),
                                 bmaSchedule, bma, vars.bmaDayCounter);
        swap.setPricingEngine(
          new DiscountingSwapEngine(libor3m.forwardingTermStructure()));

        const expectedFraction = bmaData[i].rate / 100,
              estimatedFraction = swap.fairLiborFraction();
        const error = Math.abs(expectedFraction - estimatedFraction);
        if(error>tolerance) {
          fail(`fairLiborFraction ${i}`);
        }
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

describe(`Piecewise yield curve tests ${version}`, () => {
    xit('Testing consistency of piecewise-log-cubic discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.Discount, I.LogCubic, B.IterativeBootstrap, 1.0e-9, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0);
        testBMACurveConsistency(vars, new Discount(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-log-linear discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.Discount, I.LogLinear, B.IterativeBootstrap);
        testBMACurveConsistency(vars, new Discount(), new LogLinear());
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-linear discount curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.Discount, I.Linear, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new Discount(), new Linear());
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-log-linear zero-yield curve...', () => {
        const vars = new CommonVars();
        Settings.QL_NEGATIVE_RATES = false;
        testCurveConsistency(vars, T.ZeroYield, I.LogLinear, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new ZeroYield(), new LogLinear());
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-linear zero-yield curve...', () => {
        const vars = new CommonVars();
        Settings.QL_NEGATIVE_RATES = false;
        testCurveConsistency(vars, T.ZeroYield, I.Linear, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new ZeroYield(), new Linear());
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-cubic zero-yield curve...', () => {
        const vars = new CommonVars();
        Settings.QL_NEGATIVE_RATES = false;
        testCurveConsistency(vars, T.ZeroYield, I.LogCubic, B.IterativeBootstrap, 1.0e-9, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0);
        //testBMACurveConsistency(vars, new ZeroYield(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-linear forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.ForwardRate, I.Linear, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new ForwardRate(), new Linear());
        vars.backup.dispose();
    });

    it('Testing consistency of piecewise-flat forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.ForwardRate, I.BackwardFlat, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new ForwardRate(), new BackwardFlat());
        vars.backup.dispose();
    });

    xit('Testing consistency of piecewise-cubic forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.ForwardRate, I.LogCubic, B.IterativeBootstrap, 1.0e-9, CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0);
        //testBMACurveConsistency(vars, new ForwardRate(), new LogCubic(CubicInterpolation.DerivativeApprox.Spline, true, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0, CubicInterpolation.BoundaryCondition.SecondDerivative, 0.0));
        vars.backup.dispose();
    });

    it('Testing consistency of convex monotone forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveConsistency(vars, T.ForwardRate, I.ConvexMonotone, B.IterativeBootstrap);
        //testBMACurveConsistency(vars, new ForwardRate(), new ConvexMonotone());
        vars.backup.dispose();
    });

    it('Testing consistency of local-bootstrap algorithm...', () => {
        const vars = new CommonVars();
        const traits = new ForwardRate();
        const interpolator = new ConvexMonotone();
        const bootstrap = new LocalBootstrap(traits, interpolator);
        testCurveConsistency(vars, T.ForwardRate, I.ConvexMonotone, B.LocalBootstrap, 1.0e-7);
        testBMACurveConsistency(vars, traits, interpolator, bootstrap, 1.0e-7);
        vars.backup.dispose();
    });

    it('Testing observability of piecewise yield curve...', () => {
        const vars = new CommonVars();
        vars.termStructure =
            new PiecewiseYieldCurve(new Discount(), new LogLinear())
                .pwycInit4(vars.settlementDays, vars.calendar, vars.instruments, new Actual360());
        const f = new Flag();
        f.registerWith(vars.termStructure);
        for (let i = 0; i < vars.deposits + vars.swaps; i++) {
            const testTime = new Actual360().yearFraction(vars.settlement, vars.instruments[i].pillarDate());
            const discount = vars.termStructure.discount2(testTime);
            f.lower();
            vars.rates[i].setValue(vars.rates[i].value() * 1.01);
            expect(f.isUp()).toBeTruthy();
            expect(vars.termStructure.discount2(testTime, true))
                .not.toEqual(discount);
            vars.rates[i].setValue(vars.rates[i].value() / 1.01);
        }
        vars.termStructure.maxDate();
        f.lower();
        Settings.evaluationDate.set(vars.calendar.advance1(vars.today, 15, TimeUnit.Days));
        expect(f.isUp()).toBeTruthy();
        f.lower();
        Settings.evaluationDate.set(vars.today);
        expect(f.isUp()).toBeFalsy();
        vars.backup.dispose();
    });

    it('Testing use of today\'s LIBOR fixings in swap curve...', () => {
        const vars = new CommonVars();
        const swapHelpers = new Array(vars.swaps);
        const euribor6m = new Euribor6M();
        for (let i = 0; i < vars.swaps; i++) {
            const r = new Handle(vars.rates[i + vars.deposits]);
            swapHelpers[i] = new SwapRateHelper().srhInit2(r, new Period().init1(swapData[i].n, swapData[i].units), vars.calendar, vars.fixedLegFrequency, vars.fixedLegConvention, vars.fixedLegDayCounter, euribor6m);
        }
        vars.termStructure =
            new PiecewiseYieldCurve(new Discount(), new LogLinear())
                .pwycInit1(vars.settlement, swapHelpers, new Actual360());
        const curveHandle = new Handle(vars.termStructure);
        const index = new Euribor6M(curveHandle);
        for (let i = 0; i < vars.swaps; i++) {
            const tenor = new Period().init1(swapData[i].n, swapData[i].units);
            const swap = new MakeVanillaSwap(tenor, index, 0.0)
                .withEffectiveDate(vars.settlement)
                .withFixedLegDayCount(vars.fixedLegDayCounter)
                .withFixedLegTenor(new Period().init2(vars.fixedLegFrequency))
                .withFixedLegConvention(vars.fixedLegConvention)
                .withFixedLegTerminationDateConvention(vars.fixedLegConvention)
                .f();
            const expectedRate = swapData[i].rate / 100, estimatedRate = swap.fairRate();
            const tolerance = 1.0e-9;
            expect(Math.abs(expectedRate - estimatedRate))
                .toBeLessThanOrEqual(tolerance);
        }
        const f = new Flag();
        f.registerWith(vars.termStructure);
        f.lower();
        index.addFixing(vars.today, 0.0425);
        expect(f.isUp()).toBeTruthy();
        for (let i = 0; i < vars.swaps; i++) {
            const tenor = new Period().init1(swapData[i].n, swapData[i].units);
            const swap = new MakeVanillaSwap(tenor, index, 0.0)
                .withEffectiveDate(vars.settlement)
                .withFixedLegDayCount(vars.fixedLegDayCounter)
                .withFixedLegTenor(new Period().init2(vars.fixedLegFrequency))
                .withFixedLegConvention(vars.fixedLegConvention)
                .withFixedLegTerminationDateConvention(vars.fixedLegConvention)
                .f();
            const expectedRate = swapData[i].rate / 100, estimatedRate = swap.fairRate();
            const tolerance = 1.0e-9;
            expect(Math.abs(expectedRate - estimatedRate)).toBeLessThan(tolerance);
        }
        vars.backup.dispose();
    });

    it('Testing bootstrap over JPY LIBOR swaps...', () => {
        const vars = new CommonVars();
        vars.today = DateExt.UTC('4,October,2007');
        Settings.evaluationDate.set(vars.today);
        vars.calendar = new Japan();
        vars.settlement =
            vars.calendar.advance1(vars.today, vars.settlementDays, TimeUnit.Days);
        vars.rates = new Array(vars.swaps);
        for (let i = 0; i < vars.swaps; i++) {
            vars.rates[i] = new SimpleQuote(swapData[i].rate / 100);
        }
        vars.instruments = new Array(vars.swaps);
        const index = new JPYLibor(new Period().init1(6, TimeUnit.Months));
        for (let i = 0; i < vars.swaps; i++) {
            const r = new Handle(vars.rates[i]);
            vars.instruments[i] = new SwapRateHelper().srhInit2(r, new Period().init1(swapData[i].n, swapData[i].units), vars.calendar, vars.fixedLegFrequency, vars.fixedLegConvention, vars.fixedLegDayCounter, index);
        }
        vars.termStructure =
            new PiecewiseYieldCurve(new Discount(), new LogLinear())
                .pwycInit2(vars.settlement, vars.instruments, new Actual360(), 1.0e-12);
        const curveHandle = new RelinkableHandle();
        curveHandle.linkTo(vars.termStructure);
        const jpylibor6m = new JPYLibor(new Period().init1(6, TimeUnit.Months), curveHandle);
        for (let i = 0; i < vars.swaps; i++) {
            const tenor = new Period().init1(swapData[i].n, swapData[i].units);
            const swap = new MakeVanillaSwap(tenor, jpylibor6m, 0.0)
                .withEffectiveDate(vars.settlement)
                .withFixedLegDayCount(vars.fixedLegDayCounter)
                .withFixedLegTenor(new Period().init2(vars.fixedLegFrequency))
                .withFixedLegConvention(vars.fixedLegConvention)
                .withFixedLegTerminationDateConvention(vars.fixedLegConvention)
                .withFixedLegCalendar(vars.calendar)
                .withFloatingLegCalendar(vars.calendar)
                .f();
            const expectedRate = swapData[i].rate / 100, estimatedRate = swap.fairRate();
            const error = Math.abs(expectedRate - estimatedRate);
            const tolerance = 1.0e-9;
            expect(error).toBeLessThan(tolerance);
        }
        vars.backup.dispose();
    });

    xit('Testing copying of discount curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new Discount(), new LogLinear());
        vars.backup.dispose();
    });

    xit('Testing copying of forward-rate curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new ForwardRate(), new BackwardFlat());
    });

    xit('Testing copying of zero-rate curve...', () => {
        const vars = new CommonVars();
        testCurveCopy(vars, new ZeroYield(), new Linear());
        vars.backup.dispose();
    });

    it('Testing SwapRateHelper last relevant date...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(DateExt.UTC('22,Dec,2016'));
        const today = Settings.evaluationDate.f();
        const flat3m = new Handle(new FlatForward().ffInit1(today, new Handle(new SimpleQuote(0.02)), new Actual365Fixed()));
        const usdLibor3m = new USDLibor(new Period().init1(3, TimeUnit.Months), flat3m);
        const helper = new SwapRateHelper().srhInit4(0.02, new Period().init1(50, TimeUnit.Years), new UnitedStates(), Frequency.Semiannual, BusinessDayConvention.ModifiedFollowing, new Thirty360(), usdLibor3m);
        const curve = new PiecewiseYieldCurve(new Discount(), new LogLinear())
            .pwycInit1(today, [helper], new Actual365Fixed());
        expect(() => curve.discount2(1.0)).not.toThrow();
        backup.dispose();
    });

    it('Testing bootstrap starting from bad guess...', () => {
        const backup = new SavedSettings();
        Settings.QL_NEGATIVE_RATES = true;
        Settings.QL_USE_INDEXED_COUPON = false;
        const data = [
            new Datum(1, TimeUnit.Weeks, -0.003488),
            new Datum(2, TimeUnit.Weeks, -0.0033),
            new Datum(6, TimeUnit.Months, -0.00339),
            new Datum(2, TimeUnit.Years, -0.00336),
            new Datum(8, TimeUnit.Years, 0.00302),
            new Datum(50, TimeUnit.Years, 0.01185)
        ];
        const helpers = [];
        const euribor1m = new Euribor1M();
        for (let i = 0; i < data.length; ++i) {
            helpers.push(new SwapRateHelper().srhInit4(data[i].rate, new Period().init1(data[i].n, data[i].units), new TARGET(), Frequency.Monthly, BusinessDayConvention.Unadjusted, new Thirty360(), euribor1m));
        }
        const today = DateExt.UTC('12,October,2017');
        const test_date = DateExt.UTC('16,December,2016');
        Settings.evaluationDate.set(today);
        const curve = new PiecewiseYieldCurve(new ForwardRate(), new BackwardFlat())
            .pwycInit1(test_date, helpers, new Actual360());
        curve.discount2(1.0);
        Settings.evaluationDate.set(test_date);
        const h = new RelinkableHandle();
        h.linkTo(curve);
        const index = new Euribor1M(h);
        for (let i = 0; i < data.length; i++) {
            const tenor = new Period().init1(data[i].n, data[i].units);
            const swap = new MakeVanillaSwap(tenor, index, 0.0)
                .withFixedLegDayCount(new Thirty360())
                .withFixedLegTenor(new Period().init1(1, TimeUnit.Months))
                .withFixedLegConvention(BusinessDayConvention.Unadjusted)
                .f();
            swap.setPricingEngine(new DiscountingSwapEngine(h));
            const expectedRate = data[i].rate, estimatedRate = swap.fairRate();
            const error = Math.abs(expectedRate - estimatedRate);
            const tolerance = 1.0e-9;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});
