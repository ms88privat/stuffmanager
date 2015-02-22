

(function(angular) {
	'use strict';

	angular
		.module('stuffmanager', [])
		.factory('facilityManager', function() {

			class Facility {
				constructor(name = 'defaultName', {cache = true} = {}) {
					this.name = name;
					this.cache = cache;
				}
			}

			return {
				create: function(name) {
					return new Facility(name);
				},
			};
		})
		;


}(window.angular));