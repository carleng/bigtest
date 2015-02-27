/* global server: true */
import Server from 'ember-pretenderify/server';
import Factory from 'ember-pretenderify/factory';

module('pretenderify:server');

test('it can be instantiated', function() {
  var server = new Server({environment: 'test'});
  ok(server);
});

test('it cannot be instantiated without an environment', function() {
  throws(function() {
    var server = new Server();
  });
});

module('pretenderify:server#store');

test('its store is isolated across instances', function() {
  var server1 = new Server({environment: 'test'});
  server1.store.loadData({
    contacts: [{id: 1, name: 'Sam'}]
  });
  var server2 = new Server({environment: 'test'});

  deepEqual(server2.store.findAll('contact'), []);
});


var server;
module('pretenderify:server#create', {
  setup: function() {
    server = new Server({environment: 'test'});
  }
});

test('create fails when no factories are regisered', function() {
  throws(function() {
    var contact = server.create('contact');
  });
});

test('create fails when an expected factory isn\'t registered', function() {
  server.loadFactories({
    address: Factory.extend()
  });

  throws(function() {
    var contact = server.create('contact');
  });
});

test('create adds the data to the store', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  server.create('contact');
  var contactsInStore = server.store.findAll('contact');

  equal(contactsInStore.length, 1);
  deepEqual(contactsInStore[0], {id: 1, name: 'Sam'});
});

test('create returns the new data in the store', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  var contact = server.create('contact');

  deepEqual(contact, {id: 1, name: 'Sam'});
});

test('create allows for attr overrides', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  var sam = server.create('contact');
  var link = server.create('contact', {name: 'Link'});

  deepEqual(sam, {id: 1, name: 'Sam'});
  deepEqual(link, {id: 2, name: 'Link'});
});

module('pretenderify:server#createList', {
  setup: function() {
    server = new Server({environment: 'test'});
  }
});

test('createList adds the given number of elements to the store', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  server.createList('contact', 3);
  var contactsInStore = server.store.findAll('contact');

  equal(contactsInStore.length, 3);
  deepEqual(contactsInStore[0], {id: 1, name: 'Sam'});
  deepEqual(contactsInStore[1], {id: 2, name: 'Sam'});
  deepEqual(contactsInStore[2], {id: 3, name: 'Sam'});
});

test('createList returns the created elements', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  server.create('contact');
  var contacts = server.createList('contact', 3);

  equal(contacts.length, 3);
  deepEqual(contacts[0], {id: 2, name: 'Sam'});
  deepEqual(contacts[1], {id: 3, name: 'Sam'});
  deepEqual(contacts[2], {id: 4, name: 'Sam'});
});

test('createList respects sequences', function() {
  server.loadFactories({
    contact: Factory.extend({
      name: function(i) {
        return 'name' + i;
      }
    })
  });

  var contacts = server.createList('contact', 3);

  deepEqual(contacts[0], {id: 1, name: 'name0'});
  deepEqual(contacts[1], {id: 2, name: 'name1'});
  deepEqual(contacts[2], {id: 3, name: 'name2'});
});

test('createList respects attr overrides', function() {
  server.loadFactories({
    contact: Factory.extend({name: 'Sam'})
  });

  var sams = server.createList('contact', 2);
  var links = server.createList('contact', 2, {name: 'Link'});

  deepEqual(sams[0], {id: 1, name: 'Sam'});
  deepEqual(sams[1], {id: 2, name: 'Sam'});
  deepEqual(links[0], {id: 3, name: 'Link'});
  deepEqual(links[1], {id: 4, name: 'Link'});
});
