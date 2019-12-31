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
import { Actual360, Actual365Fixed, BackwardFlat, BusinessDayConvention, CreditDefaultSwap, DateExt, DateGeneration, DepositRateHelper, Discount, DiscountCurve, FlatForward, FlatHazardRate, Frequency, Handle, IborIndex, IntegralCdsEngine, InterpolatedHazardRateCurve, IsdaCdsEngine, LogLinear, MakeCreditDefaultSwap, MakeSchedule, MidPointCdsEngine, Period, PiecewiseYieldCurve, Protection, QL_NULL_REAL, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, SwapRateHelper, TARGET, Thirty360, TimeUnit, UnitedStates, USDCurrency, WeekendsOnly, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Credit-default swap tests ${version}`, () => {
    it('Testing credit-default swap against cached values...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(DateExt.UTC('9,June,2006'));
        const today = Settings.evaluationDate.f();
        const calendar = new TARGET();
        const hazardRate = new Handle(new SimpleQuote(0.01234));
        const probabilityCurve = new RelinkableHandle();
        probabilityCurve.linkTo(new FlatHazardRate().fhrInit3(0, calendar, hazardRate, new Actual360()));
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
        const issueDate = calendar.advance1(today, -1, TimeUnit.Years);
        const maturity = calendar.advance1(issueDate, 10, TimeUnit.Years);
        const frequency = Frequency.Semiannual;
        const convention = BusinessDayConvention.ModifiedFollowing;
        const schedule = new Schedule().init2(issueDate, maturity, new Period().init2(frequency), calendar, convention, convention, DateGeneration.Rule.Forward, false);
        const fixedRate = 0.0120;
        const dayCount = new Actual360();
        const notional = 10000.0;
        const recoveryRate = 0.4;
        const cds = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, fixedRate, schedule, convention, dayCount, true, true);
        cds.setPricingEngine(new MidPointCdsEngine(probabilityCurve, recoveryRate, discountCurve));
        const npv = 295.0153398;
        const fairRate = 0.007517539081;
        let calculatedNpv = cds.NPV();
        let calculatedFairRate = cds.fairSpread();
        let tolerance = 1.0e-7;
        expect(Math.abs(calculatedNpv - npv)).toBeLessThan(tolerance);
        expect(Math.abs(calculatedFairRate - fairRate)).toBeLessThan(tolerance);
        cds.setPricingEngine(new IntegralCdsEngine(new Period().init1(1, TimeUnit.Days), probabilityCurve, recoveryRate, discountCurve));
        calculatedNpv = cds.NPV();
        calculatedFairRate = cds.fairSpread();
        tolerance = 1.0e-5;
        expect(Math.abs(calculatedNpv - npv))
            .toBeLessThan(notional * tolerance * 10);
        expect(Math.abs(calculatedFairRate - fairRate)).toBeLessThan(tolerance);
        cds.setPricingEngine(new IntegralCdsEngine(new Period().init1(1, TimeUnit.Weeks), probabilityCurve, recoveryRate, discountCurve));
        calculatedNpv = cds.NPV();
        calculatedFairRate = cds.fairSpread();
        tolerance = 1.0e-5;
        expect(Math.abs(calculatedNpv - npv))
            .toBeLessThan(notional * tolerance * 10);
        expect(Math.abs(calculatedFairRate - fairRate)).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing credit-default swap against cached market values...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(DateExt.UTC('9,June,2006'));
        const evalDate = Settings.evaluationDate.f();
        const calendar = new UnitedStates();
        const discountDates = [];
        discountDates.push(evalDate);
        discountDates.push(calendar.advance1(evalDate, 1, TimeUnit.Weeks, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 1, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 2, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 3, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 6, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 12, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 2, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 3, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 4, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 5, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 6, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 7, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 8, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 9, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 10, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        discountDates.push(calendar.advance1(evalDate, 15, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        const dfs = [];
        dfs.push(1.0);
        dfs.push(0.9990151375768731);
        dfs.push(0.99570502636871183);
        dfs.push(0.99118260474528685);
        dfs.push(0.98661167950906203);
        dfs.push(0.9732592953359388);
        dfs.push(0.94724424481038083);
        dfs.push(0.89844996737120875);
        dfs.push(0.85216647839921411);
        dfs.push(0.80775477692556874);
        dfs.push(0.76517289234200347);
        dfs.push(0.72401019553182933);
        dfs.push(0.68503909569219212);
        dfs.push(0.64797499814013748);
        dfs.push(0.61263171936255534);
        dfs.push(0.5791942350748791);
        dfs.push(0.43518868769953606);
        const curveDayCounter = new Actual360();
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new DiscountCurve().curveInit1(discountDates, dfs, curveDayCounter));
        const dayCounter = new Thirty360();
        const dates = [];
        dates.push(evalDate);
        dates.push(calendar.advance1(evalDate, 6, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 1, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 2, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 3, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 4, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 5, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 7, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        dates.push(calendar.advance1(evalDate, 10, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing));
        const defaultProbabilities = [];
        defaultProbabilities.push(0.0000);
        defaultProbabilities.push(0.0047);
        defaultProbabilities.push(0.0093);
        defaultProbabilities.push(0.0286);
        defaultProbabilities.push(0.0619);
        defaultProbabilities.push(0.0953);
        defaultProbabilities.push(0.1508);
        defaultProbabilities.push(0.2288);
        defaultProbabilities.push(0.3666);
        const hazardRates = [];
        hazardRates.push(0.0);
        for (let i = 1; i < dates.length; ++i) {
            const t1 = dayCounter.yearFraction(dates[0], dates[i - 1]);
            const t2 = dayCounter.yearFraction(dates[0], dates[i]);
            const S1 = 1.0 - defaultProbabilities[i - 1];
            const S2 = 1.0 - defaultProbabilities[i];
            hazardRates.push(Math.log(S1 / S2) / (t2 - t1));
        }
        const piecewiseFlatHazardRate = new RelinkableHandle();
        piecewiseFlatHazardRate.linkTo(new InterpolatedHazardRateCurve(new BackwardFlat())
            .curveInit1(dates, hazardRates, new Thirty360()));
        const issueDate = DateExt.UTC('20,March,2006');
        const maturity = DateExt.UTC('20,June,2013');
        const cdsFrequency = Frequency.Semiannual;
        const cdsConvention = BusinessDayConvention.ModifiedFollowing;
        const schedule = new Schedule().init2(issueDate, maturity, new Period().init2(cdsFrequency), calendar, cdsConvention, cdsConvention, DateGeneration.Rule.Forward, false);
        const recoveryRate = 0.25;
        const fixedRate = 0.0224;
        const dayCount = new Actual360();
        const cdsNotional = 100.0;
        const cds = new CreditDefaultSwap().init1(Protection.Side.Seller, cdsNotional, fixedRate, schedule, cdsConvention, dayCount, true, true);
        cds.setPricingEngine(new MidPointCdsEngine(piecewiseFlatHazardRate, recoveryRate, discountCurve));
        const calculatedNpv = cds.NPV();
        const calculatedFairRate = cds.fairSpread();
        const npv = -1.364048777;
        const fairRate = 0.0248429452;
        const tolerance = 1e-9;
        expect(Math.abs(npv - calculatedNpv)).toBeLessThan(tolerance);
        expect(Math.abs(fairRate - calculatedFairRate)).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing implied hazard-rate for credit-default swaps...', () => {
        const backup = new SavedSettings();
        const calendar = new TARGET();
        const today = calendar.adjust(DateExt.UTC());
        Settings.evaluationDate.set(today);
        const h1 = 0.30, h2 = 0.40;
        const dayCounter = new Actual365Fixed();
        const dates = new Array(3);
        const hazardRates = new Array(3);
        dates[0] = today;
        hazardRates[0] = h1;
        dates[1] = DateExt.advance(today, 5, TimeUnit.Years);
        hazardRates[1] = h1;
        dates[2] = DateExt.advance(today, 10, TimeUnit.Years);
        hazardRates[2] = h2;
        const probabilityCurve = new RelinkableHandle();
        probabilityCurve.linkTo(new InterpolatedHazardRateCurve(new BackwardFlat())
            .curveInit1(dates, hazardRates, dayCounter));
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new FlatForward().ffInit2(today, 0.03, new Actual360()));
        const frequency = Frequency.Semiannual;
        const convention = BusinessDayConvention.ModifiedFollowing;
        const issueDate = calendar.advance1(today, -6, TimeUnit.Months);
        const fixedRate = 0.0120;
        const cdsDayCount = new Actual360();
        const notional = 10000.0;
        const recoveryRate = 0.4;
        let latestRate = QL_NULL_REAL;
        for (let n = 6; n <= 10; ++n) {
            const maturity = calendar.advance1(issueDate, n, TimeUnit.Years);
            const schedule = new Schedule().init2(issueDate, maturity, new Period().init2(frequency), calendar, convention, convention, DateGeneration.Rule.Forward, false);
            const cds = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, fixedRate, schedule, convention, cdsDayCount, true, true);
            cds.setPricingEngine(new MidPointCdsEngine(probabilityCurve, recoveryRate, discountCurve));
            const NPV = cds.NPV();
            const flatRate = cds.impliedHazardRate(NPV, discountCurve, dayCounter, recoveryRate);
            expect(flatRate >= h1 && flatRate <= h2).toBeTruthy();
            expect(n <= 6 || flatRate >= latestRate).toBeTruthy();
            latestRate = flatRate;
            const probability = new RelinkableHandle();
            probability.linkTo(new FlatHazardRate().fhrInit1(today, new Handle(new SimpleQuote(flatRate)), dayCounter));
            const cds2 = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, fixedRate, schedule, convention, cdsDayCount, true, true);
            cds2.setPricingEngine(new MidPointCdsEngine(probability, recoveryRate, discountCurve));
            const NPV2 = cds2.NPV();
            const tolerance = 1.0;
            expect(Math.abs(NPV - NPV2)).toBeLessThan(tolerance);
        }
        backup.dispose();
    });

    it('Testing fair-spread calculation for credit-default swaps...', () => {
        const backup = new SavedSettings();
        const calendar = new TARGET();
        const today = calendar.adjust(DateExt.UTC());
        Settings.evaluationDate.set(today);
        const hazardRate = new Handle(new SimpleQuote(0.01234));
        const probabilityCurve = new RelinkableHandle();
        probabilityCurve.linkTo(new FlatHazardRate().fhrInit3(0, calendar, hazardRate, new Actual360()));
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
        const issueDate = calendar.advance1(today, -1, TimeUnit.Years);
        const maturity = calendar.advance1(issueDate, 10, TimeUnit.Years);
        const convention = BusinessDayConvention.Following;
        const schedule = new MakeSchedule()
            .from(issueDate)
            .to(maturity)
            .withFrequency(Frequency.Quarterly)
            .withCalendar(calendar)
            .withTerminationDateConvention(convention)
            .withRule(DateGeneration.Rule.TwentiethIMM)
            .f();
        const fixedRate = 0.001;
        const dayCount = new Actual360();
        const notional = 10000.0;
        const recoveryRate = 0.4;
        const engine = new MidPointCdsEngine(probabilityCurve, recoveryRate, discountCurve);
        const cds = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, fixedRate, schedule, convention, dayCount, true, true);
        cds.setPricingEngine(engine);
        const fairRate = cds.fairSpread();
        const fairCds = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, fairRate, schedule, convention, dayCount, true, true);
        fairCds.setPricingEngine(engine);
        const fairNPV = fairCds.NPV();
        const tolerance = 1e-10;
        expect(Math.abs(fairNPV)).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing fair-upfront calculation for credit-default swaps...', () => {
        const backup = new SavedSettings();
        const calendar = new TARGET();
        const today = calendar.adjust(DateExt.UTC());
        Settings.evaluationDate.set(today);
        const hazardRate = new Handle(new SimpleQuote(0.01234));
        const probabilityCurve = new RelinkableHandle();
        probabilityCurve.linkTo(new FlatHazardRate().fhrInit3(0, calendar, hazardRate, new Actual360()));
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new FlatForward().ffInit2(today, 0.06, new Actual360()));
        const issueDate = today;
        const maturity = calendar.advance1(issueDate, 10, TimeUnit.Years);
        const convention = BusinessDayConvention.Following;
        const schedule = new MakeSchedule()
            .from(issueDate)
            .to(maturity)
            .withFrequency(Frequency.Quarterly)
            .withCalendar(calendar)
            .withTerminationDateConvention(convention)
            .withRule(DateGeneration.Rule.TwentiethIMM)
            .f();
        const fixedRate = 0.05;
        let upfront = 0.001;
        const dayCount = new Actual360();
        const notional = 10000.0;
        const recoveryRate = 0.4;
        const engine = new MidPointCdsEngine(probabilityCurve, recoveryRate, discountCurve, true);
        const cds = new CreditDefaultSwap().init2(Protection.Side.Seller, notional, upfront, fixedRate, schedule, convention, dayCount, true, true);
        cds.setPricingEngine(engine);
        let fairUpfront = cds.fairUpfront();
        const fairCds = new CreditDefaultSwap().init2(Protection.Side.Seller, notional, fairUpfront, fixedRate, schedule, convention, dayCount, true, true);
        fairCds.setPricingEngine(engine);
        let fairNPV = fairCds.NPV();
        const tolerance = 1e-10;
        expect(Math.abs(fairNPV)).toBeLessThan(tolerance);
        upfront = 0.0;
        const cds2 = new CreditDefaultSwap().init2(Protection.Side.Seller, notional, upfront, fixedRate, schedule, convention, dayCount, true, true);
        cds2.setPricingEngine(engine);
        fairUpfront = cds2.fairUpfront();
        const fairCds2 = new CreditDefaultSwap().init2(Protection.Side.Seller, notional, fairUpfront, fixedRate, schedule, convention, dayCount, true, true);
        fairCds2.setPricingEngine(engine);
        fairNPV = fairCds2.NPV();
        expect(Math.abs(fairNPV)).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing ISDA engine calculations for credit-default swaps...', () => {
        const backup = new SavedSettings();
        const tradeDate = DateExt.UTC('21,May,2009');
        Settings.evaluationDate.set(tradeDate);
        const isdaRateHelpers = [];
        const dep_tenors = [1, 2, 3, 6, 9, 12];
        const dep_quotes = [0.003081, 0.005525, 0.007163, 0.012413, 0.014, 0.015488];
        for (let i = 0; i < dep_tenors.length; i++) {
            isdaRateHelpers.push(new DepositRateHelper().drhInit2(dep_quotes[i], new Period().init1(dep_tenors[i], TimeUnit.Months), 2, new WeekendsOnly(), BusinessDayConvention.ModifiedFollowing, false, new Actual360()));
        }
        const swap_tenors = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];
        const swap_quotes = [
            0.011907, 0.01699, 0.021198, 0.02444, 0.026937, 0.028967, 0.030504,
            0.031719, 0.03279, 0.034535, 0.036217, 0.036981, 0.037246, 0.037605
        ];
        const isda_ibor = new IborIndex('IsdaIbor', new Period().init1(3, TimeUnit.Months), 2, new USDCurrency(), new WeekendsOnly(), BusinessDayConvention.ModifiedFollowing, false, new Actual360());
        for (let i = 0; i < swap_tenors.length; i++) {
            isdaRateHelpers.push(new SwapRateHelper().srhInit4(swap_quotes[i], new Period().init1(swap_tenors[i], TimeUnit.Years), new WeekendsOnly(), Frequency.Semiannual, BusinessDayConvention.ModifiedFollowing, new Thirty360(), isda_ibor));
        }
        const discountCurve = new RelinkableHandle();
        discountCurve.linkTo(new PiecewiseYieldCurve(new Discount(), new LogLinear())
            .pwycInit4(0, new WeekendsOnly(), isdaRateHelpers, new Actual365Fixed()));
        const probabilityCurve = new RelinkableHandle();
        const termDates = [
            DateExt.UTC('20,June,2010'), DateExt.UTC('20,June,2011'),
            DateExt.UTC('20,June,2012'), DateExt.UTC('20,June,2016'),
            DateExt.UTC('20,June,2019')
        ];
        const spreads = [0.001, 0.1];
        const recoveries = [0.2, 0.4];
        const markitValues = [
            97798.29358,
            97776.11889,
            -914971.5977,
            -894985.6298,
            186921.3594,
            186839.8148,
            -1646623.672,
            -1579803.626,
            274298.9203, 274122.4725, -2279730.93, -2147972.527,
            592420.2297, 591571.2294, -3993550.206, -3545843.418,
            797501.1422, 795915.9787, -4702034.688, -4042340.999
        ];
        const tolerance = 1.0e-6;
        let l = 0;
        for (let i = 0; i < termDates.length; i++) {
            for (let j = 0; j < 2; j++) {
                for (let k = 0; k < 2; k++) {
                    const quotedTrade = new MakeCreditDefaultSwap()
                        .init2(termDates[i], spreads[j])
                        .withNominal(10000000.)
                        .f();
                    const h = quotedTrade.impliedHazardRate(0., discountCurve, new Actual365Fixed(), recoveries[k], 1e-10, CreditDefaultSwap.PricingModel.ISDA);
                    probabilityCurve.linkTo(new FlatHazardRate().fhrInit4(0, new WeekendsOnly(), h, new Actual365Fixed()));
                    const engine = new IsdaCdsEngine(probabilityCurve, recoveries[k], discountCurve, null, IsdaCdsEngine.NumericalFix.Taylor, IsdaCdsEngine.AccrualBias.HalfDayBias, IsdaCdsEngine.ForwardsInCouponPeriod.Piecewise);
                    const conventionalTrade = new MakeCreditDefaultSwap()
                        .init2(termDates[i], 0.01)
                        .withNominal(10000000.)
                        .withPricingEngine(engine)
                        .f();
                    expect(Math.abs(conventionalTrade.notional() *
                        conventionalTrade.fairUpfront() -
                        markitValues[l]))
                        .toBeLessThan(tolerance);
                    l++;
                }
            }
        }
        backup.dispose();
    });
});
