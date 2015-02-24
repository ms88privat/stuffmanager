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


    describe('facilityManager INSTANCE', function() {
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
