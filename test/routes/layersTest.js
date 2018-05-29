var request = require('supertest')
  , sinon = require('sinon')
  , app = require('../../express')
  , api = require('../../api')
  , mongoose = require('mongoose')
  , MockToken = require('../mockToken')
  , TokenModel = mongoose.model('Token');

var LayerModel = require('../../models/layer');
var LayerMongoModel = mongoose.model('Layer');
var FeatureModel = require('../../models/feature');
var FeatureMongoModel = FeatureModel.featureModel;
var EventModel = require('../../models/event');
var EventMongoModel = mongoose.model('Event');

require('sinon-mongoose');
require('chai').should();

var userId = mongoose.Types.ObjectId();

var acl = {};
acl[userId] = {
  "role": "OWNER",
  "permissions": [
    "read",
    "update",
    "delete"
  ]
};

var style = {
  "fill": "#5278A2",
  "stroke": "#5278A2",
  "fillOpacity": 0.2,
  "strokeOpacity": 1,
  "strokeWidth": 2,
  "Choice1": {
    "fill": "#5278A2",
    "stroke": "#5278A2",
    "fillOpacity": 0.2,
    "strokeOpacity": 1,
    "strokeWidth": 2,
    "None": {
      "fill": "#5278A2",
      "stroke": "#5278A2",
      "fillOpacity": 0.2,
      "strokeOpacity": 1,
      "strokeWidth": 2
    }
  }
};

var teams = [
  {
    "name": "Event 1",
    "description": "This team belongs specifically to event 'Event 1' and cannot be deleted.",
    "teamEventId": 1,
    "acl": acl,
    "__v": 0,
    "userIds": [
      userId
    ],
    "id": "5afde5a8c0782abb2938caa5"
  }
];

var form = {
  "variantField": "field7",
  "name": "Test",
  "color": "#71C4C7",
  "primaryField": "type",
  "fields": [
    {
      "name": "type",
      "required": true,
      "type": "dropdown",
      "title": "Incident Type",
      "id": 3,
      "choices": [
        {
          "id": 0,
          "value": 0,
          "title": "Choice1"
        },
        {
          "id": 1,
          "value": 1,
          "title": "Choice2"
        }
      ]
    },
    {
      "name": "field7",
      "id": 7,
      "required": true,
      "value": "None",
      "type": "dropdown",
      "title": "Level",
      "choices": [
        {
          "id": 0,
          "value": 0,
          "title": "None"
        },
        {
          "id": 1,
          "value": 1,
          "title": "Low"
        },
        {
          "id": 2,
          "value": 2,
          "title": "Medium"
        },
        {
          "id": 3,
          "value": 3,
          "title": "High"
        }
      ]
    }
  ],
  "userFields": [],
  "style": style,
  "archived": false,
  "_id": 2
};

var mockEvent = {
  "name": "Event 1",
  "acl": acl,
  "style": style,
  "forms": [form],
  "_id": 1,
  "teams": teams,
  "layerIds": [1,2]
};

var layers = [{
  "name":"Open Street Map",
  "type":"Imagery",
  "format":"XYZ",
  "base":true,
  "url":"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "_id":1
},{
  "type": "Feature",
  "name": "KML",
  "_id": 2,
  "url": "http://localhost:3000/api/layers/2"
},{
  "type": "Feature",
  "name": "not in an event",
  "_id": 3,
  "url": "http://localhost:3000/api/layers/3"
}];

var features = [
  {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -104.762849454644,
          39.71712963440129
        ],
        [
          -104.7425460806689,
          39.68861474628888
        ]
      ]
    },
    "properties": {
      "name": "Runway1",
      "style": {
        "iconStyle": {
          "scale": "1.1",
          "icon": {
            "href": "http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"
          }
        },
        "lineStyle": {
          "color": {
            "rgb": "#ffe913",
            "opacity": 255
          },
          "width": "10"
        }
      }
    },
    "id": "5b0881db9f0d1b537a5ce5a3"
  },
  {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -104.8022284909322,
            39.72034307176344
          ],
          [
            -104.8022325868227,
            39.72033482167414
          ],
          [
            -104.8022323435019,
            39.72033164306915
          ],
          [
            -104.8022284909322,
            39.72034307176344
          ]
        ]
      ]
    },
    "properties": {
      "name": "BITS",
      "style": {
        "iconStyle": {
          "scale": "1.1",
          "icon": {
            "href": "http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"
          }
        },
        "lineStyle": {
          "color": {
            "rgb": "#5513ff",
            "opacity": 255
          }
        },
        "polyStyle": {
          "color": {
            "rgb": "#00ffff",
            "opacity": 128
          }
        }
      }
    },
    "id": "5b0881db9f0d1b537a5ce5a2"
  },
  {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          -104.7681376741965,
          39.71000760666408
        ],
        [
          -104.7400884823023,
          39.71001297114742
        ]
      ]
    },
    "properties": {
      "name": "Runway 2",
      "style": {
        "iconStyle": {
          "scale": "1.1",
          "icon": {
            "href": "http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png"
          }
        },
        "lineStyle": {
          "color": {
            "rgb": "#ff0302",
            "opacity": 255
          },
          "width": "10"
        }
      }
    },
    "id": "5b0881db9f0d1b537a5ce5a4"
  }
];

