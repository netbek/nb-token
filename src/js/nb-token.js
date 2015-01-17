/**
 * AngularJS service for tokens
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.token', [
			'nb.lodash',
			'nb.i18n'
		])
		.provider('nbToken', nbToken)
		.provider('nbTokenConfig', nbTokenConfig);

	function nbTokenConfig () {
		var config = {
			delimiter: ':', // Token path delimiter
			defaults: {
				site: {
					name: undefined,
					slogan: undefined
				}
			}
		};
		return {
			set: function (values) {
				config = angular.extend({}, config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	function nbToken () {
		var initialized = false;

		return {
			$get: ['$rootScope', '$q', '_', 'nbI18N', 'nbTokenConfig',
				function ($rootScope, $q, _, nbI18N, nbTokenConfig) {
					// Bind events.
					$rootScope.$on('$stateChangeStart', function () {
						reset();
					});

					/**
					 *
					 * @param {object|array} obj
					 * @param {string} path
					 * @returns {object}
					 */
					function getReplaceTokens (obj, path) {
						var replace = {};

						if (angular.isObject(obj) && !angular.isArray(obj)) {
							if (angular.isUndefined(path)) {
								path = [];
							}
							angular.forEach(obj, function (value, key) {
								_.extend(replace, getReplaceTokens(value, [].concat(path, key)));
							});
						}
						else {
							if (angular.isDefined(path)) {
								var key = path.join(nbTokenConfig.delimiter);
								replace['[' + key + ']'] = nbI18N.t('@value', {'@value': obj});
							}
						}

						return replace;
					}

					/**
					 * Replaces tokens with values.
					 *
					 * @param {mixed} obj
					 * @param {object} tokens
					 * @returns {mixed}
					 */
					function replace (obj, tokens) {
						if (angular.isUndefined(obj)) {
							return obj;
						}

						if (angular.isUndefined(tokens)) {
							tokens = getReplaceTokens($rootScope.tokens);
						}

						if (angular.isObject(obj)) {
							angular.forEach(obj, function (value, key) {
								obj[key] = replace(value, tokens);
							});
						}
						else {
							obj = obj.toString();

							angular.forEach(tokens, function (value, key) {
								obj = obj.replace(key, value);
							});
						}

						return obj;
					}

					/**
					 * Resets tokens to default values.
					 */
					function reset () {
						$rootScope.tokens = _.cloneDeep(nbTokenConfig.defaults);
					}

					return {
						/**
						 *
						 * @returns {promise}
						 */
						init: function () {
							var d = $q.defer();

							if (!initialized) {
								initialized = true;
								reset();
							}

							d.resolve(true);

							return d.promise;
						},
						/**
						 *
						 */
						reset: reset,
						/**
						 *
						 * @param {string} token Path to value, e.g. a.b.c
						 * @param {string} defaultValue
						 * @returns object
						 */
						get: function (token, defaultValue) {
							return _.get($rootScope.tokens, token, defaultValue, nbTokenConfig.delimiter);
						},
						/**
						 *
						 * @returns {object}
						 */
						getAll: function () {
							return $rootScope.tokens;
						},
						/**
						 *
						 * @param {string} token Path to value, e.g. a.b.c
						 * @param {string} value
						 * @returns object
						 */
						set: function (token, value) {
							return _.set($rootScope.tokens, token, value, nbTokenConfig.delimiter);
						},
						/**
						 *
						 */
						replace: replace,
						/**
						 *
						 * @param {string} token Path to value, e.g. a.b.c
						 */
						clear: function (token) {
							return _.set($rootScope.tokens, token, undefined);
						}
					};
				}
			]
		};
	}
})(window, window.angular);
