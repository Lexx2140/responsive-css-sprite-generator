(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function later() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

module.exports = debounce;

},{}],2:[function(require,module,exports){
'use strict';

var Clipboard = require('clipboard');
var Packer = require('./packer');
var debounce = require('./debounce');

/*
 * Files Selector
 * */

window.URL = window.URL || window.webkitURL;

var loadInProgress = false;
var fileElem = document.getElementById("fileElem"),
    fileList = document.getElementById("fileList"),
    prefixElem = document.getElementById("prefix"),
    paddingElem = document.getElementById("padding"),
    pathElem = document.getElementById("path");
var id = 0;
var blocks = [];
var loaded = 0;
var canvas = document.getElementById('canvas');
var css = document.getElementById('css');
css.value = '';
var prefix = prefixElem.value;
var padding = paddingElem.value;
var path = pathElem.value;
var dimensionsElem = document.getElementById('dimensions');

var list = document.createElement("ul");
fileList.appendChild(list);

fileElem.addEventListener('change', function () {
    handleFiles(this.files);
});

fileList.addEventListener('click', function (e) {
    if (!loadInProgress) {
        if (e.target && e.target.classList.contains('remove')) {
            var id = e.target.parentNode.getAttribute('data-id');
            for (var i = 0; i < blocks.length; i++) {
                if (blocks[i].id == id) {
                    blocks.splice(i, 1);
                    loaded--;
                    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
                    ga('send', {
                        hitType: 'event',
                        eventCategory: 'Remove Image',
                        eventAction: 'click'
                    });
                    break;
                }
            }
            var packer = new Packer(padding, prefix, path);
            packer.sort(blocks);
            packer.fit(blocks);
            packer.draw(blocks, canvas, css);
            dimensionsElem.innerHTML = '(' + canvas.width + 'px by ' + canvas.height + 'px)';
            if (blocks.length === 0) {
                css.value = '';
                dropbox.classList.add('is-empty');
            }
        }
    }
});

prefixElem.addEventListener('keyup', debounce(updateValues, 250));
paddingElem.addEventListener('keyup', debounce(updateValues, 250));
pathElem.addEventListener('keyup', debounce(updateValues, 250));

function updateValues() {
    prefix = prefixElem.value;
    padding = paddingElem.value;
    path = pathElem.value;
    if (blocks.length > 0) {
        var packer = new Packer(padding, prefix, path);
        packer.sort(blocks);
        packer.fit(blocks);
        packer.draw(blocks, canvas, css);
        dimensionsElem.innerHTML = '(' + canvas.width + 'px by ' + canvas.height + 'px)';
        ga('send', {
            hitType: 'event',
            eventCategory: 'Update Values',
            eventAction: 'keyup'
        });
    }
}

var dropbox;

dropbox = document.getElementById("dropbox");
dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("drop", drop, false);
dropbox.addEventListener("click", function (e) {
    if (fileElem) {
        fileElem.click();
    }
    e.preventDefault(); // prevent navigation to "#"
    ga('send', {
        hitType: 'event',
        eventCategory: 'File Explorer',
        eventAction: 'click'
    });
}, false);

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    handleFiles(files);

    ga('send', {
        hitType: 'event',
        eventCategory: 'File Drop',
        eventAction: 'drop'
    });
}

/*
 * Handle Files
 * */

function handleFiles(files) {
    if (!files.length) {
        fileList.innerHTML = "<p>No files selected!</p>";
    } else {
        loadInProgress = true;
        //fileList.innerHTML = "";
        //var list = document.createElement("ul");
        //fileList.appendChild(list);
        for (var i = 0; i < files.length; i++) {
            id++;
            var li = document.createElement("li");
            var img = document.createElement("img");
            var info = document.createElement("span");
            var remove = document.createElement("div");

            li.setAttribute('data-id', id);
            list.appendChild(li);

            img.src = window.URL.createObjectURL(files[i]);
            img.height = 60;
            img.onload = onload(id, files[i], files.length + blocks.length);
            li.appendChild(img);

            info.innerHTML = files[i].name.substring(0, files[i].name.indexOf('.'));
            li.appendChild(info);

            remove.classList.add('remove');
            li.appendChild(remove);

            dropbox.classList.remove('is-empty');
        }
    }
    fileElem.value = '';
}

function loadComplete() {
    var packer = new Packer(padding, prefix, path);
    packer.sort(blocks);
    packer.fit(blocks);
    packer.draw(blocks, canvas, css);
    dimensionsElem.innerHTML = '(' + canvas.width + 'px by ' + canvas.height + 'px)';
    loadInProgress = false;
}

function onload(id, file, queue) {
    return function () {
        window.URL.revokeObjectURL(this.src);
        blocks.push({
            w: this.naturalWidth,
            h: this.naturalHeight,
            img: this,
            name: file.name.substring(0, file.name.indexOf('.')),
            id: id
        });
        loaded++;
        if (loaded === queue) {
            loadComplete();
        }
    };
}

document.getElementById('download').addEventListener('click', function () {
    var a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'sprite.png';
    document.body.appendChild(a);
    //console.log(a);
    a.click();
    document.body.removeChild(a);

    ga('send', {
        hitType: 'event',
        eventCategory: 'Sprite Download',
        eventAction: 'click'
    });
}, false);

var clipboard = new Clipboard('#copy');

document.getElementById('copy').addEventListener('click', function () {
    ga('send', {
        hitType: 'event',
        eventCategory: 'Copy CSS',
        eventAction: 'click'
    });
});

},{"./debounce":1,"./packer":3,"clipboard":5}],3:[function(require,module,exports){
'use strict';

function Packer(pad, pre, path) {
    this.init(pad, pre, path);
}

Packer.prototype = {

    init: function init(pad, pre, path) {
        var padding = isNumeric(pad) ? pad : 2;
        padding = Math.round(Math.abs(padding));
        this.root = {
            x: 0, // origin x
            y: 0, // origin y
            w: 256 - padding, // width
            h: 256 - padding, // height
            p: padding
        };
        this.prefix = pre;
        //this.prefix = this.prefix.replace(/ /g, '');
        this.path = path;
    },

    sort: function sort(blocks) {
        blocks.sort(function (a, b) {
            // should this be sorted by height?
            if (a.h < b.h) {
                return 1;
            }
            if (a.h > b.h) {
                return -1;
            }
            return 0;
        });
    },

    fit: function fit(blocks) {
        var n,
            node,
            block,
            p = this.root.p;
        for (n = 0; n < blocks.length; n++) {
            block = blocks[n];
            block.fit = false; // reset
            if (node = this.findNode(this.root, block.w + p, block.h + p)) {
                block.fit = this.splitNode(node, block.w + p, block.h + p);
            }
            if (!block.fit) {
                this.resize(blocks);
                break;
            }
        }
    },

    resize: function resize(blocks) {
        var w,
            h,
            p = this.root.p;
        if (this.root.w > this.root.h) {
            w = this.root.w + p;
            h = (this.root.h + p) * 2;
        } else {
            w = (this.root.w + p) * 2;
            h = this.root.h + p;
        }
        this.root = {
            x: 0, // origin x
            y: 0, // origin y
            w: w - p, // width
            h: h - p, // height
            p: p
        };
        this.fit(blocks);
    },

    findNode: function findNode(root, w, h) {
        if (root.used) return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);else if (w <= root.w && h <= root.h) return root;else return null;
    },

    splitNode: function splitNode(node, w, h) {
        node.used = true;
        node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
        node.right = { x: node.x + w, y: node.y, w: node.w - w, h: h };
        return node;
    },

    draw: function draw(blocks, canvas, output) {
        var ctx = canvas.getContext('2d');
        var gitubUrl = '/*\nResponsive CSS Sprite created using: ' + 'http://eivers88.github.io/responsive-css-sprite-generator/\n' + '*/\n\n';
        var groupSelectors = '';
        var globalStyle = '\n{display:inline-block; overflow:hidden; background-repeat: ' + 'no-repeat;background-image:url(' + this.path + ');}\n\n';
        var spriteStyle = '';
        var p = this.root.p; // padding
        var width = this.root.w + p;
        var height = this.root.h + p;
        var b; // block
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var n = 0; n < blocks.length; n++) {
            b = blocks[n];
            if (b.fit) {
                // turn on for testing
                //ctx.fillRect(b.fit.x + p, b.fit.y + p, b.w, b.h);
                //ctx.stroke();
                ctx.drawImage(b.img, b.fit.x + p, b.fit.y + p);
                // add comma if not the last style
                groupSelectors += '.' + this.prefix + b.name + (n === blocks.length - 1 ? ' ' : ', ');
                // individual sprite style
                spriteStyle += '.' + this.prefix + b.name + ' {width:' + b.w + 'px; ' + 'height:' + b.h + 'px; ' + 'background-position:' + ((b.fit.x + p) / (width - b.w) * 100).toPrecision(6) + '% ' + ((b.fit.y + p) / (height - b.h) * 100).toPrecision(6) + '%; ' + 'background-size:' + (width / b.w * 100).toPrecision(6) + '%; ' + '}\n';
            }
        }
        output.value = gitubUrl + groupSelectors + globalStyle + spriteStyle;
    }

};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = Packer;

},{}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _select = require('select');

