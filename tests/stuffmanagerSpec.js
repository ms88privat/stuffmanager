'use strict';

describe('Stuffmanager', function() {
  // Load the module with MainController
  beforeEach(module('stuffmanager'));

  it('3 should be 3', 
    function() {
      expect(3).toEqual(3);
  });

  it('should instantiate an instance with a default name or specific name', inject(function(facilityManager) {

  	var instance = facilityManager.create();
  	var instance2 = facilityManager.create('specificName');

  	expect(instance.name).toEqual('defaultName');
  	expect(instance2.name).toEqual('specificName');

  }));


});
