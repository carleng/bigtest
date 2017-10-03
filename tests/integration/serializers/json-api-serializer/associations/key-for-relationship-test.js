import { Schema, Db, SerializerRegistry } from 'mirage-server';
import { Model, hasMany, JSONAPISerializer } from 'mirage-server';
import { underscore } from 'mirage-server';
import { module, test } from 'qunit';

module('Integration | Serializers | JSON API Serializer | Key for relationship', {
  beforeEach() {
    this.schema = new Schema(new Db(), {
      wordSmith: Model.extend({
        blogPosts: hasMany()
      }),
      blogPost: Model
    });
  }
});

test(`keyForRelationship works`, function(assert) {
  let ApplicationSerializer = JSONAPISerializer.extend({
    keyForRelationship(key) {
      return underscore(key);
    }
  });
  let registry = new SerializerRegistry(this.schema, {
    application: ApplicationSerializer,
    wordSmith: ApplicationSerializer.extend({
      include: ['blogPosts']
    })
  });
  let wordSmith = this.schema.wordSmiths.create({
    id: 1,
    firstName: 'Link',
    lastName: 'Jackson',
    age: 323
  });
  wordSmith.createBlogPost({ title: 'Lorem ipsum' });

  let result = registry.serialize(wordSmith);

  assert.deepEqual(result, {
    data: {
      type: 'word-smiths',
      id: '1',
      attributes: {
        age: 323,
        'first-name': 'Link',
        'last-name': 'Jackson'
      },
      relationships: {
        'blog_posts': {
          data: [
            { id: '1', type: 'blog-posts' }
          ]
        }
      }
    },
    included: [
      {
        attributes: {
          title: "Lorem ipsum"
        },
        id: "1",
        type: "blog-posts"
      }
    ]
  });
});
