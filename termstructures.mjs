import { Actual360, Actual365Fixed, BusinessDayConvention, Comparison, CompositeZeroYieldStructure, Compounding, Currency, DateExt, DepositRateHelper, Discount, FlatForward, ForwardCurve, ForwardSpreadedTermStructure, Frequency, Handle, IborIndex, ImpliedTermStructure, LogLinear, Month, NullCalendar, Period, PiecewiseYieldCurve, RelinkableHandle, SavedSettings, Settings, SimpleQuote, SwapRateHelper, TARGET, Thirty360, TimeUnit, YieldTermStructure, ZeroSpreadedTermStructure } from '/ql.mjs';
import { Flag } from '/test-suite/utilities.mjs';

class Datum {
    constructor(n, units, rate) {
        this.n = n;
        this.units = units;
        this.rate = rate;
    }
}

class CommonVars {
    constructor() {
        this.backup = new SavedSettings();
        this.calendar = new TARGET();
        this.settlementDays = 2;
        const today = this.calendar.adjust(new Date());
        Settings.evaluationDate.set(today);
        const settlement = this.calendar.advance1(today, this.settlementDays, TimeUnit.Days);
        const depositData = [
            new Datum(1, TimeUnit.Months, 4.581),
            new Datum(2, TimeUnit.Months, 4.573),
            new Datum(3, TimeUnit.Months, 4.557),
            new Datum(6, TimeUnit.Months, 4.496), new Datum(9, TimeUnit.Months, 4.490)
        ];
        const swapData = [
            new Datum(1, TimeUnit.Years, 4.54), new Datum(5, TimeUnit.Years, 4.99),
            new Datum(10, TimeUnit.Years, 5.47), new Datum(20, TimeUnit.Years, 5.89),
            new Datum(30, TimeUnit.Years, 5.96)
        ];
        const deposits = depositData.length, swaps = swapData.length;
        const instruments = new Array(deposits + swaps);
        for (let i = 0; i < deposits; i++) {
            instruments[i] = new DepositRateHelper().drhInit2(depositData[i].rate / 100, new Period().init1(depositData[i].n, depositData[i].units), this.settlementDays, this.calendar, BusinessDayConvention.ModifiedFollowing, true, new Actual360());
        }
        const index = new IborIndex('dummy', new Period().init1(6, TimeUnit.Months), this.settlementDays, new Currency(), this.calendar, BusinessDayConvention.ModifiedFollowing, false, new Actual360());
        for (let i = 0; i < swaps; i++) {
            instruments[i + deposits] = new SwapRateHelper().srhInit4(swapData[i].rate / 100, new Period().init1(swapData[i].n, swapData[i].units), this.calendar, Frequency.Annual, BusinessDayConvention.Unadjusted, new Thirty360(), index);
        }
        this.termStructure =
            new PiecewiseYieldCurve(new Discount(), new LogLinear())
                .pwycInit3(settlement, instruments, new Actual360());
        this.dummyTermStructure =
            new PiecewiseYieldCurve(new Discount(), new LogLinear())
                .pwycInit3(settlement, instruments, new Actual360());
    }
    sub(x, y) {
        return x - y;
    }
}

