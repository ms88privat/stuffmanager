(function(angular,_) {
	'use strict';

	function clearSomeLocalStorage(startsWith) {
		var myLength = startsWith.length;
		Object.keys(localStorage).forEach(function(key){ 
			if (key.substring(0,myLength) == startsWith) {
				localStorage.removeItem(key); 
			} 
		}); 
	}

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
		.provider('facilityManager', function() {

			var instances = [];
			var appPrefix = 'myApp';

			this.appPrefix = function(prefix) {
				appPrefix = prefix;
			};


			this.$get = function($q) {

				/**
			     * @ngdoc object
			     * @name FacilityInstance
			     * @description FacilityInstance
			     */
				class Facility {
					constructor(name = 'defaultName', {cache = true, store = false, resource = false, domains = []} = {}) {
						this.name = appPrefix + name;
						this.cache = cache;
						this.store = store;
						this.resource = resource;
						this.domains = domains;

						if(this.resource) {
							this.domains.push('resource');
						}
						else {
							this.domains.push('facility');
						}

						this.cached = {};

						instances.push(this);
					}

					destroy() {
						_.without(instances, this);
					}

					save({key, data} = {}){

						// no cache = no save
						if(!this.cache) return;

						// the argumented key should always be an addition to the instance and not be the key itself
						key = this.name + key; 
						
						if(this.store) {
							this.saveToStorage(key, data);
						}

						// always return the reference to the cache
						return this.saveToCache(key, data);

					}

					get({id, key} = {}) {

						key = this.name + key;

						var data = this.getFromCache(key);

						// if no data in cache, try in store
						if(!data && this.store) {

							// save it to cache for the next time (otherwise it will always load from store during AppLifetime)
							// which can be very bed if it is often used and the store is the standard syncronous localStorage
							// and gets reference to cache object again -> good!
							data = this.saveToCache(key, this.getFromStore(key));
						}


						// if(id && data) {
						// 	id = parseInt(id);
						// 	data = this.getById(data, id);
						// }

						// if(promise) {
						// 	return $q.when(data);
						// }

						return data;
						
					}

					getFromStore(key) {
						return angular.fromJson(localStorage.getItem(key));
					}

					saveToStorage(key, data) {
						return localStorage.setItem(key, angular.toJson(data));
					}

					getFromCache(key) {
						return this.cached[key];
					}

					saveToCache(key, data) {

						this.cached[key] = data;
						return this.cached[key];
					}


					clear({keys = [], cache = true, storage = true} = {}) {

						if(keys.length === 0) {

							if(cache) {
								this.cached = {};
							}
							
							if (storage) {
								clearSomeLocalStorage(this.name);
							}
							
						}

						else {

							_.forEach(keys, key => {

								if(cache) {
									this.cached[key] = {};
								}

								if (storage) {
									clearSomeLocalStorage(this.name + key);
								}
								
							});
						}

					}

					/**
	                 * @ngdoc method
	                 * @name get
	                 * @description get data by id
	                 * @methodOf FacilityInstance
	                 * @param {Number} id must be an integer
	                 * @returns {Object | Array} of data
	                 */

					static clearAll({domains = [], cache = true, storage = true} = {}) {
						// cache
						if(domains.length === 0) {
							_.forEach(instances, instance => {
								instance.clear({
									cache: cache,
									storage: storage
								});
							});
						}

						else {
							_.forEach(instances, instance => {
								// only clear if there is minimum one domain match
								if(_.intersection(domains, instance.domains)) {
									instance.clear({
										cache: cache,
										storage: storage
									});
								}
							});
						}
						
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
					create: function(name, params) {
						return new Facility(name, params);
					},
					/**
	                 * @ngdoc method
	                 * @name class
	                 * @methodOf stuffmanager.facilityManager
	                 * @returns {CLASS} Returns the Facility Class for extending purposes 
	                 * (e.g. Resource (within resourceManager) extends Facility.class)
	                 */
					class: function() {
						return Facility;
					}
				};
			};
			
			
		})
		;


}(window.angular, window._));


/* EOF */