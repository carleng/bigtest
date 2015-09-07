import SerializerRegistry from 'ember-cli-mirage/serializer-registry';
import Serializer from 'ember-cli-mirage/serializer';
import schemaHelper from '../schema-helper';
import {module, test} from 'qunit';

module('Integration | Serializer | Associations | Sideloading Assorted Collections', {
  beforeEach() {
    this.schema = schemaHelper.setup();
    this.registry = new SerializerRegistry(this.schema, {
      author: Serializer.extend({
        embed: false,
        relationships: ['posts']
      }),
      photo: Serializer.extend({
        attrs: ['id', 'title']
      })
    });
    this.authors = [
      {id: 1, name: 'Link'},
      {id: 2, name: 'Zelda'},
      {id: 3, name: 'Epona'}
    ];
    this.posts = [
      {id: 1, title: 'Lorem', authorId: 1},
      {id: 2, title: 'Ipsum', authorId: 1}
    ];
    this.photos = [
      {id: 1, title: 'Amazing', location: 'Hyrule'},
      {id: 2, title: 'Photo', location: 'Goron City'}
    ];
    this.schema.db.loadData({
      authors: this.authors,
      posts: this.posts,
      photos: this.photos,
    });
  },
  afterEach() {
    this.schema.db.emptyData();
  }
});

/*
  This is a strange response from a route handler, but it's used in the array get shorthand. Deprecate that shorthand?
*/
test(`it can sideload an array of assorted collections that have relationships`, function(assert) {
  let result = this.registry.serialize([this.schema.author.all(), this.schema.photo.all()]);

  assert.deepEqual(result, {
    authors: this.authors.map(attrs => {
      attrs.postIds = this.posts.filter(post => post.authorId === attrs.id).map(post => post.id);
      return attrs;
    }),
    posts: this.posts,
    photos: this.photos.map(attrs => { delete attrs.location; return attrs; })
  });
});