describe("layers route tests", function() {

  var sandbox;
  before(function() {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
  });

  function mockTokenWithPermission(permission) {
    sandbox.mock(TokenModel)
      .expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate')
      .chain('exec')
      .yields(null, MockToken(userId, [permission]));
  }

  describe('/api/layers route tests', function() {

    it("should get all layers", function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      sandbox.mock(LayerModel)
        .expects('getLayers')
        .withArgs({type: 'Imagery'})
        .yields(null, [new LayerMongoModel(layers[0])]);

      request(app)
        .get('/api/layers')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .query({type: 'Imagery'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layers = res.body;
          layers.length.should.be.equal(1);
          layers[0].should.deep.equal(layers[0]);
        })
        .end(done);
    });

    it("should create a layer", function(done) {
      mockTokenWithPermission('CREATE_LAYER');

      var layerToCreate = { name: 'Open Street Map',
        type: 'Imagery',
        format: 'XYZ',
        base: true,
        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' };

      sandbox.mock(LayerModel)
        .expects('create')
        .withArgs(sinon.match(layerToCreate))
        .yields(null, new LayerMongoModel(layers[0]));

      request(app)
        .post('/api/layers')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send(layerToCreate)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layer = res.body;
          layer.name.should.be.equal('Open Street Map');
        })
        .end(done);
    });

    it("should update a layer", function(done) {
      mockTokenWithPermission('UPDATE_LAYER');

      var update = { name: 'Open Street Map',
        type: 'Imagery',
        format: 'XYZ',
        base: true,
        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' };

      var lmm = new LayerMongoModel(layers[0]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .yields(lmm);

      sandbox.mock(LayerModel)
        .expects('update')
        .withArgs('1', sinon.match(update))
        .yields(null, lmm);

      request(app)
        .put('/api/layers/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send(update)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layer = res.body;
          layer.name.should.be.equal('Open Street Map');
        })
        .end(done);
    });

    it("should update a layer", function(done) {
      mockTokenWithPermission('DELETE_LAYER');

      var lmm = new LayerMongoModel(layers[0]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .yields(lmm);

      sandbox.mock(LayerModel)
        .expects('remove')
        .withArgs(lmm)
        .yields(null, lmm);

      request(app)
        .delete('/api/layers/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var response = res.body;
          response.success.should.be.equal(true);
          response.message.should.be.equal('Layer Open Street Map has been removed.');
        })
        .end(done);
    });
  });

  describe('/api/layers/count route tests', function() {

    it("should get the layer count", function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');
      sandbox.mock(LayerModel)
        .expects('count')
        .yields(null, 1);

      request(app)
        .get('/api/layers/count')
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

  describe('/api/layers/{id}/features route tests', function() {
    it('should get the features for the layer', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var lmm = new LayerMongoModel(layers[1]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .withArgs('2')
        .yields(lmm);

      var fm = FeatureMongoModel(lmm);

      sandbox.mock(FeatureModel)
        .expects('getFeatures')
        .yields(null, [new fm(features[0]), new fm(features[1]), new fm(features[2])]);

      sandbox.spy(api, 'Feature')

      request(app)
        .get('/api/layers/2/features')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var features = res.body;
          features.features.length.should.be.equal(3);
          api.Feature.calledWith(sinon.match({_id: 2})).should.be.equal(true);
        })
        .end(done);
    });

    it('should get the features for the layer in the event', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      var lmm = new LayerMongoModel(layers[1]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .withArgs('2')
        .yields(lmm);

      var fm = FeatureMongoModel(lmm);

      sandbox.mock(FeatureModel)
        .expects('getFeatures')
        .yields(null, [new fm(features[0]), new fm(features[1]), new fm(features[2])]);

      sandbox.spy(api, 'Feature')

      request(app)
        .get('/api/events/1/layers/2/features')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var features = res.body;
          features.features.length.should.be.equal(3);
          api.Feature.calledWith(sinon.match({_id: 2})).should.be.equal(true);
        })
        .end(done);
    });

    it('should not get the features for the layer not in the event', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      var lmm = new LayerMongoModel(layers[2]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .withArgs('3')
        .yields(lmm);

      request(app)
        .get('/api/events/1/layers/3/features')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect(400)
        .end(done);
    });
  });

  describe('/api/{eventId}/layers route tests', function() {
    it('should get the layers for the event', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.mock(LayerModel)
        .expects('getLayers')
        .withArgs(sinon.match({type: undefined}))
        .yields(null, [new LayerMongoModel(layers[0]), new LayerMongoModel(layers[1])]);

      request(app)
        .get('/api/events/1/layers')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layers = res.body;
          layers.length.should.be.equal(2);
        })
        .end(done);
    });

    it('should get the layers for the event', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.mock(LayerModel)
        .expects('getLayers')
        .withArgs(sinon.match({type: 'Feature'}))
        .yields(null, [new LayerMongoModel(layers[0]), new LayerMongoModel(layers[1])]);

      request(app)
        .get('/api/events/1/layers')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .query({type: 'Feature'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layers = res.body;
          layers.length.should.be.equal(2);
        })
        .end(done);
    });
  });

  describe('/api/layers/{layerId} route tests', function() {
    it('should get the layer by id', function(done) {
      mockTokenWithPermission('READ_LAYER_ALL');

      var lmm = new LayerMongoModel(layers[1]);
      lmm.collectionName = 'layer1';
      sandbox.mock(LayerModel)
        .expects('getById')
        .withArgs('1')
        .yields(lmm);

      request(app)
        .get('/api/layers/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var layer = res.body;
          layer.name.should.be.equal('KML');
        })
        .end(done);
    });
  });

});
