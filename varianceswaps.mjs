import { Actual365Fixed, Array2D, BlackScholesMertonProcess, BlackVarianceCurve, BlackVarianceSurface, DateExt, Handle, MakeMCVarianceSwapEngine, NullCalendar, Option, Position, PseudoRandom, ReplicatingVarianceSwapEngine, SimpleQuote, VarianceSwap } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';
import { flatRate1 } from '/test-suite/utilities.mjs';

class MCVarianceSwapData {
    constructor(type, varStrike, nominal, s, q, r, t1, t, v1, v, result, tol) {
        this.type = type;
        this.varStrike = varStrike;
        this.nominal = nominal;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t1 = t1;
        this.t = t;
        this.v1 = v1;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

class ReplicatingVarianceSwapData {
    constructor(type, varStrike, nominal, s, q, r, t, v, result, tol) {
        this.type = type;
        this.varStrike = varStrike;
        this.nominal = nominal;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

class Datum {
    constructor(type, strike, v) {
        this.type = type;
        this.strike = strike;
        this.v = v;
    }
}

describe('Variance swap tests', () => {
    it('Testing variance swap with replicating cost engine...', () => {
        const values = [
            new ReplicatingVarianceSwapData(Position.Type.Long, 0.04, 50000, 100.0, 0.00, 0.05, 0.246575, 0.20, 0.04189, 1.0e-4)
        ];
        const replicatingOptionData = [
            new Datum(Option.Type.Put, 50, 0.30),
            new Datum(Option.Type.Put, 55, 0.29),
            new Datum(Option.Type.Put, 60, 0.28),
            new Datum(Option.Type.Put, 65, 0.27),
            new Datum(Option.Type.Put, 70, 0.26),
            new Datum(Option.Type.Put, 75, 0.25),
            new Datum(Option.Type.Put, 80, 0.24),
            new Datum(Option.Type.Put, 85, 0.23),
            new Datum(Option.Type.Put, 90, 0.22),
            new Datum(Option.Type.Put, 95, 0.21),
            new Datum(Option.Type.Put, 100, 0.20),
            new Datum(Option.Type.Call, 100, 0.20),
            new Datum(Option.Type.Call, 105, 0.19),
            new Datum(Option.Type.Call, 110, 0.18),
            new Datum(Option.Type.Call, 115, 0.17),
            new Datum(Option.Type.Call, 120, 0.16),
            new Datum(Option.Type.Call, 125, 0.15),
            new Datum(Option.Type.Call, 130, 0.14),
            new Datum(Option.Type.Call, 135, 0.13)
        ];
        const dc = new Actual365Fixed();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 365 + 0.5));
            const dates = [exDate];
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            const options = replicatingOptionData.length;
            const callStrikes = [], putStrikes = [], callVols = [], putVols = [];
            let j;
            for (j = 0; j < options; j++) {
                if (replicatingOptionData[j].type === Option.Type.Call) {
                    callStrikes.push(replicatingOptionData[j].strike);
                    callVols.push(replicatingOptionData[j].v);
                }
                else if (replicatingOptionData[j].type === Option.Type.Put) {
                    putStrikes.push(replicatingOptionData[j].strike);
                    putVols.push(replicatingOptionData[j].v);
                }
                else {
                    throw new Error('unknown option type');
                }
            }
            const vols = Array2D.newMatrix(options - 1, 1);
            const strikes = [];
            for (j = 0; j < putVols.length; j++) {
                vols[j][0] = putVols[j];
                strikes.push(putStrikes[j]);
            }
            for (let k = 1; k < callVols.length; k++) {
                const j = putVols.length - 1;
                vols[j + k][0] = callVols[k];
                strikes.push(callStrikes[k]);
            }
            const volTS = new BlackVarianceSurface(today, new NullCalendar(), dates, strikes, vols, dc);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new ReplicatingVarianceSwapEngine(stochProcess, 5.0, callStrikes, putStrikes);
            const varianceSwap = new VarianceSwap(values[i].type, values[i].varStrike, values[i].nominal, today, exDate);
            varianceSwap.setPricingEngine(engine);
            const calculated = varianceSwap.variance();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
    it('Testing variance swap with Monte Carlo engine...', () => {
        const values = [
            new MCVarianceSwapData(Position.Type.Long, 0.04, 50000, 100.0, 0.00, 0.05, 0.1, 0.246575, 0.1, 0.20, 0.04, 3.0e-4)
        ];
        const dc = new Actual365Fixed();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vols = new Array(2);
        const dates = new Array(2);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 365 + 0.5));
            const intermDate = DateExt.add(today, Math.floor(values[i].t1 * 365 + 0.5));
            dates[0] = intermDate;
            dates[1] = exDate;
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vols[0] = values[i].v1;
            vols[1] = values[i].v;
            const volTS = new BlackVarianceCurve(today, dates, vols, dc, true);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new MakeMCVarianceSwapEngine(new PseudoRandom())
                .init(stochProcess)
                .withStepsPerYear(250)
                .withSamples(1023)
                .withSeed(42)
                .f();
            const varianceSwap = new VarianceSwap(values[i].type, values[i].varStrike, values[i].nominal, today, exDate);
            varianceSwap.setPricingEngine(engine);
            const calculated = varianceSwap.variance();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
});