var _select2 = _interopRequireDefault(_select);

/**
 * Inner class which performs selection from either `text` or `target`
 * properties and then executes copy or cut operations.
 */

var ClipboardAction = (function () {
    /**
     * @param {Object} options
     */

    function ClipboardAction(options) {
        _classCallCheck(this, ClipboardAction);

        this.resolveOptions(options);
        this.initSelection();
    }

    /**
     * Defines base properties passed from constructor.
     * @param {Object} options
     */

    ClipboardAction.prototype.resolveOptions = function resolveOptions() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.action = options.action;
        this.emitter = options.emitter;
        this.target = options.target;
        this.text = options.text;
        this.trigger = options.trigger;

        this.selectedText = '';
    };

    /**
     * Decides which selection strategy is going to be applied based
     * on the existence of `text` and `target` properties.
     */

    ClipboardAction.prototype.initSelection = function initSelection() {
        if (this.text && this.target) {
            throw new Error('Multiple attributes declared, use either "target" or "text"');
        } else if (this.text) {
            this.selectFake();
        } else if (this.target) {
            this.selectTarget();
        } else {
            throw new Error('Missing required attributes, use either "target" or "text"');
        }
    };

    /**
     * Creates a fake textarea element, sets its value from `text` property,
     * and makes a selection on it.
     */

    ClipboardAction.prototype.selectFake = function selectFake() {
        var _this = this;

        this.removeFake();

        this.fakeHandler = document.body.addEventListener('click', function () {
            return _this.removeFake();
        });

        this.fakeElem = document.createElement('textarea');
        this.fakeElem.style.position = 'absolute';
        this.fakeElem.style.left = '-9999px';
        this.fakeElem.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
        this.fakeElem.setAttribute('readonly', '');
        this.fakeElem.value = this.text;

        document.body.appendChild(this.fakeElem);

        this.selectedText = _select2['default'](this.fakeElem);
        this.copyText();
    };

    /**
     * Only removes the fake element after another click event, that way
     * a user can hit `Ctrl+C` to copy because selection still exists.
     */

    ClipboardAction.prototype.removeFake = function removeFake() {
        if (this.fakeHandler) {
            document.body.removeEventListener('click');
            this.fakeHandler = null;
        }

        if (this.fakeElem) {
            document.body.removeChild(this.fakeElem);
            this.fakeElem = null;
        }
    };

    /**
     * Selects the content from element passed on `target` property.
     */

    ClipboardAction.prototype.selectTarget = function selectTarget() {
        this.selectedText = _select2['default'](this.target);
        this.copyText();
    };

    /**
     * Executes the copy operation based on the current selection.
     */

    ClipboardAction.prototype.copyText = function copyText() {
        var succeeded = undefined;

        try {
            succeeded = document.execCommand(this.action);
        } catch (err) {
            succeeded = false;
        }

        this.handleResult(succeeded);
    };

    /**
     * Fires an event based on the copy operation result.
     * @param {Boolean} succeeded
     */

    ClipboardAction.prototype.handleResult = function handleResult(succeeded) {
        if (succeeded) {
            this.emitter.emit('success', {
                action: this.action,
                text: this.selectedText,
                trigger: this.trigger,
                clearSelection: this.clearSelection.bind(this)
            });
        } else {
            this.emitter.emit('error', {
                action: this.action,
                trigger: this.trigger,
                clearSelection: this.clearSelection.bind(this)
            });
        }
    };

    /**
     * Removes current selection and focus from `target` element.
     */

    ClipboardAction.prototype.clearSelection = function clearSelection() {
        if (this.target) {
            this.target.blur();
        }

        window.getSelection().removeAllRanges();
    };

    /**
     * Sets the `action` to be performed which can be either 'copy' or 'cut'.
     * @param {String} action
     */

    /**
     * Destroy lifecycle.
     */

    ClipboardAction.prototype.destroy = function destroy() {
        this.removeFake();
    };

    _createClass(ClipboardAction, [{
        key: 'action',
        set: function set() {
            var action = arguments.length <= 0 || arguments[0] === undefined ? 'copy' : arguments[0];

            this._action = action;

            if (this._action !== 'copy' && this._action !== 'cut') {
                throw new Error('Invalid "action" value, use either "copy" or "cut"');
            }
        },

        /**
         * Gets the `action` property.
         * @return {String}
         */
        get: function get() {
            return this._action;
        }

        /**
         * Sets the `target` property using an element
         * that will be have its content copied.
         * @param {Element} target
         */
    }, {
        key: 'target',
        set: function set(target) {
            if (target !== undefined) {
                if (target && typeof target === 'object' && target.nodeType === 1) {
                    this._target = target;
                } else {
                    throw new Error('Invalid "target" value, use a valid Element');
                }
            }
        },

        /**
         * Gets the `target` property.
         * @return {String|HTMLElement}
         */
        get: function get() {
            return this._target;
        }
    }]);

    return ClipboardAction;
})();

