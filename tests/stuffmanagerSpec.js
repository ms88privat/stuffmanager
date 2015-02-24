'use strict';

describe('Stuffmanager', function() {
    // load the angular-module
    beforeEach(module('stuffmanager'));

    // setup some test data
    var obj1,
        obj2,
        ary1 = [],
        ary2 = [];

    beforeEach(function() {
        obj1 = {
            name: 'Name',
            id: 3
        };
        obj2 = {
            name: 'Name2',
            id: 45
        };
        ary1.push(obj1, obj2);
        ary2 = [
            {
                name: 'Name3',
                id: 1
            }
        ];
    });

    // start testing
    it('3 should be 3', function() {
        expect(3).toEqual(3);
    });

    it('should instantiate an instance with a default name or specific name', inject(function(facilityManager) {

        var instance = facilityManager.create();
        var instance2 = facilityManager.create('specificName');

        expect(instance.name).toEqual('myAppdefaultName');
        expect(instance2.name).toEqual('myAppspecificName');

    }));

    it('should instantiate an instance with domains', inject(function(facilityManager) {

        var instance = facilityManager.create();
        var instance2 = facilityManager.create('specificName', {
            resource: true,
        });
        var instance3 = facilityManager.create('specificName', {
            resource: true,
            domains: ['ideas']
        });

        expect(instance.domains).toEqual(['facility']);
        expect(instance2.domains).toEqual(['resource']);
        expect(instance3.domains).toEqual(['ideas', 'resource']);

    }));


    describe('facilityManager INSTANCE', function() {
        it('should instantiate an instance with a default name or specific name', inject(function(facilityManager) {

            var instance = facilityManager.create();
            var instance2 = facilityManager.create();


            instance.save({data: obj1});
            instance2.save({data: obj2});

            var get = instance.get();
            var get2 = instance2.get();

            expect(get).toEqual(obj1);
            expect(get2).toEqual(obj2);


        }));
    });




});
