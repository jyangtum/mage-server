var request = require('supertest')
  , fs = require('fs')
  , path = require('path')
  , sinon = require('sinon')
  , app = require('../../express')
  , api = require('../../api')
  , mongoose = require('mongoose')
  , MockToken = require('../mockToken')
  , TokenModel = mongoose.model('Token');

var EventModel = require('../../models/event');
var UserModel = require('../../models/user');
var TeamModel = require('../../models/team');
var EventMongoModel = mongoose.model('Event');
var TeamMongoModel = mongoose.model('Team');
var UserMongoModel = mongoose.model('User');

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
  "layers": [
    {
      "name": "Open Street Map",
      "type": "Imagery",
      "format": "XYZ",
      "base": true,
      "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "wms": {},
      "id": 1
    }
  ]
};

var mockIcons =[{
  "eventId":1,
  "formId":2,
  "primary":null,
  "variant":null,
  "path":path.resolve(path.join(__dirname, '..', 'fixtures', 'defaultIcon.png'))
}];

describe("events route tests", function() {

  var sandbox;
  var TokenModelMock;
  before(function() {
    sandbox = sinon.sandbox.create();
  });

  beforeEach(function() {
    TokenModelMock = sandbox.mock(TokenModel);
  });

  afterEach(function() {
    sandbox.restore();
  });

  function mockTokenWithPermission(permission) {
    var mockToken = MockToken(userId, [permission]);

    TokenModelMock.expects('findOne')
      .withArgs({token: "12345"})
      .chain('populate', 'userId')
      .chain('exec')
      .yields(null, mockToken);

    return mockToken;
  }

  describe('/api/events/count route tests', function() {

    it("should get the event count", function(done) {
      mockTokenWithPermission('READ_EVENT_ALL');
      sandbox.mock(EventModel)
        .expects('count')
        .withArgs({access: undefined})
        .yields(null, 1);

      request(app)
        .get('/api/events/count')
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

  describe('/api/events route tests', function() {

    it("should get the events", function(done) {
      mockTokenWithPermission('READ_EVENT_ALL');
      sandbox.mock(EventModel)
        .expects('getEvents')
        .withArgs({
          access: undefined,
          filter: { complete: false },
          populate: true,
          projection: undefined
        })
        .yields(null, [new EventMongoModel(mockEvent)]);

      request(app)
        .get('/api/events')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var events = res.body;
          events.length.should.be.equal(1);
        })
        .end(done);
    });

    it("should get the complete events for the user events", function(done) {
      mockTokenWithPermission('READ_EVENT_ALL');
      sandbox.mock(EventModel)
        .expects('getEvents')
        .withArgs({
          access: undefined,
          filter: { complete: true, userId: userId.toString() },
          populate: true,
          projection: undefined
        })
        .yields(null, [new EventMongoModel(mockEvent)]);

      request(app)
        .get('/api/events')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .query({userId: userId.toString(), state: 'complete'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var events = res.body;
          events.length.should.be.equal(1);
        })
        .end(done);
    });

    it("should get the archived events for the user events", function(done) {
      mockTokenWithPermission('READ_EVENT_ALL');
      sandbox.mock(EventModel)
        .expects('getEvents')
        .withArgs({
          access: undefined,
          filter: { complete: false, userId: userId.toString() },
          populate: true,
          projection: undefined
        })
        .yields(null, [new EventMongoModel(mockEvent)])
        .once();

      request(app)
        .get('/api/events')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .query({userId: userId.toString(), state: 'active'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var events = res.body;
          events.length.should.be.equal(1);
          events[0].name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);
    });

    it('should create a new event', function(done) {
      var mockToken = mockTokenWithPermission('CREATE_EVENT');
      mockToken.userId.populate('userId', function(err, mockUser) {
        sandbox.mock(EventModel)
          .expects('create')
          .withArgs({name: 'new event'}, mockUser)
          .yields(null, new EventMongoModel(mockEvent))
          .once();

        sandbox.mock(api.Icon.prototype)
          .expects('saveDefaultIconToEventForm')
          .yields(null)
          .once();

        request(app)
          .post('/api/events')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .send({name: 'new event'})
          .expect('Content-Type', /json/)
          .expect(201)
          .expect(function(res) {
            var event = res.body;
            event.name.should.be.equal('Event 1');
            sandbox.verify();
          })
          .end(done);
      });
    });
  });

  describe('/api/events/{id} route tests', function() {
    it('should get an event by id', function(done){
      mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, new EventMongoModel(mockEvent));

      mockedEventModelClass.expects('getById').withArgs(1, {
          access: undefined,
          populate: true,
          projection: undefined
        })
        .yields(null, new EventMongoModel(mockEvent));

      request(app)
        .get('/api/events/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);

    });

    it('should update an event by id', function(done){
      mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, new EventMongoModel(mockEvent));

      mockedEventModelClass.expects('update').withArgs(1, {name: 'Event 2'}, {populate: true})
        .yields(null, new EventMongoModel(mockEvent));

      request(app)
        .put('/api/events/1')
        .send({name: 'Event 2'})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);

    });

    it('should delete an event by id', function(done){
      mockTokenWithPermission('DELETE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, new EventMongoModel(mockEvent));

      mockedEventModelClass.expects('remove')
        .yields(null);

      request(app)
        .delete('/api/events/1')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        // .expect('Content-Type', /json/)
        .expect(204)
        .expect(function(res) {
          sandbox.verify();
        })
        .end(done);

    });
  });

  describe('/api/events/{id}/teams route tests', function() {
    it('should get teams for an event by id', function(done){
      mockTokenWithPermission('READ_EVENT_ALL');
      var mockedEventModelClass = sandbox.mock(EventModel);

      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, new EventMongoModel(mockEvent));

      mockedEventModelClass.expects('getTeams').withArgs(1, {populate: null})
        .yields(null, [new TeamMongoModel(teams[0])]);

      request(app)
        .get('/api/events/1/teams')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var teams = res.body;
          teams[0].name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);
    });

    it('should get teams for an event by id with a populate parameter', function(done){
      mockTokenWithPermission('READ_EVENT_ALL');
      var mockedEventModelClass = sandbox.mock(EventModel);

      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, new EventMongoModel(mockEvent));

      mockedEventModelClass.expects('getTeams').withArgs(1, {populate: ['users']})
        .yields(null, [new TeamMongoModel(teams[0])]);

      request(app)
        .get('/api/events/1/teams')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .query({populate: 'users'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var teams = res.body;
          teams[0].name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);
    });

    it('should add a team to an event', function(done){
      mockTokenWithPermission('UPDATE_EVENT');
      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent);

      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('addTeam').withArgs(mongoEvent, {team: {id: '2'}})
        .yields(null, new EventMongoModel(mockEvent));

      request(app)
        .post('/api/events/1/teams')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send({team: {id: '2'}})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.name.should.be.equal('Event 1');
          sandbox.verify();
        })
        .end(done);
    });
  });

  describe('/api/events/{id}/users route tests', function() {
    it('should get users for an event by id', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');
      mockToken.userId.populate('userId', function(err, mockUser) {
        var mockedEventModelClass = sandbox.mock(EventModel);

        mockedEventModelClass.expects('getById').withArgs('1')
          .yields(null, new EventMongoModel(mockEvent));

        mockedEventModelClass.expects('getUsers').withArgs(1)
          .yields(null, [new UserMongoModel(mockUser)]);

        request(app)
          .get('/api/events/1/users')
          .set('Accept', 'application/json')
          .set('Authorization', 'Bearer 12345')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function(res) {
            var users = res.body;
            users[0].id.should.be.equal(userId.toString());
            sandbox.verify();
          })
          .end(done);
      });
    });
  });

  describe('/api/events/{eventId}/forms route tests', function() {
    it('should add a form to the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      // Since there are two POST routes and the second one is the one we are testing
      // we need two mocks
      TokenModelMock.expects('findOne')
        .withArgs({token: "12345"})
        .chain('populate', 'userId')
        .chain('exec')
        .yields(null, mockToken);

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('addForm').withArgs(1, sinon.match({id: 2}))
        .yields(null, mongoEvent.forms[0]);

      sandbox.mock(api.Form.prototype)
        .expects('populateUserFields')
        .yields(null)
        .once();

      sandbox.mock(api.Icon.prototype)
        .expects('saveDefaultIconToEventForm')
        .yields(null)
        .once();

      request(app)
        .post('/api/events/1/forms')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send(mongoEvent.forms[0])
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(function(res) {
          var formResponse = res.body;
          formResponse.id.should.be.equal(form._id);
        })
        .end(done);
    });

    it('should upload a form to the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('addForm').withArgs(1, mongoEvent.forms[0])
        .yields(null, mongoEvent.forms[0]);

      var formMock = sandbox.mock(api.Form.prototype);

      formMock.expects('validate')
        .withArgs(sinon.match({ fieldname: 'form'}))
        .yields(null, mongoEvent.forms[0])
        .once();

      formMock.expects('importIcons')
        .withArgs(sinon.match({ fieldname: 'form'}))
        .yields(null)
        .once();

      request(app)
        .post('/api/events/1/forms')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .attach('form', path.resolve(__dirname + '/../fixtures/Event 1-Test-form.zip'))
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(function(res) {
          var formResponse = res.body;
          formResponse.id.should.be.equal(form._id);
          sandbox.verify();
        })
        .end(done);
    });
  });

  describe('/api/events/{eventId}/forms/{formId} route tests', function() {
    it('should update a form in the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('updateForm').withArgs(1, {name: 'name', _id: 2})
        .yields(null, mongoEvent.forms[0]);

      sandbox.mock(api.Form.prototype)
        .expects('populateUserFields')
        .yields(null)
        .once();

      request(app)
        .put('/api/events/1/forms/2')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send({name: 'name'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var formResponse = res.body;
          formResponse.id.should.be.equal(form._id);
        })
        .end(done);
    });

    it('should get the form zip', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.mock(api.Form.prototype)
        .expects('export')
        .yields(null, {
          file:fs.createReadStream(__dirname + '/../fixtures/Event 1-Test-form.zip'),
          name: 'Test'
        })
        .once();

      request(app)
        .get('/api/events/1/'+mongoEvent.forms[0].id+'/form.zip')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /application\/zip/)
        .expect(200)
        .expect(function(res) {
          res.headers['content-disposition'].should.be.equal('attachment; filename="' + mongoEvent.name + '-' + mongoEvent.forms[0].name + '-form.zip"');
        })
        .end(done);
    });

    it('should get the icon zip', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      var writeStream = fs.createWriteStream(__dirname + '/../fixtures/tmpicons.zip');
      writeStream.on('finish', function() {
        sandbox.mock(api.Icon.prototype)
          .expects('getZipPath')
          .yields(null, path.resolve(__dirname + '/../fixtures/tmpicons.zip'))
          .once();

        request(app)
          .get('/api/events/1/form/icons.zip')
          .set('Authorization', 'Bearer 12345')
          .expect('Content-Type', /application\/zip/)
          .expect(200)
          .expect(function(res) {
            api.Icon.calledWith(mockEvent._id).should.be.equal(true);
            sandbox.verify();
          })
          .end(done);
      });

      fs.createReadStream(__dirname + '/../fixtures/icons.zip').pipe(writeStream);

    });

    it('should get the icon json', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      sandbox.mock(api.Icon.prototype)
        .expects('getIcons')
        .yields(null, mockIcons)
        .once();

      request(app)
        .get('/api/events/1/icons/2.json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          api.Icon.calledWith(mockEvent._id, '2').should.be.equal(true);
          sandbox.verify();
        })
        .end(done);
    });

    it('should get the icon for the primary and variant', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      sandbox.mock(api.Icon.prototype)
        .expects('getIcon')
        .yields(null, mockIcons[0])
        .once();

      request(app)
        .get('/api/events/1/icons/2/high/blue')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /image/)
        .expect(200)
        .expect(function(res) {
          api.Icon.calledWith(mockEvent._id, '2', 'high', 'blue').should.be.equal(true);
          sandbox.verify();
        })
        .end(done);
    });

    it('should get the icon for the primary and variant as json', function(done) {
      var mockToken = mockTokenWithPermission('READ_EVENT_ALL');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      sandbox.mock(api.Icon.prototype)
        .expects('getIcon')
        .yields(null, mockIcons[0])
        .once();

      request(app)
        .get('/api/events/1/icons/2/high/blue')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          api.Icon.calledWith(mockEvent._id, '2', 'high', 'blue').should.be.equal(true);
          sandbox.verify();
        })
        .end(done);
    });

    it('should post an icon', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      sandbox.mock(api.Icon.prototype)
        .expects('create')
        .withArgs(sinon.match({ fieldname: 'icon'}))
        .yields(null, mockIcons[0])
        .once();

      request(app)
        .post('/api/events/1/icons/2/high/blue')
        .set('Authorization', 'Bearer 12345')
        .attach('icon', path.resolve(path.join(__dirname, '..', 'fixtures', 'defaultIcon.png')))
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          api.Icon.calledWith(mockEvent._id, '2', 'high', 'blue').should.be.equal(true);
          sandbox.verify();
        })
        .end(done);
    });

    it('should delete an icon', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById').withArgs('1')
        .yields(null, mongoEvent);

      sandbox.spy(api, 'Icon')

      sandbox.mock(api.Icon.prototype)
        .expects('delete')
        .yields(null)
        .once();

      request(app)
        .delete('/api/events/1/icons/2/high/blue')
        .set('Authorization', 'Bearer 12345')
        .expect(204)
        .expect(function(res) {
          api.Icon.calledWith(mockEvent._id, '2', 'high', 'blue').should.be.equal(true);
          sandbox.verify();
        })
        .end(done);
    });
  });

  describe('/api/events/{eventId}/teams/{teamId} route tests', function() {
    it('should delete a team from the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById')
        .withArgs('1')
        .yields(null, mongoEvent);

      var mockedTeamModelClass = sandbox.mock(TeamModel);
      var mongoTeam = new TeamMongoModel(teams[0]);
      mockedTeamModelClass.expects('getTeamById')
        .withArgs(teams[0].id)
        .yields(null, mongoTeam);

      mockedEventModelClass.expects('removeTeam').withArgs(mongoEvent, mongoTeam)
        .yields(null, mongoEvent);

      request(app)
        .delete('/api/events/1/teams/'+teams[0].id)
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.id.should.be.equal(mongoEvent._id);
        })
        .end(done);
    });
  });

  describe('/api/events/{eventId}/layers route tests', function() {
    it('should add a layer to the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById')
        .withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('addLayer').withArgs(mongoEvent, {name: 'name'})
        .yields(null, mongoEvent);

      request(app)
        .post('/api/events/1/layers')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send({name: 'name'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.id.should.be.equal(1);
        })
        .end(done);
    });
  });

  describe('/api/events/{eventId}/layers/{layerId} route tests', function() {
    it('should delete a layer from the event', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById')
        .withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('removeLayer').withArgs(mongoEvent, {id: '2'})
        .yields(null, mongoEvent);

      request(app)
        .delete('/api/events/1/layers/2')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.id.should.be.equal(1);
        })
        .end(done);
    });
  });

  describe('/api/events/{eventId}/acl/{id} route tests', function() {
    it('should update a user in the acl', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById')
        .withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('updateUserInAcl').withArgs(mongoEvent._id, '2', 'read')
        .yields(null, mongoEvent);

      request(app)
        .put('/api/events/1/acl/2')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send({role: 'read'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.id.should.be.equal(1);
        })
        .end(done);
    });

    it('should delete a user from the acl', function(done) {
      var mockToken = mockTokenWithPermission('UPDATE_EVENT');

      var mockedEventModelClass = sandbox.mock(EventModel);
      var mongoEvent = new EventMongoModel(mockEvent)
      mockedEventModelClass.expects('getById')
        .withArgs('1')
        .yields(null, mongoEvent);

      mockedEventModelClass.expects('removeUserFromAcl').withArgs(mongoEvent._id, '2')
        .yields(null, mongoEvent);

      request(app)
        .delete('/api/events/1/acl/2')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer 12345')
        .send({role: 'read'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          var event = res.body;
          event.id.should.be.equal(1);
        })
        .end(done);
    });
  });

});
