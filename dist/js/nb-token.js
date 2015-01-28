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
				config = window.merge(true, config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	function nbToken () {
		var initialized = false;

		return {
			$get: ['$rootScope', '$q', '_', 'nbTokenConfig',
				function ($rootScope, $q, _, nbTokenConfig) {
					// Reset the replacement values of all tokens to their default value at the start of a state change.
					$rootScope.$on('$stateChangeStart', function () {
						reset();
					});

					/**
					 * Builds a list of search and replacement values from a nested object.
					 *
					 * @param {object|array} obj
					 * @param {string} path
					 * @returns {object}
					 */
					function generate (obj, path) {
						var replacements = {};

						if (angular.isObject(obj) && !angular.isArray(obj)) {
							if (angular.isUndefined(path)) {
								path = [];
							}
							angular.forEach(obj, function (value, key) {
								_.extend(replacements, generate(value, [].concat(path, key)));
							});
						}
						else {
							if (angular.isDefined(path)) {
								var key = path.join(nbTokenConfig.delimiter);
								replacements['[' + key + ']'] = obj;
							}
						}

						return replacements;
					}

					/**
					 * Replaces tokens in a given object or string with appropriate values.
					 *
					 * @param {mixed} obj
					 * @param {object} data Replacement values as a nested object. If undefined, then the root scope token replacement values are used.
					 * @returns {String}
					 */
					function replace (obj, data) {
						if (angular.isUndefined(obj)) {
							return obj;
						}

						var replacements = generate(angular.isDefined(data) ? data : $rootScope.tokens);

						return _replace(obj, replacements);
					}

					/***
					 * Replaces tokens in a given object or string with appropriate values.
					 *
					 * @param {mixed} obj
					 * @param {array} replacements
					 * @returns {mixed}
					 */
					function _replace (obj, replacements) {
						if (angular.isUndefined(obj)) {
							return obj;
						}

						if (angular.isObject(obj)) {
							angular.forEach(obj, function (value, key) {
								obj[key] = _replace(value, replacements);
							});
						}
						else {
							obj = obj.toString();
							angular.forEach(replacements, function (value, key) {
								obj = obj.replace(key, angular.isDefined(value) ? value : '');
							});
						}

						return obj;
					}

					/**
					 * Resets the replacement values of all tokens to their default value.
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
						reset: reset,
						replace: replace,
						/**
						 * Gets the replacement value of a token.
						 *
						 * @param {string} token Path to value, e.g. a.b.c
						 * @param {string} defaultValue
						 * @returns object
						 */
						get: function (token, defaultValue) {
							return _.get($rootScope.tokens, token, defaultValue, nbTokenConfig.delimiter);
						},
						/**
						 * Gets the replacement values of all tokens.
						 *
						 * @returns {object}
						 */
						getAll: function () {
							return $rootScope.tokens;
						},
						/**
						 * Sets the replacement value of a token.
						 *
						 * @param {string} token Path to value, e.g. a.b.c
						 * @param {string} value
						 * @returns object
						 */
						set: function (token, value) {
							return _.set($rootScope.tokens, token, value, nbTokenConfig.delimiter);
						},
						/**
						 * Sets the replacement value of a token to undefined.
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
