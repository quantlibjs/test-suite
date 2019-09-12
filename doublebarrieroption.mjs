import { Actual360, AnalyticDoubleBarrierEngine, BinomialDoubleBarrierEngine, blackFormula1, BlackScholesMertonProcess, CoxRossRubinstein, DateExt, DeltaVolQuote, DiscretizedDermanKaniDoubleBarrierOption, DiscretizedDoubleBarrierOption, DoubleBarrier, DoubleBarrierOption, EuropeanExercise, Exercise, FdHestonDoubleBarrierEngine, Handle, HestonModel, HestonProcess, Option, PlainVanillaPayoff, SavedSettings, Settings, SimpleQuote, VannaVolgaDoubleBarrierEngine, WulinYongDoubleBarrierEngine } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

class NewBarrierOptionData {
    constructor(barrierType, barrierlo, barrierhi, type, exType, strike, s, q, r, t, v, result, tol) {
        this.barrierType = barrierType;
        this.barrierlo = barrierlo;
        this.barrierhi = barrierhi;
        this.type = type;
        this.exType = exType;
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

class DoubleBarrierFxOptionData {
    constructor(barrierType, barrier1, barrier2, rebate, type, strike, s, q, r, t, vol25Put, volAtm, vol25Call, v, result, tol) {
        this.barrierType = barrierType;
        this.barrier1 = barrier1;
        this.barrier2 = barrier2;
        this.rebate = rebate;
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.vol25Put = vol25Put;
        this.volAtm = volAtm;
        this.vol25Call = vol25Call;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

describe('DoubleBarrier tests', () => {
    it('Testing double barrier european options against Haug\'s values...', () => {
        const european = Exercise.Type.European;
        const values = [
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 4.3515, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 6.1644, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 7.0373, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 6.9853, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 7.9336, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 6.5088, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 4.3505, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 5.8500, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 5.7726, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 6.8082, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 6.3383, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 4.3841, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 4.3139, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 4.8293, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 3.7765, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 5.9697, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 4.0004, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 2.2563, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 3.7516, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 2.6387, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 1.4903, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 3.5805, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 1.5098, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 0.5635, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 1.2055, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 0.3098, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 0.0477, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 0.5537, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 0.0441, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 0.0011, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 1.8825, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 3.7855, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 5.7191, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 2.1374, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 4.7033, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 50.0, 150.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 7.1683, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 1.8825, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 3.7845, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 5.6060, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 2.1374, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 4.6236, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 60.0, 140.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 6.1062, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 1.8825, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 3.7014, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 4.6472, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 2.1325, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 3.8944, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 70.0, 130.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 3.5868, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 1.8600, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 2.6866, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 2.0719, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 1.8883, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 1.7851, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 80.0, 120.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 0.8244, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 0.9473, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 0.3449, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 0.0578, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 0.4555, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 0.0491, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockOut, 90.0, 110.0, Option.Type.Put, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 0.0013, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 0.0000, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 0.0900, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 1.1537, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 0.0292, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 1.6487, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 50.0, 150.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 5.7321, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 0.0010, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 0.4045, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 2.4184, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 0.2062, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 3.2439, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 60.0, 140.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 7.8569, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 0.0376, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 1.4252, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 4.4145, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 1.0447, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 5.5818, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 70.0, 130.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 9.9846, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 0.5999, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 3.6158, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 6.7007, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 3.4340, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 8.0724, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 80.0, 120.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 11.6774, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.15, 3.1460, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.25, 5.9447, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.25, 0.35, 8.1432, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.15, 6.4608, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.25, 9.5382, 1.0e-4),
            new NewBarrierOptionData(DoubleBarrier.Type.KnockIn, 90.0, 110.0, Option.Type.Call, european, 100, 100.0, 0.0, 0.1, 0.50, 0.35, 12.2398, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.0);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const opt = new DoubleBarrierOption(values[i].barrierType, values[i].barrierlo, values[i].barrierhi, 0, payoff, exercise);
            let engine = new AnalyticDoubleBarrierEngine().init1(stochProcess);
            opt.setPricingEngine(engine);
            let calculated = opt.NPV();
            let expected = values[i].result;
            let error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
            engine = new WulinYongDoubleBarrierEngine().init1(stochProcess);
            opt.setPricingEngine(engine);
            calculated = opt.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
            engine =
                new BinomialDoubleBarrierEngine(new CoxRossRubinstein(), new DiscretizedDoubleBarrierOption())
                    .bdbeInit(stochProcess, 300);
            opt.setPricingEngine(engine);
            calculated = opt.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            let tol = 0.28;
            expect(error).toBeLessThan(tol);
            engine = new BinomialDoubleBarrierEngine(new CoxRossRubinstein(), new DiscretizedDermanKaniDoubleBarrierOption())
                .bdbeInit(stochProcess, 300);
            opt.setPricingEngine(engine);
            calculated = opt.NPV();
            expected = values[i].result;
            error = Math.abs(calculated - expected);
            tol = 0.033;
            expect(error).toBeLessThan(tol);
            if (values[i].barrierType === DoubleBarrier.Type.KnockOut) {
                engine = new FdHestonDoubleBarrierEngine(new HestonModel(new HestonProcess(new Handle(rTS), new Handle(qTS), new Handle(spot), (vol.value() * vol.value()), 1.0, (vol.value() * vol.value()), 0.001, 0.0)), 251, 76, 3);
                opt.setPricingEngine(engine);
                calculated = opt.NPV();
                expected = values[i].result;
                error = Math.abs(calculated - expected);
                tol = 0.025;
                expect(error).toBeLessThan(tol);
            }
        }
    });
});

describe('DoubleBarrier experimental tests', () => {
    it('Testing double-barrier FX options against Vanna/Volga values...', () => {
        const backup = new SavedSettings();
        const values = [
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Call, 1.13321, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.11638, 0.14413, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Call, 1.22687, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.10088, 0.07456, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Call, 1.31179, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08925, 0.02710, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Call, 1.38843, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08463, 0.00569, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Call, 1.46047, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08412, 0.00013, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Put, 1.13321, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.11638, 0.00017, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Put, 1.22687, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.10088, 0.00353, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Put, 1.31179, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08925, 0.02221, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Put, 1.38843, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08463, 0.06049, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.1, 1.5, 0.0, Option.Type.Put, 1.46047, 1.30265, 0.0003541, 0.0033871, 1.0, 0.10087, 0.08925, 0.08463, 0.08412, 0.11103, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Call, 1.06145, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.12511, 0.19981, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Call, 1.19545, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.10890, 0.10389, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Call, 1.32238, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09444, 0.03555, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Call, 1.44298, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09197, 0.00634, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Call, 1.56345, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09261, 0.00000, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Put, 1.06145, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.12511, 0.00000, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Put, 1.19545, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.10890, 0.00436, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Put, 1.32238, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09444, 0.03173, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Put, 1.44298, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09197, 0.09346, 1.0e-4),
            new DoubleBarrierFxOptionData(DoubleBarrier.Type.KnockOut, 1.0, 1.6, 0.0, Option.Type.Put, 1.56345, 1.30265, 0.0009418, 0.0039788, 2.0, 0.10891, 0.09525, 0.09197, 0.09261, 0.17704, 1.0e-4)
        ];
        const dc = new Actual360();
        const today = new Date('05-Mar-2013');
        Settings.evaluationDate.set(today);
        const spot = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol25Put = new SimpleQuote(0.0);
        const volAtm = new SimpleQuote(0.0);
        const vol25Call = new SimpleQuote(0.0);
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j <= 1; j++) {
                const barrierType = j;
                spot.setValue(values[i].s);
                qRate.setValue(values[i].q);
                rRate.setValue(values[i].r);
                vol25Put.setValue(values[i].vol25Put);
                volAtm.setValue(values[i].volAtm);
                vol25Call.setValue(values[i].vol25Call);
                const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
                const exDate = DateExt.add(today, Math.floor(values[i].t * 365 + 0.5));
                const exercise = new EuropeanExercise(exDate);
                const volAtmQuote = new Handle(new DeltaVolQuote().init2(new Handle(volAtm), DeltaVolQuote.DeltaType.Fwd, values[i].t, DeltaVolQuote.AtmType.AtmDeltaNeutral));
                const vol25PutQuote = new Handle(new DeltaVolQuote().init1(-0.25, new Handle(vol25Put), values[i].t, DeltaVolQuote.DeltaType.Fwd));
                const vol25CallQuote = new Handle(new DeltaVolQuote().init1(0.25, new Handle(vol25Call), values[i].t, DeltaVolQuote.DeltaType.Fwd));
                const doubleBarrierOption = new DoubleBarrierOption(barrierType, values[i].barrier1, values[i].barrier2, values[i].rebate, payoff, exercise);
                const bsVanillaPrice = blackFormula1(values[i].type, values[i].strike, spot.value() * qTS.discount2(values[i].t) /
                    rTS.discount2(values[i].t), values[i].v * Math.sqrt(values[i].t), rTS.discount2(values[i].t));
                let vannaVolgaEngine = new VannaVolgaDoubleBarrierEngine(new WulinYongDoubleBarrierEngine())
                    .vvdbeInit(volAtmQuote, vol25PutQuote, vol25CallQuote, new Handle(spot), new Handle(rTS), new Handle(qTS), true, bsVanillaPrice);
                doubleBarrierOption.setPricingEngine(vannaVolgaEngine);
                let expected = 0;
                if (barrierType === DoubleBarrier.Type.KnockOut) {
                    expected = values[i].result;
                }
                else if (barrierType === DoubleBarrier.Type.KnockIn) {
                    expected = (bsVanillaPrice - values[i].result);
                }
                let calculated = doubleBarrierOption.NPV();
                let error = Math.abs(calculated - expected);
                expect(error).toBeLessThan(values[i].tol);
                vannaVolgaEngine =
                    new VannaVolgaDoubleBarrierEngine(new AnalyticDoubleBarrierEngine())
                        .vvdbeInit(volAtmQuote, vol25PutQuote, vol25CallQuote, new Handle(spot), new Handle(rTS), new Handle(qTS), true, bsVanillaPrice);
                doubleBarrierOption.setPricingEngine(vannaVolgaEngine);
                calculated = doubleBarrierOption.NPV();
                error = Math.abs(calculated - expected);
                const maxtol = 5.0e-3;
                expect(error).toBeLessThan(maxtol);
            }
        }
        backup.dispose();
    });
});