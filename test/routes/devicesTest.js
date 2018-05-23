var request = require('supertest')
  , sinon = require('sinon')
  , app = require('../../express')
  , mongoose = require('mongoose')
  , MockToken = require('../mockToken')
  , TokenModel = mongoose.model('Token');

var DeviceModel = require('../../models/device');
var UserModel = require('../../models/user');
var UserMongoModel = mongoose.model('User');

require('sinon-mongoose');
require('chai').should();

describe("device route tests", function() {

  var sandbox;
  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  var userId = mongoose.Types.ObjectId();
  function mockTokenWithPermission(permission) {
    sandbox.mock(TokenModel)
      .expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate')
      .chain('exec')
      .yields(null, MockToken(userId, [permission]));
  }

  describe('/api/devices route tests', function() {

    it('should create a device with CREATE_DEVICE role', function(done) {
      mockTokenWithPermission('CREATE_DEVICE');

      var deviceToPost = {
        "uid": "uid",
        "name": "name",
        "description": "description",
        "poc": "poc"
      };

      var deviceToCreate = {
        uid: 'uid',
        name: 'name',
        description: 'description',
        userId: undefined,
        registered: true
      };

      var createdDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };

      sandbox.mock(DeviceModel)
        .expects('createDevice')
        .withArgs(deviceToCreate)
        .yields(null, createdDevice);
      request(app)
        .post('/api/devices')
        .send(deviceToPost)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var device = res.body;
          device.should.deep.equal(createdDevice);
        })
        .end(done);
    });

    it('should create a device without CREATE_DEVICE role', function(done) {
      mockTokenWithPermission('READ_DEVICE');

      var deviceToPost = {
        "uid": "uid",
        "name": "name",
        "description": "description",
        "poc": "poc",
        "username": "test",
        "password": "test",
        "appVersion": 'appVersion'
      };

      var deviceToCreate = {
        uid: 'uid',
        name: 'name',
        registered: false,
        description: 'description',
        userAgent: 'a browser',
        appVersion: 'appVersion',
        userId: userId.toString()
      };

      var mockUser = new UserMongoModel({
        _id: userId,
        username: 'test',
        displayName: 'test',
        active: true,
        authentication: {
          type: 'local'
        }
      });

      var createdDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": "description",
        "userAgent": "a browser",
        "userId": userId.toString(),
        "registered": false,
        "id": "uid"
      };

      sandbox.mock(UserModel)
        .expects('getUserByUsername')
        .withArgs('test')
        .yields(null, mockUser);

      sandbox.mock(UserMongoModel.prototype)
        .expects('validPassword')
        .yields(null, true);

      sandbox.mock(DeviceModel)
        .expects('getDeviceByUid')
        .withArgs('uid')
        .yields(null, null);

      sandbox.mock(DeviceModel)
        .expects('createDevice')
        .withArgs(deviceToCreate)
        .yields(null, createdDevice);

      request(app)
        .post('/api/devices')
        .send(deviceToPost)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .set('user-agent', 'a browser')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var device = res.body;
          device.should.deep.equal(createdDevice);
        })
        .end(done);
    });

    it('should return the existing device without CREATE_DEVICE role', function(done) {
      mockTokenWithPermission('READ_DEVICE');

      var deviceToPost = {
        "uid": "uid",
        "name": "name",
        "description": "description",
        "poc": "poc",
        "username": "test",
        "password": "test",
        "appVersion": 'appVersion'
      };

      var deviceToCreate = {
        uid: 'uid',
        name: 'name',
        registered: false,
        description: 'description',
        userAgent: 'a browser',
        appVersion: 'appVersion',
        userId: userId.toString()
      };

      var mockUser = new UserMongoModel({
        _id: userId,
        username: 'test',
        displayName: 'test',
        active: true,
        authentication: {
          type: 'local'
        }
      });

      var createdDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": "description",
        "userAgent": "a browser",
        "userId": userId.toString(),
        "registered": false,
        "id": "uid"
      };

      sandbox.mock(UserModel)
        .expects('getUserByUsername')
        .withArgs('test')
        .yields(null, mockUser);

      sandbox.mock(UserMongoModel.prototype)
        .expects('validPassword')
        .yields(null, true);

      sandbox.mock(DeviceModel)
        .expects('getDeviceByUid')
        .withArgs('uid')
        .yields(null, createdDevice);

      sandbox.mock(DeviceModel)
        .expects('createDevice')
        .never();

      request(app)
        .post('/api/devices')
        .send(deviceToPost)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .set('user-agent', 'a browser')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var device = res.body;
          device.should.deep.equal(createdDevice);
          sandbox.verify();
        })
        .end(done);
    });


    it("should get all devices", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      var retrievedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {}, expand: {}})
        .yields(null, [retrievedDevice]);

      request(app)
        .get('/api/devices')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.deep.equal(retrievedDevice);
        })
        .end(done);
    });

    it("should get all devices that are registered", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      var retrievedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {
          registered: true
        }, expand: {}})
        .yields(null, [retrievedDevice]);

      request(app)
        .get('/api/devices')
        .query({registered: 'true'})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.deep.equal(retrievedDevice);
        })
        .end(done);
    });

    it("should get all devices that are not registered", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      var retrievedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {
          registered: false
        }, expand: {}})
        .yields(null, [retrievedDevice]);

      request(app)
        .get('/api/devices')
        .query({registered: 'false'})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.deep.equal(retrievedDevice);
        })
        .end(done);
    });

    it("should get all devices with expanded users", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      var retrievedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {},
          expand: {
            user: true
          }})
        .yields(null, [retrievedDevice]);

      request(app)
        .get('/api/devices')
        .query({expand: 'user'})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.deep.equal(retrievedDevice);
        })
        .end(done);
    });
  });

  describe('/api/devices/{id} route tests', function() {

    it("should fail to update a device with none specified", function(done) {
      mockTokenWithPermission('CREATE_DEVICE');
      var deviceToPost = {
        "name": "name",
        "description": "description",
        "userAgent": "a browser",
        "userId": "userId",
        "registered": true
      };

      request(app)
        .post('/api/devices')
        .send(deviceToPost)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(400)
        .end(done);
    });

    it("should get the device specified expanded", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      var retrievedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": null,
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "id": "deviceid"
      };
      sandbox.mock(DeviceModel)
        .expects('getDeviceById')
        .withArgs('testdeviceid', {expand: {
          user: true
        }})
        .yields(null, [retrievedDevice]);

      request(app)
        .get('/api/devices/testdeviceid')
        .query({expand: 'user'})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.deep.equal(retrievedDevice);
        })
        .end(done);
    });

    it('should update the device', function(done){
      mockTokenWithPermission('UPDATE_DEVICE');
      var deviceToPost = {
        "uid": "test",
        "name": "name",
        "description": "description",
        "userAgent": "a browser",
        "userId": "userId",
        "registered": true,
        "id": "deviceid"
      };

      var createdDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": "description",
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "name": "name",
        "id": "deviceid"
      };

      sandbox.mock(DeviceModel)
        .expects('updateDevice')
        .withArgs('deviceid', {
          uid: 'test',
          name: "name",
          description: "description",
          userId: "userId",
          registered: false
        })
        .yields(null, createdDevice);
      request(app)
        .put('/api/devices/deviceid')
        .send(deviceToPost)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var device = res.body;
          device.should.deep.equal(createdDevice);
        })
        .end(done);
    });

    it('should delete the device', function(done){
      mockTokenWithPermission('DELETE_DEVICE');
      var deletedDevice = {
        "uid": "test",
        "appVersion": "version",
        "description": "description",
        "userAgent": "a browser",
        "userId": null,
        "registered": true,
        "name": "name",
        "id": "deviceid"
      };

      sandbox.mock(DeviceModel)
        .expects('deleteDevice')
        .withArgs('deviceid')
        .yields(null, deletedDevice);
      request(app)
        .delete('/api/devices/deviceid')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var device = res.body;
          device.should.deep.equal(deletedDevice);
        })
        .end(done);
    });

    it('should return a 404 when deleting a device that does not exist', function(done){
      mockTokenWithPermission('DELETE_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('deleteDevice')
        .withArgs('deviceid')
        .yields(null, null);
      request(app)
        .delete('/api/devices/deviceid')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(404)
        .end(done);
    });

  });

  describe('/api/devices/count route tests', function() {

    it("should get the device count", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('count')
        .yields(null, 1);

      request(app)
        .get('/api/devices/count')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var count = res.body;
          count.count.should.be.equal(1);
        })
        .end(done);
    });
  });

});