exports['default'] = ClipboardAction;
module.exports = exports['default'];
},{"select":11}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _clipboardAction = require('./clipboard-action');

var _clipboardAction2 = _interopRequireDefault(_clipboardAction);

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _goodListener = require('good-listener');

var _goodListener2 = _interopRequireDefault(_goodListener);

/**
 * Base class which takes one or more elements, adds event listeners to them,
 * and instantiates a new `ClipboardAction` on each click.
 */

var Clipboard = (function (_Emitter) {
    _inherits(Clipboard, _Emitter);

    /**
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     * @param {Object} options
     */

    function Clipboard(trigger, options) {
        _classCallCheck(this, Clipboard);

        _Emitter.call(this);

        this.resolveOptions(options);
        this.listenClick(trigger);
    }

    /**
     * Helper function to retrieve attribute value.
     * @param {String} suffix
     * @param {Element} element
     */

    /**
     * Defines if attributes would be resolved using internal setter functions
     * or custom functions that were passed in the constructor.
     * @param {Object} options
     */

    Clipboard.prototype.resolveOptions = function resolveOptions() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        this.action = typeof options.action === 'function' ? options.action : this.defaultAction;
        this.target = typeof options.target === 'function' ? options.target : this.defaultTarget;
        this.text = typeof options.text === 'function' ? options.text : this.defaultText;
    };

    /**
     * Adds a click event listener to the passed trigger.
     * @param {String|HTMLElement|HTMLCollection|NodeList} trigger
     */

    Clipboard.prototype.listenClick = function listenClick(trigger) {
        var _this = this;

        this.listener = _goodListener2['default'](trigger, 'click', function (e) {
            return _this.onClick(e);
        });
    };

    /**
     * Defines a new `ClipboardAction` on each click event.
     * @param {Event} e
     */

    Clipboard.prototype.onClick = function onClick(e) {
        var trigger = e.delegateTarget || e.currentTarget;

        if (this.clipboardAction) {
            this.clipboardAction = null;
        }

        this.clipboardAction = new _clipboardAction2['default']({
            action: this.action(trigger),
            target: this.target(trigger),
            text: this.text(trigger),
            trigger: trigger,
            emitter: this
        });
    };

    /**
     * Default `action` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultAction = function defaultAction(trigger) {
        return getAttributeValue('action', trigger);
    };

    /**
     * Default `target` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultTarget = function defaultTarget(trigger) {
        var selector = getAttributeValue('target', trigger);

        if (selector) {
            return document.querySelector(selector);
        }
    };

    /**
     * Default `text` lookup function.
     * @param {Element} trigger
     */

    Clipboard.prototype.defaultText = function defaultText(trigger) {
        return getAttributeValue('text', trigger);
    };

    /**
     * Destroy lifecycle.
     */

    Clipboard.prototype.destroy = function destroy() {
        this.listener.destroy();

        if (this.clipboardAction) {
            this.clipboardAction.destroy();
            this.clipboardAction = null;
        }
    };

    return Clipboard;
})(_tinyEmitter2['default']);

