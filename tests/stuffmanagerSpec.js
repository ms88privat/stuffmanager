'use strict';

describe('Stuffmanager', function() {
    // load the angular-module
    beforeEach(module('stuffmanager'));

    // setup some test data

    // important: the data gets mutated during unit test, if you want this data to compare the result to, you have to copy if beforehand

    var obj1,
        obj2,
        obj3,
        ary1 = [],
        ary2 = [];

    beforeEach(function() {
        obj1 = {id: 3, name: 'Name'};
        obj2 = {id: 45, name: 'Name2'};
        obj3 = {id: 1, name: 'Name3'};
        ary1.push(obj1, obj2);
        ary2 = [{id: 1, name: 'Name3'}];
    });

    afterEach(function() {
        ary1 = [];
        ary2 = [];
    });

    // start testing
    it('3 should be 3', function() {
        expect(3).toEqual(3);
    });

    describe('facilityManager', function() {

        it('should instantiate an instance with a name and appPrefix', inject(function(facilityManager) {

            var instance = facilityManager.create('name');
            var instance2 = facilityManager.create('specificName');

            expect(instance.name).toEqual('myAppname');
            expect(instance2.name).toEqual('myAppspecificName');

        }));

        it('should instantiate an instance with domains', inject(function(facilityManager) {

            var instance = facilityManager.create('name');
            var instance2 = facilityManager.create('name2', {
                resource: true,
            });
            var instance3 = facilityManager.create('name3', {
                resource: true,
                domains: ['IDEAS']
            });

            expect(instance.domains).toEqual(['FACILITY']);
            expect(instance2.domains).toEqual(['RESOURCE']);
            expect(instance3.domains).toEqual(['IDEAS', 'RESOURCE']);

        }));

        it('should clear all data in all instances', inject(function(facilityManager) {

            var instance = facilityManager.create('name');
            var instance2 = facilityManager.create('name2');
            var instance3 = facilityManager.create('name3');

            instance.save({data: obj1, key: 3});
            instance2.save({data: obj2, key: 'keyname'});
            instance3.save({data: obj2, key: 'abc'});

            facilityManager.clear();

            var get = instance.get({key: 3});
            var get2 = instance2.get({key: 'keyname'});
            var get3 = instance3.get({key: 'abc'});

            expect(get).toBeUndefined();
            expect(get2).toBeUndefined();
            expect(get3).toBeUndefined();

        }));

        it('should clear all data in all instances [DOMAIN specific]', inject(function(facilityManager) {

            var instance = facilityManager.create('instance', {
                domains: ['FLOAT', 'IDEAS']
            });
            var instance2 = facilityManager.create('instance2', {
                domains: ['IDEAS']
            });
            var instance3 = facilityManager.create('instance3', {
                domains: ['YOLO']
            });

            instance.save({data: obj1, key: 3});
            instance2.save({data: obj2, key: 'keyname'});
            instance3.save({data: obj2, key: 'abc'});

            facilityManager.clear({
                domains: ['IDEAS'] // -> instance3 should be still defined
            });

            var get = instance.get({key: 3});
            var get2 = instance2.get({key: 'keyname'});
            var get3 = instance3.get({key: 'abc'});

            expect(get).toBeUndefined();
            expect(get2).toBeUndefined();
            expect(get3).toEqual(obj2);

            facilityManager.clear({
                domains: ['FACILITY'] // domain which every facilityManager.instance has
            });

            get3 = instance3.get({key: 'abc'});
            expect(get3).toBeUndefined();

        }));


        describe('INSTANCE', function() {
            it('should save() and get() data from cache', inject(function(facilityManager) {

                var instance = facilityManager.create('name');
                var instance2 = facilityManager.create('name2');

                instance.save({data: obj1});
                instance2.save({data: obj2});

                var get = instance.get();
                var get2 = instance2.get();

                expect(get).toEqual(obj1);
                expect(get2).toEqual(obj2);

            }));

            it('should clear() cached data', inject(function(facilityManager) {

                var instance = facilityManager.create('name');
                var instance2 = facilityManager.create('name2');

                instance.save({data: obj1});
                instance2.save({data: obj2});

                instance.clear();

                var get = instance.get();
                var get2 = instance2.get();

                expect(get).toBeUndefined();
                // be sure that not all instances are cleared
                expect(get2).toEqual(obj2);

            }));

            it('should save() and get() data from cache by key', inject(function(facilityManager) {

                var instance = facilityManager.create('name');
                var instance2 = facilityManager.create('name2');

                instance.save({data: obj1, key: 3});
                instance2.save({data: obj2, key: 'keyname'});

                var get = instance.get({key: 3});
                var get2 = instance2.get();

                expect(get).toEqual(obj1);
                expect(get2).toBeUndefined();

            }));

            it('should clear() cached data by keys', inject(function(facilityManager) {

                var instance = facilityManager.create('name');
                var instance2 = facilityManager.create('name2');
                var instance3 = facilityManager.create('name3');

                instance.save({data: obj1, key: 3});
                instance2.save({data: obj2, key: 'keyname'});
                instance3.save({data: obj2, key: 'abc'});

                instance.clear();
                instance2.clear({keys: ['keyname']});
                instance3.clear({keys: ['ABC']}); // keyname not matching

                var get = instance.get({key: 3});
                var get2 = instance2.get({key: 'keyname'});
                var get3 = instance3.get({key: 'abc'});

                expect(get).toBeUndefined();
                expect(get2).toBeUndefined();
                expect(get3).toEqual(obj2);

            }));


            it('should get() data byId', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                instance.save({data: ary1, key: 'keyname'});

                var get = instance.get({key: 'keyname', id: 45});

                expect(get).toEqual(obj2);

            }));

            it('should add() data to a collection', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                var result = angular.copy(ary1);
                instance.save({data: ary1});

                instance.add({data: obj3});

                var get = instance.get();

                result.push(obj3);

                expect(get).toEqual(result);

            }));

            it('should removeById() data from a collection', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                instance.save({data: ary1});

                instance.removeById({id: 3});

                var get = instance.get();

                expect(get).toEqual([obj2]);

            }));

            it('should update() [CASE 1] the collection by the given object', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                instance.save({data: ary1});

                instance.update({
                    data: {id: 3, name: 'NeuerName'}
                });

                var get = instance.get();

                expect(get).toEqual([
                    {id: 3, name: 'NeuerName'},
                    {id: 45, name: 'Name2'}
                ]);

            }));

            it('should update() [CASE 2] the object by the given object (id-property will be ignored and can be overridden)', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                instance.save({data: obj2});

                instance.update({
                    data: {id: 3, name: 'NeuerName'}
                });

                var get = instance.get();

                expect(get).toEqual({id: 3, name: 'NeuerName'});

            }));

            it('should update() [CASE 3] the elements of a collection by the given collection of elements', inject(function(facilityManager) {

                var instance = facilityManager.create('name');

                instance.save({data: ary1});

                instance.update({
                    data: [
                        {id: 3, name: 'NeuerNameX'},
                        {id: 45, name: 'YOLO45'},
                        {id: 666, name: 'EVIL'}
                    ]
                });

                var get = instance.get();

                expect(get).toEqual([
                    {id: 3, name: 'NeuerNameX'},
                    {id: 45, name: 'YOLO45'}
                ]);

            }));

        });

    });

    describe('resourceManager', function() {

        it('should instantiate an instance with a name and appPrefix and domain "RESOURCE"', inject(function(resourceManager) {

            var instance = resourceManager.create('name', {
                url: 'url'
            });

            expect(instance.name).toEqual('myAppname');
            expect(instance.resource).toBeTruthy();

        }));

        describe('INSTANCE', function() {

            it('should make a GET request', inject(function(resourceManager, $httpBackend) {

                var instance = resourceManager.create('name', {
                    url: 'api/test/:id',
                    parse: 'wrapper'
                });
                var params = {params: {id: 3}};

                $httpBackend.expectGET('api/test/3').respond(200, {wrapper: {data: 'yolo', id: 3}});

                expect(instance.url).toEqual('api/test/:id');

                var handler = {
                    success: function(resp) {
                        expect(resp.data).toEqual('yolo');
                    },
                    error: function(err) {

                    }
                };

                spyOn(handler, 'success').and.callThrough();
                spyOn(handler, 'error').and.callThrough();


                instance.fetch(params)
                    .then(handler.success)
                    .catch(handler.error)
                    ;

                $httpBackend.flush();

                expect(handler.success).toHaveBeenCalled();
                expect(handler.error).not.toHaveBeenCalled();

            }));

            it('should make only one GET request in a short time period (throttle) for a specific request', 
                inject(function(resourceManager, $rootScope, $httpBackend) {

                var instance = resourceManager.create('NameOfmsResource', {
                    url: 'api/test/:id'
                });

                $httpBackend.expectGET('api/test/3').respond(200, {data: 'yolo', id: 3});
                        
                var handler = {
                    success: function(resp) {
                        expect(resp.data).toEqual('yolo');
                    },
                    error: function(err) {

                    }
                };

                spyOn(handler, 'success').and.callThrough();
                spyOn(handler, 'error').and.callThrough();
                spyOn(instance, 'parseResponse').and.callThrough();


                instance.fetch({params: {id: 3}})
                    .then(handler.success)
                    .catch(handler.error)
                    ;

                    $httpBackend.flush();

                    expect(instance.parseResponse).toHaveBeenCalled();
                    expect(handler.success).toHaveBeenCalled();
                    expect(handler.error).not.toHaveBeenCalled();

                  // next request

                var handler2 = {
                    success: function(resp) {
                        expect(resp.data).toEqual('yolo');
                    },
                    error: function(err) {

                    }
                };

                spyOn(handler2, 'success').and.callThrough();
                spyOn(handler2, 'error').and.callThrough();
                instance.parseResponse.calls.reset();

                    instance.fetch({params: {id: 3}})
                    .then(handler2.success)
                    .catch(handler2.error)
                    ;

                $rootScope.$apply();

                expect(instance.parseResponse).not.toHaveBeenCalled();
                expect(handler2.success).toHaveBeenCalled();
                expect(handler2.error).not.toHaveBeenCalled();
              

            }));

            it('should catch http Errors', inject(function(resourceManager, $httpBackend) {

                var instance = resourceManager.create('name', {
                    url: 'api/test/:id',
                    parse: 'wrapper'
                });
                var params = {params: {id: 3}};

                $httpBackend.expectGET('api/test/3').respond(400, {wrapper: {data: 'yolo'}});

                expect(instance.url).toEqual('api/test/:id');

                var handler = {
                    success: function(resp) {
                        
                    },
                    error: function(err) {
                        expect(err).toBeDefined();
                    }
                };

                spyOn(handler, 'success').and.callThrough();
                spyOn(handler, 'error').and.callThrough();

                spyOn(instance, 'errorHandler').and.callThrough();


                instance.fetch(params)
                    .then(handler.success)
                    .catch(handler.error)
                    ;

                $httpBackend.flush();

                expect(handler.success).not.toHaveBeenCalled();
                expect(handler.error).toHaveBeenCalled();

                expect(instance.errorHandler).toHaveBeenCalled();

            }));

            it('should catch http Errors but dont reject the promise', inject(function(resourceManager, $httpBackend) {

                var instance = resourceManager.create('name', {
                    url: 'api/test/:id',
                    parse: 'wrapper'
                });
                var params = {params: {id: 3}, rejectIfError: false};

                $httpBackend.expectGET('api/test/3').respond(400, {wrapper: {data: 'yolo'}});

                expect(instance.url).toEqual('api/test/:id');

                var handler = {
                    success: function(resp) {
                        expect(resp).toBeDefined();
                    },
                    error: function(err) {
                        
                    }
                };

                spyOn(handler, 'success').and.callThrough();
                spyOn(handler, 'error').and.callThrough();

                spyOn(instance, 'errorHandler').and.callThrough();


                instance.fetch(params)
                    .then(handler.success)
                    .catch(handler.error)
                    ;

                $httpBackend.flush();

                expect(handler.success).toHaveBeenCalled();
                expect(handler.error).not.toHaveBeenCalled();

                expect(instance.errorHandler).toHaveBeenCalled();

            }));

            describe('CREATE', function() {
                it('should make a POST request', 
                    inject(function(resourceManager, $rootScope, $httpBackend) {

                    var instance = resourceManager.create('NameOfmsResource', {
                        url: 'api/test/:id',
                        parse: 'data'
                    });
                    var args = {
                        params: {id: 3}, 
                        data: {
                            name: 'createName',
                        }
                    };

                    var copy = angular.copy(ary1);
                    instance.save({data: ary1});
                    expect(instance.get()).toEqual(ary1);


                    $httpBackend.expectPOST('api/test/3').respond(200, {
                        data: {
                            name: 'tripple',
                            id: 777
                        }
                    });
                            
                    var handler = {
                        success: function(resp) {
                            expect(resp).toEqual({
                                name: 'tripple',
                                id: 777
                            });
                            
                            copy.push({
                                name: 'tripple',
                                id: 777
                            });

                            expect(instance.get()).toEqual(copy);
                        },
                        error: function(err) {

                        }
                    };

                    spyOn(handler, 'success').and.callThrough();
                    spyOn(handler, 'error').and.callThrough();
                    spyOn(instance, 'parseResponse').and.callThrough();


                    instance.create(args)
                        .then(handler.success)
                        .catch(handler.error)
                        ;

                        $httpBackend.flush();

                        expect(instance.parseResponse).toHaveBeenCalled();
                        expect(handler.success).toHaveBeenCalled();
                        expect(handler.error).not.toHaveBeenCalled();

                }));

            });

            describe('PUT', function() {
                it('should make a PUT request', 
                    inject(function(resourceManager, $rootScope, $httpBackend) {

                    var instance = resourceManager.create('NameOfmsResource', {
                        url: 'api/test/:id',
                        parse: 'data'
                    });
                    var args = {
                        data: {
                            name: 'createName',
                            id: 3
                        }
                    };

                    var copy = angular.copy(ary1);
                    instance.save({data: ary1});
                    var get = instance.get();
                    expect(get).toEqual(ary1);
                    expect(get[0].name).toEqual('Name');


                    $httpBackend.expectPUT('api/test/3').respond(200, {
                        data: {
                            name: 'createName',
                            id: 3
                        }
                    });
                            
                    var handler = {
                        success: function(resp) {
                            expect(resp).toEqual({
                                name: 'createName',
                                id: 3
                            });

                            var afterGet = instance.get();
                            expect(afterGet).not.toEqual(copy);
                            expect(afterGet).toEqual(ary1); // ary1 should be muated
                            expect(afterGet[0].name).toEqual('createName');

                            resourceManager.clear();

                            var afterClear = instance.get();
                            expect(afterClear).toBeUndefined();
                        },
                        error: function(err) {

                        }
                    };

                    spyOn(handler, 'success').and.callThrough();
                    spyOn(handler, 'error').and.callThrough();
                    spyOn(instance, 'parseResponse').and.callThrough();


                    instance.put(args)
                        .then(handler.success)
                        .catch(handler.error)
                        ;

                        $httpBackend.flush();

                        expect(instance.parseResponse).toHaveBeenCalled();
                        expect(handler.success).toHaveBeenCalled();
                        expect(handler.error).not.toHaveBeenCalled();

                }));

            });

            describe('DELETE', function() {
                it('should make a DELETE request', 
                    inject(function(resourceManager, $rootScope, $httpBackend) {

                    var instance = resourceManager.create('NameOfmsResource', {
                        url: 'api/test/:id',
                    });
                    var args = {
                        params: {id: 3}
                    };

                    var copy = angular.copy(ary1);
                    instance.save({data: ary1});


                    $httpBackend.expectDELETE('api/test/3').respond(200, 'success');
                            
                    var handler = {
                        success: function(resp) {
                            expect(resp).toEqual([{id: 45, name: 'Name2'}]);

                            var afterGet = instance.get();
                            expect(afterGet).not.toEqual(copy);
                            expect(afterGet).toEqual(ary1); // ary1 should be muated
                            expect(afterGet[0].name).toEqual('Name2');
                        },
                        error: function(err) {

                        }
                    };

                    spyOn(handler, 'success').and.callThrough();
                    spyOn(handler, 'error').and.callThrough();
                    spyOn(instance, 'parseResponse').and.callThrough();


                    instance.delete(args)
                        .then(handler.success)
                        .catch(handler.error)
                        ;

                        $httpBackend.flush();

                        // expect(instance.parseResponse).toHaveBeenCalled();
                        expect(handler.success).toHaveBeenCalled();
                        expect(handler.error).not.toHaveBeenCalled();

                }));

            });

        });

        

    });



});
