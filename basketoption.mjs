import { Actual360, Actual365Fixed, AmericanExercise, Array2D, BasketOption, BlackProcess, BlackScholesMertonProcess, DateExt, EuropeanExercise, Fd2dBlackScholesVanillaEngine, FdmSchemeDesc, GeneralizedBlackScholesProcess, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, KirkEngine, LowDiscrepancy, MakeMCAmericanBasketEngine, MakeMCEuropeanBasketEngine, MaxBasketPayoff, MinBasketPayoff, Option, PlainVanillaPayoff, PseudoRandom, RiskStatistics, SimpleQuote, SpreadBasketPayoff, StochasticProcessArray, StulzEngine, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate2, flatVol1, flatVol2, relativeError } from '/test-suite/utilities.mjs';

// enum BasketType
var BasketType; 
(function (BasketType) {
    BasketType[BasketType["MinBasket"] = 0] = "MinBasket";
    BasketType[BasketType["MaxBasket"] = 1] = "MaxBasket";
    BasketType[BasketType["SpreadBasket"] = 2] = "SpreadBasket";
})(BasketType || (BasketType = {}));
function basketTypeToPayoff(basketType, p) {
    switch (basketType) {
        case BasketType.MinBasket:
            return new MinBasketPayoff().init(p);
        case BasketType.MaxBasket:
            return new MaxBasketPayoff().init(p);
        case BasketType.SpreadBasket:
            return new SpreadBasketPayoff().init(p);
        default:
            throw new Error('unknown basket option type');
    }
}