function getAttributeValue(suffix, element) {
    var attribute = 'data-clipboard-' + suffix;

    if (!element.hasAttribute(attribute)) {
        return;
    }

    return element.getAttribute(attribute);
}

exports['default'] = Clipboard;
module.exports = exports['default'];
},{"./clipboard-action":4,"good-listener":9,"tiny-emitter":12}],6:[function(require,module,exports){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf) {
  var parent = checkYoSelf ? element : element.parentNode

  while (parent && parent !== document) {
    if (matches(parent, selector)) return parent;
    parent = parent.parentNode
  }
}

},{"matches-selector":10}],7:[function(require,module,exports){
var closest = require('closest');

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function delegate(element, selector, type, callback) {
    var listenerFn = listener.apply(this, arguments);

    element.addEventListener(type, listenerFn);

    return {
        destroy: function() {
            element.removeEventListener(type, listenerFn);
        }
    }
}

/**
 * Finds closest match and invokes callback.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Function}
 */
function listener(element, selector, type, callback) {
    return function(e) {
        e.delegateTarget = closest(e.target, selector, true);

        if (e.delegateTarget) {
            callback.call(element, e);
        }
    }
}

module.exports = delegate;

},{"closest":6}],8:[function(require,module,exports){
/**
 * Check if argument is a HTML element.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.node = function(value) {
    return value !== undefined
        && value instanceof HTMLElement
        && value.nodeType === 1;
};

/**
 * Check if argument is a list of HTML elements.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.nodeList = function(value) {
    var type = Object.prototype.toString.call(value);

    return value !== undefined
        && (type === '[object NodeList]' || type === '[object HTMLCollection]')
        && ('length' in value)
        && (value.length === 0 || exports.node(value[0]));
};

/**
 * Check if argument is a string.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.string = function(value) {
    return typeof value === 'string'
        || value instanceof String;
};

/**
 * Check if argument is a function.
 *
 * @param {Object} value
 * @return {Boolean}
 */
exports.function = function(value) {
    var type = Object.prototype.toString.call(value);

    return type === '[object Function]';
};

},{}],9:[function(require,module,exports){
var is = require('./is');
var delegate = require('delegate');

/**
 * Validates all params and calls the right
 * listener function based on its target type.
 *
 * @param {String|HTMLElement|HTMLCollection|NodeList} target
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listen(target, type, callback) {
    if (!target && !type && !callback) {
        throw new Error('Missing required arguments');
    }

    if (!is.string(type)) {
        throw new TypeError('Second argument must be a String');
    }

    if (!is.function(callback)) {
        throw new TypeError('Third argument must be a Function');
    }

    if (is.node(target)) {
        return listenNode(target, type, callback);
    }
    else if (is.nodeList(target)) {
        return listenNodeList(target, type, callback);
    }
    else if (is.string(target)) {
        return listenSelector(target, type, callback);
    }
    else {
        throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
    }
}

/**
 * Adds an event listener to a HTML element
 * and returns a remove listener function.
 *
 * @param {HTMLElement} node
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenNode(node, type, callback) {
    node.addEventListener(type, callback);

    return {
        destroy: function() {
            node.removeEventListener(type, callback);
        }
    }
}

/**
 * Add an event listener to a list of HTML elements
 * and returns a remove listener function.
 *
 * @param {NodeList|HTMLCollection} nodeList
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenNodeList(nodeList, type, callback) {
    Array.prototype.forEach.call(nodeList, function(node) {
        node.addEventListener(type, callback);
    });

    return {
        destroy: function() {
            Array.prototype.forEach.call(nodeList, function(node) {
                node.removeEventListener(type, callback);
            });
        }
    }
}

/**
 * Add an event listener to a selector
 * and returns a remove listener function.
 *
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Object}
 */
function listenSelector(selector, type, callback) {
    return delegate(document.body, selector, type, callback);
}

module.exports = listen;

},{"./is":8,"delegate":7}],10:[function(require,module,exports){

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],11:[function(require,module,exports){
function select(element) {
    var selectedText;

    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        element.focus();
        element.setSelectionRange(0, element.value.length);

        selectedText = element.value;
    }
    else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        selectedText = selection.toString();
    }

    return selectedText;
}

module.exports = select;

},{}],12:[function(require,module,exports){
function E () {
	// Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
	on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;

},{}]},{},[2])
//# sourceMappingURL=bundle.js.map
