import { Actual360, Actual365Fixed, Array1D, Basket, Compounding, ConstantLossModel, EURCurrency, FlatForward, FlatHazardRate, GaussianCopulaPolicy, Handle, IntegralNtdEngine, Issuer, LatentModelIntegrationType, MakeSchedule, NorthAmericaCorpDefaultKey, NthToDefault, Period, Pool, Protection, SavedSettings, Seniority, Settings, SimpleQuote, TARGET, TCopulaPolicy, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class hwDatum {
    constructor(rank, spread) {
        this.rank = rank;
        this.spread = spread;
    }
}

const hwData = [
    new hwDatum(1, [603, 440, 293]), new hwDatum(2, [98, 139, 137]),
    new hwDatum(3, [12, 53, 79]), new hwDatum(4, [1, 21, 49]),
    new hwDatum(5, [0, 8, 31]), new hwDatum(6, [0, 3, 19]),
    new hwDatum(7, [0, 1, 12]), new hwDatum(8, [0, 0, 7]),
    new hwDatum(9, [0, 0, 3]), new hwDatum(10, [0, 0, 1])
];

const hwCorrelation = [0.0, 0.3, 0.6];

class hwDatumDist {
    constructor(rank, spread) {
        this.rank = rank;
        this.spread = spread;
    }
}

const hwDataDist = [
    new hwDatumDist(1, [440, 419, 474, 455]),
    new hwDatumDist(2, [139, 127, 127, 116]),
    new hwDatumDist(3, [53, 51, 44, 44]), new hwDatumDist(4, [21, 24, 18, 22]),
    new hwDatumDist(5, [8, 13, 7, 13]), new hwDatumDist(6, [3, 8, 3, 8]),
    new hwDatumDist(7, [1, 5, 1, 5]), new hwDatumDist(8, [0, 3, 0, 4]),
    new hwDatumDist(9, [0, 2, 0, 0]), new hwDatumDist(10, [0, 1, 0, 1])
];

describe('Nth-to-default tests', () => {
    it('Testing nth-to-default against Hull-White values with Gaussian copula...', () => {
        const backup = new SavedSettings();
        const relTolerance = 0.015;
        const timeUnit = new Period().init1(1, TimeUnit.Weeks);
        const names = 10;
        if (hwData.length !== names) {
            throw new Error('hwData length does not match');
        }
        const rate = 0.05;
        const dc = new Actual365Fixed();
        const cmp = Compounding.Continuous;
        const recovery = 0.4;
        const lambda = Array1D.fromSizeValue(names, 0.01);
        const namesNotional = 100.0;
        const schedule = new MakeSchedule()
            .from(new Date('1,September,2006'))
            .to(new Date('1,September,2011'))
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withCalendar(new TARGET())
            .f();
        const asofDate = new Date('31,August,2006');
        Settings.evaluationDate.set(asofDate);
        const gridDates = [];
        gridDates.push(asofDate);
        gridDates.push(new TARGET().advance1(asofDate, 1, TimeUnit.Years));
        gridDates.push(new TARGET().advance1(asofDate, 5, TimeUnit.Years));
        gridDates.push(new TARGET().advance1(asofDate, 7, TimeUnit.Years));
        const yieldPtr = new FlatForward().ffInit2(asofDate, rate, dc, cmp);
        const yieldHandle = new Handle(yieldPtr);
        const probabilities = [];
        for (let i = 0; i < lambda.length; i++) {
            const h = new Handle(new SimpleQuote(lambda[i]));
            const ptr = new FlatHazardRate().fhrInit1(asofDate, h, dc);
            probabilities.push(new Handle(ptr));
        }
        const simpleQuote = new SimpleQuote(0.0);
        const correlationHandle = new Handle(simpleQuote);
        const copula = new ConstantLossModel(new GaussianCopulaPolicy())
            .clmInit2(correlationHandle, Array1D.fromSizeValue(names, recovery), LatentModelIntegrationType.GaussianQuadrature, names, null);
        const singleProbability = [];
        singleProbability.push(probabilities[0]);
        const namesIds = [];
        for (let i = 0; i < names; i++) {
            namesIds.push(`Name ${i}`);
        }
        const issuers = [];
        for (let i = 0; i < names; i++) {
            const curves = [[
                    new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.),
                    probabilities[i]
                ]];
            issuers.push(new Issuer().init1(curves));
        }
        const thePool = new Pool();
        for (let i = 0; i < names; i++) {
            thePool.add(namesIds[i], issuers[i], new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.));
        }
        const defaultKeys = new Array(probabilities.length);
        for (let i = 0; i < defaultKeys.length; i++) {
            defaultKeys[i] = new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.);
        }
        const basket = new Basket().init(asofDate, namesIds, Array1D.fromSizeValue(names, namesNotional / names), thePool, 0., 1.);
        basket.setLossModel(copula);
        const engine = new IntegralNtdEngine(timeUnit, yieldHandle);
        let diff, maxDiff = 0;
        const ntd = [];
        for (let i = 1; i <= probabilities.length; i++) {
            ntd.push(new NthToDefault(basket, i, Protection.Side.Seller, schedule, 0.0, 0.02, new Actual360(), namesNotional * names, true));
            Array1D.back(ntd).setPricingEngine(engine);
        }
        if (hwCorrelation.length !== 3) {
            throw new Error('correlation length does not match');
        }
        for (let j = 0; j < hwCorrelation.length; j++) {
            simpleQuote.setValue(hwCorrelation[j]);
            for (let i = 0; i < ntd.length; i++) {
                if (ntd[i].rank() !== hwData[i].rank) {
                    throw new Error('rank does not match');
                }
                if (hwCorrelation.length !== hwData[i].spread.length) {
                    throw new Error('vector length does not match');
                }
                diff = 1e4 * ntd[i].fairPremium() - hwData[i].spread[j];
                maxDiff = Math.max(maxDiff, Math.abs(diff));
                expect(Math.abs(diff / hwData[i].spread[j]))
                    .toBeLessThan(relTolerance);
            }
        }
        backup.dispose();
    });
    it('Testing nth-to-default against Hull-White values' +
        ' with Gaussian and Student copula...', () => {
        const backup = new SavedSettings();
        const absTolerance = 1;
        const timeUnit = new Period().init1(1, TimeUnit.Weeks);
        const names = 10;
        if (hwDataDist.length !== names) {
            throw new Error('hwData length does not match');
        }
        const rate = 0.05;
        const dc = new Actual365Fixed();
        const cmp = Compounding.Continuous;
        const recovery = 0.4;
        const lambda = Array1D.fromSizeValue(names, 0.01);
        const schedule = new MakeSchedule()
            .from(new Date('1,September,2006'))
            .to(new Date('1,September,2011'))
            .withTenor(new Period().init1(3, TimeUnit.Months))
            .withCalendar(new TARGET())
            .f();
        const asofDate = new Date('31,August,2006');
        Settings.evaluationDate.set(asofDate);
        const gridDates = [];
        gridDates.push(asofDate);
        gridDates.push(new TARGET().advance1(asofDate, 1, TimeUnit.Years));
        gridDates.push(new TARGET().advance1(asofDate, 5, TimeUnit.Years));
        gridDates.push(new TARGET().advance1(asofDate, 7, TimeUnit.Years));
        const yieldPtr = new FlatForward().ffInit2(asofDate, rate, dc, cmp);
        const yieldHandle = new Handle(yieldPtr);
        const probabilities = [];
        for (let i = 0; i < lambda.length; i++) {
            const h = new Handle(new SimpleQuote(lambda[i]));
            const ptr = new FlatHazardRate().fhrInit1(asofDate, h, dc);
            probabilities.push(new Handle(ptr));
        }
        const simpleQuote = new SimpleQuote(0.3);
        const correlationHandle = new Handle(simpleQuote);
        const gaussianCopula = new ConstantLossModel(new GaussianCopulaPolicy())
            .clmInit2(correlationHandle, Array1D.fromSizeValue(names, recovery), LatentModelIntegrationType.GaussianQuadrature, names, null);
        const iniT = {};
        iniT.tOrders = Array1D.fromSizeValue(2, 5);
        const studentCopula = new ConstantLossModel(new TCopulaPolicy())
            .clmInit2(correlationHandle, Array1D.fromSizeValue(names, recovery), LatentModelIntegrationType.GaussianQuadrature, names, iniT);
        const namesIds = [];
        for (let i = 0; i < names; i++) {
            namesIds.push(`Name ${i}`);
        }
        const issuers = [];
        for (let i = 0; i < names; i++) {
            const curves = [[
                    new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.),
                    probabilities[i]
                ]];
            issuers.push(new Issuer().init1(curves));
        }
        const thePool = new Pool();
        for (let i = 0; i < names; i++) {
            thePool.add(namesIds[i], issuers[i], new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.));
        }
        const defaultKeys = new Array(probabilities.length);
        for (let i = 0; i < defaultKeys.length; i++) {
            defaultKeys[i] = new NorthAmericaCorpDefaultKey(new EURCurrency(), Seniority.SeniorSec, new Period(), 1.);
        }
        const basket = new Basket().init(asofDate, namesIds, Array1D.fromSizeValue(names, 100. / names), thePool, 0., 1.);
        const engine = new IntegralNtdEngine(timeUnit, yieldHandle);
        const ntd = [];
        for (let i = 1; i <= probabilities.length; i++) {
            ntd.push(new NthToDefault(basket, i, Protection.Side.Seller, schedule, 0.0, 0.02, new Actual360(), 100. * names, true));
            Array1D.back(ntd).setPricingEngine(engine);
        }
        if (hwCorrelation.length !== 3) {
            throw new Error('correlation length does not match');
        }
        let maxDiff = 0;
        simpleQuote.setValue(0.3);
        basket.setLossModel(gaussianCopula);
        for (let i = 0; i < ntd.length; i++) {
            if (ntd[i].rank() !== hwDataDist[i].rank) {
                throw new Error('rank does not match');
            }
            const diff = 1e4 * ntd[i].fairPremium() - hwDataDist[i].spread[0];
            maxDiff = Math.max(maxDiff, Math.abs(diff));
            expect(Math.abs(diff / hwDataDist[i].spread[0]) || Math.abs(diff))
                .toBeLessThan(absTolerance);
        }
        basket.setLossModel(studentCopula);
        maxDiff = 0;
        for (let i = 0; i < ntd.length; i++) {
            if (ntd[i].rank() !== hwDataDist[i].rank) {
                throw new Error('rank does not match');
            }
            const diff = 1e4 * ntd[i].fairPremium() - hwDataDist[i].spread[3];
            maxDiff = Math.max(maxDiff, Math.abs(diff));
            expect(Math.abs(diff / hwDataDist[i].spread[3]) || Math.abs(diff))
                .toBeLessThan(absTolerance);
        }
        backup.dispose();
    });
});