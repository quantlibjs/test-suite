import { Actual360, AmericanExercise, AnalyticDoubleBarrierBinaryEngine, BinomialDoubleBarrierEngine, BlackScholesMertonProcess, CashOrNothingPayoff, CoxRossRubinstein, DateExt, DiscretizedDoubleBarrierOption, DoubleBarrier, DoubleBarrierOption, EuropeanExercise, Handle, Option, SimpleQuote } from '/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';
class DoubleBinaryOptionData {
    constructor(barrierType, barrier_lo, barrier_hi, cash, s, q, r, t, v, result, tol) {
        this.barrierType = barrierType;
        this.barrier_lo = barrier_lo;
        this.barrier_hi = barrier_hi;
        this.cash = cash;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}
describe('DoubleBinary', () => {
    it('Testing cash-or-nothing double barrier options against Haug\'s values...', () => {
        const values = [
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 9.8716, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 8.9307, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 6.3272, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 1.9094, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 9.7961, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 7.2300, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 3.7100, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 0.4271, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 8.9054, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 3.6752, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 0.7960, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 0.0059, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 3.6323, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 0.0911, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 0.0002, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 0.2402, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 1.4076, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 3.8160, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0075, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 0.9910, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 2.8098, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 4.6612, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.2656, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 2.7954, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 4.4024, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 4.9266, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 2.6285, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 4.7523, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 4.9096, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 4.9675, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0042, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 0.9450, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 3.5486, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 7.9663, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0797, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 2.6458, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 6.1658, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 9.4486, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.9704, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 6.2006, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 9.0798, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 9.8699, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 6.2434, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 9.7847, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 9.8756, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 9.8758, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0041, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 0.7080, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 2.1581, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 80.00, 120.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 4.2061, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.0723, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 1.6663, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 3.3930, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 85.00, 115.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 4.8679, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 0.7080, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 3.4424, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 4.7496, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 90.00, 110.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 5.0475, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.10, 3.6524, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.20, 5.1256, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.30, 5.0763, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 100.00, 0.02, 0.05, 0.25, 0.50, 5.0275, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 80.00, 0.02, 0.05, 0.25, 0.10, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockOut, 95.00, 105.00, 10.00, 110.00, 0.02, 0.05, 0.25, 0.10, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 80.00, 0.02, 0.05, 0.25, 0.10, 10.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KnockIn, 95.00, 105.00, 10.00, 110.00, 0.02, 0.05, 0.25, 0.10, 10.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 80.00, 0.02, 0.05, 0.25, 0.10, 10.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KIKO, 95.00, 105.00, 10.00, 110.00, 0.02, 0.05, 0.25, 0.10, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 80.00, 0.02, 0.05, 0.25, 0.10, 0.0000, 1e-4),
            new DoubleBinaryOptionData(DoubleBarrier.Type.KOKI, 95.00, 105.00, 10.00, 110.00, 0.02, 0.05, 0.25, 0.10, 10.0000, 1e-4)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new CashOrNothingPayoff(Option.Type.Call, 0, values[i].cash);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            let exercise;
            if (values[i].barrierType === DoubleBarrier.Type.KIKO ||
                values[i].barrierType === DoubleBarrier.Type.KOKI) {
                exercise = new AmericanExercise().init1(today, exDate);
            }
            else {
                exercise = new EuropeanExercise(exDate);
            }
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            let engine = new AnalyticDoubleBarrierBinaryEngine().init1(stochProcess);
            const opt = new DoubleBarrierOption(values[i].barrierType, values[i].barrier_lo, values[i].barrier_hi, 0, payoff, exercise);
            opt.setPricingEngine(engine);
            let calculated = opt.NPV();
            let expected = values[i].result;
            let error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
            const steps = 500;
            engine =
                new BinomialDoubleBarrierEngine(new CoxRossRubinstein(), new DiscretizedDoubleBarrierOption())
                    .bdbeInit(stochProcess, steps);
            opt.setPricingEngine(engine);
            calculated = opt.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            const tol = 0.22;
            expect(error).toBeLessThan(tol);
        }
    });
});
//# sourceMappingURL=doublebinaryoption.js.map