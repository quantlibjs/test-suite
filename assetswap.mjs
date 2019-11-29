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
import { Actual360, Actual365Fixed, ActualActual, AnalyticHaganPricer, AssetSwap, BlackIborCouponPricer, Bond, BondFunctions, BusinessDayConvention, CmsLeg, CmsRateBond, Compounding, ConstantSwaptionVolatility, DateExt, DateGeneration, DiscountingBondEngine, DiscountingSwapEngine, Euribor, FixedRateBond, FixedRateLeg, FloatingRateBond, Frequency, GFunctionFactory, Handle, IborLeg, NullCalendar, Period, RelinkableHandle, SavedSettings, Schedule, setCouponPricer, Settings, SimpleCashFlow, SimpleQuote, SwapIndex, TARGET, Thirty360, TimeUnit, ZeroCouponBond, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, IndexHistoryCleaner } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.indexCleaner = new IndexHistoryCleaner();
        const swapSettlementDays = 2;
        this.faceAmount = 100.0;
        const fixedConvention = BusinessDayConvention.Unadjusted;
        this.compounding = Compounding.Continuous;
        const fixedFrequency = Frequency.Annual;
        const floatingFrequency = Frequency.Semiannual;
        this.iborIndex =
            new Euribor(new Period().init2(floatingFrequency), this.termStructure);
        const calendar = this.iborIndex.fixingCalendar();
        this.swapIndex = new SwapIndex().siInit('EuriborSwapIsdaFixA', new Period().init1(10, TimeUnit.Years), swapSettlementDays, this.iborIndex.currency(), calendar, new Period().init2(fixedFrequency), fixedConvention, this.iborIndex.dayCounter(), this.iborIndex);
        this.spread = 0.0;
        this.nonnullspread = 0.003;
        const today = DateExt.UTC('24,April,2007');
        Settings.evaluationDate.set(today);
        this.termStructure.linkTo(flatRate2(today, 0.05, new Actual365Fixed()));
        this.pricer = new BlackIborCouponPricer();
        const swaptionVolatilityStructure = new Handle(new ConstantSwaptionVolatility().csvInit4(today, new NullCalendar(), BusinessDayConvention.Following, 0.2, new Actual365Fixed()));
        const meanReversionQuote = new Handle(new SimpleQuote(0.01));
        this.cmspricer = new AnalyticHaganPricer(swaptionVolatilityStructure, GFunctionFactory.YieldCurveModel.Standard, meanReversionQuote);
    }
}

