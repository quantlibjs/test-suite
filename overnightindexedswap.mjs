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
import { Actual360, Actual365Fixed, BusinessDayConvention, DateExt, DepositRateHelper, Discount, Eonia, Euribor3M, FraRateHelper, Frequency, Handle, LogLinear, MakeOIS, OISRateHelper, OvernightIndexedSwap, Period, PiecewiseYieldCurve, RelinkableHandle, SavedSettings, Settings, SimpleQuote, SwapRateHelper, Thirty360, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

class Datum {
    constructor(settlementDays, n, unit, rate) {
        this.settlementDays = settlementDays;
        this.n = n;
        this.unit = unit;
        this.rate = rate;
    }
}

class FraDatum {
    constructor(settlementDays, nExpiry, nMaturity, rate) {
        this.settlementDays = settlementDays;
        this.nExpiry = nExpiry;
        this.nMaturity = nMaturity;
        this.rate = rate;
    }
}

class SwapDatum {
    constructor(settlementDays, nIndexUnits, indexUnit, nTermUnits, termUnit, rate) {
        this.settlementDays = settlementDays;
        this.nIndexUnits = nIndexUnits;
        this.indexUnit = indexUnit;
        this.nTermUnits = nTermUnits;
        this.termUnit = termUnit;
        this.rate = rate;
    }
}

const depositData = [
    new Datum(0, 1, TimeUnit.Days, 1.10), new Datum(1, 1, TimeUnit.Days, 1.10),
    new Datum(2, 1, TimeUnit.Weeks, 1.40), new Datum(2, 2, TimeUnit.Weeks, 1.50),
    new Datum(2, 1, TimeUnit.Months, 1.70),
    new Datum(2, 2, TimeUnit.Months, 1.90),
    new Datum(2, 3, TimeUnit.Months, 2.05),
    new Datum(2, 4, TimeUnit.Months, 2.08),
    new Datum(2, 5, TimeUnit.Months, 2.11), new Datum(2, 6, TimeUnit.Months, 2.13)
];

const eoniaSwapData = [
    new Datum(2, 1, TimeUnit.Weeks, 1.245),
    new Datum(2, 2, TimeUnit.Weeks, 1.269),
    new Datum(2, 3, TimeUnit.Weeks, 1.277),
    new Datum(2, 1, TimeUnit.Months, 1.281),
    new Datum(2, 2, TimeUnit.Months, 1.18),
    new Datum(2, 3, TimeUnit.Months, 1.143),
    new Datum(2, 4, TimeUnit.Months, 1.125),
    new Datum(2, 5, TimeUnit.Months, 1.116),
    new Datum(2, 6, TimeUnit.Months, 1.111),
    new Datum(2, 7, TimeUnit.Months, 1.109),
    new Datum(2, 8, TimeUnit.Months, 1.111),
    new Datum(2, 9, TimeUnit.Months, 1.117),
    new Datum(2, 10, TimeUnit.Months, 1.129),
    new Datum(2, 11, TimeUnit.Months, 1.141),
    new Datum(2, 12, TimeUnit.Months, 1.153),
    new Datum(2, 15, TimeUnit.Months, 1.218),
    new Datum(2, 18, TimeUnit.Months, 1.308),
    new Datum(2, 21, TimeUnit.Months, 1.407),
    new Datum(2, 2, TimeUnit.Years, 1.510),
    new Datum(2, 3, TimeUnit.Years, 1.916),
    new Datum(2, 4, TimeUnit.Years, 2.254),
    new Datum(2, 5, TimeUnit.Years, 2.523),
    new Datum(2, 6, TimeUnit.Years, 2.746),
    new Datum(2, 7, TimeUnit.Years, 2.934),
    new Datum(2, 8, TimeUnit.Years, 3.092),
    new Datum(2, 9, TimeUnit.Years, 3.231),
    new Datum(2, 10, TimeUnit.Years, 3.380),
    new Datum(2, 11, TimeUnit.Years, 3.457),
    new Datum(2, 12, TimeUnit.Years, 3.544),
    new Datum(2, 15, TimeUnit.Years, 3.702),
    new Datum(2, 20, TimeUnit.Years, 3.703),
    new Datum(2, 25, TimeUnit.Years, 3.541),
    new Datum(2, 30, TimeUnit.Years, 3.369)
];

const fraData = [new FraDatum(2, 3, 6, 1.728), new FraDatum(2, 6, 9, 1.702)];

const swapData = [
    new SwapDatum(2, 3, TimeUnit.Months, 1, TimeUnit.Years, 1.867),
    new SwapDatum(2, 3, TimeUnit.Months, 15, TimeUnit.Months, 1.879),
    new SwapDatum(2, 3, TimeUnit.Months, 18, TimeUnit.Months, 1.934),
    new SwapDatum(2, 3, TimeUnit.Months, 21, TimeUnit.Months, 2.005),
    new SwapDatum(2, 3, TimeUnit.Months, 2, TimeUnit.Years, 2.091),
    new SwapDatum(2, 3, TimeUnit.Months, 3, TimeUnit.Years, 2.435),
    new SwapDatum(2, 3, TimeUnit.Months, 4, TimeUnit.Years, 2.733),
    new SwapDatum(2, 3, TimeUnit.Months, 5, TimeUnit.Years, 2.971),
    new SwapDatum(2, 3, TimeUnit.Months, 6, TimeUnit.Years, 3.174),
    new SwapDatum(2, 3, TimeUnit.Months, 7, TimeUnit.Years, 3.345),
    new SwapDatum(2, 3, TimeUnit.Months, 8, TimeUnit.Years, 3.491),
    new SwapDatum(2, 3, TimeUnit.Months, 9, TimeUnit.Years, 3.620),
    new SwapDatum(2, 3, TimeUnit.Months, 10, TimeUnit.Years, 3.733),
    new SwapDatum(2, 3, TimeUnit.Months, 12, TimeUnit.Years, 3.910),
    new SwapDatum(2, 3, TimeUnit.Months, 15, TimeUnit.Years, 4.052),
    new SwapDatum(2, 3, TimeUnit.Months, 20, TimeUnit.Years, 4.073),
    new SwapDatum(2, 3, TimeUnit.Months, 25, TimeUnit.Years, 3.844),
    new SwapDatum(2, 3, TimeUnit.Months, 30, TimeUnit.Years, 3.687)
];

class CommonVars {
    constructor() {
        this.eoniaTermStructure = new RelinkableHandle();
        this.swapTermStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.type = OvernightIndexedSwap.Type.Payer;
        this.settlementDays = 2;
        this.nominal = 100.0;
        this.fixedEoniaConvention = BusinessDayConvention.ModifiedFollowing;
        this.floatingEoniaConvention = BusinessDayConvention.ModifiedFollowing;
        this.fixedEoniaPeriod = new Period().init1(1, TimeUnit.Years);
        this.floatingEoniaPeriod = new Period().init1(1, TimeUnit.Years);
        this.fixedEoniaDayCount = new Actual360();
        this.eoniaIndex = new Eonia(this.eoniaTermStructure);
        this.fixedSwapConvention = BusinessDayConvention.ModifiedFollowing;
        this.fixedSwapFrequency = Frequency.Annual;
        this.fixedSwapDayCount = new Thirty360();
        this.swapIndex = new Euribor3M(this.swapTermStructure);
        this.calendar = this.eoniaIndex.fixingCalendar();
        this.today = DateExt.UTC('5,February,2009');
        Settings.evaluationDate.set(this.today);
        this.settlement = this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days, BusinessDayConvention.Following);
        this.eoniaTermStructure.linkTo(flatRate2(this.today, 0.05, new Actual365Fixed()));
    }
    makeSwap(length, fixedRate, spread, telescopicValueDates, effectiveDate = null) {
        return new MakeOIS(length, this.eoniaIndex, fixedRate)
            .withEffectiveDate(effectiveDate == null ? this.settlement : effectiveDate)
            .withOvernightLegSpread(spread)
            .withNominal(this.nominal)
            .withDiscountingTermStructure(this.eoniaTermStructure)
            .withTelescopicValueDates(telescopicValueDates)
            .f();
    }
    dispose() {
        this.backup.dispose();
    }
}

