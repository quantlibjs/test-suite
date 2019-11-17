/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
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
import { Actual360, BackwardFlat, BusinessDayConvention, CreditDefaultSwap, DateExt, DateGeneration, DefaultDensity, FlatForward, FlatHazardRate, Frequency, Handle, HazardRate, Linear, LogLinear, MidPointCdsEngine, Period, PiecewiseDefaultCurve, Protection, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, SpreadCdsHelper, SurvivalProbability, TARGET, Thirty360, TimeUnit, UpfrontCdsHelper, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function testBootstrapFromSpread(T, I) {
    const calendar = new TARGET();
    const today = Settings.evaluationDate.f();
    const settlementDays = 1;
    const quote = [];
    quote.push(0.005);
    quote.push(0.006);
    quote.push(0.007);
    quote.push(0.009);
    const n = [];
    n.push(1);
    n.push(2);
    n.push(3);
    n.push(5);
    const frequency = Frequency.Quarterly;
    const convention = BusinessDayConvention.Following;
    const rule = DateGeneration.Rule.TwentiethIMM;
    const dayCounter = new Thirty360();
    const recoveryRate = 0.4;
    const discountCurve = new RelinkableHandle();
    discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
    const helpers = [];
    for (let i = 0; i < n.length; i++) {
        helpers.push(new SpreadCdsHelper().scdshInit2(quote[i], new Period().init1(n[i], TimeUnit.Years), settlementDays, calendar, frequency, convention, rule, dayCounter, recoveryRate, discountCurve));
    }
    const piecewiseCurve = new RelinkableHandle();
    piecewiseCurve.linkTo(new PiecewiseDefaultCurve(T, I).pwdcInit1(today, helpers, new Thirty360()));
    const notional = 1.0;
    const tolerance = 1.0e-6;
    const backup = new SavedSettings();
    Settings.includeTodaysCashFlows = true;
    for (let i = 0; i < n.length; i++) {
        const protectionStart = DateExt.add(today, settlementDays);
        const startDate = calendar.adjust(protectionStart, convention);
        const endDate = DateExt.advance(today, n[i], TimeUnit.Years);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(frequency), calendar, convention, BusinessDayConvention.Unadjusted, rule, false);
        const cds = new CreditDefaultSwap().init1(Protection.Side.Buyer, notional, quote[i], schedule, convention, dayCounter, true, true, protectionStart);
        cds.setPricingEngine(new MidPointCdsEngine(piecewiseCurve, recoveryRate, discountCurve));
        const inputRate = quote[i];
        const computedRate = cds.fairSpread();
        expect(Math.abs(inputRate - computedRate)).toBeLessThan(tolerance);
    }
    backup.dispose();
}

function testBootstrapFromUpfront(T, I) {
    const calendar = new TARGET();
    const today = Settings.evaluationDate.f();
    const settlementDays = 1;
    const quote = [];
    quote.push(0.01);
    quote.push(0.02);
    quote.push(0.04);
    quote.push(0.06);
    const n = [];
    n.push(2);
    n.push(3);
    n.push(5);
    n.push(7);
    const fixedRate = 0.05;
    const frequency = Frequency.Quarterly;
    const convention = BusinessDayConvention.ModifiedFollowing;
    const rule = DateGeneration.Rule.CDS;
    const dayCounter = new Actual360();
    const recoveryRate = 0.4;
    const upfrontSettlementDays = 3;
    const discountCurve = new RelinkableHandle();
    discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
    const helpers = [];
    for (let i = 0; i < n.length; i++) {
        helpers.push(new UpfrontCdsHelper().ufcdshInit2(quote[i], fixedRate, new Period().init1(n[i], TimeUnit.Years), settlementDays, calendar, frequency, convention, rule, dayCounter, recoveryRate, discountCurve, upfrontSettlementDays, true, true, null, new Actual360(true)));
    }
    const piecewiseCurve = new RelinkableHandle();
    piecewiseCurve.linkTo(new PiecewiseDefaultCurve(T, I).pwdcInit1(today, helpers, new Thirty360()));
    const notional = 1.0;
    const tolerance = 1.0e-6;
    const backup = new SavedSettings();
    Settings.includeTodaysCashFlows = true;
    for (let i = 0; i < n.length; i++) {
        const protectionStart = DateExt.add(today, settlementDays);
        const startDate = calendar.adjust(protectionStart, convention);
        const endDate = DateExt.advance(today, n[i], TimeUnit.Years);
        const upfrontDate = calendar.advance1(today, upfrontSettlementDays, TimeUnit.Days, convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(frequency), calendar, convention, BusinessDayConvention.Unadjusted, rule, false);
        const cds = new CreditDefaultSwap().init2(Protection.Side.Buyer, notional, quote[i], fixedRate, schedule, convention, dayCounter, true, true, protectionStart, upfrontDate, null, new Actual360(true), true);
        cds.setPricingEngine(new MidPointCdsEngine(piecewiseCurve, recoveryRate, discountCurve, true));
        const inputUpfront = quote[i];
        const computedUpfront = cds.fairUpfront();
        expect(Math.abs(inputUpfront - computedUpfront)).toBeLessThan(tolerance);
    }
    backup.dispose();
}

