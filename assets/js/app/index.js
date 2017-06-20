import Store from './store';
import View from './view';
import Controller from './controller';
import Template from './templates';

/**
 * App structure inspired by https://github.com/tastejs/todomvc/tree/gh-pages/examples/vanilla-es6
 * */

let app = {

  start: function () {

    const template = new Template();

    let store = new Store('responsive-css-sprite-generator');
    let view = new View(template);

    new Controller(store, view);

    console.log('app started');

  }


};

export default app;
