/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
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
import { BlackConstantVol, FlatForward, Handle, IndexManager, NullCalendar, Observer, SimpleQuote, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

export class Flag extends Observer {
    constructor() {
        super(...arguments);
        this._up = false;
    }
    raise() {
        this._up = true;
    }
    lower() {
        this._up = false;
    }
    isUp() {
        return this._up;
    }
    update() {
        this.raise();
    }
}

export function norm(v, h) {
    const f2 = v.map(x => x * x);
    const I = h *
        (f2.reduce((a, b) => a + b, 0) - 0.5 * f2[0] - 0.5 * f2[f2.length - 1]);
    return Math.sqrt(I);
}

export class IndexHistoryCleaner {
    constructor() {
        this._isDisposed = false;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        IndexManager.clearHistories();
    }
}

export function flatRate1(today, forward, dc) {
    return new FlatForward().ffInit1(today, new Handle(forward), dc);
}

export function flatRate2(today, forward, dc) {
    return flatRate1(today, new SimpleQuote(forward), dc);
}

export function flatRate3(forward, dc) {
    return new FlatForward().ffInit3(0, new NullCalendar(), new Handle(forward), dc);
}

export function flatRate4(forward, dc) {
    return flatRate3(new SimpleQuote(forward), dc);
}

export function flatVol1(today, vol, dc) {
    return new BlackConstantVol().bcvInit2(today, new NullCalendar(), new Handle(vol), dc);
}

export function flatVol2(today, vol, dc) {
    return flatVol1(today, new SimpleQuote(vol), dc);
}

export function flatVol3(vol, dc) {
    return new BlackConstantVol().bcvInit4(0, new NullCalendar(), new Handle(vol), dc);
}

export function flatVol4(vol, dc) {
    return flatVol3(new SimpleQuote(vol), dc);
}

export function relativeError(x1, x2, reference) {
    if (reference !== 0.0) {
        return Math.abs(x1 - x2) / reference;
    }
    else {
        return Math.abs(x1 - x2);
    }
}