describe(`Default-probability curve tests ${version}`, () => {
    it('Testing default-probability structure...', () => {
        const hazardRate = 0.0100;
        const hazardRateQuote = new Handle(new SimpleQuote(hazardRate));
        const dayCounter = new Actual360();
        const calendar = new TARGET();
        const n = 20;
        const tolerance = 1.0e-10;
        const today = Settings.evaluationDate.f();
        let startDate = today;
        let endDate = startDate;
        const flatHazardRate = new FlatHazardRate().fhrInit1(startDate, hazardRateQuote, dayCounter);
        for (let i = 0; i < n; i++) {
            startDate = endDate;
            endDate = calendar.advance1(endDate, 1, TimeUnit.Years);
            const pStart = flatHazardRate.defaultProbability1(startDate);
            const pEnd = flatHazardRate.defaultProbability1(endDate);
            const pBetweenComputed = flatHazardRate.defaultProbability3(startDate, endDate);
            const pBetween = pEnd - pStart;
            expect(Math.abs(pBetween - pBetweenComputed)).toBeLessThan(tolerance);
            const t2 = dayCounter.yearFraction(today, endDate);
            let timeProbability = flatHazardRate.defaultProbability2(t2);
            let dateProbability = flatHazardRate.defaultProbability1(endDate);
            expect(Math.abs(timeProbability - dateProbability))
                .toBeLessThan(tolerance);
            const t1 = dayCounter.yearFraction(today, startDate);
            timeProbability = flatHazardRate.defaultProbability4(t1, t2);
            dateProbability = flatHazardRate.defaultProbability3(startDate, endDate);
            expect(Math.abs(timeProbability - dateProbability))
                .toBeLessThan(tolerance);
        }
    });

    it('Testing flat hazard rate...', () => {
        const hazardRate = 0.0100;
        const hazardRateQuote = new Handle(new SimpleQuote(hazardRate));
        const dayCounter = new Actual360();
        const calendar = new TARGET();
        const n = 20;
        const tolerance = 1.0e-10;
        const today = Settings.evaluationDate.f();
        const startDate = today;
        let endDate = startDate;
        const flatHazardRate = new FlatHazardRate().fhrInit1(today, hazardRateQuote, dayCounter);
        for (let i = 0; i < n; i++) {
            endDate = calendar.advance1(endDate, 1, TimeUnit.Years);
            const t = dayCounter.yearFraction(startDate, endDate);
            const probability = 1.0 - Math.exp(-hazardRate * t);
            const computedProbability = flatHazardRate.defaultProbability2(t);
            expect(Math.abs(probability - computedProbability))
                .toBeLessThan(tolerance);
        }
    });

    it('Testing piecewise-flat hazard-rate consistency...', () => {
        testBootstrapFromSpread(new HazardRate(), new BackwardFlat());
        testBootstrapFromUpfront(new HazardRate(), new BackwardFlat());
    });

    it('Testing piecewise-flat default-density consistency...', () => {
        testBootstrapFromSpread(new DefaultDensity(), new BackwardFlat());
        testBootstrapFromUpfront(new DefaultDensity(), new BackwardFlat());
    });

    it('Testing piecewise-linear default-density consistency...', () => {
        testBootstrapFromSpread(new DefaultDensity(), new Linear());
        testBootstrapFromUpfront(new DefaultDensity(), new Linear());
    });

    it('Testing log-linear survival-probability consistency...', () => {
        testBootstrapFromSpread(new SurvivalProbability(), new LogLinear());
        testBootstrapFromUpfront(new SurvivalProbability(), new LogLinear());
    });

    it('Testing single-instrument curve bootstrap...', () => {
        const calendar = new TARGET();
        const today = Settings.evaluationDate.f();
        const settlementDays = 0;
        const quote = 0.005;
        const tenor = new Period().init1(2, TimeUnit.Years);
        const frequency = Frequency.Quarterly;
        const convention = BusinessDayConvention.Following;
        const rule = DateGeneration.Rule.TwentiethIMM;
        const dayCounter = new Thirty360();
        const recoveryRate = 0.4;
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
        const helpers = new Array(1);
        helpers[0] = new SpreadCdsHelper().scdshInit2(quote, tenor, settlementDays, calendar, frequency, convention, rule, dayCounter, recoveryRate, discountCurve);
        const defaultCurve = new PiecewiseDefaultCurve(new HazardRate(), new BackwardFlat())
            .pwdcInit1(today, helpers, dayCounter);
        defaultCurve.recalculate();
        expect(()=>{}).not.toThrow();
    });

    it('Testing bootstrap on upfront quotes...', () => {
        const backup = new SavedSettings();
        Settings.includeTodaysCashFlows = false;
        testBootstrapFromUpfront(new HazardRate(), new BackwardFlat());
        const flag = Settings.includeTodaysCashFlows;
        expect(flag).toBeFalsy();
        backup.dispose();
    });
});