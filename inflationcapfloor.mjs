import { ActualActual, BusinessDayConvention, ConstantYoYOptionletVolatility, DateExt, DateGeneration, DiscountingSwapEngine, FlatForward, Frequency, Handle, Linear, MakeSchedule, Period, PiecewiseYoYInflationCurve, Schedule, Settings, SimpleQuote, Thirty360, TimeUnit, UnitedKingdom, YearOnYearInflationSwap, YearOnYearInflationSwapHelper, YoYInflationBachelierCapFloorEngine, YoYInflationBlackCapFloorEngine, YoYInflationCap, YoYInflationCapFloor, YoYInflationCollar, YoYInflationFloor, yoyInflationLeg, YoYInflationTermStructure, YoYInflationUnitDisplacedBlackCapFloorEngine, YYUKRPIr, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

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
        this.calendar = new UnitedKingdom();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        const today = new Date('13-August-2007');
        this.evaluationDate = this.calendar.adjust(today);
        Settings.evaluationDate.set(this.evaluationDate);
        this.settlementDays = 0;
        this.fixingDays = 0;
        this.settlement =
            this.calendar.advance1(today, this.settlementDays, TimeUnit.Days);
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
    makeYoYLeg(startDate, length) {
        const ii = this.iir;
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, BusinessDayConvention.Unadjusted);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, false);
        return new yoyInflationLeg(schedule, this.calendar, ii, this.observationLag)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.dc)
            .withPaymentAdjustment(this.convention)
            .f();
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

describe(`Inflation (year-on-year) Cap and floor tests ${version}`, () => {
    it('Testing consistency between yoy inflation cap, floor and collar...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const cap_rates = [0.01, 0.025, 0.029, 0.03, 0.031, 0.035, 0.07];
        const floor_rates = [0.01, 0.025, 0.029, 0.03, 0.031, 0.035, 0.07];
        const vols = [0.001, 0.005, 0.010, 0.015, 0.020];
        for (let whichPricer = 0; whichPricer < 3; whichPricer++) {
            for (let i = 0; i < lengths.length; i++) {
                for (let j = 0; j < cap_rates.length; j++) {
                    for (let k = 0; k < floor_rates.length; k++) {
                        for (let l = 0; l < vols.length; l++) {
                            const leg = vars.makeYoYLeg(vars.evaluationDate, lengths[i]);
                            const cap = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Cap, leg, cap_rates[j], vols[l], whichPricer);
                            const floor = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Floor, leg, floor_rates[k], vols[l], whichPricer);
                            const collar = new YoYInflationCollar(leg, [cap_rates[j]], [floor_rates[k]]);
                            collar.setPricingEngine(vars.makeEngine(vols[l], whichPricer));
                            expect(Math.abs((cap.NPV() - floor.NPV()) - collar.NPV()))
                                .toBeLessThan(1e-6);
                            let capletsNPV = 0.0;
                            const caplets = [];
                            for (let m = 0; m < lengths[i] * 1; m++) {
                                caplets.push(cap.optionlet(m));
                                caplets[m].setPricingEngine(vars.makeEngine(vols[l], whichPricer));
                                capletsNPV += caplets[m].NPV();
                            }
                            expect(Math.abs(cap.NPV() - capletsNPV)).toBeLessThan(1e-6);
                            let floorletsNPV = 0.0;
                            const floorlets = [];
                            for (let m = 0; m < lengths[i] * 1; m++) {
                                floorlets.push(floor.optionlet(m));
                                floorlets[m].setPricingEngine(vars.makeEngine(vols[l], whichPricer));
                                floorletsNPV += floorlets[m].NPV();
                            }
                            expect(Math.abs(floor.NPV() - floorletsNPV))
                                .toBeLessThan(1e-6);
                            let collarletsNPV = 0.0;
                            const collarlets = [];
                            for (let m = 0; m < lengths[i] * 1; m++) {
                                collarlets.push(collar.optionlet(m));
                                collarlets[m].setPricingEngine(vars.makeEngine(vols[l], whichPricer));
                                collarletsNPV += collarlets[m].NPV();
                            }
                            expect(Math.abs(collar.NPV() - collarletsNPV))
                                .toBeLessThan(1e-6);
                        }
                    }
                }
            }
        }
        vars.hy.linkTo(new YoYInflationTermStructure());
    });
    it('Testing yoy inflation cap/floor parity...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const strikes = [0., 0.025, 0.029, 0.03, 0.031, 0.035, 0.07];
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
                        const swap = new YearOnYearInflationSwap(YearOnYearInflationSwap.Type.Payer, 1000000.0, yoySchedule, strikes[j], vars.dc, yoySchedule, vars.iir, vars.observationLag, 0.0, vars.dc, new UnitedKingdom());
                        const hTS = vars.nominalTS;
                        const sppe = new DiscountingSwapEngine(hTS);
                        swap.setPricingEngine(sppe);
                        expect(Math.abs((cap.NPV() - floor.NPV()) - swap.NPV()))
                            .toBeLessThan(1.0e-6);
                    }
                }
            }
        }
        vars.hy.linkTo(new YoYInflationTermStructure());
    });
    it('Testing Black yoy inflation cap/floor price against cached values...', () => {
        const vars = new CommonVars();
        let whichPricer = 0;
        const K = 0.0295;
        const j = 2;
        const leg = vars.makeYoYLeg(vars.evaluationDate, j);
        let cap = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Cap, leg, K, 0.01, whichPricer);
        let floor = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Floor, leg, K, 0.01, whichPricer);
        const cachedCapNPVblack = 219.452;
        const cachedFloorNPVblack = 314.641;
        expect(Math.abs(cap.NPV() - cachedCapNPVblack)).toBeLessThan(0.02);
        expect(Math.abs(floor.NPV() - cachedFloorNPVblack)).toBeLessThan(0.02);
        whichPricer = 1;
        cap = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Cap, leg, K, 0.01, whichPricer);
        floor = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Floor, leg, K, 0.01, whichPricer);
        const cachedCapNPVdd = 9114.61;
        const cachedFloorNPVdd = 9209.8;
        expect(Math.abs(cap.NPV() - cachedCapNPVdd)).toBeLessThan(0.22);
        expect(Math.abs(floor.NPV() - cachedFloorNPVdd)).toBeLessThan(0.22);
        whichPricer = 2;
        cap = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Cap, leg, K, 0.01, whichPricer);
        floor = vars.makeYoYCapFloor(YoYInflationCapFloor.Type.Floor, leg, K, 0.01, whichPricer);
        const cachedCapNPVbac = 8852.4;
        const cachedFloorNPVbac = 8947.59;
        expect(Math.abs(cap.NPV() - cachedCapNPVbac)).toBeLessThan(0.22);
        expect(Math.abs(floor.NPV() - cachedFloorNPVbac)).toBeLessThan(0.22);
        vars.hy.linkTo(new YoYInflationTermStructure());
    });
});