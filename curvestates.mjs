import { Array1D, Array2D, BusinessDayConvention, CMSMMDriftCalculator, CMSwapCurveState, DateExt, DateGeneration, EvolutionDescription, Frequency, LMMCurveState, LMMDriftCalculator, NullCalendar, Period, Schedule, Settings, SimpleDayCounter, TimeUnit } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

class CommonVars {
    constructor() {
        this.calendar = new NullCalendar();
        this.todaysDate = Settings.evaluationDate.f();
        this.endDate = DateExt.advance(this.todaysDate, 10, TimeUnit.Years);
        const dates = new Schedule().init2(this.todaysDate, this.endDate, new Period().init2(Frequency.Semiannual), this.calendar, BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Backward, false);
        this.rateTimes = new Array(dates.size() - 1);
        this.paymentTimes = new Array(this.rateTimes.length - 1);
        this.accruals = new Array(this.rateTimes.length - 1);
        this.dayCounter = new SimpleDayCounter();
        for (let i = 1; i < dates.size(); ++i) {
            this.rateTimes[i - 1] =
                this.dayCounter.yearFraction(this.todaysDate, dates.date(i));
        }
        this.paymentTimes = this.rateTimes.slice(1, this.rateTimes.length);
        for (let i = 1; i < this.rateTimes.length; ++i) {
            this.accruals[i - 1] = this.rateTimes[i] - this.rateTimes[i - 1];
        }
        this.todaysForwards = new Array(this.paymentTimes.length);
        this.displacement = 0.0;
        for (let i = 0; i < this.todaysForwards.length; ++i) {
            this.todaysForwards[i] = 0.03 + 0.0010 * i;
        }
        this.todaysDiscounts = new Array(this.rateTimes.length);
        this.todaysDiscounts[0] = 0.95;
        for (let i = 1; i < this.rateTimes.length; ++i) {
            this.todaysDiscounts[i] = this.todaysDiscounts[i - 1] /
                (1.0 + this.todaysForwards[i - 1] * this.accruals[i - 1]);
        }
        const N = this.todaysForwards.length;
        this.todaysCoterminalSwapRates = new Array(N);
        this.coterminalAnnuity = new Array(N);
        let floatingLeg = 0.0;
        for (let i = 1; i <= N; ++i) {
            if (i === 1) {
                this.coterminalAnnuity[N - 1] =
                    this.accruals[N - 1] * this.todaysDiscounts[N];
            }
            else {
                this.coterminalAnnuity[N - i] = this.coterminalAnnuity[N - i + 1] +
                    this.accruals[N - i] * this.todaysDiscounts[N - i + 1];
            }
            floatingLeg = this.todaysDiscounts[N - i] - this.todaysDiscounts[N];
            this.todaysCoterminalSwapRates[N - i] =
                floatingLeg / this.coterminalAnnuity[N - i];
        }
        const evolutionTimes = this.rateTimes.slice(0, this.rateTimes.length - 1);
        const evolution = new EvolutionDescription(this.rateTimes, evolutionTimes);
        evolution.rateTaus();
        evolution.firstAliveRate();
    }
}
describe('Curve States tests', () => {
    it('Testing constant-maturity-swap-market-model curve state...', () => {
        const vars = new CommonVars();
        const nbRates = vars.todaysForwards.length;
        const factors = nbRates;
        const pseudo = Array2D.newMatrix(nbRates, factors, 0.1);
        const displacements = Array1D.fromSizeValue(nbRates, .0);
        const rateTimes = new Array(nbRates + 1);
        const taus = Array1D.fromSizeValue(nbRates, .5);
        const forwards = Array1D.fromSizeValue(nbRates, 0.0);
        for (let i = 0; i < forwards.length; ++i) {
            forwards[i] = i * .001 + .04;
        }
        for (let i = 0; i < rateTimes.length; ++i) {
            rateTimes[i] = (i + 1) * .5;
        }
        const numeraire = nbRates;
        const alive = 0;
        const spanningFwds = 1;
        const cmsDriftcalculator = new CMSMMDriftCalculator(pseudo, displacements, taus, numeraire, alive, spanningFwds);
        const cmsCs = new CMSwapCurveState(rateTimes, spanningFwds);
        cmsCs.setOnCMSwapRates(forwards);
        const cmsDrifts = new Array(nbRates);
        cmsDriftcalculator.compute(cmsCs, cmsDrifts);
        const lmmDriftcalculator = new LMMDriftCalculator(pseudo, displacements, taus, numeraire, alive);
        const lmmCs = new LMMCurveState(rateTimes);
        lmmCs.setOnForwardRates(forwards);
        expect(lmmDriftcalculator).not.toBeNull();
    });
});