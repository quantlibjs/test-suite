import { Actual360, AnalyticCompoundOptionEngine, AnalyticEuropeanEngine, BlackConstantVol, BlackScholesMertonProcess, CompoundOption, DateExt, EuropeanExercise, EuropeanOption, FlatForward, Handle, NullCalendar, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function timeToDays(t) {
    return Math.floor(t * 360 + 0.5);
}

class CompoundOptionData {
    constructor(typeMother, typeDaughter, strikeMother, strikeDaughter, s, q, r, tMother, tDaughter, v, npv = null, tol = null, delta = null, gamma = null, vega = null, theta = null) {
        this.typeMother = typeMother;
        this.typeDaughter = typeDaughter;
        this.strikeMother = strikeMother;
        this.strikeDaughter = strikeDaughter;
        this.s = s;
        this.q = q;
        this.r = r;
        this.tMother = tMother;
        this.tDaughter = tDaughter;
        this.v = v;
        this.npv = npv;
        this.tol = tol;
        this.delta = delta;
        this.gamma = gamma;
        this.vega = vega;
        this.theta = theta;
    }
}
describe('Compound option tests', () => {
    it('Testing compound-option put-call parity...', () => {
        const values = [
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17),
        ];
        const backup = new SavedSettings();
        const dc = new Actual360();
        const todaysDate = Settings.evaluationDate.f();
        const spot = new SimpleQuote(0.0);
        const rRate = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const vol = new SimpleQuote(0.0);
        const rTS = new FlatForward().ffInit3(0, new NullCalendar(), new Handle(rRate), dc);
        const qTS = new FlatForward().ffInit3(0, new NullCalendar(), new Handle(qRate), dc);
        const volTS = new BlackConstantVol().bcvInit2(todaysDate, new NullCalendar(), new Handle(vol), dc);
        for (let i = 0; i < values.length; i++) {
            const payoffMotherCall = new PlainVanillaPayoff(Option.Type.Call, values[i].strikeMother);
            const payoffMotherPut = new PlainVanillaPayoff(Option.Type.Put, values[i].strikeMother);
            const payoffDaughter = new PlainVanillaPayoff(values[i].typeDaughter, values[i].strikeDaughter);
            const matDateMom = DateExt.add(todaysDate, timeToDays(values[i].tMother));
            const matDateDaughter = DateExt.add(todaysDate, timeToDays(values[i].tDaughter));
            const exerciseCompound = new EuropeanExercise(matDateMom);
            const exerciseDaughter = new EuropeanExercise(matDateDaughter);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const compoundOptionCall = new CompoundOption(payoffMotherCall, exerciseCompound, payoffDaughter, exerciseDaughter);
            const compoundOptionPut = new CompoundOption(payoffMotherPut, exerciseCompound, payoffDaughter, exerciseDaughter);
            const vanillaOption = new EuropeanOption(payoffDaughter, exerciseDaughter);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engineCompound = new AnalyticCompoundOptionEngine(stochProcess);
            const engineEuropean = new AnalyticEuropeanEngine().init1(stochProcess);
            compoundOptionCall.setPricingEngine(engineCompound);
            compoundOptionPut.setPricingEngine(engineCompound);
            vanillaOption.setPricingEngine(engineEuropean);
            const discFact = rTS.discount1(matDateMom);
            const discStrike = values[i].strikeMother * discFact;
            const calculated = compoundOptionCall.NPV() + discStrike -
                compoundOptionPut.NPV() - vanillaOption.NPV();
            const expected = 0.0;
            const error = Math.abs(calculated - expected);
            const tolerance = 1.0e-8;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
    it('Testing compound-option values and greeks...', () => {
        const values = [
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35, 21.1965, 1.0e-3, -0.1966, 0.0007, -32.1241, -3.3837),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35, 17.5945, 1.0e-3, 0.3219, 0.0038, 106.5185, -65.1614),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35, 18.7128, 1.0e-3, -0.2906, 0.0036, 103.3856, -46.6982),
            new CompoundOptionData(Option.Type.Put, Option.Type.Put, 50.0, 520.0, 500.0, 0.03, 0.08, 0.25, 0.5, 0.35, 15.2601, 1.0e-3, 0.1760, 0.0005, -35.2570, -10.1126),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11, 0.0729, 1.0e-3, 0.6614, 2.5762, 0.5812, -0.0297),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11, 0.0074, 1.0e-3, -0.1334, 1.9681, 0.2933, -0.0155),
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11, 0.0021, 1.0e-3, -0.0426, 0.7252, -0.0052, -0.0058),
            new CompoundOptionData(Option.Type.Put, Option.Type.Put, 0.05, 1.14, 1.20, 0.0, 0.01, 0.5, 2.0, 0.11, 0.0192, 1.0e-3, 0.1626, 0.1171, -0.2931, -0.0028),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22, 0.4419, 1.0e-3, 0.1049, 0.0195, 11.3368, -6.2871),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22, 2.6112, 1.0e-3, -0.3618, 0.0337, 28.4843, -13.4124),
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22, 4.1616, 1.0e-3, -0.3174, 0.0024, -26.6403, -2.2720),
            new CompoundOptionData(Option.Type.Put, Option.Type.Put, 10.0, 122.0, 120.0, 0.06, 0.02, 0.1, 0.7, 0.22, 1.0914, 1.0e-3, 0.1748, 0.0165, -9.4928, -4.8995),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08, 0.0099, 1.0e-3, 0.0285, 0.0688, 0.7764, -0.0027),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08, 0.9826, 1.0e-3, -0.7224, 0.2158, 2.7279, -0.3332),
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08, 0.3585, 1.0e-3, -0.0720, -0.0835, -1.5633, -0.0117),
            new CompoundOptionData(Option.Type.Put, Option.Type.Put, 0.4, 8.2, 8.0, 0.05, 0.00, 2.0, 3.0, 0.08, 0.0168, 1.0e-3, 0.0378, 0.0635, 0.3882, 0.0021),
            new CompoundOptionData(Option.Type.Call, Option.Type.Call, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17, 0.0680, 1.0e-3, 0.4937, 2.1271, 0.4418, -0.0843),
            new CompoundOptionData(Option.Type.Call, Option.Type.Put, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17, 0.0605, 1.0e-3, -0.4169, 2.0836, 0.4330, -0.0697),
            new CompoundOptionData(Option.Type.Put, Option.Type.Call, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17, 0.0081, 1.0e-3, -0.0417, 0.0761, -0.0045, -0.0020),
            new CompoundOptionData(Option.Type.Put, Option.Type.Put, 0.02, 1.6, 1.6, 0.013, 0.022, 0.45, 0.5, 0.17, 0.0078, 1.0e-3, 0.0413, 0.0326, -0.0133, -0.0016)
        ];
        const backup = new SavedSettings();
        const dc = new Actual360();
        const todaysDate = Settings.evaluationDate.f();
        const spot = new SimpleQuote(0.0);
        const rRate = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const vol = new SimpleQuote(0.0);
        const rTS = new FlatForward().ffInit3(0, new NullCalendar(), new Handle(rRate), dc);
        const qTS = new FlatForward().ffInit3(0, new NullCalendar(), new Handle(qRate), dc);
        const volTS = new BlackConstantVol().bcvInit2(todaysDate, new NullCalendar(), new Handle(vol), dc);
        for (let i = 0; i < values.length; i++) {
            const payoffMother = new PlainVanillaPayoff(values[i].typeMother, values[i].strikeMother);
            const payoffDaughter = new PlainVanillaPayoff(values[i].typeDaughter, values[i].strikeDaughter);
            const matDateMom = DateExt.add(todaysDate, timeToDays(values[i].tMother));
            const matDateDaughter = DateExt.add(todaysDate, timeToDays(values[i].tDaughter));
            const exerciseMother = new EuropeanExercise(matDateMom);
            const exerciseDaughter = new EuropeanExercise(matDateDaughter);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const compoundOption = new CompoundOption(payoffMother, exerciseMother, payoffDaughter, exerciseDaughter);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engineCompound = new AnalyticCompoundOptionEngine(stochProcess);
            compoundOption.setPricingEngine(engineCompound);
            let calculated = compoundOption.NPV();
            let error = Math.abs(calculated - values[i].npv);
            let tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
            calculated = compoundOption.delta();
            error = Math.abs(calculated - values[i].delta);
            tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
            calculated = compoundOption.gamma();
            error = Math.abs(calculated - values[i].gamma);
            tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
            calculated = compoundOption.vega();
            error = Math.abs(calculated - values[i].vega);
            tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
            calculated = compoundOption.theta();
            error = Math.abs(calculated - values[i].theta);
            tolerance = values[i].tol;
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});