import Association from './association';
import Collection from '../collection';
import { capitalize } from 'ember-cli-mirage/utils/inflector';

class HasMany extends Association {

  /*
    The hasMany association adds a fk to the target of the association
  */
  getForeignKeyArray() {
    return [this.target, `${this.owner}_id`];
  }

  getForeignKey() {
    return `${this.owner}_id`;
  }

  addMethodsToModel(model, key, schema) {
    this._model = model;
    this._key = key;

    var association = this;
    var foreignKey = this.getForeignKey();
    var relationshipIdsKey = association.target + '_ids';

    var associationHash = {[key]: this};
    model.hasManyAssociations = _.assign(model.hasManyAssociations, associationHash);
    model.associationKeys.push(key);
    model.associationIdKeys.push(relationshipIdsKey);

    Object.defineProperty(model, relationshipIdsKey, {

      /*
        object.children_ids
          - returns an array of the associated children's ids
      */
      get: function() {
        var models = association._cachedChildren || [];

        if (!this.isNew()) {
          var query = {[foreignKey]: this.id};
          var savedModels = schema[association.target].where(query);

          models = savedModels.mergeCollection(models);
        }

        return models.map(model => model.id);
      },

      /*
        object.children_ids = ([childrenIds...])
          - sets the associated parent (via id)
      */
      set: function(ids) {
        ids = ids || [];

        if (this.isNew()) {
          association._cachedChildren = schema[association.target].find(ids);

        } else {
          // Set current children's fk to null
          var query = {[foreignKey]: this.id};
          schema[association.target].where(query).update(foreignKey, null);

          // Associate the new childrens to this model
          schema[association.target].find(ids).update(foreignKey, this.id);

          // Clear out any old cached children
          association._cachedChildren = [];
        }

        return this;
      }
    });

    Object.defineProperty(model, key, {

      /*
        object.children
          - returns an array of associated children
      */
      get: function() {
        var tempModels = association._cachedChildren || [];

        if (this.isNew()) {
          return tempModels;

        } else {
          var query = {};
          query[foreignKey] = this.id;
          var savedModels = schema[association.target].where(query);

          return savedModels.mergeCollection(tempModels);
        }
      },

      /*
        object.children = [model1, model2, ...]
          - sets the associated children (via array of models)
          - note: this method will persist unsaved chidren
            + (why? because rails does)
      */
      set: function(models) {
        models = models ? _.compact(models) : [];

        if (this.isNew()) {
          association._cachedChildren = models instanceof Collection ? models : new Collection(models);

        } else {

          // Set current children's fk to null
          var query = {[foreignKey]: this.id};
          schema[association.target].where(query).update(foreignKey, null);

          // Save any children that are new
          models.filter(model => model.isNew())
            .forEach(model => model.save());

          // Associate the new children to this model
          schema[association.target].find(models.map(m => m.id)).update(foreignKey, this.id);

          // Clear out any old cached children
          association._cachedChildren = [];
        }
      }
    });

    /*
      object.newChild
        - creates a new unsaved associated child
    */
    model['new' + capitalize(association.target)] = function(attrs) {
      if (!this.isNew()) {
        attrs = _.assign(attrs, {[foreignKey]: this.id});
      }

      var child = schema[association.target].new(attrs);

      association._cachedChildren = association._cachedChildren || new Collection();
      association._cachedChildren.push(child);

      return child;
    };

    /*
      object.createChild
        - creates an associated child, persists directly to db, and
          updates the target's foreign key
        - parent must be saved
    */
    model['create' + capitalize(association.target)] = function(attrs) {
      if (this.isNew()) {
        throw 'You cannot call create unless the parent is saved';
      }

      var augmentedAttrs = _.assign(attrs, {[foreignKey]: this.id});
      var child = schema[association.target].create(augmentedAttrs);

      return child;
    };
  }
}

export default HasMany;
