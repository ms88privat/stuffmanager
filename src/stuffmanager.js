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

	function timeDiff(timeOne, timeTwo) {
		if (timeOne === 'now') {timeOne = new Date().getTime();}
		if (timeOne < timeTwo) {
			timeOne.setDate(timeOne.getDate() + 1);
		}
		var diff = timeOne - timeTwo;
		return diff;
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
			var instancesNames = []; // every instance should have a unique name (so string-based-storage does not mess up)
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
					constructor(name, {
						cache = true, 
						store = false, 
						resource = false, 
						primId = 'id',
						domains = []
					} = {}) {

						// every instance need a string-based name
						if(!(typeof name === 'string' || name instanceof String )) {
							throw 'facilityManager Instance: No "name" specified';
						}

						// every name should be unique
						if(_.indexOf(instancesNames, name) !== -1) {
							throw 'facilityManager Instance: Duplicate Name - Every instance should have a unique name';
						}
						instancesNames.push(name);


						this.name = appPrefix + name;
						this.cache = cache;
						this.store = store;
						this.resource = resource;
						this.domains = domains;
						this.primId = primId; // is treatet like it is always an Integer!

						// predefined domains (resource = promise based data)
						if(this.resource) {
							this.domains.push('RESOURCE');
						}
						else {
							this.domains.push('FACILITY');
						}

						this.cached = {};

						instances.push(this);
					}

					destroy() {
						_.without(instances, this);
					}

					save({key, data} = {}){

						if(!this.cache) return;

						if(this.store) {
							this.saveToStorage(key, data);
						}

						// always return the reference to the cache
						return this.saveToCache(key, data);

					}

					/**
	                 * @ngdoc method
	                 * @name get
	                 * @description get data by id
	                 * @methodOf FacilityInstance
	                 * @param {Object} args Specify all arguments needed
	                 * @param {Number} args.id Has to be an integer
	                 * @param {Number | String} args.key Get data from a specific key
	                 * @returns {Object | Array} of data
	                 */
					get({id, key} = {}) {

						var data = this.getFromCache(key);

						// if no data in cache, try in store
						if(!data && this.store) {

							// save it to cache for the next time (otherwise it will always load from store during AppLifetime)
							// which can be very bed if it is often used and the store is the standard syncronous localStorage
							// and gets reference to cache object again -> good!
							data = this.saveToCache(key, this.getFromStore(key));
						}


						if(id && data) {
							id = parseInt(id);
							data = this.getById(id, data);
						}

						// if(promise) {
						// 	return $q.when(data);
						// }

						return data;
						
					}


					getById(id, data) {
						if (data instanceof Array) {
							var matrix = {};
							matrix[this.primId] = id;
							return _.find(data, matrix);
						}
					}

					// todo: should data be an object or array, or can it be a string too?
					add({key, data} = {}) {

						var presentData = Facility.prototype.get.call(this, {key: key});

						if(presentData) {

							if(!_.isArray(presentData)) {
								throw 'add() failed: presentData is not an array';
							}

							presentData = presentData.concat(data); // concat because data could be an array too
							// _.uniq(presentData, this.primId);
						}
						else {
							presentData = [];
							presentData = presentData.concat(data);
						}

						// save changes and return
						return Facility.prototype.save.call(this, {key: key, data: presentData});

					}

					removeById({id, key} = {}) {

						if(!id) {
							throw 'removeById() has no id specified';
						}

						var presentData = Facility.prototype.get.call(this, {key: key});

						if(presentData) { // instanceofAry? singleModel unterstüzung?

							if(!_.isArray(presentData)) throw 'removeById() failed: presentData is not an array';

							id = parseInt(id);

							var removed = _.remove(presentData, (model) => {
								if(model[this.primId] === id) return true;
							});

							// save changes only if there was a change
							if(removed) {
								var saved = Facility.prototype.save.call(this, {key: key, data: presentData});
								return saved;
							} else {
								console.warn('removeById(): no match found -> no data removedById', id);
								return presentData;
							}
							
						}

					}

					update({key, data} = {}) {
						// limitTo three cases:
						// 1. data = object with id, presentData = collection with id's (standard case)
						// 2. data = object, presentData = object (if 'id' does not matter)
						// 3. data = collection with id's (isList), presentData = collection with id's

						// throwErr is:
						// 1. no case passed
						var presentData = Facility.prototype.get.call(this, {key: key});
						var passed = false;	
					
						// CASE 1
						if(data.hasOwnProperty(this.primId) && _.isArray(presentData) ) {
							// console.log('CASE 1');
							passed = true;
							// find possible match
							var match = this.getById(data[this.primId], presentData);
							// assign the new data to the match
							if(match) {
								_.assign(match, data);
							}
							else {
								console.warn('update() CASE 1: no match found -> no data updated or added! not found:', data);
							}
						}

						// CASE 2
						if(_.isPlainObject(data) && _.isPlainObject(presentData)) { // cut playObject(data), its testet in the beginning
							// console.log('CASE 2');
							passed = true;
							// todo: console.warn if id's are not matching??
							// assign the new data to the presentData
							_.assign(presentData, data);
						}

						// CASE 3
						if(_.isArray(data) && _.isArray(presentData)) {
							// console.log('CASE 3');
							passed = true;
							var matrix = {};

							// find all matches, update every match
							_.forEach(data, (model) => {
								matrix[this.primId] = model[this.primId];
								var match = _.find(presentData, matrix);
								if(match) {
									_.assign(match, model);
								}
								else {
									console.warn('update() CASE 3: no match found -> data NOT updated or added! not found:', model);
								}
							});
						}

						// no CASE matched
						if(!passed) {
							throw 'update() was not possible - maybe there is no use case for it with the given and fetched data - re save() instead?';
						}

						// save to cache is duplicate because the cache was mutated already? only save to store?
						return Facility.prototype.save.call(this, {key: key, data: presentData});

					}

					saveToCache(key, data) {
						// extend the key to the specfic instance
						key = this.name + key;
						this.cached[key] = data;
						return this.cached[key];
					}

					saveToStorage(key, data) {
						key = this.name + key;
						return localStorage.setItem(key, angular.toJson(data));
					}

					getFromCache(key) {
						key = this.name + key;
						return this.cached[key];
					}

					getFromStore(key) {
						key = this.name + key;
						return angular.fromJson(localStorage.getItem(key));
					}

					// loopKeys() {

					// }

					
					// key array nötig oder nur key?
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

							_.forEach(keys, (key) => {

								if(cache) {
									delete this.cached[this.name + key];
								}

								if (storage) {
									clearSomeLocalStorage(this.name + key);
								}
								
							});
						}

					}

					

					static clear({domains = [], cache = true, storage = true} = {}) {
						// cache
						if(domains.length === 0) {
							_.forEach(instances, (instance) => {
								instance.clear({
									cache: cache,
									storage: storage
								});
							});
						}

						else {
							_.forEach(instances, (instance) => {
								// only clear if there is minimum one domain match
								if(_.intersection(domains, instance.domains).length > 0) {
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
					},
					classX: Facility,
					clear: Facility.clear
				};
			};
			
			
		})
		.provider('resourceManager', function() {

			var THROTTLE_TIME = 5000;

			this.THROTTLE_TIME = function(ms) {
				THROTTLE_TIME = ms;
			};


			this.$get = function($q, $rootScope, $http, facilityManager) { 

				var TRANSFORM = function(data, header, x,y) {
					console.log('data, header', data, header(), x,y);

					if (_.has(header, 'status')) { // hf special
						$rootScope.$broadcast('STUFFMANAGER:SERVER_TRANSFER_HAPPENED', header().date);
					}
					
					return data;
				};

				var ERROR_HANDLER = function(name, error) {
					console.warn('errorHandler', name, error);
					$rootScope.$broadcast('STUFFMANAGER:HTTP_ERROR', name, error);
				};
	

				function httpRequest(method, url, params, data) {
					var config = {
						method: method,
						url: url,
						params: params,
						data: data,
						transformResponse: [TRANSFORM].concat($http.defaults.transformResponse)
					};

					return httpProxy(config);

				}


				class Resource extends facilityManager.class() {
					constructor(name, {
						cache = true, 
						store = false, 
						primId = 'id',
						domains = [],
						parse = false,
						throttleTime = THROTTLE_TIME,
						errorHandler = ERROR_HANDLER,
						url
					} = {}) {

						if(!(typeof url === 'string' || url instanceof String )) {
							throw 'resourceManager Instance: No "url" specified';
						}

						this.url = url;
						this.parse = parse;
						this.throttleTime = throttleTime;
						this.errorHandler = errorHandler;

						super(name, {
							cache: cache, 
							store: store, 
							resource: true, // Resource!
							primId: primId,
							domains: domains
						});

						// this assoiative array is holding all of the last requests promises
						this.request = {}; 
						this.requestTime = {};
					}

					throwErr({throwErr = {}} = {}) {
						var defaultArgs = {
							timeout: 3000, // 3 sec
							code: 404,
						};
						_.defaults(throwErr, defaultArgs);

						var error = {};
						error.status = throwErr.code;
						return $timeout(()=> {
							if (this.errorHandler) {this.errorHandler(this.name, error);}
							return $q.reject('Error ' + name);
						}, throwErr.timeout);
					}

					fetch({
						url = this.url, 
						params = {},
						key, 
						reload = false, 

						} = {}) {

						if (!reload) {
							var data = super.get({key: key, id: params.id}); // get id???
							
						}

						if (data) {
							return $q.when(data);
						}

						else {

							var requestIdf = angular.toJson(url) + angular.toJson(params); // unqiue identifyer
							var diff = timeDiff('now', this.requestTime[requestIdf]);

							var saveHandler = (resp) => {
								super.save({data: resp, key: key});
								return resp;
							};

							if (!diff || diff > this.throttleTime) {
								// new request
								console.log('get() ', this.name);
								this.requestTime[requestIdf] = new Date().getTime();
								this.request[requestIdf] = httpRequest('GET', url, params)

									
									.then((resp)=>{return this.parseResponse(resp);})
									.then(saveHandler)
									.catch((err)=>{return this.errorResponse(err);})
									;
							}

							// if throttle it will return the value from last time
							return this.request[requestIdf]; 
						}

						

					}

					create({
						params = {}, 
						data, 
						url = this.url, 
						key
						} = {}) {
					
						if (data.hasOwnProperty(this.primId)) { 
							console.warn('CREATE() data has a id already?');
						}

						var addHandler = (resp) => {
							super.add({data: resp, key: key}); // evtl. inital data muaten um changes zu übernehmen??
							return resp;
						};

						// CREATE
						return httpRequest('POST', url, params, data)
							.then((resp)=>{return this.parseResponse(resp);})
							.then(addHandler)
							.catch((err)=>{return this.errorResponse(err);});
					}

					put({
						params = {}, 
						data, 
						url = this.url, 
						key
						} = {}) {

						var updateHandler =function(resp) {
							super.update({data: resp, key: key}); 
							return resp;
						};

						return httpRequest('PUT', url, params, data)
							.then((resp)=>{return this.parseResponse(resp);})
							.then(updateHandler)
							.catch((err)=>{return this.errorResponse(err);});
						


					}

					// delte has no parse response until now
					delete({url = this.url, params, key} = {}) {

						var id = _.pick(params, 'id').id; // copy id

						var removeHandler = (resp) => {
							// we can not use params.id, because params.id got deleted by url interpolation process
							return super.removeById({key: key, id: id});
						};

						return httpRequest('DELETE', url, params)
							.then(removeHandler)
							.catch((err)=>{return this.errorResponse(err);});
					}


					parseResponse(resp) {
						resp = resp.data;
						console.log('parse:', resp);
						if (typeof this.parse === 'string') {
							resp = resp[this.parse];
						} else if (angular.isFunction(this.parse) === true) {
							resp = this.parse(resp);
						} 
						return resp;
					}

					errorResponse(err) {
						if (this.errorHandler) {this.errorHandler(this.name, err);}
						return $q.reject(err);
					}

				}




				return {
					class: function() {
						return Resource;
					},
					create: function(name, args) {
						return new Resource(name, args);
					},
					TRANSFORM: TRANSFORM,
					ERROR_HANDLER: ERROR_HANDLER
				};



				// I proxy the $http service and merge the params and data values into
				// the URL before creating the underlying request.
				function httpProxy( config ) {

					config.url = interpolateUrl( config.url, config.params, config.data );

					return( $http( config ) );

				}

				// I move values from the params and data arguments into the URL where
				// there is a match for labels. When the match occurs, the key-value
				// pairs are removed from the parent object and merged into the string
				// value of the URL.
				function interpolateUrl( url, params, data ) {

					// Make sure we have an object to work with - makes the rest of the
					// logic easier.
					params = ( params || {} );
					data = ( data || {} );

					// Strip out the delimiter fluff that is only there for readability
					// of the optional label paths.
					url = url.replace( /(\(\s*|\s*\)|\s*\|\s*)/g, "" );

					// Replace each label in the URL (ex, :userID).
					url = url.replace(
						/:([a-z]\w*)/gi,
						function( $0, label ) {

							// NOTE: Giving "data" precedence over "params".
							return( popFirstKey( data, params, label ) || "" );

						}
					);

					// Strip out any repeating slashes (but NOT the http:// version).
					url = url.replace( /(^|[^:])[\/]{2,}/g, "$1/" );

					// Strip out any trailing slash.
					url = url.replace( /\/+$/i, "" );

					return( url );

				}

				// I take 1..N objects and a key and perform a popKey() action on the
				// first object that contains the given key. If other objects in the list
				// also have the key, they are ignored.
				function popFirstKey( object1, object2, objectN, key ) {

					// Convert the arguments list into a true array so we can easily
					// pluck values from either end.
					var objects = Array.prototype.slice.call( arguments );

					// The key will always be the last item in the argument collection.
					var key = objects.pop();

					var object = null;

					// Iterate over the arguments, looking for the first object that
					// contains a reference to the given key.
					while ( object = objects.shift() ) {

						if ( object.hasOwnProperty( key ) ) {

							return( popKey( object, key ) );

						}

					}

				}


				// I delete the key from the given object and return the value.
				function popKey( object, key ) {

					var value = object[ key ];

					delete( object[ key ] );

					return( value );

				}

			};
		})
		;


}(window.angular, window._));


/* EOF */