describe(`Asset swap tests ${version}`, () => {
    it('Testing consistency between fair price and fair spread...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const bondSchedule = new Schedule().init2(DateExt.UTC('4,January,2005'), DateExt.UTC('4,January,2037'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const bond = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, bondSchedule, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        const payFixedRate = true;
        const bondPrice = 95.0;
        let isPar = true;
        const parAssetSwap = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        let swapEngine = new DiscountingSwapEngine(vars.termStructure, true, bond.settlementDate(), Settings.evaluationDate.f());
        parAssetSwap.setPricingEngine(swapEngine);
        let fairCleanPrice = parAssetSwap.fairCleanPrice();
        let fairSpread = parAssetSwap.fairSpread();
        const tolerance = 1.0e-13;
        let assetSwap2 = new AssetSwap().asInit1(payFixedRate, bond, fairCleanPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap2.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap2.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap2.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap2.fairSpread() - vars.spread))
            .toBeLessThan(tolerance);
        let assetSwap3 = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, fairSpread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap3.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap3.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap3.fairCleanPrice() - bondPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap3.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        swapEngine = new DiscountingSwapEngine(vars.termStructure, true, bond.settlementDate(), bond.settlementDate());
        parAssetSwap.setPricingEngine(swapEngine);
        expect(Math.abs(parAssetSwap.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(parAssetSwap.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        assetSwap2 = new AssetSwap().asInit1(payFixedRate, bond, fairCleanPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap2.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap2.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap2.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap2.fairSpread() - vars.spread))
            .toBeLessThan(tolerance);
        assetSwap3 = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, fairSpread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap3.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap3.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap3.fairCleanPrice() - bondPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap3.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        isPar = false;
        const mktAssetSwap = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        swapEngine = new DiscountingSwapEngine(vars.termStructure, true, bond.settlementDate(), Settings.evaluationDate.f());
        mktAssetSwap.setPricingEngine(swapEngine);
        fairCleanPrice = mktAssetSwap.fairCleanPrice();
        fairSpread = mktAssetSwap.fairSpread();
        let assetSwap4 = new AssetSwap().asInit1(payFixedRate, bond, fairCleanPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap4.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap4.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap4.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap4.fairSpread() - vars.spread))
            .toBeLessThan(tolerance);
        let assetSwap5 = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, fairSpread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap5.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap5.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap5.fairCleanPrice() - bondPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap5.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        swapEngine = new DiscountingSwapEngine(vars.termStructure, true, bond.settlementDate(), bond.settlementDate());
        mktAssetSwap.setPricingEngine(swapEngine);
        expect(Math.abs(mktAssetSwap.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(mktAssetSwap.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        assetSwap4 = new AssetSwap().asInit1(payFixedRate, bond, fairCleanPrice, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap4.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap4.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap4.fairCleanPrice() - fairCleanPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap4.fairSpread() - vars.spread))
            .toBeLessThan(tolerance);
        assetSwap5 = new AssetSwap().asInit1(payFixedRate, bond, bondPrice, vars.iborIndex, fairSpread, new Schedule(), vars.iborIndex.dayCounter(), isPar);
        assetSwap5.setPricingEngine(swapEngine);
        expect(Math.abs(assetSwap5.NPV())).toBeLessThan(tolerance);
        expect(Math.abs(assetSwap5.fairCleanPrice() - bondPrice))
            .toBeLessThan(tolerance);
        expect(Math.abs(assetSwap5.fairSpread() - fairSpread))
            .toBeLessThan(tolerance);
        vars.backup.dispose();
        vars.indexCleaner.dispose();
    });

    it('Testing implied bond value against asset-swap ' +
        'fair price with null spread...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const payFixedRate = true;
        const parAssetSwap = true;
        const inArrears = false;
        const fixedBondSchedule1 = new Schedule().init2(DateExt.UTC('4,January,2005'), DateExt.UTC('4,January,2037'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule1, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        const swapEngine = new DiscountingSwapEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondPrice1 = fixedBond1.cleanPrice1();
        const fixedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice1 = fixedBondAssetSwap1.fairCleanPrice();
        const tolerance = 1.0e-13;
        const tolerance2 = 1.0e-2;
        const error1 = Math.abs(fixedBondAssetSwapPrice1 - fixedBondPrice1);
        expect(error1).toBeLessThan(tolerance2);
        const fixedBondSchedule2 = new Schedule().init2(DateExt.UTC('5,February,2005'), DateExt.UTC('5,February,2019'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule2, [0.05], new Thirty360(Thirty360.Convention.BondBasis), BusinessDayConvention.Following, 100.0, DateExt.UTC('5,February,2005'));
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondPrice2 = fixedBond2.cleanPrice1();
        const fixedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice2 = fixedBondAssetSwap2.fairCleanPrice();
        const error2 = Math.abs(fixedBondAssetSwapPrice2 - fixedBondPrice2);
        expect(error2).toBeLessThan(tolerance2);
        const floatingBondSchedule1 = new Schedule().init2(DateExt.UTC('29,September,2003'), DateExt.UTC('29,September,2013'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule1, vars.iborIndex, new Actual360(), BusinessDayConvention.Following, fixingDays, [1], [0.0056], [], [], inArrears, 100.0, DateExt.UTC('29,September,2003'));
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondPrice1 = floatingBond1.cleanPrice1();
        const floatingBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice1 = floatingBondAssetSwap1.fairCleanPrice();
        const error3 = Math.abs(floatingBondAssetSwapPrice1 - floatingBondPrice1);
        expect(error3).toBeLessThan(tolerance2);
        const floatingBondSchedule2 = new Schedule().init2(DateExt.UTC('24,September,2004'), DateExt.UTC('24,September,2018'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule2, vars.iborIndex, new Actual360(), BusinessDayConvention.ModifiedFollowing, fixingDays, [1], [0.0025], [], [], inArrears, 100.0, DateExt.UTC('24,September,2004'));
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const currentCoupon = 0.04013 + 0.0025;
        const floatingCurrentCoupon = floatingBond2.nextCouponRate();
        const error4 = Math.abs(floatingCurrentCoupon - currentCoupon);
        expect(error4).toBeLessThan(tolerance);
        const floatingBondPrice2 = floatingBond2.cleanPrice1();
        const floatingBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice2 = floatingBondAssetSwap2.fairCleanPrice();
        const error5 = Math.abs(floatingBondAssetSwapPrice2 - floatingBondPrice2);
        expect(error5).toBeLessThan(tolerance2);
        const cmsBondSchedule1 = new Schedule().init2(DateExt.UTC('22,August,2005'), DateExt.UTC('22,August,2020'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond1 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule1, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [1.0], [0.0], [0.055], [0.025], inArrears, 100.0, DateExt.UTC('22,August,2005'));
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondPrice1 = cmsBond1.cleanPrice1();
        const cmsBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice1 = cmsBondAssetSwap1.fairCleanPrice();
        const error6 = Math.abs(cmsBondAssetSwapPrice1 - cmsBondPrice1);
        expect(error6).toBeLessThan(tolerance2);
        const cmsBondSchedule2 = new Schedule().init2(DateExt.UTC('06,May,2005'), DateExt.UTC('06,May,2015'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond2 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule2, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [0.84], [0.0], [], [], inArrears, 100.0, DateExt.UTC('06,May,2005'));
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondPrice2 = cmsBond2.cleanPrice1();
        const cmsBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice2 = cmsBondAssetSwap2.fairCleanPrice();
        const error7 = Math.abs(cmsBondAssetSwapPrice2 - cmsBondPrice2);
        expect(error7).toBeLessThan(tolerance2);
        const zeroCpnBond1 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('20,December,2015'), BusinessDayConvention.Following, 100.0, DateExt.UTC('19,December,1985'));
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondPrice1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnAssetSwap1.setPricingEngine(swapEngine);
        const error8 = Math.abs(cmsBondAssetSwapPrice1 - cmsBondPrice1);
        expect(error8).toBeLessThan(tolerance2);
        const zeroCpnBond2 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('17,February,2028'), BusinessDayConvention.Following, 100.0, DateExt.UTC('17,February,1998'));
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondPrice2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnAssetSwap2.setPricingEngine(swapEngine);
        const error9 = Math.abs(cmsBondAssetSwapPrice2 - cmsBondPrice2);
        expect(error9).toBeLessThan(tolerance2);
    });

    it('Testing relationship between market asset swap and par asset swap...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const payFixedRate = true;
        const parAssetSwap = true;
        const mktAssetSwap = false;
        const inArrears = false;
        const fixedBondSchedule1 = new Schedule().init2(DateExt.UTC('4,January,2005'), DateExt.UTC('4,January,2037'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule1, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        const swapEngine = new DiscountingSwapEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondMktPrice1 = 89.22;
        const fixedBondMktFullPrice1 = fixedBondMktPrice1 + fixedBond1.accruedAmount();
        const fixedBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondParAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondParAssetSwapSpread1 = fixedBondParAssetSwap1.fairSpread();
        const fixedBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        fixedBondMktAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondMktAssetSwapSpread1 = fixedBondMktAssetSwap1.fairSpread();
        const tolerance2 = 1.0e-4;
        const error1 = Math.abs(fixedBondMktAssetSwapSpread1 -
            100 * fixedBondParAssetSwapSpread1 / fixedBondMktFullPrice1);
        expect(error1).toBeLessThan(tolerance2);
        const fixedBondSchedule2 = new Schedule().init2(DateExt.UTC('5,February,2005'), DateExt.UTC('5,February,2019'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule2, [0.05], new Thirty360(Thirty360.Convention.BondBasis), BusinessDayConvention.Following, 100.0, DateExt.UTC('5,February,2005'));
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondMktPrice2 = 99.98;
        const fixedBondMktFullPrice2 = fixedBondMktPrice2 + fixedBond2.accruedAmount();
        const fixedBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondParAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondParAssetSwapSpread2 = fixedBondParAssetSwap2.fairSpread();
        const fixedBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        fixedBondMktAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondMktAssetSwapSpread2 = fixedBondMktAssetSwap2.fairSpread();
        const error2 = Math.abs(fixedBondMktAssetSwapSpread2 -
            100 * fixedBondParAssetSwapSpread2 / fixedBondMktFullPrice2);
        expect(error2).toBeLessThan(tolerance2);
        const floatingBondSchedule1 = new Schedule().init2(DateExt.UTC('29,September,2003'), DateExt.UTC('29,September,2013'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule1, vars.iborIndex, new Actual360(), BusinessDayConvention.Following, fixingDays, [1], [0.0056], [], [], inArrears, 100.0, DateExt.UTC('29,September,2003'));
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondMktPrice1 = 101.64;
        const floatingBondMktFullPrice1 = floatingBondMktPrice1 + floatingBond1.accruedAmount();
        const floatingBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondParAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondParAssetSwapSpread1 = floatingBondParAssetSwap1.fairSpread();
        const floatingBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        floatingBondMktAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondMktAssetSwapSpread1 = floatingBondMktAssetSwap1.fairSpread();
        const error3 = Math.abs(floatingBondMktAssetSwapSpread1 -
            100 * floatingBondParAssetSwapSpread1 / floatingBondMktFullPrice1);
        expect(error3).toBeLessThan(tolerance2);
        const floatingBondSchedule2 = new Schedule().init2(DateExt.UTC('24,September,2004'), DateExt.UTC('24,September,2018'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule2, vars.iborIndex, new Actual360(), BusinessDayConvention.ModifiedFollowing, fixingDays, [1], [0.0025], [], [], inArrears, 100.0, DateExt.UTC('24,September,2004'));
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const floatingBondMktPrice2 = 101.248;
        const floatingBondMktFullPrice2 = floatingBondMktPrice2 + floatingBond2.accruedAmount();
        const floatingBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondParAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondParAssetSwapSpread2 = floatingBondParAssetSwap2.fairSpread();
        const floatingBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        floatingBondMktAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondMktAssetSwapSpread2 = floatingBondMktAssetSwap2.fairSpread();
        const error4 = Math.abs(floatingBondMktAssetSwapSpread2 -
            100 * floatingBondParAssetSwapSpread2 / floatingBondMktFullPrice2);
        expect(error4).toBeLessThan(tolerance2);
        const cmsBondSchedule1 = new Schedule().init2(DateExt.UTC('22,August,2005'), DateExt.UTC('22,August,2020'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond1 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule1, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [1.0], [0.0], [0.055], [0.025], inArrears, 100.0, DateExt.UTC('22,August,2005'));
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondMktPrice1 = 88.45;
        const cmsBondMktFullPrice1 = cmsBondMktPrice1 + cmsBond1.accruedAmount();
        const cmsBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondParAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondParAssetSwapSpread1 = cmsBondParAssetSwap1.fairSpread();
        const cmsBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        cmsBondMktAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondMktAssetSwapSpread1 = cmsBondMktAssetSwap1.fairSpread();
        const error5 = Math.abs(cmsBondMktAssetSwapSpread1 -
            100 * cmsBondParAssetSwapSpread1 / cmsBondMktFullPrice1);
        expect(error5).toBeLessThan(tolerance2);
        const cmsBondSchedule2 = new Schedule().init2(DateExt.UTC('06,May,2005'), DateExt.UTC('06,May,2015'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond2 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule2, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [0.84], [0.0], [], [], inArrears, 100.0, DateExt.UTC('06,May,2005'));
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondMktPrice2 = 94.08;
        const cmsBondMktFullPrice2 = cmsBondMktPrice2 + cmsBond2.accruedAmount();
        const cmsBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondParAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondParAssetSwapSpread2 = cmsBondParAssetSwap2.fairSpread();
        const cmsBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        cmsBondMktAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondMktAssetSwapSpread2 = cmsBondMktAssetSwap2.fairSpread();
        const error6 = Math.abs(cmsBondMktAssetSwapSpread2 -
            100 * cmsBondParAssetSwapSpread2 / cmsBondMktFullPrice2);
        expect(error6).toBeLessThan(tolerance2);
        const zeroCpnBond1 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('20,December,2015'), BusinessDayConvention.Following, 100.0, DateExt.UTC('19,December,1985'));
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondMktPrice1 = 70.436;
        const zeroCpnBondMktFullPrice1 = zeroCpnBondMktPrice1 + zeroCpnBond1.accruedAmount();
        const zeroCpnBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondParAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondParAssetSwapSpread1 = zeroCpnBondParAssetSwap1.fairSpread();
        const zeroCpnBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        zeroCpnBondMktAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondMktAssetSwapSpread1 = zeroCpnBondMktAssetSwap1.fairSpread();
        const error7 = Math.abs(zeroCpnBondMktAssetSwapSpread1 -
            100 * zeroCpnBondParAssetSwapSpread1 / zeroCpnBondMktFullPrice1);
        expect(error7).toBeLessThan(tolerance2);
        const zeroCpnBond2 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('17,February,2028'), BusinessDayConvention.Following, 100.0, DateExt.UTC('17,February,1998'));
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondMktPrice2 = 35.160;
        const zeroCpnBondMktFullPrice2 = zeroCpnBondMktPrice2 + zeroCpnBond2.accruedAmount();
        const zeroCpnBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondParAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondParAssetSwapSpread2 = zeroCpnBondParAssetSwap2.fairSpread();
        const zeroCpnBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        zeroCpnBondMktAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondMktAssetSwapSpread2 = zeroCpnBondMktAssetSwap2.fairSpread();
        const error8 = Math.abs(zeroCpnBondMktAssetSwapSpread2 -
            100 * zeroCpnBondParAssetSwapSpread2 / zeroCpnBondMktFullPrice2);
        expect(error8).toBeLessThan(tolerance2);
    });

    it('Testing clean and dirty price with null Z-spread' +
        ' against theoretical prices...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const inArrears = false;
        const fixedBondSchedule1 = new Schedule().init2(DateExt.UTC('4,January,2005'), DateExt.UTC('4,January,2037'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule1, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondImpliedValue1 = fixedBond1.cleanPrice1();
        const fixedBondSettlementDate1 = fixedBond1.settlementDate();
        const fixedBondCleanPrice1 = BondFunctions.cleanPrice4(fixedBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, fixedBondSettlementDate1);
        const tolerance = 1.0e-13;
        const error1 = Math.abs(fixedBondImpliedValue1 - fixedBondCleanPrice1);
        expect(error1).toBeLessThan(tolerance);
        const fixedBondSchedule2 = new Schedule().init2(DateExt.UTC('5,February,2005'), DateExt.UTC('5,February,2019'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule2, [0.05], new Thirty360(Thirty360.Convention.BondBasis), BusinessDayConvention.Following, 100.0, DateExt.UTC('5,February,2005'));
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondImpliedValue2 = fixedBond2.cleanPrice1();
        const fixedBondSettlementDate2 = fixedBond2.settlementDate();
        const fixedBondCleanPrice2 = BondFunctions.cleanPrice4(fixedBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, fixedBondSettlementDate2);
        const error3 = Math.abs(fixedBondImpliedValue2 - fixedBondCleanPrice2);
        expect(error3).toBeLessThan(tolerance);
        const floatingBondSchedule1 = new Schedule().init2(DateExt.UTC('29,September,2003'), DateExt.UTC('29,September,2013'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule1, vars.iborIndex, new Actual360(), BusinessDayConvention.Following, fixingDays, [1], [0.0056], [], [], inArrears, 100.0, DateExt.UTC('29,September,2003'));
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondImpliedValue1 = floatingBond1.cleanPrice1();
        const floatingBondCleanPrice1 = BondFunctions.cleanPrice4(floatingBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Semiannual, fixedBondSettlementDate1);
        const error5 = Math.abs(floatingBondImpliedValue1 - floatingBondCleanPrice1);
        expect(error5).toBeLessThan(tolerance);
        const floatingBondSchedule2 = new Schedule().init2(DateExt.UTC('24,September,2004'), DateExt.UTC('24,September,2018'), new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule2, vars.iborIndex, new Actual360(), BusinessDayConvention.ModifiedFollowing, fixingDays, [1], [0.0025], [], [], inArrears, 100.0, DateExt.UTC('24,September,2004'));
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22-March-2007'), 0.04013);
        const floatingBondImpliedValue2 = floatingBond2.cleanPrice1();
        const floatingBondCleanPrice2 = BondFunctions.cleanPrice4(floatingBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Semiannual, fixedBondSettlementDate1);
        const error7 = Math.abs(floatingBondImpliedValue2 - floatingBondCleanPrice2);
        expect(error7).toBeLessThan(tolerance);
        const cmsBondSchedule1 = new Schedule().init2(DateExt.UTC('22,August,2005'), DateExt.UTC('22,August,2020'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond1 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule1, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [1.0], [0.0], [0.055], [0.025], inArrears, 100.0, DateExt.UTC('22,August,2005'));
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondImpliedValue1 = cmsBond1.cleanPrice1();
        const cmsBondSettlementDate1 = cmsBond1.settlementDate();
        const cmsBondCleanPrice1 = BondFunctions.cleanPrice4(cmsBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, cmsBondSettlementDate1);
        const error9 = Math.abs(cmsBondImpliedValue1 - cmsBondCleanPrice1);
        expect(error9).toBeLessThan(tolerance);
        const cmsBondSchedule2 = new Schedule().init2(DateExt.UTC('06,May,2005'), DateExt.UTC('06,May,2015'), new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBond2 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule2, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [0.84], [0.0], [], [], inArrears, 100.0, DateExt.UTC('06,May,2005'));
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondImpliedValue2 = cmsBond2.cleanPrice1();
        const cmsBondSettlementDate2 = cmsBond2.settlementDate();
        const cmsBondCleanPrice2 = BondFunctions.cleanPrice4(cmsBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, cmsBondSettlementDate2);
        const error11 = Math.abs(cmsBondImpliedValue2 - cmsBondCleanPrice2);
        expect(error11).toBeLessThan(tolerance);
        const zeroCpnBond1 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('20,December,2015'), BusinessDayConvention.Following, 100.0, DateExt.UTC('19,December,1985'));
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondImpliedValue1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnBondSettlementDate1 = zeroCpnBond1.settlementDate();
        const zeroCpnBondCleanPrice1 = BondFunctions.cleanPrice4(zeroCpnBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, zeroCpnBondSettlementDate1);
        const error13 = Math.abs(zeroCpnBondImpliedValue1 - zeroCpnBondCleanPrice1);
        expect(error13).toBeLessThan(tolerance);
        const zeroCpnBond2 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('17,February,2028'), BusinessDayConvention.Following, 100.0, DateExt.UTC('17,February,1998'));
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondImpliedValue2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnBondSettlementDate2 = zeroCpnBond2.settlementDate();
        const zeroCpnBondCleanPrice2 = BondFunctions.cleanPrice4(zeroCpnBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, zeroCpnBondSettlementDate2);
        const error15 = Math.abs(zeroCpnBondImpliedValue2 - zeroCpnBondCleanPrice2);
        expect(error15).toBeLessThan(tolerance);
    });

    it('Testing implied generic-bond value against asset-swap' +
        ' fair price with null spread...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const payFixedRate = true;
        const parAssetSwap = true;
        const inArrears = false;
        const fixedBondStartDate1 = DateExt.UTC('4,January,2005');
        const fixedBondMaturityDate1 = DateExt.UTC('4,January,2037');
        const fixedBondSchedule1 = new Schedule().init2(fixedBondStartDate1, fixedBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg1 = new FixedRateLeg(fixedBondSchedule1)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.04, new ActualActual(ActualActual.Convention.ISDA))
            .f();
        const fixedbondRedemption1 = bondCalendar.adjust(fixedBondMaturityDate1, BusinessDayConvention.Following);
        fixedBondLeg1.push(new SimpleCashFlow(100.0, fixedbondRedemption1));
        const fixedBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate1, fixedBondStartDate1, fixedBondLeg1);
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        const swapEngine = new DiscountingSwapEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondPrice1 = fixedBond1.cleanPrice1();
        const fixedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice1 = fixedBondAssetSwap1.fairCleanPrice();
        const tolerance = 1.0e-13;
        const tolerance2 = 1.0e-2;
        const error1 = Math.abs(fixedBondAssetSwapPrice1 - fixedBondPrice1);
        expect(error1).toBeLessThan(tolerance2);
        const fixedBondStartDate2 = DateExt.UTC('5,February,2005');
        const fixedBondMaturityDate2 = DateExt.UTC('5,February,2019');
        const fixedBondSchedule2 = new Schedule().init2(fixedBondStartDate2, fixedBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg2 = new FixedRateLeg(fixedBondSchedule2)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.05, new Thirty360(Thirty360.Convention.BondBasis))
            .f();
        const fixedbondRedemption2 = bondCalendar.adjust(fixedBondMaturityDate2, BusinessDayConvention.Following);
        fixedBondLeg2.push(new SimpleCashFlow(100.0, fixedbondRedemption2));
        const fixedBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate2, fixedBondStartDate2, fixedBondLeg2);
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondPrice2 = fixedBond2.cleanPrice1();
        const fixedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice2 = fixedBondAssetSwap2.fairCleanPrice();
        const error2 = Math.abs(fixedBondAssetSwapPrice2 - fixedBondPrice2);
        expect(error2).toBeLessThan(tolerance2);
        const floatingBondStartDate1 = DateExt.UTC('29,September,2003');
        const floatingBondMaturityDate1 = DateExt.UTC('29,September,2013');
        const floatingBondSchedule1 = new Schedule().init2(floatingBondStartDate1, floatingBondMaturityDate1, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBondLeg1 = new IborLeg(floatingBondSchedule1, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0056)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption1 = bondCalendar.adjust(floatingBondMaturityDate1, BusinessDayConvention.Following);
        floatingBondLeg1.push(new SimpleCashFlow(100.0, floatingbondRedemption1));
        const floatingBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate1, floatingBondStartDate1, floatingBondLeg1);
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondPrice1 = floatingBond1.cleanPrice1();
        const floatingBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice1 = floatingBondAssetSwap1.fairCleanPrice();
        const error3 = Math.abs(floatingBondAssetSwapPrice1 - floatingBondPrice1);
        expect(error3).toBeLessThan(tolerance2);
        const floatingBondStartDate2 = DateExt.UTC('24,September,2004');
        const floatingBondMaturityDate2 = DateExt.UTC('24,September,2018');
        const floatingBondSchedule2 = new Schedule().init2(floatingBondStartDate2, floatingBondMaturityDate2, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBondLeg2 = new IborLeg(floatingBondSchedule2, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withPaymentAdjustment(BusinessDayConvention.ModifiedFollowing)
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0025)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption2 = bondCalendar.adjust(floatingBondMaturityDate2, BusinessDayConvention.ModifiedFollowing);
        floatingBondLeg2.push(new SimpleCashFlow(100.0, floatingbondRedemption2));
        const floatingBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate2, floatingBondStartDate2, floatingBondLeg2);
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const currentCoupon = 0.04013 + 0.0025;
        const floatingCurrentCoupon = floatingBond2.nextCouponRate();
        const error4 = Math.abs(floatingCurrentCoupon - currentCoupon);
        expect(error4).toBeLessThan(tolerance);
        const floatingBondPrice2 = floatingBond2.cleanPrice1();
        const floatingBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice2 = floatingBondAssetSwap2.fairCleanPrice();
        const error5 = Math.abs(floatingBondAssetSwapPrice2 - floatingBondPrice2);
        expect(error5).toBeLessThan(tolerance2);
        const cmsBondStartDate1 = DateExt.UTC('22,August,2005');
        const cmsBondMaturityDate1 = DateExt.UTC('22,August,2020');
        const cmsBondSchedule1 = new Schedule().init2(cmsBondStartDate1, cmsBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg1 = new CmsLeg(cmsBondSchedule1, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withCaps1(0.055)
            .withFloors1(0.025)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption1 = bondCalendar.adjust(cmsBondMaturityDate1, BusinessDayConvention.Following);
        cmsBondLeg1.push(new SimpleCashFlow(100.0, cmsbondRedemption1));
        const cmsBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate1, cmsBondStartDate1, cmsBondLeg1);
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondPrice1 = cmsBond1.cleanPrice1();
        const cmsBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice1 = cmsBondAssetSwap1.fairCleanPrice();
        const error6 = Math.abs(cmsBondAssetSwapPrice1 - cmsBondPrice1);
        expect(error6).toBeLessThan(tolerance2);
        const cmsBondStartDate2 = DateExt.UTC('06,May,2005');
        const cmsBondMaturityDate2 = DateExt.UTC('06,May,2015');
        const cmsBondSchedule2 = new Schedule().init2(cmsBondStartDate2, cmsBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg2 = new CmsLeg(cmsBondSchedule2, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withGearings1(0.84)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption2 = bondCalendar.adjust(cmsBondMaturityDate2, BusinessDayConvention.Following);
        cmsBondLeg2.push(new SimpleCashFlow(100.0, cmsbondRedemption2));
        const cmsBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate2, cmsBondStartDate2, cmsBondLeg2);
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondPrice2 = cmsBond2.cleanPrice1();
        const cmsBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice2 = cmsBondAssetSwap2.fairCleanPrice();
        const error7 = Math.abs(cmsBondAssetSwapPrice2 - cmsBondPrice2);
        expect(error7).toBeLessThan(tolerance2);
        const zeroCpnBondStartDate1 = DateExt.UTC('19,December,1985');
        const zeroCpnBondMaturityDate1 = DateExt.UTC('20,December,2015');
        const zeroCpnBondRedemption1 = bondCalendar.adjust(zeroCpnBondMaturityDate1, BusinessDayConvention.Following);
        const zeroCpnBondLeg1 = [new SimpleCashFlow(100.0, zeroCpnBondRedemption1)];
        const zeroCpnBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate1, zeroCpnBondStartDate1, zeroCpnBondLeg1);
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondPrice1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondAssetSwapPrice1 = zeroCpnAssetSwap1.fairCleanPrice();
        const error8 = Math.abs(zeroCpnBondAssetSwapPrice1 - zeroCpnBondPrice1);
        expect(error8).toBeLessThan(tolerance2);
        const zeroCpnBondStartDate2 = DateExt.UTC('17,February,1998');
        const zeroCpnBondMaturityDate2 = DateExt.UTC('17,February,2028');
        const zerocpbondRedemption2 = bondCalendar.adjust(zeroCpnBondMaturityDate2, BusinessDayConvention.Following);
        const zeroCpnBondLeg2 = [new SimpleCashFlow(100.0, zerocpbondRedemption2)];
        const zeroCpnBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate2, zeroCpnBondStartDate2, zeroCpnBondLeg2);
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondPrice2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondAssetSwapPrice2 = zeroCpnAssetSwap2.fairCleanPrice();
        const error9 = Math.abs(zeroCpnBondAssetSwapPrice2 - zeroCpnBondPrice2);
        expect(error9).toBeLessThan(tolerance2);
    });

    it('Testing market asset swap against par asset swap with generic bond...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const payFixedRate = true;
        const parAssetSwap = true;
        const mktAssetSwap = false;
        const inArrears = false;
        const fixedBondStartDate1 = DateExt.UTC('4,January,2005');
        const fixedBondMaturityDate1 = DateExt.UTC('4,January,2037');
        const fixedBondSchedule1 = new Schedule().init2(fixedBondStartDate1, fixedBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg1 = new FixedRateLeg(fixedBondSchedule1)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.04, new ActualActual(ActualActual.Convention.ISDA))
            .f();
        const fixedbondRedemption1 = bondCalendar.adjust(fixedBondMaturityDate1, BusinessDayConvention.Following);
        fixedBondLeg1.push(new SimpleCashFlow(100.0, fixedbondRedemption1));
        const fixedBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate1, fixedBondStartDate1, fixedBondLeg1);
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        const swapEngine = new DiscountingSwapEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondMktPrice1 = 89.22;
        const fixedBondMktFullPrice1 = fixedBondMktPrice1 + fixedBond1.accruedAmount();
        const fixedBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondParAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondParAssetSwapSpread1 = fixedBondParAssetSwap1.fairSpread();
        const fixedBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        fixedBondMktAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondMktAssetSwapSpread1 = fixedBondMktAssetSwap1.fairSpread();
        const tolerance2 = 1.0e-4;
        const error1 = Math.abs(fixedBondMktAssetSwapSpread1 -
            100 * fixedBondParAssetSwapSpread1 / fixedBondMktFullPrice1);
        expect(error1).toBeLessThan(tolerance2);
        const fixedBondStartDate2 = DateExt.UTC('5,February,2005');
        const fixedBondMaturityDate2 = DateExt.UTC('5,February,2019');
        const fixedBondSchedule2 = new Schedule().init2(fixedBondStartDate2, fixedBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg2 = new FixedRateLeg(fixedBondSchedule2)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.05, new Thirty360(Thirty360.Convention.BondBasis))
            .f();
        const fixedbondRedemption2 = bondCalendar.adjust(fixedBondMaturityDate2, BusinessDayConvention.Following);
        fixedBondLeg2.push(new SimpleCashFlow(100.0, fixedbondRedemption2));
        const fixedBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate2, fixedBondStartDate2, fixedBondLeg2);
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondMktPrice2 = 99.98;
        const fixedBondMktFullPrice2 = fixedBondMktPrice2 + fixedBond2.accruedAmount();
        const fixedBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondParAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondParAssetSwapSpread2 = fixedBondParAssetSwap2.fairSpread();
        const fixedBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        fixedBondMktAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondMktAssetSwapSpread2 = fixedBondMktAssetSwap2.fairSpread();
        const error2 = Math.abs(fixedBondMktAssetSwapSpread2 -
            100 * fixedBondParAssetSwapSpread2 / fixedBondMktFullPrice2);
        expect(error2).toBeLessThan(tolerance2);
        const floatingBondStartDate1 = DateExt.UTC('29,September,2003');
        const floatingBondMaturityDate1 = DateExt.UTC('29,September,2013');
        const floatingBondSchedule1 = new Schedule().init2(floatingBondStartDate1, floatingBondMaturityDate1, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBondLeg1 = new IborLeg(floatingBondSchedule1, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0056)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption1 = bondCalendar.adjust(floatingBondMaturityDate1, BusinessDayConvention.Following);
        floatingBondLeg1.push(new SimpleCashFlow(100.0, floatingbondRedemption1));
        const floatingBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate1, floatingBondStartDate1, floatingBondLeg1);
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondMktPrice1 = 101.64;
        const floatingBondMktFullPrice1 = floatingBondMktPrice1 + floatingBond1.accruedAmount();
        const floatingBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondParAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondParAssetSwapSpread1 = floatingBondParAssetSwap1.fairSpread();
        const floatingBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        floatingBondMktAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondMktAssetSwapSpread1 = floatingBondMktAssetSwap1.fairSpread();
        const error3 = Math.abs(floatingBondMktAssetSwapSpread1 -
            100 * floatingBondParAssetSwapSpread1 / floatingBondMktFullPrice1);
        expect(error3).toBeLessThan(tolerance2);
        const floatingBondStartDate2 = DateExt.UTC('24,September,2004');
        const floatingBondMaturityDate2 = DateExt.UTC('24,September,2018');
        const floatingBondSchedule2 = new Schedule().init2(floatingBondStartDate2, floatingBondMaturityDate2, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBondLeg2 = new IborLeg(floatingBondSchedule2, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withPaymentAdjustment(BusinessDayConvention.ModifiedFollowing)
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0025)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption2 = bondCalendar.adjust(floatingBondMaturityDate2, BusinessDayConvention.ModifiedFollowing);
        floatingBondLeg2.push(new SimpleCashFlow(100.0, floatingbondRedemption2));
        const floatingBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate2, floatingBondStartDate2, floatingBondLeg2);
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const floatingBondMktPrice2 = 101.248;
        const floatingBondMktFullPrice2 = floatingBondMktPrice2 + floatingBond2.accruedAmount();
        const floatingBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondParAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondParAssetSwapSpread2 = floatingBondParAssetSwap2.fairSpread();
        const floatingBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        floatingBondMktAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondMktAssetSwapSpread2 = floatingBondMktAssetSwap2.fairSpread();
        const error4 = Math.abs(floatingBondMktAssetSwapSpread2 -
            100 * floatingBondParAssetSwapSpread2 / floatingBondMktFullPrice2);
        expect(error4).toBeLessThan(tolerance2);
        const cmsBondStartDate1 = DateExt.UTC('22,August,2005');
        const cmsBondMaturityDate1 = DateExt.UTC('22,August,2020');
        const cmsBondSchedule1 = new Schedule().init2(cmsBondStartDate1, cmsBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg1 = new CmsLeg(cmsBondSchedule1, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withCaps1(0.055)
            .withFloors1(0.025)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption1 = bondCalendar.adjust(cmsBondMaturityDate1, BusinessDayConvention.Following);
        cmsBondLeg1.push(new SimpleCashFlow(100.0, cmsbondRedemption1));
        const cmsBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate1, cmsBondStartDate1, cmsBondLeg1);
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondMktPrice1 = 88.45;
        const cmsBondMktFullPrice1 = cmsBondMktPrice1 + cmsBond1.accruedAmount();
        const cmsBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondParAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondParAssetSwapSpread1 = cmsBondParAssetSwap1.fairSpread();
        const cmsBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        cmsBondMktAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondMktAssetSwapSpread1 = cmsBondMktAssetSwap1.fairSpread();
        const error5 = Math.abs(cmsBondMktAssetSwapSpread1 -
            100 * cmsBondParAssetSwapSpread1 / cmsBondMktFullPrice1);
        expect(error5).toBeLessThan(tolerance2);
        const cmsBondStartDate2 = DateExt.UTC('06,May,2005');
        const cmsBondMaturityDate2 = DateExt.UTC('06,May,2015');
        const cmsBondSchedule2 = new Schedule().init2(cmsBondStartDate2, cmsBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg2 = new CmsLeg(cmsBondSchedule2, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withGearings1(0.84)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption2 = bondCalendar.adjust(cmsBondMaturityDate2, BusinessDayConvention.Following);
        cmsBondLeg2.push(new SimpleCashFlow(100.0, cmsbondRedemption2));
        const cmsBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate2, cmsBondStartDate2, cmsBondLeg2);
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondMktPrice2 = 94.08;
        const cmsBondMktFullPrice2 = cmsBondMktPrice2 + cmsBond2.accruedAmount();
        const cmsBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondParAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondParAssetSwapSpread2 = cmsBondParAssetSwap2.fairSpread();
        const cmsBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        cmsBondMktAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondMktAssetSwapSpread2 = cmsBondMktAssetSwap2.fairSpread();
        const error6 = Math.abs(cmsBondMktAssetSwapSpread2 -
            100 * cmsBondParAssetSwapSpread2 / cmsBondMktFullPrice2);
        expect(error6).toBeLessThan(tolerance2);
        const zeroCpnBondStartDate1 = DateExt.UTC('19,December,1985');
        const zeroCpnBondMaturityDate1 = DateExt.UTC('20,December,2015');
        const zeroCpnBondRedemption1 = bondCalendar.adjust(zeroCpnBondMaturityDate1, BusinessDayConvention.Following);
        const zeroCpnBondLeg1 = [new SimpleCashFlow(100.0, zeroCpnBondRedemption1)];
        const zeroCpnBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate1, zeroCpnBondStartDate1, zeroCpnBondLeg1);
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondMktPrice1 = 70.436;
        const zeroCpnBondMktFullPrice1 = zeroCpnBondMktPrice1 + zeroCpnBond1.accruedAmount();
        const zeroCpnBondParAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondParAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondParAssetSwapSpread1 = zeroCpnBondParAssetSwap1.fairSpread();
        const zeroCpnBondMktAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        zeroCpnBondMktAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondMktAssetSwapSpread1 = zeroCpnBondMktAssetSwap1.fairSpread();
        const error7 = Math.abs(zeroCpnBondMktAssetSwapSpread1 -
            100 * zeroCpnBondParAssetSwapSpread1 / zeroCpnBondMktFullPrice1);
        expect(error7).toBeLessThan(tolerance2);
        const zeroCpnBondStartDate2 = DateExt.UTC('17,February,1998');
        const zeroCpnBondMaturityDate2 = DateExt.UTC('17,February,2028');
        const zerocpbondRedemption2 = bondCalendar.adjust(zeroCpnBondMaturityDate2, BusinessDayConvention.Following);
        const zeroCpnBondLeg2 = [new SimpleCashFlow(100.0, zerocpbondRedemption2)];
        const zeroCpnBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate2, zeroCpnBondStartDate2, zeroCpnBondLeg2);
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondMktPrice2 = 35.160;
        const zeroCpnBondMktFullPrice2 = zeroCpnBondMktPrice2 + zeroCpnBond2.accruedAmount();
        const zeroCpnBondParAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondParAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondParAssetSwapSpread2 = zeroCpnBondParAssetSwap2.fairSpread();
        const zeroCpnBondMktAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), mktAssetSwap);
        zeroCpnBondMktAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondMktAssetSwapSpread2 = zeroCpnBondMktAssetSwap2.fairSpread();
        const error8 = Math.abs(zeroCpnBondMktAssetSwapSpread2 -
            100 * zeroCpnBondParAssetSwapSpread2 / zeroCpnBondMktFullPrice2);
        expect(error8).toBeLessThan(tolerance2);
    });

    it('Testing clean and dirty price with null Z-spread' +
        ' against theoretical prices...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const inArrears = false;
        const fixedBondStartDate1 = DateExt.UTC('4,January,2005');
        const fixedBondMaturityDate1 = DateExt.UTC('4,January,2037');
        const fixedBondSchedule1 = new Schedule().init2(fixedBondStartDate1, fixedBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg1 = new FixedRateLeg(fixedBondSchedule1)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.04, new ActualActual(ActualActual.Convention.ISDA))
            .f();
        const fixedbondRedemption1 = bondCalendar.adjust(fixedBondMaturityDate1, BusinessDayConvention.Following);
        fixedBondLeg1.push(new SimpleCashFlow(100.0, fixedbondRedemption1));
        const fixedBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate1, fixedBondStartDate1, fixedBondLeg1);
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedBondImpliedValue1 = fixedBond1.cleanPrice1();
        const fixedBondSettlementDate1 = fixedBond1.settlementDate();
        const fixedBondCleanPrice1 = BondFunctions.cleanPrice4(fixedBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, fixedBondSettlementDate1);
        const tolerance = 1.0e-13;
        const error1 = Math.abs(fixedBondImpliedValue1 - fixedBondCleanPrice1);
        expect(error1).toBeLessThan(tolerance);
        const fixedBondStartDate2 = DateExt.UTC('5,February,2005');
        const fixedBondMaturityDate2 = DateExt.UTC('5,February,2019');
        const fixedBondSchedule2 = new Schedule().init2(fixedBondStartDate2, fixedBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg2 = new FixedRateLeg(fixedBondSchedule2)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.05, new Thirty360(Thirty360.Convention.BondBasis))
            .f();
        const fixedbondRedemption2 = bondCalendar.adjust(fixedBondMaturityDate2, BusinessDayConvention.Following);
        fixedBondLeg2.push(new SimpleCashFlow(100.0, fixedbondRedemption2));
        const fixedBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate2, fixedBondStartDate2, fixedBondLeg2);
        fixedBond2.setPricingEngine(bondEngine);
        const fixedBondImpliedValue2 = fixedBond2.cleanPrice1();
        const fixedBondSettlementDate2 = fixedBond2.settlementDate();
        const fixedBondCleanPrice2 = BondFunctions.cleanPrice4(fixedBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, fixedBondSettlementDate2);
        const error3 = Math.abs(fixedBondImpliedValue2 - fixedBondCleanPrice2);
        expect(error3).toBeLessThan(tolerance);
        const floatingBondStartDate1 = DateExt.UTC('29,September,2003');
        const floatingBondMaturityDate1 = DateExt.UTC('29,September,2013');
        const floatingBondSchedule1 = new Schedule().init2(floatingBondStartDate1, floatingBondMaturityDate1, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBondLeg1 = new IborLeg(floatingBondSchedule1, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0056)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption1 = bondCalendar.adjust(floatingBondMaturityDate1, BusinessDayConvention.Following);
        floatingBondLeg1.push(new SimpleCashFlow(100.0, floatingbondRedemption1));
        const floatingBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate1, floatingBondStartDate1, floatingBondLeg1);
        floatingBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondImpliedValue1 = floatingBond1.cleanPrice1();
        const floatingBondCleanPrice1 = BondFunctions.cleanPrice4(floatingBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Semiannual, fixedBondSettlementDate1);
        const error5 = Math.abs(floatingBondImpliedValue1 - floatingBondCleanPrice1);
        expect(error5).toBeLessThan(tolerance);
        const floatingBondStartDate2 = DateExt.UTC('24,September,2004');
        const floatingBondMaturityDate2 = DateExt.UTC('24,September,2018');
        const floatingBondSchedule2 = new Schedule().init2(floatingBondStartDate2, floatingBondMaturityDate2, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBondLeg2 = new IborLeg(floatingBondSchedule2, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withPaymentAdjustment(BusinessDayConvention.ModifiedFollowing)
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0025)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption2 = bondCalendar.adjust(floatingBondMaturityDate2, BusinessDayConvention.ModifiedFollowing);
        floatingBondLeg2.push(new SimpleCashFlow(100.0, floatingbondRedemption2));
        const floatingBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate2, floatingBondStartDate2, floatingBondLeg2);
        floatingBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const floatingBondImpliedValue2 = floatingBond2.cleanPrice1();
        const floatingBondCleanPrice2 = BondFunctions.cleanPrice4(floatingBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Semiannual, fixedBondSettlementDate1);
        const error7 = Math.abs(floatingBondImpliedValue2 - floatingBondCleanPrice2);
        expect(error7).toBeLessThan(tolerance);
        const cmsBondStartDate1 = DateExt.UTC('22,August,2005');
        const cmsBondMaturityDate1 = DateExt.UTC('22,August,2020');
        const cmsBondSchedule1 = new Schedule().init2(cmsBondStartDate1, cmsBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg1 = new CmsLeg(cmsBondSchedule1, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withCaps1(0.055)
            .withFloors1(0.025)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption1 = bondCalendar.adjust(cmsBondMaturityDate1, BusinessDayConvention.Following);
        cmsBondLeg1.push(new SimpleCashFlow(100.0, cmsbondRedemption1));
        const cmsBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate1, cmsBondStartDate1, cmsBondLeg1);
        cmsBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondImpliedValue1 = cmsBond1.cleanPrice1();
        const cmsBondSettlementDate1 = cmsBond1.settlementDate();
        const cmsBondCleanPrice1 = BondFunctions.cleanPrice4(cmsBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, cmsBondSettlementDate1);
        const error9 = Math.abs(cmsBondImpliedValue1 - cmsBondCleanPrice1);
        expect(error9).toBeLessThan(tolerance);
        const cmsBondStartDate2 = DateExt.UTC('06,May,2005');
        const cmsBondMaturityDate2 = DateExt.UTC('06,May,2015');
        const cmsBondSchedule2 = new Schedule().init2(cmsBondStartDate2, cmsBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg2 = new CmsLeg(cmsBondSchedule2, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withGearings1(0.84)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption2 = bondCalendar.adjust(cmsBondMaturityDate2, BusinessDayConvention.Following);
        cmsBondLeg2.push(new SimpleCashFlow(100.0, cmsbondRedemption2));
        const cmsBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate2, cmsBondStartDate2, cmsBondLeg2);
        cmsBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondImpliedValue2 = cmsBond2.cleanPrice1();
        const cmsBondSettlementDate2 = cmsBond2.settlementDate();
        const cmsBondCleanPrice2 = BondFunctions.cleanPrice4(cmsBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, cmsBondSettlementDate2);
        const error11 = Math.abs(cmsBondImpliedValue2 - cmsBondCleanPrice2);
        expect(error11).toBeLessThan(tolerance);
        const zeroCpnBondStartDate1 = DateExt.UTC('19,December,1985');
        const zeroCpnBondMaturityDate1 = DateExt.UTC('20,December,2015');
        const zeroCpnBondRedemption1 = bondCalendar.adjust(zeroCpnBondMaturityDate1, BusinessDayConvention.Following);
        const zeroCpnBondLeg1 = [new SimpleCashFlow(100.0, zeroCpnBondRedemption1)];
        const zeroCpnBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate1, zeroCpnBondStartDate1, zeroCpnBondLeg1);
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnBondImpliedValue1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnBondSettlementDate1 = zeroCpnBond1.settlementDate();
        const zeroCpnBondCleanPrice1 = BondFunctions.cleanPrice4(zeroCpnBond1, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, zeroCpnBondSettlementDate1);
        const error13 = Math.abs(zeroCpnBondImpliedValue1 - zeroCpnBondCleanPrice1);
        expect(error13).toBeLessThan(tolerance);
        const zeroCpnBondStartDate2 = DateExt.UTC('17,February,1998');
        const zeroCpnBondMaturityDate2 = DateExt.UTC('17,February,2028');
        const zerocpbondRedemption2 = bondCalendar.adjust(zeroCpnBondMaturityDate2, BusinessDayConvention.Following);
        const zeroCpnBondLeg2 = [new SimpleCashFlow(100.0, zerocpbondRedemption2)];
        const zeroCpnBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate2, zeroCpnBondStartDate2, zeroCpnBondLeg2);
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnBondImpliedValue2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnBondSettlementDate2 = zeroCpnBond2.settlementDate();
        const zeroCpnBondCleanPrice2 = BondFunctions.cleanPrice4(zeroCpnBond2, vars.termStructure.currentLink(), vars.spread, new Actual365Fixed(), vars.compounding, Frequency.Annual, zeroCpnBondSettlementDate2);
        const error15 = Math.abs(zeroCpnBondImpliedValue2 - zeroCpnBondCleanPrice2);
        expect(error15).toBeLessThan(tolerance);
    });

    it('Testing clean and dirty prices for specialized bond' +
        ' against equivalent generic bond...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const inArrears = false;
        const fixedBondStartDate1 = DateExt.UTC('4,January,2005');
        const fixedBondMaturityDate1 = DateExt.UTC('4,January,2037');
        const fixedBondSchedule1 = new Schedule().init2(fixedBondStartDate1, fixedBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg1 = new FixedRateLeg(fixedBondSchedule1)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.04, new ActualActual(ActualActual.Convention.ISDA))
            .f();
        const fixedbondRedemption1 = bondCalendar.adjust(fixedBondMaturityDate1, BusinessDayConvention.Following);
        fixedBondLeg1.push(new SimpleCashFlow(100.0, fixedbondRedemption1));
        const fixedBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate1, fixedBondStartDate1, fixedBondLeg1);
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedSpecializedBond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule1, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        fixedSpecializedBond1.setPricingEngine(bondEngine);
        const fixedBondTheoValue1 = fixedBond1.cleanPrice1();
        const fixedSpecializedBondTheoValue1 = fixedSpecializedBond1.cleanPrice1();
        const tolerance = 1.0e-13;
        const error1 = Math.abs(fixedBondTheoValue1 - fixedSpecializedBondTheoValue1);
        expect(error1).toBeLessThan(tolerance);
        const fixedBondTheoDirty1 = fixedBondTheoValue1 + fixedBond1.accruedAmount();
        const fixedSpecializedTheoDirty1 = fixedSpecializedBondTheoValue1 +
            fixedSpecializedBond1.accruedAmount();
        const error2 = Math.abs(fixedBondTheoDirty1 - fixedSpecializedTheoDirty1);
        expect(error2).toBeLessThan(tolerance);
        const fixedBondStartDate2 = DateExt.UTC('5,February,2005');
        const fixedBondMaturityDate2 = DateExt.UTC('5,February,2019');
        const fixedBondSchedule2 = new Schedule().init2(fixedBondStartDate2, fixedBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg2 = new FixedRateLeg(fixedBondSchedule2)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.05, new Thirty360(Thirty360.Convention.BondBasis))
            .f();
        const fixedbondRedemption2 = bondCalendar.adjust(fixedBondMaturityDate2, BusinessDayConvention.Following);
        fixedBondLeg2.push(new SimpleCashFlow(100.0, fixedbondRedemption2));
        const fixedBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate2, fixedBondStartDate2, fixedBondLeg2);
        fixedBond2.setPricingEngine(bondEngine);
        const fixedSpecializedBond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule2, [0.05], new Thirty360(Thirty360.Convention.BondBasis), BusinessDayConvention.Following, 100.0, DateExt.UTC('5,February,2005'));
        fixedSpecializedBond2.setPricingEngine(bondEngine);
        const fixedBondTheoValue2 = fixedBond2.cleanPrice1();
        const fixedSpecializedBondTheoValue2 = fixedSpecializedBond2.cleanPrice1();
        const error3 = Math.abs(fixedBondTheoValue2 - fixedSpecializedBondTheoValue2);
        expect(error3).toBeLessThan(tolerance);
        const fixedBondTheoDirty2 = fixedBondTheoValue2 + fixedBond2.accruedAmount();
        const fixedSpecializedBondTheoDirty2 = fixedSpecializedBondTheoValue2 +
            fixedSpecializedBond2.accruedAmount();
        const error4 = Math.abs(fixedBondTheoDirty2 - fixedSpecializedBondTheoDirty2);
        expect(error4).toBeLessThan(tolerance);
        const floatingBondStartDate1 = DateExt.UTC('29,September,2003');
        const floatingBondMaturityDate1 = DateExt.UTC('29,September,2013');
        const floatingBondSchedule1 = new Schedule().init2(floatingBondStartDate1, floatingBondMaturityDate1, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBondLeg1 = new IborLeg(floatingBondSchedule1, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0056)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption1 = bondCalendar.adjust(floatingBondMaturityDate1, BusinessDayConvention.Following);
        floatingBondLeg1.push(new SimpleCashFlow(100.0, floatingbondRedemption1));
        const floatingBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate1, floatingBondStartDate1, floatingBondLeg1);
        floatingBond1.setPricingEngine(bondEngine);
        const floatingSpecializedBond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule1, vars.iborIndex, new Actual360(), BusinessDayConvention.Following, fixingDays, [1], [0.0056], [], [], inArrears, 100.0, DateExt.UTC('29,September,2003'));
        floatingSpecializedBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        setCouponPricer(floatingSpecializedBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondTheoValue1 = floatingBond1.cleanPrice1();
        const floatingSpecializedBondTheoValue1 = floatingSpecializedBond1.cleanPrice1();
        const error5 = Math.abs(floatingBondTheoValue1 - floatingSpecializedBondTheoValue1);
        expect(error5).toBeLessThan(tolerance);
        const floatingBondTheoDirty1 = floatingBondTheoValue1 + floatingBond1.accruedAmount();
        const floatingSpecializedBondTheoDirty1 = floatingSpecializedBondTheoValue1 +
            floatingSpecializedBond1.accruedAmount();
        const error6 = Math.abs(floatingBondTheoDirty1 - floatingSpecializedBondTheoDirty1);
        expect(error6).toBeLessThan(tolerance);
        const floatingBondStartDate2 = DateExt.UTC('24,September,2004');
        const floatingBondMaturityDate2 = DateExt.UTC('24,September,2018');
        const floatingBondSchedule2 = new Schedule().init2(floatingBondStartDate2, floatingBondMaturityDate2, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBondLeg2 = new IborLeg(floatingBondSchedule2, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withPaymentAdjustment(BusinessDayConvention.ModifiedFollowing)
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0025)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption2 = bondCalendar.adjust(floatingBondMaturityDate2, BusinessDayConvention.ModifiedFollowing);
        floatingBondLeg2.push(new SimpleCashFlow(100.0, floatingbondRedemption2));
        const floatingBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate2, floatingBondStartDate2, floatingBondLeg2);
        floatingBond2.setPricingEngine(bondEngine);
        const floatingSpecializedBond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule2, vars.iborIndex, new Actual360(), BusinessDayConvention.ModifiedFollowing, fixingDays, [1], [0.0025], [], [], inArrears, 100.0, DateExt.UTC('24,September,2004'));
        floatingSpecializedBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        setCouponPricer(floatingSpecializedBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const floatingBondTheoValue2 = floatingBond2.cleanPrice1();
        const floatingSpecializedBondTheoValue2 = floatingSpecializedBond2.cleanPrice1();
        const error7 = Math.abs(floatingBondTheoValue2 - floatingSpecializedBondTheoValue2);
        expect(error7).toBeLessThan(tolerance);
        const floatingBondTheoDirty2 = floatingBondTheoValue2 + floatingBond2.accruedAmount();
        const floatingSpecializedTheoDirty2 = floatingSpecializedBondTheoValue2 +
            floatingSpecializedBond2.accruedAmount();
        const error8 = Math.abs(floatingBondTheoDirty2 - floatingSpecializedTheoDirty2);
        expect(error8).toBeLessThan(tolerance);
        const cmsBondStartDate1 = DateExt.UTC('22,August,2005');
        const cmsBondMaturityDate1 = DateExt.UTC('22,August,2020');
        const cmsBondSchedule1 = new Schedule().init2(cmsBondStartDate1, cmsBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg1 = new CmsLeg(cmsBondSchedule1, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withCaps1(0.055)
            .withFloors1(0.025)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption1 = bondCalendar.adjust(cmsBondMaturityDate1, BusinessDayConvention.Following);
        cmsBondLeg1.push(new SimpleCashFlow(100.0, cmsbondRedemption1));
        const cmsBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate1, cmsBondStartDate1, cmsBondLeg1);
        cmsBond1.setPricingEngine(bondEngine);
        const cmsSpecializedBond1 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule1, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [1.0], [0.0], [0.055], [0.025], inArrears, 100.0, DateExt.UTC('22,August,2005'));
        cmsSpecializedBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        setCouponPricer(cmsSpecializedBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondTheoValue1 = cmsBond1.cleanPrice1();
        const cmsSpecializedBondTheoValue1 = cmsSpecializedBond1.cleanPrice1();
        const error9 = Math.abs(cmsBondTheoValue1 - cmsSpecializedBondTheoValue1);
        expect(error9).toBeLessThan(tolerance);
        const cmsBondTheoDirty1 = cmsBondTheoValue1 + cmsBond1.accruedAmount();
        const cmsSpecializedBondTheoDirty1 = cmsSpecializedBondTheoValue1 + cmsSpecializedBond1.accruedAmount();
        const error10 = Math.abs(cmsBondTheoDirty1 - cmsSpecializedBondTheoDirty1);
        expect(error10).toBeLessThan(tolerance);
        const cmsBondStartDate2 = DateExt.UTC('06,May,2005');
        const cmsBondMaturityDate2 = DateExt.UTC('06,May,2015');
        const cmsBondSchedule2 = new Schedule().init2(cmsBondStartDate2, cmsBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg2 = new CmsLeg(cmsBondSchedule2, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withGearings1(0.84)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption2 = bondCalendar.adjust(cmsBondMaturityDate2, BusinessDayConvention.Following);
        cmsBondLeg2.push(new SimpleCashFlow(100.0, cmsbondRedemption2));
        const cmsBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate2, cmsBondStartDate2, cmsBondLeg2);
        cmsBond2.setPricingEngine(bondEngine);
        const cmsSpecializedBond2 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule2, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [0.84], [0.0], [], [], inArrears, 100.0, DateExt.UTC('06,May,2005'));
        cmsSpecializedBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        setCouponPricer(cmsSpecializedBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondTheoValue2 = cmsBond2.cleanPrice1();
        const cmsSpecializedBondTheoValue2 = cmsSpecializedBond2.cleanPrice1();
        const error11 = Math.abs(cmsBondTheoValue2 - cmsSpecializedBondTheoValue2);
        expect(error11).toBeLessThan(tolerance);
        const cmsBondTheoDirty2 = cmsBondTheoValue2 + cmsBond2.accruedAmount();
        const cmsSpecializedBondTheoDirty2 = cmsSpecializedBondTheoValue2 + cmsSpecializedBond2.accruedAmount();
        const error12 = Math.abs(cmsBondTheoDirty2 - cmsSpecializedBondTheoDirty2);
        expect(error12).toBeLessThan(tolerance);
        const zeroCpnBondStartDate1 = DateExt.UTC('19,December,1985');
        const zeroCpnBondMaturityDate1 = DateExt.UTC('20,December,2015');
        const zeroCpnBondRedemption1 = bondCalendar.adjust(zeroCpnBondMaturityDate1, BusinessDayConvention.Following);
        const zeroCpnBondLeg1 = [new SimpleCashFlow(100.0, zeroCpnBondRedemption1)];
        const zeroCpnBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate1, zeroCpnBondStartDate1, zeroCpnBondLeg1);
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnSpecializedBond1 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('20,December,2015'), BusinessDayConvention.Following, 100.0, DateExt.UTC('19,December,1985'));
        zeroCpnSpecializedBond1.setPricingEngine(bondEngine);
        const zeroCpnBondTheoValue1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnSpecializedBondTheoValue1 = zeroCpnSpecializedBond1.cleanPrice1();
        const error13 = Math.abs(zeroCpnBondTheoValue1 - zeroCpnSpecializedBondTheoValue1);
        expect(error13).toBeLessThan(tolerance);
        const zeroCpnBondTheoDirty1 = zeroCpnBondTheoValue1 + zeroCpnBond1.accruedAmount();
        const zeroCpnSpecializedBondTheoDirty1 = zeroCpnSpecializedBondTheoValue1 +
            zeroCpnSpecializedBond1.accruedAmount();
        const error14 = Math.abs(zeroCpnBondTheoDirty1 - zeroCpnSpecializedBondTheoDirty1);
        expect(error14).toBeLessThan(tolerance);
        const zeroCpnBondStartDate2 = DateExt.UTC('17,February,1998');
        const zeroCpnBondMaturityDate2 = DateExt.UTC('17,February,2028');
        const zerocpbondRedemption2 = bondCalendar.adjust(zeroCpnBondMaturityDate2, BusinessDayConvention.Following);
        const zeroCpnBondLeg2 = [new SimpleCashFlow(100.0, zerocpbondRedemption2)];
        const zeroCpnBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate2, zeroCpnBondStartDate2, zeroCpnBondLeg2);
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnSpecializedBond2 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('17,February,2028'), BusinessDayConvention.Following, 100.0, DateExt.UTC('17,February,1998'));
        zeroCpnSpecializedBond2.setPricingEngine(bondEngine);
        const zeroCpnBondTheoValue2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnSpecializedBondTheoValue2 = zeroCpnSpecializedBond2.cleanPrice1();
        const error15 = Math.abs(zeroCpnBondTheoValue2 - zeroCpnSpecializedBondTheoValue2);
        expect(error15).toBeLessThan(tolerance);
        const zeroCpnBondTheoDirty2 = zeroCpnBondTheoValue2 + zeroCpnBond2.accruedAmount();
        const zeroCpnSpecializedBondTheoDirty2 = zeroCpnSpecializedBondTheoValue2 +
            zeroCpnSpecializedBond2.accruedAmount();
        const error16 = Math.abs(zeroCpnBondTheoDirty2 - zeroCpnSpecializedBondTheoDirty2);
        expect(error16).toBeLessThan(tolerance);
    });

    it('Testing asset-swap prices and spreads for specialized' +
        ' bond against equivalent generic bond...', () => {
        const vars = new CommonVars();
        const bondCalendar = new TARGET();
        const settlementDays = 3;
        const fixingDays = 2;
        const payFixedRate = true;
        const parAssetSwap = true;
        const inArrears = false;
        const fixedBondStartDate1 = DateExt.UTC('4,January,2005');
        const fixedBondMaturityDate1 = DateExt.UTC('4,January,2037');
        const fixedBondSchedule1 = new Schedule().init2(fixedBondStartDate1, fixedBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg1 = new FixedRateLeg(fixedBondSchedule1)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.04, new ActualActual(ActualActual.Convention.ISDA))
            .f();
        const fixedbondRedemption1 = bondCalendar.adjust(fixedBondMaturityDate1, BusinessDayConvention.Following);
        fixedBondLeg1.push(new SimpleCashFlow(100.0, fixedbondRedemption1));
        const fixedBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate1, fixedBondStartDate1, fixedBondLeg1);
        const bondEngine = new DiscountingBondEngine(vars.termStructure);
        const swapEngine = new DiscountingSwapEngine(vars.termStructure);
        fixedBond1.setPricingEngine(bondEngine);
        const fixedSpecializedBond1 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule1, [0.04], new ActualActual(ActualActual.Convention.ISDA), BusinessDayConvention.Following, 100.0, DateExt.UTC('4,January,2005'));
        fixedSpecializedBond1.setPricingEngine(bondEngine);
        const fixedBondPrice1 = fixedBond1.cleanPrice1();
        const fixedSpecializedBondPrice1 = fixedSpecializedBond1.cleanPrice1();
        const fixedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap1.setPricingEngine(swapEngine);
        const fixedSpecializedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, fixedSpecializedBond1, fixedSpecializedBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedSpecializedBondAssetSwap1.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice1 = fixedBondAssetSwap1.fairCleanPrice();
        const fixedSpecializedBondAssetSwapPrice1 = fixedSpecializedBondAssetSwap1.fairCleanPrice();
        const tolerance = 1.0e-13;
        const error1 = Math.abs(fixedBondAssetSwapPrice1 - fixedSpecializedBondAssetSwapPrice1);
        expect(error1).toBeLessThan(tolerance);
        const fixedBondMktPrice1 = 91.832;
        const fixedBondASW1 = new AssetSwap().asInit1(payFixedRate, fixedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondASW1.setPricingEngine(swapEngine);
        const fixedSpecializedBondASW1 = new AssetSwap().asInit1(payFixedRate, fixedSpecializedBond1, fixedBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedSpecializedBondASW1.setPricingEngine(swapEngine);
        const fixedBondASWSpread1 = fixedBondASW1.fairSpread();
        const fixedSpecializedBondASWSpread1 = fixedSpecializedBondASW1.fairSpread();
        const error2 = Math.abs(fixedBondASWSpread1 - fixedSpecializedBondASWSpread1);
        expect(error2).toBeLessThan(tolerance);
        const fixedBondStartDate2 = DateExt.UTC('5,February,2005');
        const fixedBondMaturityDate2 = DateExt.UTC('5,February,2019');
        const fixedBondSchedule2 = new Schedule().init2(fixedBondStartDate2, fixedBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const fixedBondLeg2 = new FixedRateLeg(fixedBondSchedule2)
            .withNotionals1(vars.faceAmount)
            .withCouponRates1(0.05, new Thirty360(Thirty360.Convention.BondBasis))
            .f();
        const fixedbondRedemption2 = bondCalendar.adjust(fixedBondMaturityDate2, BusinessDayConvention.Following);
        fixedBondLeg2.push(new SimpleCashFlow(100.0, fixedbondRedemption2));
        const fixedBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, fixedBondMaturityDate2, fixedBondStartDate2, fixedBondLeg2);
        fixedBond2.setPricingEngine(bondEngine);
        const fixedSpecializedBond2 = new FixedRateBond().frbInit1(settlementDays, vars.faceAmount, fixedBondSchedule2, [0.05], new Thirty360(Thirty360.Convention.BondBasis), BusinessDayConvention.Following, 100.0, DateExt.UTC('5,February,2005'));
        fixedSpecializedBond2.setPricingEngine(bondEngine);
        const fixedBondPrice2 = fixedBond2.cleanPrice1();
        const fixedSpecializedBondPrice2 = fixedSpecializedBond2.cleanPrice1();
        const fixedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondAssetSwap2.setPricingEngine(swapEngine);
        const fixedSpecializedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, fixedSpecializedBond2, fixedSpecializedBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedSpecializedBondAssetSwap2.setPricingEngine(swapEngine);
        const fixedBondAssetSwapPrice2 = fixedBondAssetSwap2.fairCleanPrice();
        const fixedSpecializedBondAssetSwapPrice2 = fixedSpecializedBondAssetSwap2.fairCleanPrice();
        const error3 = Math.abs(fixedBondAssetSwapPrice2 - fixedSpecializedBondAssetSwapPrice2);
        expect(error3).toBeLessThan(tolerance);
        const fixedBondMktPrice2 = 102.178;
        const fixedBondASW2 = new AssetSwap().asInit1(payFixedRate, fixedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedBondASW2.setPricingEngine(swapEngine);
        const fixedSpecializedBondASW2 = new AssetSwap().asInit1(payFixedRate, fixedSpecializedBond2, fixedBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        fixedSpecializedBondASW2.setPricingEngine(swapEngine);
        const fixedBondASWSpread2 = fixedBondASW2.fairSpread();
        const fixedSpecializedBondASWSpread2 = fixedSpecializedBondASW2.fairSpread();
        const error4 = Math.abs(fixedBondASWSpread2 - fixedSpecializedBondASWSpread2);
        expect(error4).toBeLessThan(tolerance);
        const floatingBondStartDate1 = DateExt.UTC('29,September,2003');
        const floatingBondMaturityDate1 = DateExt.UTC('29,September,2013');
        const floatingBondSchedule1 = new Schedule().init2(floatingBondStartDate1, floatingBondMaturityDate1, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const floatingBondLeg1 = new IborLeg(floatingBondSchedule1, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0056)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption1 = bondCalendar.adjust(floatingBondMaturityDate1, BusinessDayConvention.Following);
        floatingBondLeg1.push(new SimpleCashFlow(100.0, floatingbondRedemption1));
        const floatingBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate1, floatingBondStartDate1, floatingBondLeg1);
        floatingBond1.setPricingEngine(bondEngine);
        const floatingSpecializedBond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule1, vars.iborIndex, new Actual360(), BusinessDayConvention.Following, fixingDays, [1], [0.0056], [], [], inArrears, 100.0, DateExt.UTC('29,September,2003'));
        floatingSpecializedBond1.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond1.cashflows(), vars.pricer);
        setCouponPricer(floatingSpecializedBond1.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('27,March,2007'), 0.0402);
        const floatingBondPrice1 = floatingBond1.cleanPrice1();
        const floatingSpecializedBondPrice1 = floatingSpecializedBond1.cleanPrice1();
        const floatingBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap1.setPricingEngine(swapEngine);
        const floatingSpecializedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, floatingSpecializedBond1, floatingSpecializedBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingSpecializedBondAssetSwap1.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice1 = floatingBondAssetSwap1.fairCleanPrice();
        const floatingSpecializedBondAssetSwapPrice1 = floatingSpecializedBondAssetSwap1.fairCleanPrice();
        const error5 = Math.abs(floatingBondAssetSwapPrice1 -
            floatingSpecializedBondAssetSwapPrice1);
        expect(error5).toBeLessThan(tolerance);
        const floatingBondMktPrice1 = 101.33;
        const floatingBondASW1 = new AssetSwap().asInit1(payFixedRate, floatingBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondASW1.setPricingEngine(swapEngine);
        const floatingSpecializedBondASW1 = new AssetSwap().asInit1(payFixedRate, floatingSpecializedBond1, floatingBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingSpecializedBondASW1.setPricingEngine(swapEngine);
        const floatingBondASWSpread1 = floatingBondASW1.fairSpread();
        const floatingSpecializedBondASWSpread1 = floatingSpecializedBondASW1.fairSpread();
        const error6 = Math.abs(floatingBondASWSpread1 - floatingSpecializedBondASWSpread1);
        expect(error6).toBeLessThan(tolerance);
        const floatingBondStartDate2 = DateExt.UTC('24,September,2004');
        const floatingBondMaturityDate2 = DateExt.UTC('24,September,2018');
        const floatingBondSchedule2 = new Schedule().init2(floatingBondStartDate2, floatingBondMaturityDate2, new Period().init2(Frequency.Semiannual), bondCalendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const floatingBondLeg2 = new IborLeg(floatingBondSchedule2, vars.iborIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Actual360())
            .withPaymentAdjustment(BusinessDayConvention.ModifiedFollowing)
            .withFixingDays1(fixingDays)
            .withSpreads1(0.0025)
            .inArrears(inArrears)
            .f();
        const floatingbondRedemption2 = bondCalendar.adjust(floatingBondMaturityDate2, BusinessDayConvention.ModifiedFollowing);
        floatingBondLeg2.push(new SimpleCashFlow(100.0, floatingbondRedemption2));
        const floatingBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, floatingBondMaturityDate2, floatingBondStartDate2, floatingBondLeg2);
        floatingBond2.setPricingEngine(bondEngine);
        const floatingSpecializedBond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, floatingBondSchedule2, vars.iborIndex, new Actual360(), BusinessDayConvention.ModifiedFollowing, fixingDays, [1], [0.0025], [], [], inArrears, 100.0, DateExt.UTC('24,September,2004'));
        floatingSpecializedBond2.setPricingEngine(bondEngine);
        setCouponPricer(floatingBond2.cashflows(), vars.pricer);
        setCouponPricer(floatingSpecializedBond2.cashflows(), vars.pricer);
        vars.iborIndex.addFixing(DateExt.UTC('22,March,2007'), 0.04013);
        const floatingBondPrice2 = floatingBond2.cleanPrice1();
        const floatingSpecializedBondPrice2 = floatingSpecializedBond2.cleanPrice1();
        const floatingBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondAssetSwap2.setPricingEngine(swapEngine);
        const floatingSpecializedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, floatingSpecializedBond2, floatingSpecializedBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingSpecializedBondAssetSwap2.setPricingEngine(swapEngine);
        const floatingBondAssetSwapPrice2 = floatingBondAssetSwap2.fairCleanPrice();
        const floatingSpecializedBondAssetSwapPrice2 = floatingSpecializedBondAssetSwap2.fairCleanPrice();
        const error7 = Math.abs(floatingBondAssetSwapPrice2 -
            floatingSpecializedBondAssetSwapPrice2);
        expect(error7).toBeLessThan(tolerance);
        const floatingBondMktPrice2 = 101.26;
        const floatingBondASW2 = new AssetSwap().asInit1(payFixedRate, floatingBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingBondASW2.setPricingEngine(swapEngine);
        const floatingSpecializedBondASW2 = new AssetSwap().asInit1(payFixedRate, floatingSpecializedBond2, floatingBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        floatingSpecializedBondASW2.setPricingEngine(swapEngine);
        const floatingBondASWSpread2 = floatingBondASW2.fairSpread();
        const floatingSpecializedBondASWSpread2 = floatingSpecializedBondASW2.fairSpread();
        const error8 = Math.abs(floatingBondASWSpread2 - floatingSpecializedBondASWSpread2);
        expect(error8).toBeLessThan(tolerance);
        const cmsBondStartDate1 = DateExt.UTC('22,August,2005');
        const cmsBondMaturityDate1 = DateExt.UTC('22,August,2020');
        const cmsBondSchedule1 = new Schedule().init2(cmsBondStartDate1, cmsBondMaturityDate1, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg1 = new CmsLeg(cmsBondSchedule1, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withCaps1(0.055)
            .withFloors1(0.025)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption1 = bondCalendar.adjust(cmsBondMaturityDate1, BusinessDayConvention.Following);
        cmsBondLeg1.push(new SimpleCashFlow(100.0, cmsbondRedemption1));
        const cmsBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate1, cmsBondStartDate1, cmsBondLeg1);
        cmsBond1.setPricingEngine(bondEngine);
        const cmsSpecializedBond1 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule1, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [1.0], [0.0], [0.055], [0.025], inArrears, 100.0, DateExt.UTC('22,August,2005'));
        cmsSpecializedBond1.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond1.cashflows(), vars.cmspricer);
        setCouponPricer(cmsSpecializedBond1.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('18,August,2006'), 0.04158);
        const cmsBondPrice1 = cmsBond1.cleanPrice1();
        const cmsSpecializedBondPrice1 = cmsSpecializedBond1.cleanPrice1();
        const cmsBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap1.setPricingEngine(swapEngine);
        const cmsSpecializedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, cmsSpecializedBond1, cmsSpecializedBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsSpecializedBondAssetSwap1.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice1 = cmsBondAssetSwap1.fairCleanPrice();
        const cmsSpecializedBondAssetSwapPrice1 = cmsSpecializedBondAssetSwap1.fairCleanPrice();
        const error9 = Math.abs(cmsBondAssetSwapPrice1 - cmsSpecializedBondAssetSwapPrice1);
        expect(error9).toBeLessThan(tolerance);
        const cmsBondMktPrice1 = 87.02;
        const cmsBondASW1 = new AssetSwap().asInit1(payFixedRate, cmsBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondASW1.setPricingEngine(swapEngine);
        const cmsSpecializedBondASW1 = new AssetSwap().asInit1(payFixedRate, cmsSpecializedBond1, cmsBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsSpecializedBondASW1.setPricingEngine(swapEngine);
        const cmsBondASWSpread1 = cmsBondASW1.fairSpread();
        const cmsSpecializedBondASWSpread1 = cmsSpecializedBondASW1.fairSpread();
        const error10 = Math.abs(cmsBondASWSpread1 - cmsSpecializedBondASWSpread1);
        expect(error10).toBeLessThan(tolerance);
        const cmsBondStartDate2 = DateExt.UTC('06,May,2005');
        const cmsBondMaturityDate2 = DateExt.UTC('06,May,2015');
        const cmsBondSchedule2 = new Schedule().init2(cmsBondStartDate2, cmsBondMaturityDate2, new Period().init2(Frequency.Annual), bondCalendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Backward, false);
        const cmsBondLeg2 = new CmsLeg(cmsBondSchedule2, vars.swapIndex)
            .withNotionals1(vars.faceAmount)
            .withPaymentDayCounter(new Thirty360())
            .withFixingDays1(fixingDays)
            .withGearings1(0.84)
            .inArrears(inArrears)
            .f();
        const cmsbondRedemption2 = bondCalendar.adjust(cmsBondMaturityDate2, BusinessDayConvention.Following);
        cmsBondLeg2.push(new SimpleCashFlow(100.0, cmsbondRedemption2));
        const cmsBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, cmsBondMaturityDate2, cmsBondStartDate2, cmsBondLeg2);
        cmsBond2.setPricingEngine(bondEngine);
        const cmsSpecializedBond2 = new CmsRateBond(settlementDays, vars.faceAmount, cmsBondSchedule2, vars.swapIndex, new Thirty360(), BusinessDayConvention.Following, fixingDays, [0.84], [0.0], [], [], inArrears, 100.0, DateExt.UTC('06,May,2005'));
        cmsSpecializedBond2.setPricingEngine(bondEngine);
        setCouponPricer(cmsBond2.cashflows(), vars.cmspricer);
        setCouponPricer(cmsSpecializedBond2.cashflows(), vars.cmspricer);
        vars.swapIndex.addFixing(DateExt.UTC('04,May,2006'), 0.04217);
        const cmsBondPrice2 = cmsBond2.cleanPrice1();
        const cmsSpecializedBondPrice2 = cmsSpecializedBond2.cleanPrice1();
        const cmsBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondAssetSwap2.setPricingEngine(swapEngine);
        const cmsSpecializedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, cmsSpecializedBond2, cmsSpecializedBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsSpecializedBondAssetSwap2.setPricingEngine(swapEngine);
        const cmsBondAssetSwapPrice2 = cmsBondAssetSwap2.fairCleanPrice();
        const cmsSpecializedBondAssetSwapPrice2 = cmsSpecializedBondAssetSwap2.fairCleanPrice();
        const error11 = Math.abs(cmsBondAssetSwapPrice2 - cmsSpecializedBondAssetSwapPrice2);
        expect(error11).toBeLessThan(tolerance);
        const cmsBondMktPrice2 = 94.35;
        const cmsBondASW2 = new AssetSwap().asInit1(payFixedRate, cmsBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsBondASW2.setPricingEngine(swapEngine);
        const cmsSpecializedBondASW2 = new AssetSwap().asInit1(payFixedRate, cmsSpecializedBond2, cmsBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        cmsSpecializedBondASW2.setPricingEngine(swapEngine);
        const cmsBondASWSpread2 = cmsBondASW2.fairSpread();
        const cmsSpecializedBondASWSpread2 = cmsSpecializedBondASW2.fairSpread();
        const error12 = Math.abs(cmsBondASWSpread2 - cmsSpecializedBondASWSpread2);
        expect(error12).toBeLessThan(tolerance);
        const zeroCpnBondStartDate1 = DateExt.UTC('19,December,1985');
        const zeroCpnBondMaturityDate1 = DateExt.UTC('20,December,2015');
        const zeroCpnBondRedemption1 = bondCalendar.adjust(zeroCpnBondMaturityDate1, BusinessDayConvention.Following);
        const zeroCpnBondLeg1 = [new SimpleCashFlow(100.0, zeroCpnBondRedemption1)];
        const zeroCpnBond1 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate1, zeroCpnBondStartDate1, zeroCpnBondLeg1);
        zeroCpnBond1.setPricingEngine(bondEngine);
        const zeroCpnSpecializedBond1 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('20,December,2015'), BusinessDayConvention.Following, 100.0, DateExt.UTC('19,December,1985'));
        zeroCpnSpecializedBond1.setPricingEngine(bondEngine);
        const zeroCpnBondPrice1 = zeroCpnBond1.cleanPrice1();
        const zeroCpnSpecializedBondPrice1 = zeroCpnSpecializedBond1.cleanPrice1();
        const zeroCpnBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnSpecializedBondAssetSwap1 = new AssetSwap().asInit1(payFixedRate, zeroCpnSpecializedBond1, zeroCpnSpecializedBondPrice1, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnSpecializedBondAssetSwap1.setPricingEngine(swapEngine);
        const zeroCpnBondAssetSwapPrice1 = zeroCpnBondAssetSwap1.fairCleanPrice();
        const zeroCpnSpecializedBondAssetSwapPrice1 = zeroCpnSpecializedBondAssetSwap1.fairCleanPrice();
        const error13 = Math.abs(zeroCpnBondAssetSwapPrice1 - zeroCpnSpecializedBondAssetSwapPrice1);
        expect(error13).toBeLessThan(tolerance);
        const zeroCpnBondMktPrice1 = 72.277;
        const zeroCpnBondASW1 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondASW1.setPricingEngine(swapEngine);
        const zeroCpnSpecializedBondASW1 = new AssetSwap().asInit1(payFixedRate, zeroCpnSpecializedBond1, zeroCpnBondMktPrice1, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnSpecializedBondASW1.setPricingEngine(swapEngine);
        const zeroCpnBondASWSpread1 = zeroCpnBondASW1.fairSpread();
        const zeroCpnSpecializedBondASWSpread1 = zeroCpnSpecializedBondASW1.fairSpread();
        const error14 = Math.abs(zeroCpnBondASWSpread1 - zeroCpnSpecializedBondASWSpread1);
        expect(error14).toBeLessThan(tolerance);
        const zeroCpnBondStartDate2 = DateExt.UTC('17,February,1998');
        const zeroCpnBondMaturityDate2 = DateExt.UTC('17,February,2028');
        const zerocpbondRedemption2 = bondCalendar.adjust(zeroCpnBondMaturityDate2, BusinessDayConvention.Following);
        const zeroCpnBondLeg2 = [new SimpleCashFlow(100.0, zerocpbondRedemption2)];
        const zeroCpnBond2 = new Bond().init2(settlementDays, bondCalendar, vars.faceAmount, zeroCpnBondMaturityDate2, zeroCpnBondStartDate2, zeroCpnBondLeg2);
        zeroCpnBond2.setPricingEngine(bondEngine);
        const zeroCpnSpecializedBond2 = new ZeroCouponBond(settlementDays, bondCalendar, vars.faceAmount, DateExt.UTC('17,February,2028'), BusinessDayConvention.Following, 100.0, DateExt.UTC('17,February,1998'));
        zeroCpnSpecializedBond2.setPricingEngine(bondEngine);
        const zeroCpnBondPrice2 = zeroCpnBond2.cleanPrice1();
        const zeroCpnSpecializedBondPrice2 = zeroCpnSpecializedBond2.cleanPrice1();
        const zeroCpnBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnSpecializedBondAssetSwap2 = new AssetSwap().asInit1(payFixedRate, zeroCpnSpecializedBond2, zeroCpnSpecializedBondPrice2, vars.iborIndex, vars.nonnullspread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnSpecializedBondAssetSwap2.setPricingEngine(swapEngine);
        const zeroCpnBondAssetSwapPrice2 = zeroCpnBondAssetSwap2.fairCleanPrice();
        const zeroCpnSpecializedBondAssetSwapPrice2 = zeroCpnSpecializedBondAssetSwap2.fairCleanPrice();
        const error15 = Math.abs(zeroCpnBondAssetSwapPrice2 - zeroCpnSpecializedBondAssetSwapPrice2);
        expect(error15).toBeLessThan(tolerance);
        const zeroCpnBondMktPrice2 = 72.277;
        const zeroCpnBondASW2 = new AssetSwap().asInit1(payFixedRate, zeroCpnBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnBondASW2.setPricingEngine(swapEngine);
        const zeroCpnSpecializedBondASW2 = new AssetSwap().asInit1(payFixedRate, zeroCpnSpecializedBond2, zeroCpnBondMktPrice2, vars.iborIndex, vars.spread, new Schedule(), vars.iborIndex.dayCounter(), parAssetSwap);
        zeroCpnSpecializedBondASW2.setPricingEngine(swapEngine);
        const zeroCpnBondASWSpread2 = zeroCpnBondASW2.fairSpread();
        const zeroCpnSpecializedBondASWSpread2 = zeroCpnSpecializedBondASW2.fairSpread();
        const error16 = Math.abs(zeroCpnBondASWSpread2 - zeroCpnSpecializedBondASWSpread2);
        expect(error16).toBeLessThan(tolerance);
    });
});
