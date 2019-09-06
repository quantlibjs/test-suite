export var std;
(function (std) {
    function reverse(array, start = 0, stop = -1) {
        const n = array.length;
        if (n <= 1) {
            return;
        }
        if (start < 0) {
            start = Math.max(0, start + n);
        }
        else {
            start = Math.min(start, n - 1);
        }
        if (stop < 0) {
            stop = Math.max(0, stop + n);
        }
        else {
            stop = Math.min(stop, n - 1);
        }
        while (start < stop) {
            const a = array[start];
            const b = array[stop];
            array[start++] = b;
            array[stop--] = a;
        }
    }
    std.reverse = reverse;
    function lower_bound(array, value, fn, start = 0, stop = -1) {
        const n = array.length;
        if (n === 0) {
            return 0;
        }
        if (start < 0) {
            start = Math.max(0, start + n);
        }
        else {
            start = Math.min(start, n - 1);
        }
        if (stop < 0) {
            stop = Math.max(0, stop + n);
        }
        else {
            stop = Math.min(stop, n - 1);
        }
        let begin = start;
        let span = stop - start + 1;
        while (span > 0) {
            const half = span >> 1;
            const middle = begin + half;
            if (fn(array[middle], value) < 0) {
                begin = middle + 1;
                span -= half + 1;
            }
            else {
                span = half;
            }
        }
        return begin;
    }
    std.lower_bound = lower_bound;
    function upper_bound(array, value, fn, start = 0, stop = -1) {
        const n = array.length;
        if (n === 0) {
            return 0;
        }
        if (start < 0) {
            start = Math.max(0, start + n);
        }
        else {
            start = Math.min(start, n - 1);
        }
        if (stop < 0) {
            stop = Math.max(0, stop + n);
        }
        else {
            stop = Math.min(stop, n - 1);
        }
        let begin = start;
        let span = stop - start + 1;
        while (span > 0) {
            const half = span >> 1;
            const middle = begin + half;
            if (fn(array[middle], value) > 0) {
                span = half;
            }
            else {
                begin = middle + 1;
                span -= half + 1;
            }
        }
        return begin;
    }
    std.upper_bound = upper_bound;
    function max_element(a) {
        return a.reduce((p, c) => Math.max(p, c));
    }
    std.max_element = max_element;
    function min_element(a) {
        return a.reduce((p, c) => Math.min(p, c));
    }
    std.min_element = min_element;
    function random_shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    std.random_shuffle = random_shuffle;
    function is_sorted(array) {
        return array.every((value, index) => !index || (value >= array[index - 1])) ?
            1 :
            array.every((value, index) => !index || (value <= array[index - 1])) ?
                -1 :
                0;
    }
    std.is_sorted = is_sorted;
    function unique(a) {
        return Array.from(new Set(a));
    }
    std.unique = unique;
    function unique1(a, f) {
        return a.filter((value, index, array) => {
            return f.f(value, array[index + 1]);
        });
    }
    std.unique1 = unique1;
    function find_if(a, f) {
        for (let i = 0; i < a.length; i++) {
            if (f.f(a[i])) {
                return i;
            }
        }
        return a.length;
    }
    std.find_if = find_if;
    function remove(a, v) {
        const index = a.indexOf(v);
        if (index > -1) {
            a.splice(index, 1);
        }
        return a;
    }
    std.remove = remove;

    function inner_product(v1, v2, value) {
        if (v1.length !== v2.length) {
            throw new Error(`arrays with different sizes ${v1.length}, ` +
                `${v2.length} cannot be multiplied`);
        }
        let sum = value;
        for (let i = 0; i < v1.length; i++) {
            sum += v1[i] * v2[i];
        }
        return sum;
    }
    std.inner_product = inner_product;
    function adjacent_difference(a) {
        const result = [];
        for (let i = 1; i < a.length; i++) {
            result.push(a[i] - a[i - 1]);
        }
        return result;
    }
    std.adjacent_difference = adjacent_difference;
})(std || (std = {}));