import ActiveModelSerializer from 'ember-cli-mirage/serializers/active-model-serializer';
import { hasMany, belongsTo } from 'ember-cli-mirage';
import Schema from 'ember-cli-mirage/orm/schema';
import Model from 'ember-cli-mirage/orm/model';
import Db from 'ember-cli-mirage/db';
import SerializerRegistry from 'ember-cli-mirage/serializer-registry';
import { module, test } from 'qunit';

module('Mirage | Serializer | Active Model Serializer', {
  beforeEach: function() {
    let db = new Db();
    this.schema = new Schema(db);
    this.schema.registerModels({
      author: Model.extend({
        blogPosts: hasMany()
      }),
      'blog-post': Model.extend({
        author: belongsTo()
      })
    });

    let link = this.schema.author.create({name: 'Link', age: 123});
    link.createBlogPost({title: 'Lorem'});
    link.createBlogPost({title: 'Ipsum'});
  },

  afterEach() {
    this.schema.db.emptyData();
  }
});

test(`it works`, function(assert) {
  let registry = new SerializerRegistry(this.schema, {
    application: ActiveModelSerializer,
    author: ActiveModelSerializer.extend({
      attrs: ['id', 'name'],
      // relationships: ['posts']
    })
  });

  let link = this.schema.author.find(1);
  let result = registry.serialize(link);

  assert.deepEqual(result, {
    author: {id: 1, name: 'Link', blog_post_ids: [1, 2]},
    'blog_posts': [
      {id: 1, title: 'Lorem'},
      {id: 2, title: 'Ipsum'}
    ]
  });
});