class BasketOptionOneData {
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

class BasketOptionTwoData {
    constructor(basketType, type, strike, s1, s2, q1, q2, r, t, v1, v2, rho, result, tol) {
        this.basketType = basketType;
        this.type = type;
        this.strike = strike;
        this.s1 = s1;
        this.s2 = s2;
        this.q1 = q1;
        this.q2 = q2;
        this.r = r;
        this.t = t;
        this.v1 = v1;
        this.v2 = v2;
        this.rho = rho;
        this.result = result;
        this.tol = tol;
    }
}

class BasketOptionThreeData {
    constructor(basketType, type, strike, s1, s2, s3, r, t, v1, v2, v3, rho, euroValue, amValue) {
        this.basketType = basketType;
        this.type = type;
        this.strike = strike;
        this.s1 = s1;
        this.s2 = s2;
        this.s3 = s3;
        this.r = r;
        this.t = t;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.rho = rho;
        this.euroValue = euroValue;
        this.amValue = amValue;
    }
}

const oneDataValues = [
    new BasketOptionOneData(Option.Type.Put, 100.00, 80.00, 0.0, 0.06, 0.5, 0.4, 21.6059, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 85.00, 0.0, 0.06, 0.5, 0.4, 18.0374, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 90.00, 0.0, 0.06, 0.5, 0.4, 14.9187, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 95.00, 0.0, 0.06, 0.5, 0.4, 12.2314, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 100.00, 0.0, 0.06, 0.5, 0.4, 9.9458, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 105.00, 0.0, 0.06, 0.5, 0.4, 8.0281, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 110.00, 0.0, 0.06, 0.5, 0.4, 6.4352, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 115.00, 0.0, 0.06, 0.5, 0.4, 5.1265, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 100.00, 120.00, 0.0, 0.06, 0.5, 0.4, 4.0611, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 36.00, 0.0, 0.06, 1.0, 0.2, 4.478, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 36.00, 0.0, 0.06, 2.0, 0.2, 4.840, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 36.00, 0.0, 0.06, 1.0, 0.4, 7.101, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 36.00, 0.0, 0.06, 2.0, 0.4, 8.508, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 38.00, 0.0, 0.06, 1.0, 0.2, 3.250, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 38.00, 0.0, 0.06, 2.0, 0.2, 3.745, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 38.00, 0.0, 0.06, 1.0, 0.4, 6.148, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 38.00, 0.0, 0.06, 2.0, 0.4, 7.670, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 40.00, 0.0, 0.06, 1.0, 0.2, 2.314, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 40.00, 0.0, 0.06, 2.0, 0.2, 2.885, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 40.00, 0.0, 0.06, 1.0, 0.4, 5.312, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 40.00, 0.0, 0.06, 2.0, 0.4, 6.920, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 42.00, 0.0, 0.06, 1.0, 0.2, 1.617, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 42.00, 0.0, 0.06, 2.0, 0.2, 2.212, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 42.00, 0.0, 0.06, 1.0, 0.4, 4.582, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 42.00, 0.0, 0.06, 2.0, 0.4, 6.248, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 44.00, 0.0, 0.06, 1.0, 0.2, 1.110, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 44.00, 0.0, 0.06, 2.0, 0.2, 1.690, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 44.00, 0.0, 0.06, 1.0, 0.4, 3.948, 1e-2),
    new BasketOptionOneData(Option.Type.Put, 40.00, 44.00, 0.0, 0.06, 2.0, 0.4, 5.647, 1e-2)
];

describe(`Basket option tests ${version}`, () => {
    it('Testing two-asset European basket options...', () => {
        const values = [
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.90, 10.898, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.70, 8.483, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.50, 6.844, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 5.531, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.10, 4.413, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.50, 0.70, 0.00, 4.981, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.50, 0.30, 0.00, 4.159, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.50, 0.10, 0.00, 2.597, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.50, 0.10, 0.50, 4.030, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.90, 17.565, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.70, 19.980, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.50, 21.619, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 22.932, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.10, 24.049, 1.1e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 80.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 16.508, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 80.0, 80.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 8.049, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 80.0, 120.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 30.141, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 100.0, 120.0, 120.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 42.889, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.90, 11.369, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.70, 12.856, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.50, 13.890, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 14.741, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.10, 15.485, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 0.50, 0.30, 0.30, 0.10, 11.893, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 0.25, 0.30, 0.30, 0.10, 8.881, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 2.00, 0.30, 0.30, 0.10, 19.268, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.90, 7.339, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.70, 5.853, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.50, 4.818, 1.0e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.30, 3.967, 1.1e-3),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 100.0, 100.0, 100.0, 0.00, 0.00, 0.05, 1.00, 0.30, 0.30, 0.10, 3.223, 1.0e-3),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 98.0, 100.0, 105.0, 0.00, 0.00, 0.05, 0.50, 0.11, 0.16, 0.63, 4.8177, 1.0e-4),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 98.0, 100.0, 105.0, 0.00, 0.00, 0.05, 0.50, 0.11, 0.16, 0.63, 11.6323, 1.0e-4),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 98.0, 100.0, 105.0, 0.00, 0.00, 0.05, 0.50, 0.11, 0.16, 0.63, 2.0376, 1.0e-4),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 98.0, 100.0, 105.0, 0.00, 0.00, 0.05, 0.50, 0.11, 0.16, 0.63, 0.5731, 1.0e-4),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Call, 98.0, 100.0, 105.0, 0.06, 0.09, 0.05, 0.50, 0.11, 0.16, 0.63, 2.9340, 1.0e-4),
            new BasketOptionTwoData(BasketType.MinBasket, Option.Type.Put, 98.0, 100.0, 105.0, 0.06, 0.09, 0.05, 0.50, 0.11, 0.16, 0.63, 3.5224, 1.0e-4),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Call, 98.0, 100.0, 105.0, 0.06, 0.09, 0.05, 0.50, 0.11, 0.16, 0.63, 8.0701, 1.0e-4),
            new BasketOptionTwoData(BasketType.MaxBasket, Option.Type.Put, 98.0, 100.0, 105.0, 0.06, 0.09, 0.05, 0.50, 0.11, 0.16, 0.63, 1.2181, 1.0e-4),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.20, -0.5, 4.7530, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.20, 0.0, 3.7970, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.20, 0.5, 2.5537, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.25, 0.20, -0.5, 5.4275, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.25, 0.20, 0.0, 4.3712, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.25, 0.20, 0.5, 3.0086, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.25, -0.5, 5.4061, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.25, 0.0, 4.3451, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.1, 0.20, 0.25, 0.5, 2.9723, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.20, -0.5, 10.7517, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.20, 0.0, 8.7020, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.20, 0.5, 6.0257, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.25, 0.20, -0.5, 12.1941, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.25, 0.20, 0.0, 9.9340, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.25, 0.20, 0.5, 7.0067, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.25, -0.5, 12.1483, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.25, 0.0, 9.8780, 1.0e-3),
            new BasketOptionTwoData(BasketType.SpreadBasket, Option.Type.Call, 3.0, 122.0, 120.0, 0.0, 0.0, 0.10, 0.5, 0.20, 0.25, 0.5, 6.9284, 1.0e-3)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const qRate1 = new SimpleQuote(0.0);
        const qTS1 = flatRate1(today, qRate1, dc);
        const qRate2 = new SimpleQuote(0.0);
        const qTS2 = flatRate1(today, qRate2, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol1(today, vol2, dc);
        const mcRelativeErrorTolerance = 0.01;
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot1.setValue(values[i].s1);
            spot2.setValue(values[i].s2);
            qRate1.setValue(values[i].q1);
            qRate2.setValue(values[i].q2);
            rRate.setValue(values[i].r);
            vol1.setValue(values[i].v1);
            vol2.setValue(values[i].v2);
            let analyticEngine;
            let p1, p2;
            switch (values[i].basketType) {
                case BasketType.MaxBasket:
                case BasketType.MinBasket:
                    p1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS1), new Handle(rTS), new Handle(volTS1));
                    p2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS2), new Handle(rTS), new Handle(volTS2));
                    analyticEngine = new StulzEngine(p1, p2, values[i].rho);
                    break;
                case BasketType.SpreadBasket:
                    p1 = new BlackProcess(new Handle(spot1), new Handle(rTS), new Handle(volTS1));
                    p2 = new BlackProcess(new Handle(spot2), new Handle(rTS), new Handle(volTS2));
                    analyticEngine = new KirkEngine(p1, p2, values[i].rho);
                    break;
                default:
                    throw new Error('unknown basket type');
            }
            const procs = [];
            procs.push(p1);
            procs.push(p2);
            const correlationMatrix = Array2D.newMatrix(2, 2, values[i].rho);
            for (let j = 0; j < 2; j++) {
                correlationMatrix[j][j] = 1.0;
            }
            const process = new StochasticProcessArray(procs, correlationMatrix);
            const mcEngine = new MakeMCEuropeanBasketEngine(new PseudoRandom(), new RiskStatistics())
                .mmcebeInit(process)
                .withStepsPerYear(1)
                .withSamples(10000)
                .withSeed(42)
                .f();
            const fdEngine = new Fd2dBlackScholesVanillaEngine(p1, p2, values[i].rho, 50, 50, 15);
            const basketOption = new BasketOption(basketTypeToPayoff(values[i].basketType, payoff), exercise);
            basketOption.setPricingEngine(analyticEngine);
            let calculated = basketOption.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            expect(error).toBeLessThan(values[i].tol);
            basketOption.setPricingEngine(fdEngine);
            calculated = basketOption.NPV();
            let relError = relativeError(calculated, expected, expected);
            expect(relError).toBeLessThan(mcRelativeErrorTolerance);
            basketOption.setPricingEngine(mcEngine);
            calculated = basketOption.NPV();
            relError = relativeError(calculated, expected, values[i].s1);
            expect(relError).toBeLessThan(mcRelativeErrorTolerance);
        }
    });

    it('Testing three-asset basket options against Barraquand\'s values...', () => {
        const values = [
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 35.0, 40.0, 40.0, 40.0, 0.05, 1.00, 0.20, 0.30, 0.50, 0.0, 0.00, 0.00),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 40.0, 40.0, 40.0, 40.0, 0.05, 1.00, 0.20, 0.30, 0.50, 0.0, 0.13, 0.23),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 45.0, 40.0, 40.0, 40.0, 0.05, 1.00, 0.20, 0.30, 0.50, 0.0, 2.26, 5.00),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 40.0, 40.0, 40.0, 40.0, 0.05, 4.00, 0.20, 0.30, 0.50, 0.0, 0.25, 0.44),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 45.0, 40.0, 40.0, 40.0, 0.05, 4.00, 0.20, 0.30, 0.50, 0.0, 1.55, 5.00),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 45.0, 40.0, 40.0, 40.0, 0.05, 7.00, 0.20, 0.30, 0.50, 0.0, 1.41, 5.00),
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Put, 40.0, 40.0, 40.0, 40.0, 0.05, 7.00, 0.20, 0.30, 0.50, 0.5, 0.91, 1.19),
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const spot3 = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.0);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol1(today, vol2, dc);
        const vol3 = new SimpleQuote(0.0);
        const volTS3 = flatVol1(today, vol3, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t) * 30);
            const exercise = new EuropeanExercise(exDate);
            const amExercise = new AmericanExercise().init1(today, exDate);
            spot1.setValue(values[i].s1);
            spot2.setValue(values[i].s2);
            spot3.setValue(values[i].s3);
            rRate.setValue(values[i].r);
            vol1.setValue(values[i].v1);
            vol2.setValue(values[i].v2);
            vol3.setValue(values[i].v3);
            const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS), new Handle(rTS), new Handle(volTS1));
            const stochProcess2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS), new Handle(rTS), new Handle(volTS2));
            const stochProcess3 = new BlackScholesMertonProcess(new Handle(spot3), new Handle(qTS), new Handle(rTS), new Handle(volTS3));
            const procs = [];
            procs.push(stochProcess1);
            procs.push(stochProcess2);
            procs.push(stochProcess3);
            const correlation = Array2D.newMatrix(3, 3, values[i].rho);
            for (let j = 0; j < 3; j++) {
                correlation[j][j] = 1.0;
            }
            const process = new StochasticProcessArray(procs, correlation);
            const mcQuasiEngine = new MakeMCEuropeanBasketEngine(new LowDiscrepancy())
                .mmcebeInit(process)
                .withStepsPerYear(1)
                .withSamples(8091)
                .withSeed(42)
                .f();
            const euroBasketOption = new BasketOption(basketTypeToPayoff(values[i].basketType, payoff), exercise);
            euroBasketOption.setPricingEngine(mcQuasiEngine);
            let expected = values[i].euroValue;
            let calculated = euroBasketOption.NPV();
            let relError = relativeError(calculated, expected, values[i].s1);
            const mcRelativeErrorTolerance = 0.01;
            expect(relError).toBeLessThan(mcRelativeErrorTolerance);
            const requiredSamples = 1000;
            const timeSteps = 500;
            const seed = 1;
            const mcLSMCEngine = new MakeMCAmericanBasketEngine()
                .mmcabeInit(process)
                .withSteps(timeSteps)
                .withAntitheticVariate()
                .withSamples(requiredSamples)
                .withCalibrationSamples(requiredSamples / 4)
                .withSeed(seed)
                .f();
            const amBasketOption = new BasketOption(basketTypeToPayoff(values[i].basketType, payoff), amExercise);
            amBasketOption.setPricingEngine(mcLSMCEngine);
            expected = values[i].amValue;
            calculated = amBasketOption.NPV();
            relError = relativeError(calculated, expected, values[i].s1);
            const mcAmericanRelativeErrorTolerance = 0.01;
            expect(relError).toBeLessThan(mcAmericanRelativeErrorTolerance);
        }
    });

    it('Testing three-asset American basket options against Tavella\'s values...', () => {
        const values = [
            new BasketOptionThreeData(BasketType.MaxBasket, Option.Type.Call, 100, 100, 100, 100, 0.05, 3.00, 0.20, 0.20, 0.20, 0.0, -999, 18.082)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot1 = new SimpleQuote(0.0);
        const spot2 = new SimpleQuote(0.0);
        const spot3 = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.1);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.05);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const vol2 = new SimpleQuote(0.0);
        const volTS2 = flatVol1(today, vol2, dc);
        const vol3 = new SimpleQuote(0.0);
        const volTS3 = flatVol1(today, vol3, dc);
        const mcRelativeErrorTolerance = 0.01;
        const requiredSamples = 10000;
        const timeSteps = 20;
        const seed = 0;
        const payoff = new PlainVanillaPayoff(values[0].type, values[0].strike);
        const exDate = DateExt.add(today, Math.floor(values[0].t * 360 + 0.5));
        const exercise = new AmericanExercise().init1(today, exDate);
        spot1.setValue(values[0].s1);
        spot2.setValue(values[0].s2);
        spot3.setValue(values[0].s3);
        vol1.setValue(values[0].v1);
        vol2.setValue(values[0].v2);
        vol3.setValue(values[0].v3);
        const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS), new Handle(rTS), new Handle(volTS1));
        const stochProcess2 = new BlackScholesMertonProcess(new Handle(spot2), new Handle(qTS), new Handle(rTS), new Handle(volTS2));
        const stochProcess3 = new BlackScholesMertonProcess(new Handle(spot3), new Handle(qTS), new Handle(rTS), new Handle(volTS3));
        const procs = [];
        procs.push(stochProcess1);
        procs.push(stochProcess2);
        procs.push(stochProcess3);
        const correlation = Array2D.newMatrix(3, 3, 0.0);
        for (let j = 0; j < 3; j++) {
            correlation[j][j] = 1.0;
        }
        correlation[1][0] = -0.25;
        correlation[0][1] = -0.25;
        correlation[2][0] = 0.25;
        correlation[0][2] = 0.25;
        correlation[2][1] = 0.3;
        correlation[1][2] = 0.3;
        const process = new StochasticProcessArray(procs, correlation);
        const mcLSMCEngine = new MakeMCAmericanBasketEngine()
            .mmcabeInit(process)
            .withSteps(timeSteps)
            .withAntitheticVariate()
            .withSamples(requiredSamples)
            .withCalibrationSamples(requiredSamples / 4)
            .withSeed(seed)
            .f();
        const basketOption = new BasketOption(basketTypeToPayoff(values[0].basketType, payoff), exercise);
        basketOption.setPricingEngine(mcLSMCEngine);
        const calculated = basketOption.NPV();
        const expected = values[0].amValue;
        const relError = relativeError(calculated, expected, values[0].s1);
        expect(relError).toBeLessThan(mcRelativeErrorTolerance);
    });

    it('Testing basket American options against 1-D case...', () => {
        const dc = new Actual360();
        const today = new Date();
        const spot1 = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.05);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const requiredSamples = 10000;
        const timeSteps = 52;
        const seed = 0;
        const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS), new Handle(rTS), new Handle(volTS1));
        const procs = [];
        procs.push(stochProcess1);
        const correlation = Array2D.newMatrix(1, 1, 1.0);
        const process = new StochasticProcessArray(procs, correlation);
        const mcLSMCEngine = new MakeMCAmericanBasketEngine()
            .mmcabeInit(process)
            .withSteps(timeSteps)
            .withAntitheticVariate()
            .withSamples(requiredSamples)
            .withCalibrationSamples(requiredSamples / 4)
            .withSeed(seed)
            .f();
        for (let i = 0; i < oneDataValues.length; i++) {
            const payoff = new PlainVanillaPayoff(oneDataValues[i].type, oneDataValues[i].strike);
            const exDate = DateExt.add(today, Math.floor(oneDataValues[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot1.setValue(oneDataValues[i].s);
            vol1.setValue(oneDataValues[i].v);
            rRate.setValue(oneDataValues[i].r);
            qRate.setValue(oneDataValues[i].q);
            const basketOption = new BasketOption(basketTypeToPayoff(BasketType.MaxBasket, payoff), exercise);
            basketOption.setPricingEngine(mcLSMCEngine);
            const calculated = basketOption.NPV();
            const expected = oneDataValues[i].result;
            const relError = relativeError(calculated, expected, oneDataValues[i].s);
            expect(relError).toBeLessThan(oneDataValues[i].tol);
        }
    });

    it('Testing antithetic engine using odd sample number...', () => {
        const requiredSamples = 10001;
        const timeSteps = 53;
        const values = [
            new BasketOptionOneData(Option.Type.Put, 100.00, 80.00, 0.0, 0.06, 0.5, 0.4, 21.6059, 1e-2)
        ];
        const dc = new Actual360();
        const today = new Date();
        const spot1 = new SimpleQuote(0.0);
        const qRate = new SimpleQuote(0.0);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.05);
        const rTS = flatRate1(today, rRate, dc);
        const vol1 = new SimpleQuote(0.0);
        const volTS1 = flatVol1(today, vol1, dc);
        const seed = 0;
        const stochProcess1 = new BlackScholesMertonProcess(new Handle(spot1), new Handle(qTS), new Handle(rTS), new Handle(volTS1));
        const procs = [];
        procs.push(stochProcess1);
        const correlation = Array2D.newMatrix(1, 1, 1.0);
        const process = new StochasticProcessArray(procs, correlation);
        const mcLSMCEngine = new MakeMCAmericanBasketEngine()
            .mmcabeInit(process)
            .withSteps(timeSteps)
            .withAntitheticVariate()
            .withSamples(requiredSamples)
            .withCalibrationSamples(requiredSamples / 4)
            .withSeed(seed)
            .f();
        for (let i = 0; i < values.length; i++) {
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const exercise = new AmericanExercise().init1(today, exDate);
            spot1.setValue(values[i].s);
            vol1.setValue(values[i].v);
            rRate.setValue(values[i].r);
            qRate.setValue(values[i].q);
            const basketOption = new BasketOption(basketTypeToPayoff(BasketType.MaxBasket, payoff), exercise);
            basketOption.setPricingEngine(mcLSMCEngine);
            const calculated = basketOption.NPV();
            const expected = values[i].result;
            const relError = relativeError(calculated, expected, values[i].s);
            expect(relError).toBeLessThan(values[i].tol);
        }
    });

    it('Testing 2D local-volatility spread-option pricing...', () => {
        const dc = new Actual360();
        const today = new Date('21-September-2017');
        const maturity = DateExt.advance(today, 3, TimeUnit.Months);
        const riskFreeRate = new Handle(flatRate2(today, 0.07, dc));
        const dividendYield = new Handle(flatRate2(today, 0.03, dc));
        const s1 = new Handle(new SimpleQuote(100));
        const s2 = new Handle(new SimpleQuote(110));
        const hm1 = new HestonModel(new HestonProcess(riskFreeRate, dividendYield, s1, 0.09, 1.0, 0.06, 0.6, -0.75));
        const hm2 = new HestonModel(new HestonProcess(riskFreeRate, dividendYield, s2, 0.1, 2.0, 0.07, 0.8, 0.85));
        const vol1 = new Handle(new HestonBlackVolSurface(new Handle(hm1)));
        const vol2 = new Handle(new HestonBlackVolSurface(new Handle(hm2)));
        const basketOption = new BasketOption(basketTypeToPayoff(BasketType.SpreadBasket, new PlainVanillaPayoff(Option.Type.Call, s2.currentLink().value() - s1.currentLink().value())), new EuropeanExercise(maturity));
        const rho = -0.6;
        const bs2 = new GeneralizedBlackScholesProcess().init1(s2, dividendYield, riskFreeRate, vol2);
        const bs1 = new GeneralizedBlackScholesProcess().init1(s1, dividendYield, riskFreeRate, vol1);
        basketOption.setPricingEngine(new Fd2dBlackScholesVanillaEngine(bs1, bs2, rho, 11, 11, 6, 0, FdmSchemeDesc.Hundsdorfer(), true, 0.25));
        const tolerance = 0.01;
        const expected = 2.561;
        const calculated = basketOption.NPV();
        expect(Math.abs(expected - calculated)).toBeLessThan(tolerance);
    });

    it('Testing Greeks of two-dimensional PDE engine...', () => {
        const s1 = 100;
        const s2 = 100;
        const r = 0.013;
        const v = 0.2;
        const rho = 0.5;
        const strike = s1 - s2;
        const maturityInDays = 1095;
        const dc = new Actual365Fixed();
        const today = new Date();
        const maturity = DateExt.add(today, maturityInDays);
        const spot1 = new SimpleQuote(s1);
        const spot2 = new SimpleQuote(s2);
        const rTS = new Handle(flatRate2(today, r, dc));
        const vTS = new Handle(flatVol2(today, v, dc));
        const p1 = new BlackProcess(new Handle(spot1), rTS, vTS);
        const p2 = new BlackProcess(new Handle(spot2), rTS, vTS);
        const option = new BasketOption(new SpreadBasketPayoff().init(new PlainVanillaPayoff(Option.Type.Call, strike)), new EuropeanExercise(maturity));
        option.setPricingEngine(new Fd2dBlackScholesVanillaEngine(p1, p2, rho));
        const calculatedDelta = option.delta();
        const calculatedGamma = option.gamma();
        option.setPricingEngine(new KirkEngine(p1, p2, rho));
        const eps = 1.0;
        const npv = option.NPV();
        spot1.setValue(s1 + eps);
        spot2.setValue(s2 + eps);
        const npvUp = option.NPV();
        spot1.setValue(s1 - eps);
        spot2.setValue(s2 - eps);
        const npvDown = option.NPV();
        const expectedDelta = (npvUp - npvDown) / (2 * eps);
        const expectedGamma = (npvUp + npvDown - 2 * npv) / (eps * eps);
        const tol = 0.0005;
        expect(Math.abs(expectedDelta - calculatedDelta)).toBeLessThan(tol);
        expect(Math.abs(expectedGamma - calculatedGamma)).toBeLessThan(tol);
    });
});