function testBootstrap(telescopicValueDates) {
    const vars = new CommonVars();
    const eoniaHelpers = [];
    const swap3mHelpers = [];
    const euribor3m = new Euribor3M();
    const eonia = new Eonia();
    for (let i = 0; i < depositData.length; i++) {
        const rate = 0.01 * depositData[i].rate;
        const simple = new SimpleQuote(rate);
        const quote = simple;
        const term = new Period().init1(depositData[i].n, depositData[i].unit);
        const helper = new DepositRateHelper().drhInit1(new Handle(quote), term, depositData[i].settlementDays, euribor3m.fixingCalendar(), euribor3m.businessDayConvention(), euribor3m.endOfMonth(), euribor3m.dayCounter());
        if (Period.lessOrEqual(term, new Period().init1(2, TimeUnit.Days))) {
            eoniaHelpers.push(helper);
        }
        if (Period.lessOrEqual(term, new Period().init1(3, TimeUnit.Months))) {
            swap3mHelpers.push(helper);
        }
    }
    for (let i = 0; i < fraData.length; i++) {
        const rate = 0.01 * fraData[i].rate;
        const simple = new SimpleQuote(rate);
        const quote = simple;
        const helper = new FraRateHelper().frahInit1(new Handle(quote), fraData[i].nExpiry, fraData[i].nMaturity, fraData[i].settlementDays, euribor3m.fixingCalendar(), euribor3m.businessDayConvention(), euribor3m.endOfMonth(), euribor3m.dayCounter());
        swap3mHelpers.push(helper);
    }
    for (let i = 0; i < eoniaSwapData.length; i++) {
        const rate = 0.01 * eoniaSwapData[i].rate;
        const simple = new SimpleQuote(rate);
        const quote = simple;
        const term = new Period().init1(eoniaSwapData[i].n, eoniaSwapData[i].unit);
        const helper = new OISRateHelper(eoniaSwapData[i].settlementDays, term, new Handle(quote), eonia, new Handle(), telescopicValueDates);
        eoniaHelpers.push(helper);
    }
    for (let i = 0; i < swapData.length; i++) {
        const rate = 0.01 * swapData[i].rate;
        const simple = new SimpleQuote(rate);
        const quote = simple;
        const tenor = new Period().init1(swapData[i].nIndexUnits, swapData[i].indexUnit);
        const term = new Period().init1(swapData[i].nTermUnits, swapData[i].termUnit);
        const helper = new SwapRateHelper().srhInit2(new Handle(quote), term, vars.calendar, vars.fixedSwapFrequency, vars.fixedSwapConvention, vars.fixedSwapDayCount, euribor3m);
        if (Period.equal(tenor, new Period().init1(3, TimeUnit.Months))) {
            swap3mHelpers.push(helper);
        }
    }
    const eoniaTS = new PiecewiseYieldCurve(new Discount(), new LogLinear())
        .pwycInit1(vars.today, eoniaHelpers, new Actual365Fixed());
    vars.eoniaTermStructure.linkTo(eoniaTS);
    const tolerance = 1.0e-8;
    for (let i = 0; i < eoniaSwapData.length; i++) {
        const expected = eoniaSwapData[i].rate;
        const term = new Period().init1(eoniaSwapData[i].n, eoniaSwapData[i].unit);
        const swap = vars.makeSwap(term, 0.0, 0.0, false);
        const calculated = 100.0 * swap.fairRate();
        const error = Math.abs(expected - calculated);
        expect(error).toBeLessThan(tolerance);
    }
    vars.dispose();
}

