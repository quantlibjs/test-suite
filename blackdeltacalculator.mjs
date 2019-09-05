import { Actual360, AnalyticEuropeanEngine, BlackConstantVol, BlackDeltaCalculator, BlackScholesMertonProcess, DateExt, DeltaVolQuote, EuropeanExercise, EuropeanOption, FlatForward, Handle, Option, PlainVanillaPayoff, SavedSettings, SimpleQuote, TARGET } from '/ql.mjs';
function timeToDays(t) {
    return Math.floor(t * 360 + 0.5);
}
class DeltaData {
    constructor(ot, dt, spot, dDf, fDf, stdDev, strike, value) {
        this.ot = ot;
        this.dt = dt;
        this.spot = spot;
        this.dDf = dDf;
        this.fDf = fDf;
        this.stdDev = stdDev;
        this.strike = strike;
        this.value = value;
    }
}
class EuropeanOptionData {
    constructor(type, strike, s, q, r, t, v, result, tol) {
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}
describe('Black delta calculator tests', () => {
    it('Testing delta calculator values...', () => {
        const values = [
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, 1.421, 0.997306, 0.992266, 0.1180654, 1.608080, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaSpot, 1.421, 0.997306, 0.992266, 0.1180654, 1.600545, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Fwd, 1.421, 0.997306, 0.992266, 0.1180654, 1.609029, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaFwd, 1.421, 0.997306, 0.992266, 0.1180654, 1.601550, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, 122.121, 0.9695434, 0.9872347, 0.0887676, 119.8031, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaSpot, 122.121, 0.9695434, 0.9872347, 0.0887676, 117.7096, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Fwd, 122.121, 0.9695434, 0.9872347, 0.0887676, 120.0592, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaFwd, 122.121, 0.9695434, 0.9872347, 0.0887676, 118.0532, 0.67),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Spot, 3.4582, 0.99979, 0.9250616, 0.3199034, 4.964924, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaSpot, 3.4582, 0.99979, 0.9250616, 0.3199034, 3.778327, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Fwd, 3.4582, 0.99979, 0.9250616, 0.3199034, 4.51896, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaFwd, 3.4582, 0.99979, 0.9250616, 0.3199034, 3.65728, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Spot, 103.00, 0.99482, 0.98508, 0.07247845, 97.47, -0.25),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaSpot, 103.00, 0.99482, 0.98508, 0.07247845, 97.22, -0.25)
        ];
        let currOt;
        let currDt;
        let currSpot;
        let currdDf;
        let currfDf;
        let currStdDev;
        let currStrike;
        let expected;
        let currDelta;
        let calculated;
        let error;
        let tolerance;
        for (let i = 0; i < values.length; i++) {
            currOt = values[i].ot;
            currDt = values[i].dt;
            currSpot = values[i].spot;
            currdDf = values[i].dDf;
            currfDf = values[i].fDf;
            currStdDev = values[i].stdDev;
            currStrike = values[i].strike;
            currDelta = values[i].value;
            const myCalc = new BlackDeltaCalculator(currOt, currDt, currSpot, currdDf, currfDf, currStdDev);
            tolerance = 1.0e-3;
            expected = currDelta;
            calculated = myCalc.deltaFromStrike(currStrike);
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
        }
    });
    it('Testing premium-adjusted delta price consistency...', () => {
        const backup = new SavedSettings();
        const values = [
            new EuropeanOptionData(Option.Type.Call, 0.9123, 1.2212, 0.0231, 0.0000, 0.25, 0.301, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 0.9234, 1.2212, 0.0231, 0.0000, 0.35, 0.111, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 0.9783, 1.2212, 0.0231, 0.0000, 0.45, 0.071, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.0000, 1.2212, 0.0231, 0.0000, 0.55, 0.082, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.1230, 1.2212, 0.0231, 0.0000, 0.65, 0.012, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.2212, 1.2212, 0.0231, 0.0000, 0.75, 0.129, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.3212, 1.2212, 0.0231, 0.0000, 0.85, 0.034, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.3923, 1.2212, 0.0131, 0.2344, 0.95, 0.001, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Call, 1.3455, 1.2212, 0.0000, 0.0000, 1.00, 0.127, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 0.9123, 1.2212, 0.0231, 0.0000, 0.25, 0.301, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 0.9234, 1.2212, 0.0231, 0.0000, 0.35, 0.111, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 0.9783, 1.2212, 0.0231, 0.0000, 0.45, 0.071, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.0000, 1.2212, 0.0231, 0.0000, 0.55, 0.082, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.1230, 1.2212, 0.0231, 0.0000, 0.65, 0.012, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.2212, 1.2212, 0.0231, 0.0000, 0.75, 0.129, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.3212, 1.2212, 0.0231, 0.0000, 0.85, 0.034, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.3923, 1.2212, 0.0131, 0.2344, 0.95, 0.001, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.3455, 1.2212, 0.0000, 0.0000, 1.00, 0.127, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 1.3455, 1.2212, 0.0000, 0.0000, 0.50, 0.000, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 0.0000, 1.2212, 0.0000, 0.0000, 1.50, 0.133, 0.0, 0.0),
            new EuropeanOptionData(Option.Type.Put, 0.0000, 1.2212, 0.0000, 0.0000, 1.00, 0.133, 0.0, 0.0),
        ];
        const dc = new Actual360();
        const calendar = new TARGET();
        const today = new Date();
        let discFor = 0.0;
        let discDom = 0.0;
        let implVol = 0.0;
        let expectedVal = 0.0;
        let calculatedVal = 0.0;
        let error = 0.0;
        const spotQuote = new SimpleQuote(0.0);
        const spotHandle = new Handle(spotQuote);
        const qQuote = new SimpleQuote(0.0);
        const qHandle = new Handle(qQuote);
        const qTS = new FlatForward().ffInit1(today, qHandle, dc);
        const rQuote = new SimpleQuote(0.0);
        const rHandle = new Handle(qQuote);
        const rTS = new FlatForward().ffInit1(today, rHandle, dc);
        const volQuote = new SimpleQuote(0.0);
        const volHandle = new Handle(volQuote);
        const volTS = new BlackConstantVol().bcvInit2(today, calendar, volHandle, dc);
        let stochProcess;
        let engine;
        let payoff;
        let exDate;
        let exercise;
        const tolerance = 1.0e-10;
        for (let i = 0; i < values.length; ++i) {
            payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            exDate = DateExt.add(today, timeToDays(values[i].t));
            exercise = new EuropeanExercise(exDate);
            spotQuote.setValue(values[i].s);
            volQuote.setValue(values[i].v);
            rQuote.setValue(values[i].r);
            qQuote.setValue(values[i].q);
            discDom = rTS.discount1(exDate);
            discFor = qTS.discount1(exDate);
            implVol = Math.sqrt(volTS.blackVariance1(exDate, 0.0));
            const myCalc = new BlackDeltaCalculator(values[i].type, DeltaVolQuote.DeltaType.PaSpot, spotQuote.value(), discDom, discFor, implVol);
            stochProcess = new BlackScholesMertonProcess(spotHandle, new Handle(qTS), new Handle(rTS), new Handle(volTS));
            engine = new AnalyticEuropeanEngine().init1(stochProcess);
            const option = new EuropeanOption(payoff, exercise);
            option.setPricingEngine(engine);
            calculatedVal = myCalc.deltaFromStrike(values[i].strike);
            expectedVal = option.delta() - option.NPV() / spotQuote.value();
            error = Math.abs(expectedVal - calculatedVal);
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
    it('Testing put-call parity for deltas...', () => {
        const backup = new SavedSettings();
        const values = [
            new EuropeanOptionData(Option.Type.Call, 65.00, 60.00, 0.00, 0.08, 0.25, 0.30, 2.1334, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 95.00, 100.00, 0.05, 0.10, 0.50, 0.20, 2.4648, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 19.00, 19.00, 0.10, 0.10, 0.75, 0.28, 1.7011, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 19.00, 19.00, 0.10, 0.10, 0.75, 0.28, 1.7011, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 1.60, 1.56, 0.08, 0.06, 0.50, 0.12, 0.0291, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 70.00, 75.00, 0.05, 0.10, 0.50, 0.35, 4.0870, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 0.0205, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 9.9413, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 0.3150, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1217, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 10.3556, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 0.9474, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3693, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 11.1381, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 0.8069, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0232, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 10.5769, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 2.7026, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.6997, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 12.7857, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 4.9329, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.3679, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 15.3086, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.15, 9.9210, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.15, 1.8734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.15, 0.0408, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.25, 10.2155, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.25, 3.1217, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.25, 0.4551, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.10, 0.35, 10.8479, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.10, 0.35, 4.3693, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.10, 0.35, 1.2376, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.15, 10.3192, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.15, 4.0232, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.15, 1.0646, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.25, 12.2149, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.25, 6.6997, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.25, 3.2734, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 90.00, 0.10, 0.10, 0.50, 0.35, 14.4452, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 100.00, 0.10, 0.10, 0.50, 0.35, 9.3679, 1.0e-4),
            new EuropeanOptionData(Option.Type.Put, 100.00, 110.00, 0.10, 0.10, 0.50, 0.35, 5.7963, 1.0e-4),
            new EuropeanOptionData(Option.Type.Call, 40.00, 42.00, 0.08, 0.04, 0.75, 0.35, 5.0975, 1.0e-4)
        ];
        const dc = new Actual360();
        const calendar = new TARGET();
        const today = new Date();
        let discFor = 0.0;
        let discDom = 0.0;
        let implVol = 0.0;
        let deltaCall = 0.0;
        let deltaPut = 0.0;
        let expectedDiff = 0.0;
        let calculatedDiff = 0.0;
        let error = 0.0;
        let forward = 0.0;
        const spotQuote = new SimpleQuote(0.0);
        const qQuote = new SimpleQuote(0.0);
        const qHandle = new Handle(qQuote);
        const qTS = new FlatForward().ffInit1(today, qHandle, dc);
        const rQuote = new SimpleQuote(0.0);
        const rHandle = new Handle(qQuote);
        const rTS = new FlatForward().ffInit1(today, rHandle, dc);
        const volQuote = new SimpleQuote(0.0);
        const volHandle = new Handle(volQuote);
        const volTS = new BlackConstantVol().bcvInit2(today, calendar, volHandle, dc);
        let exDate;
        const tolerance = 1.0e-10;
        for (let i = 0; i < values.length; ++i) {
            exDate = DateExt.add(today, timeToDays(values[i].t));
            spotQuote.setValue(values[i].s);
            volQuote.setValue(values[i].v);
            rQuote.setValue(values[i].r);
            qQuote.setValue(values[i].q);
            discDom = rTS.discount1(exDate);
            discFor = qTS.discount1(exDate);
            implVol = Math.sqrt(volTS.blackVariance1(exDate, 0.0));
            forward = spotQuote.value() * discFor / discDom;
            const myCalc = new BlackDeltaCalculator(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, spotQuote.value(), discDom, discFor, implVol);
            deltaCall = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Put);
            deltaPut = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Call);
            expectedDiff = discFor;
            calculatedDiff = deltaCall - deltaPut;
            error = Math.abs(expectedDiff - calculatedDiff);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.Fwd);
            deltaCall = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Put);
            deltaPut = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Call);
            expectedDiff = 1.0;
            calculatedDiff = deltaCall - deltaPut;
            error = Math.abs(expectedDiff - calculatedDiff);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.PaSpot);
            deltaCall = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Put);
            deltaPut = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Call);
            expectedDiff = discFor * values[i].strike / forward;
            calculatedDiff = deltaCall - deltaPut;
            error = Math.abs(expectedDiff - calculatedDiff);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.PaFwd);
            deltaCall = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Put);
            deltaPut = myCalc.deltaFromStrike(values[i].strike);
            myCalc.setOptionType(Option.Type.Call);
            expectedDiff = values[i].strike / forward;
            calculatedDiff = deltaCall - deltaPut;
            error = Math.abs(expectedDiff - calculatedDiff);
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
    it('Testing delta-neutral ATM quotations...', () => {
        const backup = new SavedSettings();
        const values = [
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, 1.421, 0.997306, 0.992266, 0.1180654, 1.608080, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaSpot, 1.421, 0.997306, 0.992266, 0.1180654, 1.600545, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Fwd, 1.421, 0.997306, 0.992266, 0.1180654, 1.609029, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaFwd, 1.421, 0.997306, 0.992266, 0.1180654, 1.601550, 0.15),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, 122.121, 0.9695434, 0.9872347, 0.0887676, 119.8031, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaSpot, 122.121, 0.9695434, 0.9872347, 0.0887676, 117.7096, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Fwd, 122.121, 0.9695434, 0.9872347, 0.0887676, 120.0592, 0.67),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.PaFwd, 122.121, 0.9695434, 0.9872347, 0.0887676, 118.0532, 0.67),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Spot, 3.4582, 0.99979, 0.9250616, 0.3199034, 4.964924, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaSpot, 3.4582, 0.99979, 0.9250616, 0.3199034, 3.778327, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Fwd, 3.4582, 0.99979, 0.9250616, 0.3199034, 4.51896, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaFwd, 3.4582, 0.99979, 0.9250616, 0.3199034, 3.65728, -0.821),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.Spot, 103.00, 0.99482, 0.98508, 0.07247845, 97.47, -0.25),
            new DeltaData(Option.Type.Put, DeltaVolQuote.DeltaType.PaSpot, 103.00, 0.99482, 0.98508, 0.07247845, 97.22, -0.25),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Fwd, 103.00, 0.99482, 0.98508, 0.0, 101.0013, 0.5),
            new DeltaData(Option.Type.Call, DeltaVolQuote.DeltaType.Spot, 103.00, 0.99482, 0.98508, 0.0, 101.0013, 0.99482 * 0.5)
        ];
        let currDt;
        let currSpot;
        let currdDf;
        let currfDf;
        let currStdDev;
        let expected;
        let calculated;
        let error;
        const tolerance = 1.0e-2;
        let currAtmStrike;
        let currCallDelta;
        let currPutDelta;
        let currFwd;
        for (let i = 0; i < values.length; i++) {
            currDt = values[i].dt;
            currSpot = values[i].spot;
            currdDf = values[i].dDf;
            currfDf = values[i].fDf;
            currStdDev = values[i].stdDev;
            currFwd = currSpot * currfDf / currdDf;
            const myCalc = new BlackDeltaCalculator(Option.Type.Call, currDt, currSpot, currdDf, currfDf, currStdDev);
            currAtmStrike = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmDeltaNeutral);
            currCallDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Put);
            currPutDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Call);
            expected = 0.0;
            calculated = currCallDelta + currPutDelta;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.Fwd);
            currAtmStrike = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmDeltaNeutral);
            currCallDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Put);
            currPutDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Call);
            expected = 0.0;
            calculated = currCallDelta + currPutDelta;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.PaSpot);
            currAtmStrike = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmDeltaNeutral);
            currCallDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Put);
            currPutDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Call);
            expected = 0.0;
            calculated = currCallDelta + currPutDelta;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.PaFwd);
            currAtmStrike = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmDeltaNeutral);
            currCallDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Put);
            currPutDelta = myCalc.deltaFromStrike(currAtmStrike);
            myCalc.setOptionType(Option.Type.Call);
            expected = 0.0;
            calculated = currCallDelta + currPutDelta;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(tolerance);
            calculated = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmFwd);
            expected = currFwd;
            error = Math.abs(expected - calculated);
            expect(error).toBeLessThan(tolerance);
            myCalc.setDeltaType(DeltaVolQuote.DeltaType.Fwd);
            const atmFiftyStrike = myCalc.atmStrike(DeltaVolQuote.AtmType.AtmPutCall50);
            calculated = Math.abs(myCalc.deltaFromStrike(atmFiftyStrike));
            expected = 0.50;
            error = Math.abs(expected - calculated);
            expect(error).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});
//# sourceMappingURL=blackdeltacalculator.js.map