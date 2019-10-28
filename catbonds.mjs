import { Actual360, ActualActual, BetaRisk, BlackIborCouponPricer, BusinessDayConvention, Compounding, DateGeneration, DigitalNotionalRisk, DiscountingBondEngine, EventSet, FloatingCatBond, FloatingRateBond, Frequency, Handle, MonteCarloCatBondEngine, NoOffset, Period, ProportionalNotionalRisk, Schedule, setCouponPricer, Settings, TARGET, TimeUnit, UnitedStates, USDLibor, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

const first = 0, second = 0;

const data = [
    [new Date('1-February-2012').valueOf(), 100],
    [new Date('1-July-2013').valueOf(), 150],
    [new Date('5-January-2014').valueOf(), 50]
];

const sampleEvents = Array.from(data);
const eventsStart = new Date('1-January-2011');
const eventsEnd = new Date('31-December-2014');

class CommonVars {
    constructor() {
        this.calendar = new TARGET();
        this.today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(this.today);
        this.faceAmount = 1000000.0;
    }
}

describe(`CatBond tests ${version}`, () => {
    it('Testing that catastrophe events are split ' +
        'correctly for periods of whole years...', () => {
        const catRisk = new EventSet(sampleEvents, eventsStart, eventsEnd);
        const simulation = catRisk.newSimulation(new Date('1-January-2015'), new Date('31-December-2015'));
        expect(simulation).not.toBeNull();
        const path = [];
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(0);
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(1);
        expect(path[0][first]).toEqual(new Date('1-February-2015').valueOf());
        expect(path[0][second]).toEqual(100);
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(1);
        expect(path[0][first]).toEqual(new Date('1-July-2015').valueOf());
        expect(path[0][second]).toEqual(150);
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(1);
        expect(path[0][first]).toEqual(new Date('5-January-2015').valueOf());
        expect(path[0][second]).toEqual(50);
        expect(simulation.nextPath(path)).toBeFalsy();
    });
    it('Testing that catastrophe events are split ' +
        'correctly for irregular periods...', () => {
        const catRisk = new EventSet(sampleEvents, eventsStart, eventsEnd);
        const simulation = catRisk.newSimulation(new Date('2-January-2015'), new Date('5-January-2016'));
        expect(simulation).not.toBeNull();
        const path = [];
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(0);
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(2);
        expect(path[0][first]).toEqual(new Date('1-July-2015').valueOf());
        expect(path[0][second]).toEqual(150);
        expect(path[0][first]).toEqual(new Date('5-January-2016').valueOf());
        expect(path[0][second]).toEqual(50);
        expect(simulation.nextPath(path)).toBeFalsy();
    });
    it('Testing that catastrophe events are split ' +
        'correctly when there are no simulated events...', () => {
        const emptyEvents = [];
        const catRisk = new EventSet(emptyEvents, eventsStart, eventsEnd);
        const simulation = catRisk.newSimulation(new Date('2-January-2015'), new Date('5-January-2016'));
        expect(simulation).not.toBeNull();
        const path = [];
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(0);
        expect(simulation.nextPath(path)).toBeTruthy();
        expect(path.length).toEqual(0);
        expect(simulation.nextPath(path)).toBeFalsy();
    });
    it('Testing that beta risk gives correct terminal distribution...', () => {
        const PATHS = 1000000;
        const catRisk = new BetaRisk(100.0, 100.0, 10.0, 15.0);
        const simulation = catRisk.newSimulation(new Date('2-January-2015'), new Date('2-January-2018'));
        expect(simulation).not.toBeNull();
        const path = [];
        let sum = 0.0;
        let sumSquares = 0.0;
        let poissonSum = 0.0;
        let poissonSumSquares = 0.0;
        for (let i = 0; i < PATHS; ++i) {
            expect(simulation.nextPath(path)).toBeTruthy();
            let processValue = 0.0;
            for (let j = 0; j < path.length; ++j) {
                processValue += path[j][second];
            }
            sum += processValue;
            sumSquares += processValue * processValue;
            poissonSum += path.length;
            poissonSumSquares += path.length * path.length;
        }
        const poissonMean = poissonSum / PATHS;
        expect(Math.abs(poissonMean - 3.0 / 100.0)).toBeLessThan(0.02);
        const poissonVar = poissonSumSquares / PATHS - poissonMean * poissonMean;
        expect(Math.abs(poissonVar - 3.0 / 100.0)).toBeLessThan(0.05);
        const expectedMean = 3.0 * 10.0 / 100.0;
        const actualMean = sum / PATHS;
        expect(Math.abs(expectedMean - actualMean)).toBeLessThan(0.01);
        const expectedVar = 3.0 * (15.0 * 15.0 + 10 * 10) / 100.0;
        const actualVar = sumSquares / PATHS - actualMean * actualMean;
        expect(Math.abs(expectedVar - actualVar)).toBeLessThan(0.015);
    });
    it('Testing floating-rate cat bond against risk-free floating-rate bond...', () => {
        const vars = new CommonVars();
        const today = new Date('22-November-2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30-November-2004'), new Date('30-November-2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const noCatRisk = new EventSet([], new Date('1-Jan-2000'), new Date('31-Dec-2010'));
        const paymentOffset = new NoOffset();
        const notionalRisk = new DigitalNotionalRisk(paymentOffset, 100);
        const bond1 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBond1 = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const bondEngine = new DiscountingBondEngine(riskFreeRate);
        bond1.setPricingEngine(bondEngine);
        setCouponPricer(bond1.cashflows(), pricer);
        const catBondEngine = new MonteCarloCatBondEngine(noCatRisk, riskFreeRate);
        catBond1.setPricingEngine(catBondEngine);
        setCouponPricer(catBond1.cashflows(), pricer);
        const cachedPrice1 = 99.874645;
        let price = bond1.cleanPrice1();
        let catPrice = catBond1.cleanPrice1();
        expect(Math.abs(price - cachedPrice1)).toBeLessThan(tolerance);
        expect(Math.abs(catPrice - price)).toBeLessThan(tolerance);
        const bond2 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBond2 = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const bondEngine2 = new DiscountingBondEngine(discountCurve);
        bond2.setPricingEngine(bondEngine2);
        setCouponPricer(bond2.cashflows(), pricer);
        const catBondEngine2 = new MonteCarloCatBondEngine(noCatRisk, discountCurve);
        catBond2.setPricingEngine(catBondEngine2);
        setCouponPricer(catBond2.cashflows(), pricer);
        const cachedPrice2 = 97.955904;
        price = bond2.cleanPrice1();
        catPrice = catBond2.cleanPrice1();
        expect(Math.abs(price - cachedPrice2)).toBeLessThan(tolerance);
        expect(Math.abs(catPrice - price)).toBeLessThan(tolerance);
        const spreads = [0.001, 0.0012, 0.0014, 0.0016];
        const bond3 = new FloatingRateBond().frbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), BusinessDayConvention.ModifiedFollowing, fixingDays, [], spreads, [], [], false, 100.0, new Date('30-November-2004'));
        const catBond3 = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], spreads, [], [], false, 100.0, new Date('30-November-2004'));
        bond3.setPricingEngine(bondEngine2);
        setCouponPricer(bond3.cashflows(), pricer);
        catBond3.setPricingEngine(catBondEngine2);
        setCouponPricer(catBond3.cashflows(), pricer);
        const cachedPrice3 = 98.495458;
        price = bond3.cleanPrice1();
        catPrice = catBond3.cleanPrice1();
        expect(Math.abs(price - cachedPrice3)).toBeLessThan(tolerance);
        expect(Math.abs(catPrice - price)).toBeLessThan(tolerance);
    });
    it('Testing floating-rate cat bond in a doom scenario (certain default)...', () => {
        const vars = new CommonVars();
        const today = new Date('22-November-2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30-November-2004'), new Date('30-November-2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const events = [];
        events.push([new Date('30-November-2004').valueOf(), 1000]);
        const doomCatRisk = new EventSet(events, new Date('30-November-2004'), new Date('30-November-2008'));
        const paymentOffset = new NoOffset();
        const notionalRisk = new DigitalNotionalRisk(paymentOffset, 100);
        const catBond = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBondEngine = new MonteCarloCatBondEngine(doomCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngine);
        setCouponPricer(catBond.cashflows(), pricer);
        const price = catBond.cleanPrice1();
        expect(price).toEqual(0);
        const lossProbability = catBond.lossProbability();
        const exhaustionProbability = catBond.exhaustionProbability();
        const expectedLoss = catBond.expectedLoss();
        expect(Math.abs(lossProbability - 1.0)).toBeLessThan(tolerance);
        expect(Math.abs(exhaustionProbability - 1.0)).toBeLessThan(tolerance);
        expect(Math.abs(expectedLoss - 1.0)).toBeLessThan(tolerance);
    });
    it('Testing floating-rate cat bond in a doom once in 10 years scenario...', () => {
        const vars = new CommonVars();
        const today = new Date('22-November-2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30-November-2004'), new Date('30-November-2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const events = [];
        events.push([new Date('30-November-2008').valueOf(), 1000]);
        const doomCatRisk = new EventSet(events, new Date('30-November-2004'), new Date('30-November-2044'));
        const noCatRisk = new EventSet([], new Date('1-Jan-2000'), new Date('31-Dec-2010'));
        const paymentOffset = new NoOffset();
        const notionalRisk = new DigitalNotionalRisk(paymentOffset, 100);
        const catBond = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBondEngine = new MonteCarloCatBondEngine(doomCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngine);
        setCouponPricer(catBond.cashflows(), pricer);
        const price = catBond.cleanPrice1();
        const yield1 = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const lossProbability = catBond.lossProbability();
        const exhaustionProbability = catBond.exhaustionProbability();
        const expectedLoss = catBond.expectedLoss();
        expect(Math.abs(lossProbability - 1.0)).toBeLessThan(tolerance);
        expect(Math.abs(exhaustionProbability - 1.0)).toBeLessThan(tolerance);
        expect(Math.abs(expectedLoss - 1.0)).toBeLessThan(tolerance);
        const catBondEngineRF = new MonteCarloCatBondEngine(noCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngineRF);
        const riskFreePrice = catBond.cleanPrice1();
        const riskFreeYield = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const riskFreeLossProbability = catBond.lossProbability();
        const riskFreeExhaustionProbability = catBond.exhaustionProbability();
        const riskFreeExpectedLoss = catBond.expectedLoss();
        expect(Math.abs(riskFreeLossProbability - 0.0)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreeExhaustionProbability - 0.0))
            .toBeLessThan(tolerance);
        expect(Math.abs(riskFreeExpectedLoss)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreePrice * 0.9 - price)).toBeLessThan(tolerance);
        expect(riskFreeYield).toBeLessThan(yield1);
    });
    it('Testing floating-rate cat bond in a doom once ' +
        'in 10 years scenario with proportional notional reduction...', () => {
        const vars = new CommonVars();
        const today = new Date('22-November-2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30-November-2004'), new Date('30-November-2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const events = [];
        events.push([new Date('30-November-2008').valueOf(), 1000]);
        const doomCatRisk = new EventSet(events, new Date('30-November-2004'), new Date('30-November-2044'));
        const noCatRisk = new EventSet([], new Date('1-Jan-2000'), new Date('31-Dec-2010'));
        const paymentOffset = new NoOffset();
        const notionalRisk = new ProportionalNotionalRisk(paymentOffset, 500, 1500);
        const catBond = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBondEngine = new MonteCarloCatBondEngine(doomCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngine);
        setCouponPricer(catBond.cashflows(), pricer);
        const price = catBond.cleanPrice1();
        const yield1 = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const lossProbability = catBond.lossProbability();
        const exhaustionProbability = catBond.exhaustionProbability();
        const expectedLoss = catBond.expectedLoss();
        expect(Math.abs(lossProbability - 0.1)).toBeLessThan(tolerance);
        expect(Math.abs(exhaustionProbability - 0.0)).toBeLessThan(tolerance);
        expect(Math.abs(expectedLoss - 0.05)).toBeLessThan(tolerance);
        const catBondEngineRF = new MonteCarloCatBondEngine(noCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngineRF);
        const riskFreePrice = catBond.cleanPrice1();
        const riskFreeYield = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const riskFreeLossProbability = catBond.lossProbability();
        const riskFreeExpectedLoss = catBond.expectedLoss();
        expect(Math.abs(riskFreeLossProbability - 0.0)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreeExpectedLoss)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreePrice * 0.95 - price)).toBeLessThan(tolerance);
        expect(riskFreeYield).toBeLessThan(yield1);
    });
    it('Testing floating-rate cat bond in a generated scenario' +
        ' with proportional notional reduction...', () => {
        const vars = new CommonVars();
        const today = new Date('22-November-2004');
        Settings.evaluationDate.set(today);
        const settlementDays = 1;
        const riskFreeRate = new Handle(flatRate2(today, 0.025, new Actual360()));
        const discountCurve = new Handle(flatRate2(today, 0.03, new Actual360()));
        const index = new USDLibor(new Period().init1(6, TimeUnit.Months), riskFreeRate);
        const fixingDays = 1;
        const tolerance = 1.0e-6;
        const pricer = new BlackIborCouponPricer(new Handle());
        const sch = new Schedule().init2(new Date('30-November-2004'), new Date('30-November-2008'), new Period().init2(Frequency.Semiannual), new UnitedStates(UnitedStates.Market.GovernmentBond), BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Backward, false);
        const betaCatRisk = new BetaRisk(5000, 50, 500, 500);
        const noCatRisk = new EventSet([], new Date('1-Jan-2000'), new Date('31-Dec-2010'));
        const paymentOffset = new NoOffset();
        const notionalRisk = new ProportionalNotionalRisk(paymentOffset, 500, 1500);
        const catBond = new FloatingCatBond().fcbInit1(settlementDays, vars.faceAmount, sch, index, new ActualActual(ActualActual.Convention.ISMA), notionalRisk, BusinessDayConvention.ModifiedFollowing, fixingDays, [], [], [], [], false, 100.0, new Date('30-November-2004'));
        const catBondEngine = new MonteCarloCatBondEngine(betaCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngine);
        setCouponPricer(catBond.cashflows(), pricer);
        const price = catBond.cleanPrice1();
        const yield1 = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const lossProbability = catBond.lossProbability();
        const exhaustionProbability = catBond.exhaustionProbability();
        const expectedLoss = catBond.expectedLoss();
        expect(lossProbability).toBeLessThan(1.0);
        expect(lossProbability).toBeGreaterThan(0.0);
        expect(exhaustionProbability).toBeLessThan(1.0);
        expect(exhaustionProbability).toBeGreaterThan(0.0);
        expect(expectedLoss).toBeGreaterThan(0.0);
        const catBondEngineRF = new MonteCarloCatBondEngine(noCatRisk, discountCurve);
        catBond.setPricingEngine(catBondEngineRF);
        const riskFreePrice = catBond.cleanPrice1();
        const riskFreeYield = catBond.yield1(new ActualActual(ActualActual.Convention.ISMA), Compounding.Simple, Frequency.Annual);
        const riskFreeLossProbability = catBond.lossProbability();
        const riskFreeExpectedLoss = catBond.expectedLoss();
        expect(Math.abs(riskFreeLossProbability - 0.0)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreeExpectedLoss)).toBeLessThan(tolerance);
        expect(Math.abs(riskFreePrice - price)).toBeLessThan(tolerance);
        expect(riskFreeYield).toBeLessThan(yield1);
    });
});