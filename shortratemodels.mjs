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
import { Actual360, Actual365Fixed, BusinessDayConvention, Constraint, DateExt, DateGeneration, DiscountCurve, DiscountingSwapEngine, EndCriteria, Euribor6M, ExtendedCoxIngersollRoss, Frequency, Handle, HullWhite, IborIndex, IndexManager, JamshidianSwaptionEngine, LevenbergMarquardt, Period, SavedSettings, Schedule, Settings, SimpleQuote, SwaptionHelper, TARGET, Thirty360, TimeSeries, TimeUnit, TreeVanillaSwapEngine, VanillaSwap, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class CalibrationData {
    constructor(start, length, volatility) {
        this.start = start;
        this.length = length;
        this.volatility = volatility;
    }
}

describe(`Short-rate model tests ${version}`, () => {
    it('Testing Hull-White calibration against ' +
        'cached values using swaptions with start delay...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const today = DateExt.UTC('15,February,2002');
        const settlement = DateExt.UTC('19,February,2002');
        Settings.evaluationDate.set(today);
        const termStructure = new Handle(flatRate2(settlement, 0.04875825, new Actual365Fixed()));
        const model = new HullWhite(termStructure);
        const data = [
            new CalibrationData(1, 5, 0.1148), new CalibrationData(2, 4, 0.1108),
            new CalibrationData(3, 3, 0.1070), new CalibrationData(4, 2, 0.1021),
            new CalibrationData(5, 1, 0.1000)
        ];
        const index = new Euribor6M(termStructure);
        const engine = new JamshidianSwaptionEngine(model);
        const swaptions = [];
        for (let i = 0; i < data.length; i++) {
            const vol = new SimpleQuote(data[i].volatility);
            const helper = new SwaptionHelper().shInit1(new Period().init1(data[i].start, TimeUnit.Years), new Period().init1(data[i].length, TimeUnit.Years), new Handle(vol), index, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), termStructure);
            helper.setPricingEngine(engine);
            swaptions.push(helper);
        }
        const optimizationMethod = new LevenbergMarquardt(1.0e-8, 1.0e-8, 1.0e-8);
        const endCriteria = new EndCriteria(10000, 100, 1e-6, 1e-8, 1e-8);
        model.calibrate2(swaptions, optimizationMethod, endCriteria);
        let cachedA, cachedSigma;
        if(Settings.QL_USE_INDEXED_COUPON){
          cachedA = 0.0463679, cachedSigma = 0.00579831;
        } else {
          cachedA = 0.0464041, cachedSigma = 0.00579912;
        }
        const tolerance = 1.0e-5;
        const xMinCalculated = model.params();
        expect(Math.abs(xMinCalculated[0] - cachedA)).toBeLessThan(tolerance);
        expect(Math.abs(xMinCalculated[1] - cachedSigma)).toBeLessThan(tolerance);
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing Hull-White calibration with ' +
        'fixed reversion against cached values...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const today = DateExt.UTC('15,February,2002');
        const settlement = DateExt.UTC('19,February,2002');
        Settings.evaluationDate.set(today);
        const termStructure = new Handle(flatRate2(settlement, 0.04875825, new Actual365Fixed()));
        const model = new HullWhite(termStructure, 0.05, 0.01);
        const data = [
            new CalibrationData(1, 5, 0.1148), new CalibrationData(2, 4, 0.1108),
            new CalibrationData(3, 3, 0.1070), new CalibrationData(4, 2, 0.1021),
            new CalibrationData(5, 1, 0.1000)
        ];
        const index = new Euribor6M(termStructure);
        const engine = new JamshidianSwaptionEngine(model);
        const swaptions = [];
        for (let i = 0; i < data.length; i++) {
            const vol = new SimpleQuote(data[i].volatility);
            const helper = new SwaptionHelper().shInit1(new Period().init1(data[i].start, TimeUnit.Years), new Period().init1(data[i].length, TimeUnit.Years), new Handle(vol), index, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), termStructure);
            helper.setPricingEngine(engine);
            swaptions.push(helper);
        }
        const optimizationMethod = new LevenbergMarquardt();
        const endCriteria = new EndCriteria(1000, 500, 1E-8, 1E-8, 1E-8);
        model.calibrate1(swaptions, optimizationMethod, endCriteria, new Constraint(), [], HullWhite.FixedReversion());
        let cachedA, cachedSigma;
        if (Settings.QL_USE_INDEXED_COUPON) {
            cachedA = 0.05, cachedSigma = 0.00585835;
        }
        else {
            cachedA = 0.05, cachedSigma = 0.00585858;
        }
        const tolerance = 1.0e-5;
        const xMinCalculated = model.params();
        const xMinExpected = new Array(2);
        xMinExpected[0] = cachedA;
        xMinExpected[1] = cachedSigma;
        expect(Math.abs(xMinCalculated[0] - cachedA)).toBeLessThan(tolerance);
        expect(Math.abs(xMinCalculated[1] - cachedSigma))
            .toBeLessThan(tolerance);
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing Hull-White calibration against cached' +
        ' values using swaptions without start delay...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        const today = DateExt.UTC('15,February,2002');
        const settlement = DateExt.UTC('19,February,2002');
        Settings.evaluationDate.set(today);
        const termStructure = new Handle(flatRate2(settlement, 0.04875825, new Actual365Fixed()));
        const model = new HullWhite(termStructure);
        const data = [
            new CalibrationData(1, 5, 0.1148), new CalibrationData(2, 4, 0.1108),
            new CalibrationData(3, 3, 0.1070), new CalibrationData(4, 2, 0.1021),
            new CalibrationData(5, 1, 0.1000)
        ];
        const index = new Euribor6M(termStructure);
        const index0 = new IborIndex(index.familyName(), index.tenor(), 0, index.currency(), index.fixingCalendar(), index.businessDayConvention(), index.endOfMonth(), index.dayCounter(), termStructure);
        const engine = new JamshidianSwaptionEngine(model);
        const swaptions = [];
        for (let i = 0; i < data.length; i++) {
            const vol = new SimpleQuote(data[i].volatility);
            const helper = new SwaptionHelper().shInit1(new Period().init1(data[i].start, TimeUnit.Years), new Period().init1(data[i].length, TimeUnit.Years), new Handle(vol), index0, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), termStructure);
            helper.setPricingEngine(engine);
            swaptions.push(helper);
        }
        const optimizationMethod = new LevenbergMarquardt(1.0e-8, 1.0e-8, 1.0e-8);
        const endCriteria = new EndCriteria(10000, 100, 1e-6, 1e-8, 1e-8);
        model.calibrate1(swaptions, optimizationMethod, endCriteria);
        let cachedA, cachedSigma;
        if (Settings.QL_USE_INDEXED_COUPON) {
            cachedA = 0.0481608, cachedSigma = 0.00582493;
        }
        else {
            cachedA = 0.0482063, cachedSigma = 0.00582687;
        }
        const tolerance = 5.0e-6;
        const xMinCalculated = model.params();
        const xMinExpected = new Array(2);
        xMinExpected[0] = cachedA;
        xMinExpected[1] = cachedSigma;
        expect(Math.abs(xMinCalculated[0] - cachedA)).toBeLessThan(tolerance);
        expect(Math.abs(xMinCalculated[1] - cachedSigma))
            .toBeLessThan(tolerance);
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing Hull-White swap pricing against known values...', () => {
        const backup = new SavedSettings();
        const cleaner = new IndexHistoryCleaner();
        let today = Settings.evaluationDate.f();
        const calendar = new TARGET();
        today = calendar.adjust(today);
        Settings.evaluationDate.set(today);
        const settlement = calendar.advance1(today, 2, TimeUnit.Days);
        const dates = [
            settlement, calendar.advance1(settlement, 1, TimeUnit.Weeks),
            calendar.advance1(settlement, 1, TimeUnit.Months),
            calendar.advance1(settlement, 3, TimeUnit.Months),
            calendar.advance1(settlement, 6, TimeUnit.Months),
            calendar.advance1(settlement, 9, TimeUnit.Months),
            calendar.advance1(settlement, 1, TimeUnit.Years),
            calendar.advance1(settlement, 2, TimeUnit.Years),
            calendar.advance1(settlement, 3, TimeUnit.Years),
            calendar.advance1(settlement, 5, TimeUnit.Years),
            calendar.advance1(settlement, 10, TimeUnit.Years),
            calendar.advance1(settlement, 15, TimeUnit.Years)
        ];
        const discounts = [
            1.0, 0.999258, 0.996704, 0.990809, 0.981798, 0.972570, 0.963430, 0.929532,
            0.889267, 0.803693, 0.596903, 0.433022
        ];
        const termStructure = new Handle(new DiscountCurve().curveInit1(dates, discounts, new Actual365Fixed()));
        const model = new HullWhite(termStructure);
        const start = [-3, 0, 3];
        const length = [2, 5, 10];
        const rates = [0.02, 0.04, 0.06];
        const euribor = new Euribor6M(termStructure);
        const engine = new TreeVanillaSwapEngine().tvseInit1(model, 120);
        let tolerance;
        if (Settings.QL_USE_INDEXED_COUPON) {
            tolerance = 4.0e-3;
        }
        else {
            tolerance = 1.0e-8;
        }
        for (let i = 0; i < start.length; i++) {
            const startDate = calendar.advance1(settlement, start[i], TimeUnit.Months);
            if (startDate < today) {
                const fixingDate = calendar.advance1(startDate, -2, TimeUnit.Days);
                const pastFixings = new TimeSeries();
                pastFixings.set(fixingDate, 0.03);
                IndexManager.setHistory(euribor.name(), pastFixings);
            }
            for (let j = 0; j < length.length; j++) {
                const maturity = calendar.advance1(startDate, length[i], TimeUnit.Years);
                const fixedSchedule = new Schedule().init2(startDate, maturity, new Period().init2(Frequency.Annual), calendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, false);
                const floatSchedule = new Schedule().init2(startDate, maturity, new Period().init2(Frequency.Semiannual), calendar, BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Forward, false);
                for (let k = 0; k < rates.length; k++) {
                    const swap = new VanillaSwap(VanillaSwap.Type.Payer, 1000000.0, fixedSchedule, rates[k], new Thirty360(), floatSchedule, euribor, 0.0, new Actual360());
                    swap.setPricingEngine(new DiscountingSwapEngine(termStructure));
                    const expected = swap.NPV();
                    swap.setPricingEngine(engine);
                    const calculated = swap.NPV();
                    const error = Math.abs((expected - calculated) / expected);
                    expect(error).toBeLessThan(tolerance);
                }
            }
        }
        backup.dispose();
        cleaner.dispose();
    });

    it('Testing Hull-White futures convexity bias...', () => {
        const futureQuote = 94.0;
        const a = 0.03;
        const sigma = 0.015;
        const t = 5.0;
        const T = 5.25;
        const expectedForward = 0.0573037;
        const tolerance = 0.0000001;
        const futureImpliedRate = (100.0 - futureQuote) / 100.0;
        const calculatedForward = futureImpliedRate -
            HullWhite.convexityBias(futureQuote, t, T, sigma, a);
        const error = Math.abs(calculatedForward - expectedForward);
        expect(error).toBeLessThan(tolerance);
    });

    it('Testing zero bond pricing for extended CIR model ...', () => {
        const backup = new SavedSettings();
        const today = Settings.evaluationDate.f();
        const rate = 0.1;
        const rTS = new Handle(flatRate2(today, rate, new Actual365Fixed()));
        const now = 1.5;
        const maturity = 2.5;
        const cirModel = new ExtendedCoxIngersollRoss(rTS, rate, 1.0, 1e-4, rate);
        const expected = rTS.currentLink().discount2(maturity) /
            rTS.currentLink().discount2(now);
        const calculated = cirModel.discountBond2(now, maturity, rate);
        const tol = 1e-6;
        const diff = Math.abs(expected - calculated);
        expect(diff).toBeLessThan(tol);
        backup.dispose();
    });
});
