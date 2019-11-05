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
import { ActualActual, Array1D, BachelierYoYInflationCouponPricer, BlackYoYInflationCouponPricer, BusinessDayConvention, CashFlows, ConstantYoYOptionletVolatility, DateExt, DateGeneration, DiscountingSwapEngine, FixedRateLeg, FlatForward, Frequency, Handle, Linear, MakeSchedule, Period, PiecewiseYoYInflationCurve, Schedule, Settings, SimpleQuote, Swap, Thirty360, TimeUnit, UnitDisplacedBlackYoYInflationCouponPricer, UnitedKingdom, YearOnYearInflationSwap, YearOnYearInflationSwapHelper, YoYInflationBachelierCapFloorEngine, YoYInflationBlackCapFloorEngine, YoYInflationCap, YoYInflationCapFloor, YoYInflationCollar, YoYInflationFloor, yoyInflationLeg, YoYInflationTermStructure, YoYInflationUnitDisplacedBlackCapFloorEngine, YYUKRPIr, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class Datum {
    constructor(date, rate) {
        this.date = date;
        this.rate = rate;
    }
}

function makeHelpers(U, iiData, N, ii, observationLag, calendar, bdc, dc) {
    const instruments = [];
    for (let i = 0; i < N; i++) {
        const maturity = iiData[i].date;
        const quote = new Handle(new SimpleQuote(iiData[i].rate / 100.0));
        const anInstrument = U.ibhInit(quote, observationLag, maturity, calendar, bdc, dc, ii);
        instruments.push(anInstrument);
    }
    return instruments;
}

class CommonVars {
    constructor() {
        this.nominals = [1000000];
        this.frequency = Frequency.Annual;
        this.volatility = 0.01;
        this.length = 7;
        this.calendar = new UnitedKingdom();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        const today = new Date('13-August-2007');
        this.evaluationDate = this.calendar.adjust(today);
        Settings.evaluationDate.set(this.evaluationDate);
        this.settlementDays = 0;
        this.fixingDays = 0;
        this.settlement =
            this.calendar.advance1(today, this.settlementDays, TimeUnit.Days);
        this.startDate = this.settlement;
        this.dc = new Thirty360();
        const from = new Date('1-January-2005');
        const to = new Date('13-August-2007');
        const rpiSchedule = new MakeSchedule()
            .from(from)
            .to(to)
            .withTenor(new Period().init1(1, TimeUnit.Months))
            .withCalendar(new UnitedKingdom())
            .withConvention(BusinessDayConvention.ModifiedFollowing)
            .f();
        const fixData = [
            189.9, 189.9, 189.6, 190.5, 191.6, 192.0, 192.2, 192.2, 192.6,
            193.1, 193.3, 193.6, 194.1, 193.4, 194.2, 195.0, 196.5, 197.7,
            198.5, 198.5, 199.2, 200.1, 200.4, 201.1, 202.7, 201.6, 203.1,
            204.4, 205.4, 206.2, 207.3, -999.0, -999
        ];
        const interp = false;
        this.iir = new YYUKRPIr(interp, this.hy);
        for (let i = 0; i < rpiSchedule.size(); i++) {
            this.iir.addFixing(rpiSchedule.date(i), fixData[i]);
        }
        const nominalFF = new FlatForward().ffInit2(this.evaluationDate, 0.05, new ActualActual());
        this.nominalTS.linkTo(nominalFF);
        const observationLag = new Period().init1(2, TimeUnit.Months);
        const yyData = [
            new Datum(new Date('13-August-2008'), 2.95),
            new Datum(new Date('13-August-2009'), 2.95),
            new Datum(new Date('13-August-2010'), 2.93),
            new Datum(new Date('15-August-2011'), 2.955),
            new Datum(new Date('13-August-2012'), 2.945),
            new Datum(new Date('13-August-2013'), 2.985),
            new Datum(new Date('13-August-2014'), 3.01),
            new Datum(new Date('13-August-2015'), 3.035),
            new Datum(new Date('13-August-2016'), 3.055),
            new Datum(new Date('13-August-2017'), 3.075),
            new Datum(new Date('13-August-2019'), 3.105),
            new Datum(new Date('15-August-2022'), 3.135),
            new Datum(new Date('13-August-2027'), 3.155),
            new Datum(new Date('13-August-2032'), 3.145),
            new Datum(new Date('13-August-2037'), 3.145)
        ];
        const helpers = makeHelpers(new YearOnYearInflationSwapHelper(), yyData, yyData.length, this.iir, observationLag, this.calendar, this.convention, this.dc);
        const baseYYRate = yyData[0].rate / 100.0;
        const pYYTS = new PiecewiseYoYInflationCurve(new Linear())
            .pwyoyicInit(this.evaluationDate, this.calendar, this.dc, observationLag, this.iir.frequency(), this.iir.interpolated(), baseYYRate, this.nominalTS, helpers);
        pYYTS.recalculate();
        this.yoyTS = pYYTS;
        this.hy.linkTo(pYYTS);
    }
    makeYoYLeg(startDate, length, gearing = 1.0, spread = 0.0) {
        const ii = this.iir;
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, BusinessDayConvention.Unadjusted);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, false);
        const gearingVector = Array1D.fromSizeValue(length, gearing);
        const spreadVector = Array1D.fromSizeValue(length, spread);
        return new yoyInflationLeg(schedule, this.calendar, ii, this.observationLag)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.dc)
            .withGearings2(gearingVector)
            .withSpreads2(spreadVector)
            .withPaymentAdjustment(this.convention)
            .f();
    }
    makeFixedLeg(startDate, length) {
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, this.convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, this.convention, this.convention, DateGeneration.Rule.Forward, false);
        const coupons = Array1D.fromSizeValue(length, 0.0);
        return new FixedRateLeg(schedule)
            .withNotionals2(this.nominals)
            .withCouponRates3(coupons, this.dc)
            .f();
    }
    makeYoYCapFlooredLeg(which, startDate, length, caps, floors, volatility, gearing = 1.0, spread = 0.0) {
        const vol = new Handle(new ConstantYoYOptionletVolatility().cyoyovInit(volatility, this.settlementDays, this.calendar, this.convention, this.dc, this.observationLag, this.frequency, this.iir.interpolated()));
        let pricer;
        switch (which) {
            case 0:
                pricer = new BlackYoYInflationCouponPricer(vol);
                break;
            case 1:
                pricer = new UnitDisplacedBlackYoYInflationCouponPricer(vol);
                break;
            case 2:
                pricer = new BachelierYoYInflationCouponPricer(vol);
                break;
            default:
                throw new Error('unknown coupon pricer request');
        }
        const gearingVector = Array1D.fromSizeValue(length, gearing);
        const spreadVector = Array1D.fromSizeValue(length, spread);
        const ii = this.iir;
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, BusinessDayConvention.Unadjusted);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, false);
        const yoyLeg = new yoyInflationLeg(schedule, this.calendar, ii, this.observationLag)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.dc)
            .withPaymentAdjustment(this.convention)
            .withGearings2(gearingVector)
            .withSpreads2(spreadVector)
            .withCaps2(caps)
            .withFloors2(floors)
            .f();
        for (let i = 0; i < yoyLeg.length; i++) {
            yoyLeg[i].setPricer(pricer);
        }
        return yoyLeg;
    }
    makeEngine(volatility, which) {
        const vol = new Handle(new ConstantYoYOptionletVolatility().cyoyovInit(volatility, this.settlementDays, this.calendar, this.convention, this.dc, this.observationLag, this.frequency, this.iir.interpolated()));
        switch (which) {
            case 0:
                return new YoYInflationBlackCapFloorEngine(this.iir, vol);
            case 1:
                return new YoYInflationUnitDisplacedBlackCapFloorEngine(this.iir, vol);
            case 2:
                return new YoYInflationBachelierCapFloorEngine(this.iir, vol);
            default:
                throw new Error('unknown engine request: which = ' +
                    `${which} should be 0=Black,1=DD,2=Bachelier`);
        }
    }
    makeYoYCapFloor(type, leg, strike, volatility, which) {
        let result;
        switch (type) {
            case YoYInflationCapFloor.Type.Cap:
                result = new YoYInflationCap(leg, [strike]);
                break;
            case YoYInflationCapFloor.Type.Floor:
                result = new YoYInflationFloor(leg, [strike]);
                break;
            default:
                throw new Error('unknown YoYInflation cap/floor type');
        }
        result.setPricingEngine(this.makeEngine(volatility, which));
        return result;
    }
}