describe(`Overnight-indexed swap tests ${version}`, () => {
    it('Testing Eonia-swap calculation of fair fixed rate...', () => {
        const vars = new CommonVars();
        const lengths = [
            new Period().init1(1, TimeUnit.Years),
            new Period().init1(2, TimeUnit.Years),
            new Period().init1(5, TimeUnit.Years),
            new Period().init1(10, TimeUnit.Years),
            new Period().init1(20, TimeUnit.Years)
        ];
        const spreads = [-0.001, -0.01, 0.0, 0.01, 0.001];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < spreads.length; j++) {
                let swap = vars.makeSwap(lengths[i], 0.0, spreads[j], false);
                const swap2 = vars.makeSwap(lengths[i], 0.0, spreads[j], true);
                expect(Math.abs(swap.fairRate() - swap2.fairRate()))
                    .toBeLessThan(1.0e-10);
                swap = vars.makeSwap(lengths[i], swap.fairRate(), spreads[j], false);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
                swap = vars.makeSwap(lengths[i], swap.fairRate(), spreads[j], true);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
            }
        }
        vars.dispose();
    });

    it('Testing Eonia-swap calculation of fair floating spread...', () => {
        const vars = new CommonVars();
        const lengths = [
            new Period().init1(1, TimeUnit.Years),
            new Period().init1(2, TimeUnit.Years),
            new Period().init1(5, TimeUnit.Years),
            new Period().init1(10, TimeUnit.Years),
            new Period().init1(20, TimeUnit.Years)
        ];
        const rates = [0.04, 0.05, 0.06, 0.07];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < rates.length; j++) {
                let swap = vars.makeSwap(lengths[i], rates[j], 0.0, false);
                const swap2 = vars.makeSwap(lengths[i], rates[j], 0.0, true);
                const fairSpread = swap.fairSpread();
                const fairSpread2 = swap2.fairSpread();
                expect(Math.abs(fairSpread - fairSpread2)).toBeLessThan(1.0e-10);
                swap = vars.makeSwap(lengths[i], rates[j], fairSpread, false);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
                swap = vars.makeSwap(lengths[i], rates[j], fairSpread, true);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
            }
        }
        vars.dispose();
    });

    it('Testing Eonia-swap calculation against cached value...', () => {
        const vars = new CommonVars();
        Settings.evaluationDate.set(vars.today);
        vars.settlement =
            vars.calendar.advance1(vars.today, vars.settlementDays, TimeUnit.Days);
        const flat = 0.05;
        vars.eoniaTermStructure.linkTo(flatRate2(vars.settlement, flat, new Actual360()));
        const fixedRate = Math.exp(flat) - 1;
        const swap = vars.makeSwap(new Period().init1(1, TimeUnit.Years), fixedRate, 0.0, false);
        const swap2 = vars.makeSwap(new Period().init1(1, TimeUnit.Years), fixedRate, 0.0, true);
        const cachedNPV = 0.001730450147;
        const tolerance = 1.0e-11;
        expect(Math.abs(swap.NPV() - cachedNPV)).toBeLessThan(tolerance);
        expect(Math.abs(swap2.NPV() - cachedNPV)).toBeLessThan(tolerance);
        vars.dispose();
    });

    it('Testing Eonia-swap curve building...', () => {
        testBootstrap(false);
    });

    it('Testing Eonia-swap curve building with telescopic value dates...', () => {
        testBootstrap(true);
    });

    it('Testing seasoned Eonia-swap calculation...', () => {
        const vars = new CommonVars();
        const lengths = [
            new Period().init1(1, TimeUnit.Years),
            new Period().init1(2, TimeUnit.Years),
            new Period().init1(5, TimeUnit.Years),
            new Period().init1(10, TimeUnit.Years),
            new Period().init1(20, TimeUnit.Years)
        ];
        const spreads = [-0.001, -0.01, 0.0, 0.01, 0.001];
        const effectiveDate = DateExt.UTC('2,February,2009');
        vars.eoniaIndex.addFixing(DateExt.UTC('2,February,2009'), 0.0010);
        vars.eoniaIndex.addFixing(DateExt.UTC('3,February, 2009'), 0.0011);
        vars.eoniaIndex.addFixing(DateExt.UTC('4,February, 2009'), 0.0012);
        vars.eoniaIndex.addFixing(DateExt.UTC('5,February, 2009'), 0.0013);
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < spreads.length; j++) {
                const swap = vars.makeSwap(lengths[i], 0.0, spreads[j], false, effectiveDate);
                const swap2 = vars.makeSwap(lengths[i], 0.0, spreads[j], true, effectiveDate);
                expect(Math.abs(swap.NPV() - swap2.NPV())).toBeLessThan(1.0e-10);
            }
        }
        vars.dispose();
    });
});