describe('Term structure tests', () => {
    it('Testing term structure against evaluation date change...', () => {
        const vars = new CommonVars();
        const flatRate = new SimpleQuote();
        const flatRateHandle = new Handle(flatRate);
        vars.termStructure = new FlatForward().ffInit3(vars.settlementDays, new NullCalendar(), flatRateHandle, new Actual360());
        const today = Settings.evaluationDate.f();
        flatRate.setValue(.03);
        const days = [10, 30, 60, 120, 360, 720];
        let i;
        const expected = new Array(days.length);
        for (i = 0; i < days.length; i++) {
            expected[i] = vars.termStructure.discount1(DateExt.add(today, days[i]));
        }
        Settings.evaluationDate.set(DateExt.add(today, 30));
        const calculated = new Array(days.length);
        for (i = 0; i < days.length; i++) {
            calculated[i] =
                vars.termStructure.discount1(DateExt.add(today, 30 + days[i]));
        }
        for (i = 0; i < days.length; i++) {
            expect(Comparison.close(expected[i], calculated[i])).toBeTruthy();
        }
    });
    it('Testing consistency of implied term structure...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-10;
        const today = Settings.evaluationDate.f();
        const newToday = DateExt.advance(today, 3, TimeUnit.Years);
        const newSettlement = vars.calendar.advance1(newToday, vars.settlementDays, TimeUnit.Days);
        const testDate = DateExt.advance(newSettlement, 5, TimeUnit.Years);
        const implied = new ImpliedTermStructure(new Handle(vars.termStructure), newSettlement);
        const baseDiscount = vars.termStructure.discount1(newSettlement);
        const discount = vars.termStructure.discount1(testDate);
        const impliedDiscount = implied.discount1(testDate);
        expect(Math.abs(discount - baseDiscount * impliedDiscount))
            .toBeLessThan(tolerance);
    });
    it('Testing observability of implied term structure...', () => {
        const vars = new CommonVars();
        const today = Settings.evaluationDate.f();
        const newToday = DateExt.advance(today, 3, TimeUnit.Years);
        const newSettlement = vars.calendar.advance1(newToday, vars.settlementDays, TimeUnit.Days);
        const h = new RelinkableHandle();
        const implied = new ImpliedTermStructure(h, newSettlement);
        const flag = new Flag();
        flag.registerWith(implied);
        h.linkTo(vars.termStructure);
        expect(flag.isUp).toBeTruthy();
    });
    it('Testing consistency of forward-spreaded term structure...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-10;
        const me = new SimpleQuote(0.01);
        const mh = new Handle(me);
        const spreaded = new ForwardSpreadedTermStructure(new Handle(vars.termStructure), mh);
        const testDate = DateExt.advance(vars.termStructure.referenceDate(), 5, TimeUnit.Years);
        const tsdc = vars.termStructure.dayCounter();
        const sprdc = spreaded.dayCounter();
        const forward = vars.termStructure
            .forwardRate1(testDate, testDate, tsdc, Compounding.Continuous, Frequency.NoFrequency)
            .f();
        const spreadedForward = spreaded
            .forwardRate1(testDate, testDate, sprdc, Compounding.Continuous, Frequency.NoFrequency)
            .f();
        expect(Math.abs(forward - (spreadedForward - me.value())))
            .toBeLessThan(tolerance);
    });
    it('Testing observability of forward-spreaded term structure...', () => {
        const vars = new CommonVars();
        const me = new SimpleQuote(0.01);
        const mh = new Handle(me);
        const h = new RelinkableHandle();
        const spreaded = new ForwardSpreadedTermStructure(new Handle(vars.termStructure), mh);
        const flag = new Flag();
        flag.registerWith(spreaded);
        h.linkTo(vars.termStructure);
        expect(flag.isUp).toBeTruthy();
        flag.lower();
        me.setValue(0.005);
        expect(flag.isUp).toBeTruthy();
    });
    it('Testing consistency of zero-spreaded term structure...', () => {
        const vars = new CommonVars();
        const tolerance = 1.0e-10;
        const me = new SimpleQuote(0.01);
        const mh = new Handle(me);
        const spreaded = new ZeroSpreadedTermStructure(new Handle(vars.termStructure), mh);
        const testDate = DateExt.advance(vars.termStructure.referenceDate(), 5, TimeUnit.Years);
        const rfdc = vars.termStructure.dayCounter();
        const zero = vars.termStructure
            .zeroRate1(testDate, rfdc, Compounding.Continuous, Frequency.NoFrequency)
            .f();
        const spreadedZero = spreaded
            .zeroRate1(testDate, rfdc, Compounding.Continuous, Frequency.NoFrequency)
            .f();
        expect(Math.abs(zero - (spreadedZero - me.value())))
            .toBeLessThan(tolerance);
    });
    it('Testing observability of zero-spreaded term structure...', () => {
        const vars = new CommonVars();
        const me = new SimpleQuote(0.01);
        const mh = new Handle(me);
        const h = new RelinkableHandle(vars.dummyTermStructure);
        const spreaded = new ZeroSpreadedTermStructure(h, mh);
        const flag = new Flag();
        flag.registerWith(spreaded);
        h.linkTo(vars.termStructure);
        expect(flag.isUp).toBeTruthy();
        flag.lower();
        me.setValue(0.005);
        expect(flag.isUp).toBeTruthy();
    });
    it('Testing that a zero-spreaded curve can be ' +
        'created with a null underlying curve...', () => {
        const vars = new CommonVars();
        const spread = new Handle(new SimpleQuote(0.01));
        const underlying = new RelinkableHandle();
        const spreaded = new ZeroSpreadedTermStructure(underlying, spread);
        underlying.linkTo(vars.termStructure);
        spreaded.referenceDate();
    });
    it('Testing that an underlying curve can ' +
        'be relinked to a null underlying curve...', () => {
        const vars = new CommonVars();
        const spread = new Handle(new SimpleQuote(0.01));
        const underlying = new RelinkableHandle(vars.termStructure);
        const spreaded = new ZeroSpreadedTermStructure(underlying, spread);
        spreaded.referenceDate();
        underlying.linkTo(new YieldTermStructure());
    });
    it('Testing composite zero yield structures...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(new Date(2017, Month.Nov - 1, 10));
        let dates = [];
        let rates = [];
        dates.push(new Date(2017, Month.Nov - 1, 10));
        dates.push(new Date(2017, Month.Nov - 1, 13));
        dates.push(new Date(2018, Month.Feb - 1, 12));
        dates.push(new Date(2018, Month.May - 1, 10));
        dates.push(new Date(2018, Month.Aug - 1, 10));
        dates.push(new Date(2018, Month.Nov - 1, 12));
        dates.push(new Date(2018, Month.Dec - 1, 21));
        dates.push(new Date(2020, Month.Jan - 1, 15));
        dates.push(new Date(2021, Month.Mar - 1, 31));
        dates.push(new Date(2023, Month.Feb - 1, 28));
        dates.push(new Date(2026, Month.Dec - 1, 21));
        dates.push(new Date(2030, Month.Jan - 1, 31));
        dates.push(new Date(2031, Month.Feb - 1, 28));
        dates.push(new Date(2036, Month.Mar - 1, 31));
        dates.push(new Date(2041, Month.Feb - 1, 28));
        dates.push(new Date(2048, Month.Feb - 1, 28));
        dates.push(new Date(2141, Month.Dec - 1, 31));
        rates.push(0.0655823213132524);
        rates.push(0.0655823213132524);
        rates.push(0.0699455024156877);
        rates.push(0.0799107139233497);
        rates.push(0.0813931951022577);
        rates.push(0.0841615820666691);
        rates.push(0.0501297919004145);
        rates.push(0.0823483583439658);
        rates.push(0.0860720030924466);
        rates.push(0.0922887604375688);
        rates.push(0.10588902278996);
        rates.push(0.117021968693922);
        rates.push(0.109824660896137);
        rates.push(0.109231572878364);
        rates.push(0.119218123236241);
        rates.push(0.128647300167664);
        rates.push(0.0506086995288751);
        const termStructure1 = new ForwardCurve().curveInit1(dates, rates, new Actual365Fixed(), new NullCalendar());
        dates = [];
        rates = [];
        dates.push(new Date(2017, Month.Nov - 1, 10));
        dates.push(new Date(2017, Month.Nov - 1, 13));
        dates.push(new Date(2017, Month.Dec - 1, 11));
        dates.push(new Date(2018, Month.Feb - 1, 12));
        dates.push(new Date(2018, Month.May - 1, 10));
        dates.push(new Date(2022, Month.Jan - 1, 31));
        dates.push(new Date(2023, Month.Dec - 1, 7));
        dates.push(new Date(2025, Month.Jan - 1, 31));
        dates.push(new Date(2028, Month.Mar - 1, 31));
        dates.push(new Date(2033, Month.Dec - 1, 7));
        dates.push(new Date(2038, Month.Feb - 1, 1));
        dates.push(new Date(2046, Month.Apr - 1, 2));
        dates.push(new Date(2051, Month.Jan - 1, 2));
        dates.push(new Date(2141, Month.Dec - 1, 31));
        rates.push(0.056656806197189);
        rates.push(0.056656806197189);
        rates.push(0.0419541633454473);
        rates.push(0.0286681050019797);
        rates.push(0.0148840226959593);
        rates.push(0.0246680238374363);
        rates.push(0.0255349067810599);
        rates.push(0.0298907184711927);
        rates.push(0.0263943927922053);
        rates.push(0.0291924526539802);
        rates.push(0.0270049276163556);
        rates.push(0.028775807327614);
        rates.push(0.0293567711641792);
        rates.push(0.010518655099659);
        const termStructure2 = new ForwardCurve().curveInit1(dates, rates, new Actual365Fixed(), new NullCalendar());
        const compoundCurve = new CompositeZeroYieldStructure(new Handle(termStructure1), new Handle(termStructure2), {
            f: (x, y) => {
                return x - y;
            }
        });
        dates = [];
        rates = [];
        dates.push(new Date(2017, Month.Nov - 1, 10));
        dates.push(new Date(2017, Month.Dec - 1, 15));
        dates.push(new Date(2018, Month.Jun - 1, 15));
        dates.push(new Date(2029, Month.Sep - 1, 15));
        dates.push(new Date(2038, Month.Sep - 1, 15));
        dates.push(new Date(2046, Month.Mar - 1, 15));
        dates.push(new Date(2141, Month.Dec - 1, 15));
        rates.push(0.00892551511527986);
        rates.push(0.0278755322562788);
        rates.push(0.0512001768603456);
        rates.push(0.0729941474263546);
        rates.push(0.0778333309498459);
        rates.push(0.0828451659139004);
        rates.push(0.0503573807521742);
        const tolerance = 1.0e-10;
        for (let i = 0; i < dates.length; ++i) {
            const actual = compoundCurve
                .zeroRate1(dates[i], new Actual365Fixed(), Compounding.Continuous)
                .rate();
            const expected = rates[i];
            expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});