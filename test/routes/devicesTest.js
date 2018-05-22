var request = require('supertest')
  , sinon = require('sinon')
  , app = require('../../express')
  , mongoose = require('mongoose')
  , MockToken = require('../mockToken')
  , TokenModel = mongoose.model('Token');

var DeviceModel = require('../../models/device');

require('sinon-mongoose');
require('chai').should();

describe.only("device route tests", function() {

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

    it("should get all devices", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {}, expand: {}})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

      request(app)
        .get('/api/devices')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.have.property('uid');
        })
        .end(done);
    });

    it("should get all devices that are registered", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {
          registered: true
        }, expand: {}})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

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
          devices[0].should.have.property('uid');
        })
        .end(done);
    });

    it("should get all devices that are not registered", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {
          registered: false
        }, expand: {}})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

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
          devices[0].should.have.property('uid');
        })
        .end(done);
    });

    it("should get all devices with expanded users", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDevices')
        .withArgs({filter: {},
          expand: {
            user: true
          }})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

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
          devices[0].should.have.property('uid');
        })
        .end(done);
    });
  });

  describe('/api/devices/{id} route tests', function() {

    it("should get the device specified", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDeviceById')
        .withArgs('testdeviceid', {expand: {}})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

      request(app)
        .get('/api/devices/testdeviceid')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var devices = res.body;
          devices.length.should.be.equal(1);
          devices[0].should.have.property('uid');
        })
        .end(done);
    });

    it("should get the device specified expanded", function(done) {
      mockTokenWithPermission('READ_DEVICE');
      sandbox.mock(DeviceModel)
        .expects('getDeviceById')
        .withArgs('testdeviceid', {expand: {
          user: true
        }})
        .yields(null, [
          {
            "uid": "test",
            "appVersion": "version",
            "description": null,
            "userAgent": "a browser",
            "userId": null,
            "registered": true,
            "id": "deviceid"
          }
        ]);

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
          devices[0].should.have.property('uid');
        })
        .end(done);
    });

  });

});