describe(`YoY inflation capped and floored coupon tests ${version}`, () => {
    it('Testing collared coupon against its decomposition...', () => {
        const vars = new CommonVars();
        const tolerance = 1e-10;
        let npvVanilla, npvCappedLeg, npvFlooredLeg, npvCollaredLeg, npvCap, npvFloor, npvCollar;
        let error;
        const floorstrike = 0.05;
        const capstrike = 0.10;
        const caps = Array1D.fromSizeValue(vars.length, capstrike);
        const caps0 = [];
        const floors = Array1D.fromSizeValue(vars.length, floorstrike);
        const floors0 = [];
        const gearing_p = 0.5;
        const spread_p = 0.002;
        const gearing_n = -1.5;
        const spread_n = 0.12;
        const fixedLeg = vars.makeFixedLeg(vars.startDate, vars.length);
        const floatLeg = vars.makeYoYLeg(vars.startDate, vars.length);
        const floatLeg_p = vars.makeYoYLeg(vars.startDate, vars.length, gearing_p, spread_p);
        const floatLeg_n = vars.makeYoYLeg(vars.startDate, vars.length, gearing_n, spread_n);
        const vanillaLeg = new Swap().init1(fixedLeg, floatLeg);
        const vanillaLeg_p = new Swap().init1(fixedLeg, floatLeg_p);
        const vanillaLeg_n = new Swap().init1(fixedLeg, floatLeg_n);
        const engine = new DiscountingSwapEngine(vars.nominalTS);
        vanillaLeg.setPricingEngine(engine);
        vanillaLeg_p.setPricingEngine(engine);
        vanillaLeg_n.setPricingEngine(engine);
        const whichPricer = 0;
        const cappedLeg = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors0, vars.volatility);
        const capLeg = new Swap().init1(fixedLeg, cappedLeg);
        capLeg.setPricingEngine(engine);
        const cap = new YoYInflationCap(floatLeg, [capstrike]);
        cap.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg.NPV();
        npvCappedLeg = capLeg.NPV();
        npvCap = cap.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla - npvCap));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps0, floors, vars.volatility);
        const floorLeg = new Swap().init1(fixedLeg, flooredLeg);
        floorLeg.setPricingEngine(engine);
        const floor = new YoYInflationFloor(floatLeg, [floorstrike]);
        floor.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvFlooredLeg = floorLeg.NPV();
        npvFloor = floor.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla + npvFloor));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors, vars.volatility);
        const collarLeg = new Swap().init1(fixedLeg, collaredLeg);
        collarLeg.setPricingEngine(engine);
        const collar = new YoYInflationCollar(floatLeg, [capstrike], [floorstrike]);
        collar.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvCollaredLeg = collarLeg.NPV();
        npvCollar = collar.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - npvCollar));
        expect(error).toBeLessThan(tolerance);
        const cappedLeg_p = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors0, vars.volatility, gearing_p, spread_p);
        const capLeg_p = new Swap().init1(fixedLeg, cappedLeg_p);
        capLeg_p.setPricingEngine(engine);
        const cap_p = new YoYInflationCap(floatLeg_p, [capstrike]);
        cap_p.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_p.NPV();
        npvCappedLeg = capLeg_p.NPV();
        npvCap = cap_p.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla - npvCap));
        expect(error).toBeLessThan(tolerance);
        const cappedLeg_n = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors0, vars.volatility, gearing_n, spread_n);
        const capLeg_n = new Swap().init1(fixedLeg, cappedLeg_n);
        capLeg_n.setPricingEngine(engine);
        const floor_n = new YoYInflationFloor(floatLeg, [(capstrike - spread_n) / gearing_n]);
        floor_n.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_n.NPV();
        npvCappedLeg = capLeg_n.NPV();
        npvFloor = floor_n.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla + gearing_n * npvFloor));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg_p1 = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps0, floors, vars.volatility, gearing_p, spread_p);
        const floorLeg_p1 = new Swap().init1(fixedLeg, flooredLeg_p1);
        floorLeg_p1.setPricingEngine(engine);
        const floor_p1 = new YoYInflationFloor(floatLeg_p, [floorstrike]);
        floor_p1.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_p.NPV();
        npvFlooredLeg = floorLeg_p1.NPV();
        npvFloor = floor_p1.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla + npvFloor));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg_n = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps0, floors, vars.volatility, gearing_n, spread_n);
        const floorLeg_n = new Swap().init1(fixedLeg, flooredLeg_n);
        floorLeg_n.setPricingEngine(engine);
        const cap_n = new YoYInflationCap(floatLeg, [(floorstrike - spread_n) / gearing_n]);
        cap_n.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_n.NPV();
        npvFlooredLeg = floorLeg_n.NPV();
        npvCap = cap_n.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla - gearing_n * npvCap));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg_p = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors, vars.volatility, gearing_p, spread_p);
        const collarLeg_p1 = new Swap().init1(fixedLeg, collaredLeg_p);
        collarLeg_p1.setPricingEngine(engine);
        const collar_p = new YoYInflationCollar(floatLeg_p, [capstrike], [floorstrike]);
        collar_p.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_p.NPV();
        npvCollaredLeg = collarLeg_p1.NPV();
        npvCollar = collar_p.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - npvCollar));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg_n = vars.makeYoYCapFlooredLeg(whichPricer, vars.startDate, vars.length, caps, floors, vars.volatility, gearing_n, spread_n);
        const collarLeg_n1 = new Swap().init1(fixedLeg, collaredLeg_n);
        collarLeg_n1.setPricingEngine(engine);
        const collar_n = new YoYInflationCollar(floatLeg, [(floorstrike - spread_n) / gearing_n], [(capstrike - spread_n) / gearing_n]);
        collar_n.setPricingEngine(vars.makeEngine(vars.volatility, whichPricer));
        npvVanilla = vanillaLeg_n.NPV();
        npvCollaredLeg = collarLeg_n1.NPV();
        npvCollar = collar_n.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - gearing_n * npvCollar));
        expect(error).toBeLessThan(tolerance);
        vars.hy.linkTo(new YoYInflationTermStructure());
    });
    it('Testing inflation capped/floored coupon against' +
        ' inflation capfloor instrument...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const strikes = [0.01, 0.025, 0.029, 0.03, 0.031, 0.035, 0.07];
        const vols = [0.001, 0.005, 0.010, 0.015, 0.020];
        for (let whichPricer = 0; whichPricer < 3; whichPricer++) {
            for (let i = 0; i < lengths.length; i++) {
                for (let j = 0; j < strikes.length; j++) {
                    for (let k = 0; k < vols.length; k++) {
                        const leg = vars.makeYoYLeg(vars.evaluationDate, lengths[i]);
                        const cap = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Cap, leg, strikes[j], vols[k], whichPricer);
                        const floor = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Floor, leg, strikes[j], vols[k], whichPricer);
                        const from = vars.nominalTS.currentLink().referenceDate();
                        const to = DateExt.advance(from, lengths[i], TimeUnit.Years);
                        const yoySchedule = new MakeSchedule()
                            .from(from)
                            .to(to)
                            .withTenor(new Period().init1(1, TimeUnit.Years))
                            .withCalendar(new UnitedKingdom())
                            .withConvention(BusinessDayConvention.Unadjusted)
                            .backwards()
                            .f();
                        const swap = new YearOnYearInflationSwap(YearOnYearInflationSwap.Type.Payer, 1000000.0, yoySchedule, 0.0, vars.dc, yoySchedule, vars.iir, vars.observationLag, 0.0, vars.dc, new UnitedKingdom());
                        const hTS = vars.nominalTS;
                        const sppe = new DiscountingSwapEngine(hTS);
                        swap.setPricingEngine(sppe);
                        const leg2 = vars.makeYoYCapFlooredLeg(whichPricer, from, lengths[i], Array1D.fromSizeValue(lengths[i], strikes[j]), [], vols[k], 1.0, 0.0);
                        const leg3 = vars.makeYoYCapFlooredLeg(whichPricer, from, lengths[i], [], Array1D.fromSizeValue(lengths[i], strikes[j]), vols[k], 1.0, 0.0);
                        const capped = CashFlows.npv1(leg2, vars.nominalTS.currentLink(), false);
                        expect(Math.abs(capped - (swap.NPV() - cap.NPV())))
                            .toBeLessThan(1.0e-6);
                        const floored = CashFlows.npv1(leg3, vars.nominalTS.currentLink(), false);
                        expect(Math.abs(floored - (swap.NPV() + floor.NPV())))
                            .toBeLessThan(1.0e-6);
                    }
                }
            }
        }
        vars.hy.linkTo(new YoYInflationTermStructure());
    });
});