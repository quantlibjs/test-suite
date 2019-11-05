/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import '/test-suite/quantlibtestsuite.mjs';
import { ActualActual, AmortizingFixedRateBond, Frequency, NullCalendar, Period, Settings, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Amortizing Bond tests ${version}`, () => {
    it('Testing amortizing fixed rate bond...', () => {
        const rates = [
            0.0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11,
            0.12
        ];
        const amounts = [
            0.277777778, 0.321639520, 0.369619473, 0.421604034, 0.477415295,
            0.536821623, 0.599550525, 0.665302495, 0.733764574, 0.804622617,
            0.877571570, 0.952323396, 1.028612597
        ];
        const freq = Frequency.Monthly;
        const refDate = Settings.evaluationDate.f();
        const tolerance = 1.0e-6;
        for (let i = 0; i < rates.length; ++i) {
            const myBond = new AmortizingFixedRateBond().afrbInit2(0, new NullCalendar(), 100.0, refDate, new Period().init1(30, TimeUnit.Years), freq, rates[i], new ActualActual(ActualActual.Convention.ISMA));
            const cashflows = myBond.cashflows();
            const notionals = myBond.notionals();
            for (let k = 0; k < cashflows.length / 2; ++k) {
                const coupon = cashflows[2 * k].amount1();
                const principal = cashflows[2 * k + 1].amount1();
                const totalAmount = coupon + principal;
                let error = Math.abs(totalAmount - amounts[i]);
                expect(error).toBeLessThan(tolerance);
                const expectedCoupon = notionals[k] * rates[i] / freq;
                error = Math.abs(coupon - expectedCoupon);
                expect(error).toBeLessThan(tolerance);
            }
        }
    });
});