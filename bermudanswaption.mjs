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
import { Actual365Fixed, BermudanExercise, BusinessDayConvention, DateExt, DateGeneration, DiscountingSwapEngine, Euribor6M, FdG2SwaptionEngine, FdHullWhiteSwaptionEngine, Frequency, G2, HullWhite, Period, RelinkableHandle, SavedSettings, Schedule, Settings, Swaption, Thirty360, TimeUnit, TreeSwaptionEngine, VanillaSwap, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
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
        this.today = this.calendar.adjust(DateExt.UTC());
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
    }
    makeSwap(fixedRate) {
        const start = this.calendar.advance1(this.settlement, this.startYears, TimeUnit.Years);
        const maturity = this.calendar.advance1(start, this.length, TimeUnit.Years);
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

describe(`Bermudan swaption tests ${version}`, () => {
    it('Testing Bermudan swaption with HW model against cached values...', () => {
        const vars = new CommonVars();
        vars.today = DateExt.UTC('15,February,2002');
        Settings.evaluationDate.set(vars.today);
        vars.settlement = DateExt.UTC('19,February,2002');
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
        let exercise = new BermudanExercise().beInit(exerciseDates);
        const treeEngine = new TreeSwaptionEngine().tseInit1(model, 50);
        const fdmEngine = new FdHullWhiteSwaptionEngine(model);
        let itmValue, atmValue, otmValue;
        let itmValueFdm, atmValueFdm, otmValueFdm;
        if(Settings.QL_USE_INDEXED_COUPON){
          itmValue = 42.2413, atmValue = 12.8789, otmValue = 2.4759;
          itmValueFdm = 42.2111, atmValueFdm = 12.8879, otmValueFdm = 2.44443;
        }else{
          itmValue = 42.2470, atmValue = 12.8826, otmValue = 2.4769;
          itmValueFdm = 42.2091, atmValueFdm = 12.8864, otmValueFdm = 2.4437;
        }
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
        exercise = new BermudanExercise().beInit(exerciseDates);
        if(Settings.QL_USE_INDEXED_COUPON){
          itmValue = 42.1917; atmValue = 12.7788; otmValue = 2.4388;
        }else{
          itmValue = 42.1974; atmValue = 12.7825; otmValue = 2.4399;
        }
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
        vars.today = DateExt.UTC('15,September,2016');
        Settings.evaluationDate.set(vars.today);
        vars.settlement = DateExt.UTC('19,September,2016');
        vars.termStructure.linkTo(flatRate2(vars.settlement, 0.04875825, new Actual365Fixed()));
        const atmRate = vars.makeSwap(0.0).fairRate();
        const swaptions = [];
        for (let s = 0.5; s < 1.51; s += 0.25) {
            const swap = vars.makeSwap(s * atmRate);
            const exerciseDates = [];
            for (let i = 0; i < swap.fixedLeg().length; i++) {
                exerciseDates.push(swap.fixedLeg()[i].accrualStartDate());
            }
            swaptions.push(new Swaption(swap, new BermudanExercise().beInit(exerciseDates)));
        }
        const a = 0.1, sigma = 0.01, b = 0.2, eta = 0.013, rho = -0.5;
        const g2Model = new G2(vars.termStructure, a, sigma, b, eta, rho);
        const fdmEngine = new FdG2SwaptionEngine(g2Model, 50, 75, 75, 0, 1e-3);
        const treeEngine = new TreeSwaptionEngine().tseInit1(g2Model, 50);
        let expectedFdm;
        let expectedTree;
        if(Settings.QL_USE_INDEXED_COUPON){
          expectedFdm = [ 103.231, 54.6519, 20.0475, 5.26941, 1.07097 ];
          expectedTree= [ 103.253, 54.6685, 20.1399, 5.40517, 1.10642 ];
        }else{
          expectedFdm = [ 103.227, 54.6502, 20.0469, 5.26924, 1.07093 ];
          expectedTree = [ 103.256, 54.6726, 20.1429, 5.4064 , 1.10677 ];
        }
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
