import { Actual365Fixed, ActualActual, Array1D, BlackCapFloorEngine, BlackIborCouponPricer, BusinessDayConvention, Cap, CapFloor, Collar, ConstantOptionletVolatility, DateGeneration, DiscountingSwapEngine, Euribor1Y, FixedRateLeg, Floor, Frequency, Handle, IborLeg, Period, RelinkableHandle, SavedSettings, Schedule, setCouponPricer, Settings, SimpleQuote, Swap, Thirty360, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.length = 20;
        this.volatility = 0.20;
        this.nominal = 100.;
        this.nominals = Array1D.fromSizeValue(this.length, this.nominal);
        this.frequency = Frequency.Annual;
        this.index = new Euribor1Y(this.termStructure);
        this.calendar = this.index.fixingCalendar();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        this.today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(this.today);
        this.settlementDays = 2;
        this.fixingDays = 2;
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        this.startDate = this.settlement;
        this.termStructure.linkTo(flatRate2(this.settlement, 0.05, new ActualActual(ActualActual.Convention.ISDA)));
    }
    makeFixedLeg(startDate, length) {
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, this.convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, this.convention, this.convention, DateGeneration.Rule.Forward, false);
        const coupons = Array1D.fromSizeValue(length, 0.0);
        return new FixedRateLeg(schedule)
            .withNotionals2(this.nominals)
            .withCouponRates3(coupons, new Thirty360())
            .f();
    }
    makeFloatingLeg(startDate, length, gearing = 1.0, spread = 0.0) {
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, this.convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, this.convention, this.convention, DateGeneration.Rule.Forward, false);
        const gearingVector = Array1D.fromSizeValue(length, gearing);
        const spreadVector = Array1D.fromSizeValue(length, spread);
        return new IborLeg(schedule, this.index)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.index.dayCounter())
            .withPaymentAdjustment(this.convention)
            .withFixingDays1(this.fixingDays)
            .withGearings2(gearingVector)
            .withSpreads2(spreadVector)
            .f();
    }
    makeCapFlooredLeg(startDate, length, caps, floors, volatility, gearing = 1.0, spread = 0.0) {
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, this.convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, this.convention, this.convention, DateGeneration.Rule.Forward, false);
        const vol = new Handle(new ConstantOptionletVolatility().covInit3(0, this.calendar, BusinessDayConvention.Following, volatility, new Actual365Fixed()));
        const pricer = new BlackIborCouponPricer(vol);
        const gearingVector = Array1D.fromSizeValue(length, gearing);
        const spreadVector = Array1D.fromSizeValue(length, spread);
        const iborLeg = new IborLeg(schedule, this.index)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.index.dayCounter())
            .withPaymentAdjustment(this.convention)
            .withFixingDays1(this.fixingDays)
            .withGearings2(gearingVector)
            .withSpreads2(spreadVector)
            .withCaps2(caps)
            .withFloors2(floors)
            .f();
        setCouponPricer(iborLeg, pricer);
        return iborLeg;
    }
    makeEngine(volatility) {
        const vol = new Handle(new SimpleQuote(volatility));
        return new BlackCapFloorEngine().init2(this.termStructure, vol);
    }
    makeCapFloor(type, leg, capStrike, floorStrike, volatility) {
        let result;
        switch (type) {
            case CapFloor.Type.Cap:
                result = new Cap(leg, [capStrike]);
                break;
            case CapFloor.Type.Floor:
                result = new Floor(leg, [floorStrike]);
                break;
            case CapFloor.Type.Collar:
                result = new Collar(leg, [capStrike], [floorStrike]);
                break;
            default:
                throw new Error('unknown cap/floor type');
        }
        result.setPricingEngine(this.makeEngine(volatility));
        return result;
    }
}
describe('Capped and floored coupon tests', () => {
    it('Testing degenerate collared coupon...', () => {
        const vars = new CommonVars();
        const caps = Array1D.fromSizeValue(vars.length, 100.0);
        const floors = Array1D.fromSizeValue(vars.length, 0.0);
        const tolerance = 1e-10;
        const fixedLeg = vars.makeFixedLeg(vars.startDate, vars.length);
        const floatLeg = vars.makeFloatingLeg(vars.startDate, vars.length);
        const collaredLeg = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors, vars.volatility);
        const engine = new DiscountingSwapEngine(vars.termStructure);
        const vanillaLeg = new Swap().init1(fixedLeg, floatLeg);
        const collarLeg = new Swap().init1(fixedLeg, collaredLeg);
        vanillaLeg.setPricingEngine(engine);
        collarLeg.setPricingEngine(engine);
        expect(Math.abs(vanillaLeg.NPV() - collarLeg.NPV()))
            .toBeLessThan(tolerance);
    });
    it('Testing collared coupon against its decomposition...', () => {
        const vars = new CommonVars();
        const tolerance = 1e-12;
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
        const floatLeg = vars.makeFloatingLeg(vars.startDate, vars.length);
        const floatLeg_p = vars.makeFloatingLeg(vars.startDate, vars.length, gearing_p, spread_p);
        const floatLeg_n = vars.makeFloatingLeg(vars.startDate, vars.length, gearing_n, spread_n);
        const vanillaLeg = new Swap().init1(fixedLeg, floatLeg);
        const vanillaLeg_p = new Swap().init1(fixedLeg, floatLeg_p);
        const vanillaLeg_n = new Swap().init1(fixedLeg, floatLeg_n);
        const engine = new DiscountingSwapEngine(vars.termStructure);
        vanillaLeg.setPricingEngine(engine);
        vanillaLeg_p.setPricingEngine(engine);
        vanillaLeg_n.setPricingEngine(engine);
        const cappedLeg = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors0, vars.volatility);
        const capLeg = new Swap().init1(fixedLeg, cappedLeg);
        capLeg.setPricingEngine(engine);
        const cap = new Cap(floatLeg, [capstrike]);
        cap.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg.NPV();
        npvCappedLeg = capLeg.NPV();
        npvCap = cap.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla - npvCap));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps0, floors, vars.volatility);
        const floorLeg = new Swap().init1(fixedLeg, flooredLeg);
        floorLeg.setPricingEngine(engine);
        const floor = new Floor(floatLeg, [floorstrike]);
        floor.setPricingEngine(vars.makeEngine(vars.volatility));
        npvFlooredLeg = floorLeg.NPV();
        npvFloor = floor.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla + npvFloor));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors, vars.volatility);
        const collarLeg = new Swap().init1(fixedLeg, collaredLeg);
        collarLeg.setPricingEngine(engine);
        const collar = new Collar(floatLeg, [capstrike], [floorstrike]);
        collar.setPricingEngine(vars.makeEngine(vars.volatility));
        npvCollaredLeg = collarLeg.NPV();
        npvCollar = collar.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - npvCollar));
        expect(error).toBeLessThan(tolerance);
        const cappedLeg_p = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors0, vars.volatility, gearing_p, spread_p);
        const capLeg_p = new Swap().init1(fixedLeg, cappedLeg_p);
        capLeg_p.setPricingEngine(engine);
        const cap_p = new Cap(floatLeg_p, [capstrike]);
        cap_p.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_p.NPV();
        npvCappedLeg = capLeg_p.NPV();
        npvCap = cap_p.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla - npvCap));
        expect(error).toBeLessThan(tolerance);
        const cappedLeg_n = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors0, vars.volatility, gearing_n, spread_n);
        const capLeg_n = new Swap().init1(fixedLeg, cappedLeg_n);
        capLeg_n.setPricingEngine(engine);
        const floor_n = new Floor(floatLeg, [(capstrike - spread_n) / gearing_n]);
        floor_n.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_n.NPV();
        npvCappedLeg = capLeg_n.NPV();
        npvFloor = floor_n.NPV();
        error = Math.abs(npvCappedLeg - (npvVanilla + gearing_n * npvFloor));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg_p1 = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps0, floors, vars.volatility, gearing_p, spread_p);
        const floorLeg_p1 = new Swap().init1(fixedLeg, flooredLeg_p1);
        floorLeg_p1.setPricingEngine(engine);
        const floor_p1 = new Floor(floatLeg_p, [floorstrike]);
        floor_p1.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_p.NPV();
        npvFlooredLeg = floorLeg_p1.NPV();
        npvFloor = floor_p1.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla + npvFloor));
        expect(error).toBeLessThan(tolerance);
        const flooredLeg_n = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps0, floors, vars.volatility, gearing_n, spread_n);
        const floorLeg_n = new Swap().init1(fixedLeg, flooredLeg_n);
        floorLeg_n.setPricingEngine(engine);
        const cap_n = new Cap(floatLeg, [(floorstrike - spread_n) / gearing_n]);
        cap_n.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_n.NPV();
        npvFlooredLeg = floorLeg_n.NPV();
        npvCap = cap_n.NPV();
        error = Math.abs(npvFlooredLeg - (npvVanilla - gearing_n * npvCap));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg_p = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors, vars.volatility, gearing_p, spread_p);
        const collarLeg_p1 = new Swap().init1(fixedLeg, collaredLeg_p);
        collarLeg_p1.setPricingEngine(engine);
        const collar_p = new Collar(floatLeg_p, [capstrike], [floorstrike]);
        collar_p.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_p.NPV();
        npvCollaredLeg = collarLeg_p1.NPV();
        npvCollar = collar_p.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - npvCollar));
        expect(error).toBeLessThan(tolerance);
        const collaredLeg_n = vars.makeCapFlooredLeg(vars.startDate, vars.length, caps, floors, vars.volatility, gearing_n, spread_n);
        const collarLeg_n1 = new Swap().init1(fixedLeg, collaredLeg_n);
        collarLeg_n1.setPricingEngine(engine);
        const collar_n = new Collar(floatLeg, [(floorstrike - spread_n) / gearing_n], [(capstrike - spread_n) / gearing_n]);
        collar_n.setPricingEngine(vars.makeEngine(vars.volatility));
        npvVanilla = vanillaLeg_n.NPV();
        npvCollaredLeg = collarLeg_n1.NPV();
        npvCollar = collar_n.NPV();
        error = Math.abs(npvCollaredLeg - (npvVanilla - gearing_n * npvCollar));
        expect(error).toBeLessThan(tolerance);
    });
});