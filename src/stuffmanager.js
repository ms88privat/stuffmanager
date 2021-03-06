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

						if(!this.cache) return data;

						if(this.store && data) {
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
							return this.getById(id, data);
						}

						// if(promise) {
						// 	return $q.when(data);
						// }

						return data;
						
					}


					getById(id, data) {
						id = parseInt(id);
						if (data instanceof Array) {
							var matrix = {};
							matrix[this.primId] = id;
							return _.find(data, matrix);
						}
						// no collection? what todo?
						else {

							console.warn('getById: data is not an instanceof Array! returning the whole data instead', data);
							// data is the data we are looking for?
							return data;
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
							_.uniq(presentData, this.primId); // sometimes the server response with a duplicate


						}
						else {
							presentData = [];
							// presentData = presentData.concat(data);
							if(_.isArray(data)) {
								_.forEach(data, function(model) {
									presentData.push(model);
								});
							} else {
								presentData.push(data);
							}

							console.log('presentDataXX:', this.name, presentData);
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

						if(!presentData) {
							return Facility.prototype.add.call(this, {key: key, data: data});
						}

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
								console.warn('update() CASE 1: no match found -> data added', data);
								return Facility.prototype.add.call(this, {key: key, data: data});
								
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
									console.warn('update() CASE 3: no match found -> data added', model);
									return Facility.prototype.add.call(this, {key: key, data: model});
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
						key = key ? this.name + key : this.name;
						this.cached[key] = data;
						return this.cached[key];
					}

					saveToStorage(key, data) {
						key = key ? this.name + key : this.name;
						return localStorage.setItem(key, angular.toJson(data));
					}

					getFromCache(key) {
						key = key ? this.name + key : this.name;
						return this.cached[key];
					}

					getFromStore(key) {
						key = key ? this.name + key : this.name;
						return angular.fromJson(localStorage.getItem(key));
					}

					// loopKeys() {

					// }

					
					// key array nötig oder nur key?
					clear({key, keys = [], cache = true, storage = true} = {}) {

						if(key) {
							if(cache) {
								delete this.cached[this.name + key];
							}

							if (storage) {
								clearSomeLocalStorage(this.name + key);
							}
						}

						else if(keys.length === 0) {

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

					static getInstanceByName(instanceName) {
						var find = _.find(instances, {name: instanceName});
						console.log('instanceName', instanceName, instances, find);
						return find;
					}

					

					static clear({domains = [], withoutDomains = [], cache = true, storage = true} = {}) {
						// cache
						if(domains.length === 0 && withoutDomains.length === 0) {
							_.forEach(instances, (instance) => {
								instance.clear({
									cache: cache,
									storage: storage
								});
							});
						}

						else if (domains.length === 0 && withoutDomains.length > 0) {

							_.forEach(instances, (instance) => {

								// only clear when there is no withoutDomain match
								if(_.intersection(withoutDomains, instance.domains).length <= 0) {
									// no match with withoutDomains -> clear
									instance.clear({
										cache: cache,
										storage: storage
									});
								}

							});
						}

						else if (domains.length > 0 && withoutDomains.length === 0) {
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

						else { // > 0 > 0
							_.forEach(instances, (instance) => {
								// only clear if there is minimum one domain match

								if(_.intersection(withoutDomains, instance.domains).length <= 0) {
									// you could clear this instance - no intersection withoutDomains
									if(_.intersection(domains, instance.domains).length > 0) {
										instance.clear({
											cache: cache,
											storage: storage
										});
									}
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
					// class: function() {
					// 	return Facility;
					// },
					class: Facility,
					clear: Facility.clear,
					getInstanceByName: Facility.getInstanceByName
				};
			};
			
			
		})
		.provider('resourceManager', function() {

			var THROTTLE_TIME = 5000;

			this.THROTTLE_TIME = function(ms) {
				THROTTLE_TIME = ms;
			};


			this.$get = function($q, $rootScope, $http, $timeout, facilityManager) { 

				function TRANSFORM(data, header, status) {
					return data;
				}

				function ERROR_HANDLER(name, error) {
					console.warn('errorHandler', name, error);
					$rootScope.$broadcast('STUFFMANAGER:HTTP_ERROR', name, error);
				}
	

				function httpRequest(method, url, params, data) {
					var config = {
						method: method,
						url: url,
						params: params,
						data: data,
						transformResponse: [service.TRANSFORM].concat($http.defaults.transformResponse)
					};

					return httpProxy(config);

				}


				class Resource extends facilityManager.class {
					constructor(name, {
						cache = true, 
						store = false, 
						primId = 'id',
						domains = [],
						parse = false,
						throttleTime = THROTTLE_TIME,
						errorHandler = service.ERROR_HANDLER,
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
						this.requests = {}; 
						this.requestTimes = {};
					}

					// rework... has to work with real instance data?
					throwErr({throwErr = {}, rejectIfError = true} = {}) {
						var defaultArgs = {
							timeout: 3000,
							code: 404,
						};
						_.defaults(throwErr, defaultArgs);

						var error = {};
						error.status = throwErr.code;

						// todo: maybe completly ignore any errorHandler for retry requests....
						var request = {
							instanceName: 'myAppideas', // need example instance
							url: 'throw/:id',
							params: {
								id: 666
							},
							reload: true,
							rejectIfError: false,
							key: 'yolo'
						};

						return $timeout(()=> {
							return this.errorResponse(error, rejectIfError, request);
						}, throwErr.timeout);
					}

					// reFetch(instanceNamesAry) {
					// 	// todo: for each instanceName.... refetch
					// 	// todo: get instanceByName
					// 	_.forEach(instanceNamesAry, function(instanceName) {
					// 		getInstanceByName(instanceName).fetch({reload: true}); // todo: parameter unbekannt...

					// 		// todo: reload with requestIdf
					// 	});
					// }

					static reFetch(requestObjAry) {
						_.forEach(requestObjAry, (request)=> {
							facilityManager.class.getInstanceByName(request.instanceName).fetch(request);
							// request object should already have reload: true in it.
						});
					}

					// before login!
					static resetThrottle() {
						this.requests = {}; 
						this.requestTimes = {};
					}

					fetch({
						url = this.url, 
						params = {},
						key, 
						reload = false, 
						rejectIfError = true,

						} = {}) {

						if (!reload) {
							var data = super.get({key: key, id: params.id}); // get id???
							
						}

						if (data ) { // && data.complete
							return $q.when(data);
						}

						else {
							var id = _.pick(params, 'id').id || id; // copy id because it gets deleted by url interpolation

							var requestIdf = angular.toJson(url) + angular.toJson(params); // unqiue identifyer

							var request = {
								instanceName: this.name,
								url: url,
								params: angular.copy(params), // copy because some of it will get deleted by url interpolation
								key: key,
								reload: true,
								rejectIfError: false
							};

							var diff = timeDiff('now', this.requestTimes[requestIdf]);

							var saveHandler = (resp) => {
								if(id) {
									console.log('fetch(): update instead of save', id);
									return this.getById(id, super.update({data: resp, key: key})); // save as array, but return as single 
								}
								else {
									return super.save({data: resp, key: key});
								}
								// return super.save({data: resp, key: key});
							};

							if (!diff || diff > this.throttleTime) {
								// new request
								console.log('fetch() ', this.name);
								this.requestTimes[requestIdf] = new Date().getTime();
								this.requests[requestIdf] = httpRequest('GET', url, params)
									.then((resp)=>{return this.parseResponse(resp);})
									.then(saveHandler)
									.catch((err)=>{return this.errorResponse(err, rejectIfError, request);
									})
									;

							} 

							else {
								console.log('throttle', this.name);
							}

							// if throttle it will return the value from last time
							return this.requests[requestIdf]; 
						}

						

					}

					create({
						params = {}, 
						data, 
						url = this.url, 
						rejectIfError = true,
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
							.catch((err)=>{return this.errorResponse(err, rejectIfError);});
					}

					put({
						params = {}, 
						data, 
						url = this.url, 
						rejectIfError = true,
						key
						} = {}) {

						var updateHandler =function(resp) {
							super.update({data: resp, key: key}); 
							return resp;
						};

						return httpRequest('PUT', url, params, data)
							.then((resp)=>{return this.parseResponse(resp);})
							.then(updateHandler)
							.catch((err)=>{return this.errorResponse(err, rejectIfError);});
						


					}

					// delte has no parse response until now
					delete({url = this.url, rejectIfError = true, params, key, id} = {}) {

						var id = _.pick(params, 'id').id || id; // copy id

						var removeHandler = (resp) => {
							// we can not use params.id, because params.id got deleted by url interpolation process
							return super.removeById({key: key, id: id});
						};

						return httpRequest('DELETE', url, params)
							.then(removeHandler)
							.catch((err)=>{return this.errorResponse(err, rejectIfError);});
					}


					parseResponse(resp) {
						resp = resp.data;
						if (typeof this.parse === 'string') {
							resp = resp[this.parse];
						} else if (angular.isFunction(this.parse) === true) {
							resp = this.parse(resp);
						} 
						return resp;
					}

					errorResponse(err, rejectIfError, request) {
						if (this.errorHandler) {this.errorHandler(this.name, err, request);}
						if (rejectIfError) return $q.reject(err);
						else {
							err._isError = true; // indicate that the resolved response is an error
							return $q.when(err);
						}
					}

				}


				var service = {
					create: function(name, args) {
						return new Resource(name, args);
					},
					class: Resource,
					clear: facilityManager.class.clear,
					getInstanceByName: facilityManager.class.getInstanceByName,
					reFetch: Resource.reFetch,
					resetThrottle: Resource.resetThrottle,
					TRANSFORM: TRANSFORM,
					ERROR_HANDLER: ERROR_HANDLER
				}

				return service;


				/* =============================================================================== */
				/* 
				copied from https://github.com/bennadel/httpi
				Thank you!  
				*/
				/* =============================================================================== */

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
							return( popFirstKey( data, params, label ) || "");

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

					var firstObject = true;

					while ( object = objects.shift() ) {

						if ( object.hasOwnProperty( key ) ) {

							return( popKey( object, key ) );

						}

						firstObject = false;

					}

						// I delete the key from the given object and return the value.
					
					function popKey( object, key ) {

						var value = object[ key ];

						// do not delte object properties, only params!
						if(!firstObject) {
							delete( object[ key ]);
						}

						return( value );

					}

				}


				

			};
		})
		;


}(window.angular, window._));


/* EOF */