import Ember from 'ember';

export default {

  define: function(attrs) {

    return function(sequence) {
      var newModel = {};

      if (attrs) {
        Ember.keys(attrs).forEach(function(key) {
          var type = typeof attrs[key];

          if (type === 'string' || type === 'number') {
            newModel[key] = attrs[key];
          } else if (type === 'function') {
            newModel[key] = attrs[key].call(attrs, sequence);
          }
        });
      }

      return newModel;
    };
  }

};
