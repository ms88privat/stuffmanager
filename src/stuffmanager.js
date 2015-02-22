/* global angular */


(function(angular) {
	'use strict';

	 /**
     * @ngdoc overview
     * @name stuffmanager
     * @description Manage your Stuff better!
     */
	angular
		.module('stuffmanager', [])
		/**
	     * @ngdoc service
	     * @name stuffmanager.facilityManager
	     * @description facilityManager manages your localData you need to save between page reloads
	     */
		.factory('facilityManager', function() {

			/**
		     * @ngdoc object
		     * @name FacilityInstance
		     * @description FacilityInstance
		     */
			class Facility {
				constructor(name = 'defaultName', {cache = true} = {}) {
					this.name = name;
					this.cache = cache;
				}

				/**
                 * @ngdoc method
                 * @name get
                 * @description get data by id
                 * @methodOf FacilityInstance
                 * @param {Number} id must be an integer
                 * @returns {Object | Array} of data
                 */
				get(id) {
					return 'Hello world' + id;
				}
			}

			
			return {
				 /**
                 * @ngdoc method
                 * @name create
                 * @methodOf stuffmanager.facilityManager
                 * @param {string} name Name of the instance
                 * @returns {INSTANCE} Instance of Facility Class
                 */
				create: function(name) {
					return new Facility(name);
				},
			};
		})
		;


}(window.angular));


/* EOF */