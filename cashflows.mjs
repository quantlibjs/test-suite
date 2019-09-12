import '/test-suite/quantlibtestsuite.mjs';
import { Actual360, Actual365Fixed, ActualActual, BlackIborCouponPricer, BusinessDayConvention, CashFlows, Compounding, ConstantOptionletVolatility, DateExt, FixedRateLeg, FloatingRateCoupon, Frequency, Handle, IborLeg, InterestRate, MakeSchedule, NullCalendar, Period, SavedSettings, Schedule, Settings, SimpleCashFlow, TARGET, TimeUnit, USDLibor } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

function CHECK_INCLUSION(leg, n, today, days, expected) {
    expect(!leg[n].hasOccurred(DateExt.add(today, days))).toEqual(expected);
}

function CHECK_NPV(leg, r, includeRef, today, expected) {
    const NPV = CashFlows.npv2(leg, r, includeRef, today);
    expect(Math.abs(NPV - expected)).toBeLessThan(1e-6);
}

describe('Cash flows tests', () => {
    it('Testing cash-flow settings...', () => {
        const backup = new SavedSettings();
        const today = new Date();
        Settings.evaluationDate.set(today);
        const leg = [];
        for (let i = 0; i < 3; ++i) {
            leg.push(new SimpleCashFlow(1.0, DateExt.add(today, i)));
        }
        Settings.includeReferenceDateEvents = false;
        Settings.includeTodaysCashFlows = null;
        CHECK_INCLUSION(leg, 0, today, 0, false);
        CHECK_INCLUSION(leg, 0, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 0, true);
        CHECK_INCLUSION(leg, 1, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 1, true);
        CHECK_INCLUSION(leg, 2, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 3, false);
        Settings.includeReferenceDateEvents = false;
        Settings.includeTodaysCashFlows = false;
        CHECK_INCLUSION(leg, 0, today, 0, false);
        CHECK_INCLUSION(leg, 0, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 0, true);
        CHECK_INCLUSION(leg, 1, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 1, true);
        CHECK_INCLUSION(leg, 2, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 3, false);
        Settings.includeReferenceDateEvents = true;
        Settings.includeTodaysCashFlows = null;
        CHECK_INCLUSION(leg, 0, today, 0, true);
        CHECK_INCLUSION(leg, 0, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 0, true);
        CHECK_INCLUSION(leg, 1, today, 1, true);
        CHECK_INCLUSION(leg, 1, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 1, true);
        CHECK_INCLUSION(leg, 2, today, 2, true);
        CHECK_INCLUSION(leg, 2, today, 3, false);
        Settings.includeReferenceDateEvents = true;
        Settings.includeTodaysCashFlows = true;
        CHECK_INCLUSION(leg, 0, today, 0, true);
        CHECK_INCLUSION(leg, 0, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 0, true);
        CHECK_INCLUSION(leg, 1, today, 1, true);
        CHECK_INCLUSION(leg, 1, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 1, true);
        CHECK_INCLUSION(leg, 2, today, 2, true);
        CHECK_INCLUSION(leg, 2, today, 3, false);
        Settings.includeReferenceDateEvents = true;
        Settings.includeTodaysCashFlows = false;
        CHECK_INCLUSION(leg, 0, today, 0, false);
        CHECK_INCLUSION(leg, 0, today, 1, false);
        CHECK_INCLUSION(leg, 1, today, 0, true);
        CHECK_INCLUSION(leg, 1, today, 1, true);
        CHECK_INCLUSION(leg, 1, today, 2, false);
        CHECK_INCLUSION(leg, 2, today, 1, true);
        CHECK_INCLUSION(leg, 2, today, 2, true);
        CHECK_INCLUSION(leg, 2, today, 3, false);
        const no_discount = new InterestRate(0.0, new Actual365Fixed(), Compounding.Continuous, Frequency.Annual);
        Settings.includeTodaysCashFlows = null;
        CHECK_NPV(leg, no_discount, false, today, 2.0);
        CHECK_NPV(leg, no_discount, true, today, 3.0);
        Settings.includeTodaysCashFlows = false;
        CHECK_NPV(leg, no_discount, false, today, 2.0);
        CHECK_NPV(leg, no_discount, true, today, 2.0);
        backup.dispose();
    });
    it('Testing dynamic cast of coupon in Black pricer...', () => {
        const backup = new SavedSettings();
        const todaysDate = new Date('7-April-2010');
        const settlementDate = new Date('9-April-2010');
        Settings.evaluationDate.set(todaysDate);
        const calendar = new TARGET();
        const rhTermStructure = new Handle(flatRate2(settlementDate, 0.04875825, new Actual365Fixed()));
        const volatility = 0.10;
        const vol = new Handle(new ConstantOptionletVolatility().covInit3(2, calendar, BusinessDayConvention.ModifiedFollowing, volatility, new Actual365Fixed()));
        const index3m = new USDLibor(new Period().init1(3, TimeUnit.Months), rhTermStructure);
        const payDate = new Date('20-December-2013');
        const startDate = new Date('20-September-2013');
        const endDate = new Date('20-December-2013');
        const spread = 0.0115;
        const pricer = new BlackIborCouponPricer(vol);
        const coupon = new FloatingRateCoupon(payDate, 100, startDate, endDate, 2, index3m, 1.0, spread / 100);
        coupon.setPricer(pricer);
        try {
            expect(coupon.amount1()).not.toBeNull();
        }
        catch (e) {
        }
        backup.dispose();
    });
    it('Testing default evaluation date in cashflows methods...', () => {
        const today = Settings.evaluationDate.f();
        Settings.evaluationDate.set(today);
        const schedule = new MakeSchedule()
            .from(DateExt.advance(today, -2, TimeUnit.Months))
            .to(DateExt.advance(today, 4, TimeUnit.Months))
            .withFrequency(Frequency.Semiannual)
            .withCalendar(new TARGET())
            .withConvention(BusinessDayConvention.Unadjusted)
            .backwards()
            .f();
        const leg = new FixedRateLeg(schedule)
            .withNotionals1(100.0)
            .withCouponRates1(0.03, new Actual360())
            .withPaymentCalendar(new TARGET())
            .withPaymentAdjustment(BusinessDayConvention.Following)
            .f();
        const accruedPeriod = CashFlows.accrualPeriod(leg, false);
        expect(accruedPeriod).not.toEqual(0.0);
        const accruedDays = CashFlows.accruedDays(leg, false);
        expect(accruedDays).not.toEqual(0);
        const accruedAmount = CashFlows.accruedAmount(leg, false);
        expect(accruedAmount).not.toEqual(0.0);
    });
    it('Testing ibor leg construction with null fixing days...', () => {
        const today = Settings.evaluationDate.f();
        const schedule = new MakeSchedule()
            .from(DateExt.advance(today, -2, TimeUnit.Months))
            .to(DateExt.advance(today, 4, TimeUnit.Months))
            .withFrequency(Frequency.Semiannual)
            .withCalendar(new TARGET())
            .withConvention(BusinessDayConvention.Following)
            .backwards()
            .f();
        const index = new USDLibor(new Period().init1(3, TimeUnit.Months));
        const leg = new IborLeg(schedule, index)
            .withNotionals1(100.0)
            .withFixingDays1(null)
            .f();
        expect(leg).not.toBeNull();
    });
    it('Testing irregular first coupon reference dates ' +
        'with end of month enabled...', () => {
        const schedule = new MakeSchedule()
            .from(new Date('17-January-2017'))
            .to(new Date('28-February-2018'))
            .withFrequency(Frequency.Semiannual)
            .withConvention(BusinessDayConvention.Unadjusted)
            .endOfMonth()
            .backwards()
            .f();
        const leg = new FixedRateLeg(schedule)
            .withNotionals1(100.0)
            .withCouponRates1(0.01, new Actual360())
            .f();
        const firstCoupon = leg[0];
        expect(firstCoupon.referencePeriodStart().valueOf())
            .toEqual(new Date('31-August-2016').valueOf());
    });
    it('Testing irregular last coupon reference dates' +
        ' with end of month enabled...', () => {
        const schedule = new MakeSchedule()
            .from(new Date('17-January-2017'))
            .to(new Date('15-September-2018'))
            .withNextToLastDate(new Date('28-February-2018'))
            .withFrequency(Frequency.Semiannual)
            .withConvention(BusinessDayConvention.Unadjusted)
            .endOfMonth()
            .backwards()
            .f();
        const leg = new FixedRateLeg(schedule)
            .withNotionals1(100.0)
            .withCouponRates1(0.01, new Actual360())
            .f();
        const lastCoupon = leg[leg.length - 1];
        expect(lastCoupon.referencePeriodEnd().valueOf())
            .toEqual(new Date('31-August-2018').valueOf());
    });
    it('Testing leg construction with partial schedule...', () => {
        const schedule = new MakeSchedule()
            .from(new Date('15-September-2017'))
            .to(new Date('30-September-2020'))
            .withNextToLastDate(new Date('25-September-2020'))
            .withFrequency(Frequency.Semiannual)
            .backwards()
            .f();
        const schedule2 = new Schedule().init1(schedule.dates(), new NullCalendar(), BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, new Period().init1(6, TimeUnit.Months), null, schedule.endOfMonth(), schedule.isRegular2());
        const schedule3 = new Schedule().init1(schedule.dates());
        const leg = new FixedRateLeg(schedule)
            .withNotionals1(100.0)
            .withCouponRates1(0.01, new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const leg2 = new FixedRateLeg(schedule2)
            .withNotionals1(100.0)
            .withCouponRates1(0.01, new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const leg3 = new FixedRateLeg(schedule3)
            .withNotionals1(100.0)
            .withCouponRates1(0.01, new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const firstCpn = leg[0];
        const lastCpn = leg[leg.length - 1];
        expect(firstCpn).not.toEqual(null);
        expect(lastCpn).not.toEqual(null);
        expect(firstCpn.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Mar-2017').valueOf());
        expect(firstCpn.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpn.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpn.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Mar-2021').valueOf());
        const firstCpn2 = leg2[0];
        const lastCpn2 = leg2[leg2.length - 1];
        expect(firstCpn2).not.toBeNull();
        expect(lastCpn2).not.toBeNull();
        expect(firstCpn2.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Mar-2017').valueOf());
        expect(firstCpn2.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpn2.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpn2.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Mar-2021').valueOf());
        const firstCpn3 = leg3[0];
        const lastCpn3 = leg3[leg3.length - 1];
        expect(firstCpn3).not.toBeNull();
        expect(lastCpn3).not.toBeNull();
        expect(firstCpn3.referencePeriodStart().valueOf())
            .toEqual(new Date('15-Sep-2017').valueOf());
        expect(firstCpn3.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpn3.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpn3.referencePeriodEnd().valueOf())
            .toEqual(new Date('30-Sep-2020').valueOf());
        const iborIndex = new USDLibor(new Period().init1(3, TimeUnit.Months));
        const legf = new IborLeg(schedule, iborIndex)
            .withNotionals1(100.0)
            .withPaymentDayCounter(new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const legf2 = new IborLeg(schedule2, iborIndex)
            .withNotionals1(100.0)
            .withPaymentDayCounter(new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const legf3 = new IborLeg(schedule3, iborIndex)
            .withNotionals1(100.0)
            .withPaymentDayCounter(new ActualActual(ActualActual.Convention.ISMA))
            .f();
        const firstCpnF = legf[0];
        const lastCpnF = legf[legf.length - 1];
        expect(firstCpnF).not.toBeNull();
        expect(lastCpnF).not.toBeNull();
        expect(firstCpnF.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Mar-2017').valueOf());
        expect(firstCpnF.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpnF.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpnF.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Mar-2021').valueOf());
        const firstCpnF2 = legf2[0];
        const lastCpnF2 = legf2[legf2.length - 1];
        expect(firstCpnF2).not.toBeNull();
        expect(lastCpnF2).not.toBeNull();
        expect(firstCpnF2.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Mar-2017').valueOf());
        expect(firstCpnF2.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpnF2.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpnF2.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Mar-2021').valueOf());
        const firstCpnF3 = legf3[0];
        const lastCpnF3 = legf3[legf3.length - 1];
        expect(firstCpnF3).not.toBeNull();
        expect(lastCpnF3).not.toBeNull();
        expect(firstCpnF3.referencePeriodStart().valueOf())
            .toEqual(new Date('15-Sep-2017').valueOf());
        expect(firstCpnF3.referencePeriodEnd().valueOf())
            .toEqual(new Date('25-Sep-2017').valueOf());
        expect(lastCpnF3.referencePeriodStart().valueOf())
            .toEqual(new Date('25-Sep-2020').valueOf());
        expect(lastCpnF3.referencePeriodEnd().valueOf())
            .toEqual(new Date('30-Sep-2020').valueOf());
    });
});