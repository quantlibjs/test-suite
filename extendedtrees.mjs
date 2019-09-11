import { Actual360, AnalyticEuropeanEngine, BinomialVanillaEngine, BlackScholesMertonProcess, DateExt, EuropeanExercise, EuropeanOption, ExtendedAdditiveEQPBinomialTree, ExtendedCoxRossRubinstein, ExtendedJarrowRudd, ExtendedJoshi4, ExtendedLeisenReimer, ExtendedTian, ExtendedTrigeorgis, Handle, Option, PlainVanillaPayoff, QL_NULL_INTEGER, SavedSettings, SimpleQuote } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate1, flatVol1, relativeError } from '/test-suite/utilities.mjs';

const first = 0;

// enum EngineType
var EngineType;
(function (EngineType) {
    EngineType[EngineType["Analytic"] = 0] = "Analytic";
    EngineType[EngineType["JR"] = 1] = "JR";
    EngineType[EngineType["CRR"] = 2] = "CRR";
    EngineType[EngineType["EQP"] = 3] = "EQP";
    EngineType[EngineType["TGEO"] = 4] = "TGEO";
    EngineType[EngineType["TIAN"] = 5] = "TIAN";
    EngineType[EngineType["LR"] = 6] = "LR";
    EngineType[EngineType["JOSHI"] = 7] = "JOSHI";
})(EngineType || (EngineType = {}));

function makeProcess(u, q, r, vol) {
    return new BlackScholesMertonProcess(new Handle(u), new Handle(q), new Handle(r), new Handle(vol));
}

function makeOption(payoff, exercise, u, q, r, vol, engineType, binomialSteps) {
    const stochProcess = makeProcess(u, q, r, vol);
    let engine;
    switch (engineType) {
        case EngineType.Analytic:
            engine = new AnalyticEuropeanEngine().init1(stochProcess);
            break;
        case EngineType.JR:
            engine = new BinomialVanillaEngine(new ExtendedJarrowRudd())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.CRR:
            engine = new BinomialVanillaEngine(new ExtendedCoxRossRubinstein())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.EQP:
            engine = new BinomialVanillaEngine(new ExtendedAdditiveEQPBinomialTree())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.TGEO:
            engine = new BinomialVanillaEngine(new ExtendedTrigeorgis())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.TIAN:
            engine = new BinomialVanillaEngine(new ExtendedTian())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.LR:
            engine = new BinomialVanillaEngine(new ExtendedLeisenReimer())
                .bveInit(stochProcess, binomialSteps);
            break;
        case EngineType.JOSHI:
            engine = new BinomialVanillaEngine(new ExtendedJoshi4())
                .bveInit(stochProcess, binomialSteps);
            break;
        default:
            throw new Error('unknown engine type');
    }
    const option = new EuropeanOption(payoff, exercise);
    option.setPricingEngine(engine);
    return option;
}

function testEngineConsistency(engine, binomialSteps, tolerance) {
    const calculated = new Map(), expected = new Map();
    const types = [Option.Type.Call, Option.Type.Put];
    const strikes = [75.0, 100.0, 125.0];
    const lengths = [1];
    const underlyings = [100.0];
    const qRates = [0.00, 0.05];
    const rRates = [0.01, 0.05, 0.15];
    const vols = [0.11, 0.50, 1.20];
    const dc = new Actual360();
    const today = new Date();
    const spot = new SimpleQuote(0.0);
    const vol = new SimpleQuote(0.0);
    const volTS = flatVol1(today, vol, dc);
    const qRate = new SimpleQuote(0.0);
    const qTS = flatRate1(today, qRate, dc);
    const rRate = new SimpleQuote(0.0);
    const rTS = flatRate1(today, rRate, dc);
    for (let i = 0; i < types.length; i++) {
        for (let j = 0; j < strikes.length; j++) {
            for (let k = 0; k < lengths.length; k++) {
                const exDate = DateExt.add(today, lengths[k] * 360);
                const exercise = new EuropeanExercise(exDate);
                const payoff = new PlainVanillaPayoff(types[i], strikes[j]);
                const refOption = makeOption(payoff, exercise, spot, qTS, rTS, volTS, EngineType.Analytic, QL_NULL_INTEGER);
                const option = makeOption(payoff, exercise, spot, qTS, rTS, volTS, engine, binomialSteps);
                for (let l = 0; l < underlyings.length; l++) {
                    for (let m = 0; m < qRates.length; m++) {
                        for (let n = 0; n < rRates.length; n++) {
                            for (let p = 0; p < vols.length; p++) {
                                const u = underlyings[l];
                                const q = qRates[m], r = rRates[n];
                                const v = vols[p];
                                spot.setValue(u);
                                qRate.setValue(q);
                                rRate.setValue(r);
                                vol.setValue(v);
                                expected.clear();
                                calculated.clear();
                                expected.set('value', refOption.NPV());
                                calculated.set('value', option.NPV());
                                if (option.NPV() > spot.value() * 1.0e-5) {
                                    expected.set('delta', refOption.delta());
                                    expected.set('gamma', refOption.gamma());
                                    expected.set('theta', refOption.theta());
                                    calculated.set('delta', option.delta());
                                    calculated.set('gamma', option.gamma());
                                    calculated.set('theta', option.theta());
                                }
                                let it;
                                const calculatedArray = Array.from(calculated);
                                for (it = 0; it <= calculatedArray.length; ++it) {
                                    const greek = calculatedArray[it][first];
                                    const expct = expected.get(greek), calcl = calculated.get(greek), tol = tolerance.get(greek);
                                    const error = relativeError(expct, calcl, u);
                                    expect(error).toBeLessThan(tol);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

describe('European option extended trees tests', () => {
    it('Testing time-dependent JR binomial European engines' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.JR;
        const steps = 251;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent CRR binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.CRR;
        const steps = 501;
        const relativeTol = new Map();
        relativeTol.set('value', 0.02);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent EQP binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.EQP;
        const steps = 501;
        const relativeTol = new Map();
        relativeTol.set('value', 0.02);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent TGEO binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.TGEO;
        const steps = 251;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent TIAN binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.TIAN;
        const steps = 251;
        const relativeTol = new Map();
        relativeTol.set('value', 0.002);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent LR binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.LR;
        const steps = 251;
        const relativeTol = new Map();
        relativeTol.set('value', 1.0e-6);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
    it('Testing time-dependent Joshi binomial European engines ' +
        ' against analytic results...', () => {
        const backup = new SavedSettings();
        const engine = EngineType.JOSHI;
        const steps = 251;
        const relativeTol = new Map();
        relativeTol.set('value', 1.0e-7);
        relativeTol.set('delta', 1.0e-3);
        relativeTol.set('gamma', 1.0e-4);
        relativeTol.set('theta', 0.03);
        testEngineConsistency(engine, steps, relativeTol);
        backup.dispose();
    });
});