/**
 * @description mapsort - 1.6GB - Performant sorting for complex input.
 * @param {Object} object_arguments - Contains the arguments for the function.
 * @param {any[]} object_arguments.array - Array to sort.
 * @param {boolean} [object_arguments.boolean_ascending] - If `true`, sorts elements by ascending order. If `false`, sorts by descending order. Defaults to `true`.
 * @param {function} [object_arguments.function_prepare] - Optional function to use on the array's elements to get ideal versions for sorting. Defaults to converting the elements to strings.
 * @returns {any[]} The new sorted list.
 * @see {@link https://unpkg.com/mapsort@1.0.4/compiled/iife/mapsort.min.js|unpkg}
 * @see {@link https://github.com/Pimm/mapsort|GitHub}
 * @license MIT
 */
export const array_sort = ({
	array: a,
	boolean_ascending: b = !0,
	function_prepare: p = (any_element) => any_element + "",
}) => {
	var mapSort=(function(){'use strict';function defaultCompareFunction(a,b){var c=a+"",d=b+"";return c<d?-1:c==d?0:1}var forEach=[].forEach;function mapSort(a,b,c){if("function"!=typeof b)throw new TypeError(b+" is not a function");var d,e=[],f=[],g=[];forEach.call(a,function(a,h,i){if(d=b(a,h,i),void 0===d)return void g.push(a);if(void 0===c&&"symbol"==typeof d)throw new TypeError("Can't convert symbol to string");e.push(h),f[h]=d;}),void 0===c&&(c=defaultCompareFunction),e.sort(function(a,b){return c(f[a],f[b])});var h=e.map(function(b){return a[b]}).concat(g);return h.length!=a.length&&(h.length=a.length),h}return mapSort;}());
	return mapSort(
		a,
		p,
		b
			? (any_first, any_second) => any_first - any_second
			: (any_first, any_second) => any_second - any_first
	);
};
