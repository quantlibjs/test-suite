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
import { Handle, SimpleQuote, Stock, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag } from '/test-suite/utilities.mjs';

describe(`LazyObject tests ${version}`, () => {
    it('Testing that lazy objects discard notifications after the first...', () => {
        const q = new SimpleQuote(0.0);
        const s = new Stock(new Handle(q));
        const f = new Flag();
        f.registerWith(s);
        s.NPV();
        q.setValue(1.0);
        expect(f.isUp()).toEqual(true);
        f.lower();
        q.setValue(2.0);
        expect(f.isUp()).toEqual(false);
        f.lower();
        s.NPV();
        q.setValue(3.0);
        expect(f.isUp()).toEqual(true);
    });
    
    it('Testing that lazy objects forward all notifications when told...', () => {
        const q = new SimpleQuote(0.0);
        const s = new Stock(new Handle(q));
        s.alwaysForwardNotifications();
        const f = new Flag();
        f.registerWith(s);
        s.NPV();
        q.setValue(1.0);
        expect(f.isUp()).toEqual(true);
        f.lower();
        q.setValue(2.0);
        expect(f.isUp()).toEqual(true);
    });
});