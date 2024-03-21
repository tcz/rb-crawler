(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["DomToSVG"] = factory();
	else
		root["DomToSVG"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 190:
/***/ ((__unused_webpack_module, exports) => {

var __webpack_unused_export__;
// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var GradientParser = (GradientParser || {});

GradientParser.stringify = (function() {

  var visitor = {

    'visit_linear-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_repeating-linear-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_radial-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_repeating-radial-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_gradient': function(node) {
      var orientation = visitor.visit(node.orientation);
      if (orientation) {
        orientation += ', ';
      }

      return node.type + '(' + orientation + visitor.visit(node.colorStops) + ')';
    },

    'visit_shape': function(node) {
      var result = node.value,
          at = visitor.visit(node.at),
          style = visitor.visit(node.style);

      if (style) {
        result += ' ' + style;
      }

      if (at) {
        result += ' at ' + at;
      }

      return result;
    },

    'visit_default-radial': function(node) {
      var result = '',
          at = visitor.visit(node.at);

      if (at) {
        result += at;
      }
      return result;
    },

    'visit_extent-keyword': function(node) {
      var result = node.value,
          at = visitor.visit(node.at);

      if (at) {
        result += ' at ' + at;
      }

      return result;
    },

    'visit_position-keyword': function(node) {
      return node.value;
    },

    'visit_position': function(node) {
      return visitor.visit(node.value.x) + ' ' + visitor.visit(node.value.y);
    },

    'visit_%': function(node) {
      return node.value + '%';
    },

    'visit_em': function(node) {
      return node.value + 'em';
    },

    'visit_px': function(node) {
      return node.value + 'px';
    },

    'visit_literal': function(node) {
      return visitor.visit_color(node.value, node);
    },

    'visit_hex': function(node) {
      return visitor.visit_color('#' + node.value, node);
    },

    'visit_rgb': function(node) {
      return visitor.visit_color('rgb(' + node.value.join(', ') + ')', node);
    },

    'visit_rgba': function(node) {
      return visitor.visit_color('rgba(' + node.value.join(', ') + ')', node);
    },

    'visit_color': function(resultColor, node) {
      var result = resultColor,
          length = visitor.visit(node.length);

      if (length) {
        result += ' ' + length;
      }
      return result;
    },

    'visit_angular': function(node) {
      return node.value + 'deg';
    },

    'visit_directional': function(node) {
      return 'to ' + node.value;
    },

    'visit_array': function(elements) {
      var result = '',
          size = elements.length;

      elements.forEach(function(element, i) {
        result += visitor.visit(element);
        if (i < size - 1) {
          result += ', ';
        }
      });

      return result;
    },

    'visit': function(element) {
      if (!element) {
        return '';
      }
      var result = '';

      if (element instanceof Array) {
        return visitor.visit_array(element, result);
      } else if (element.type) {
        var nodeVisitor = visitor['visit_' + element.type];
        if (nodeVisitor) {
          return nodeVisitor(element);
        } else {
          throw Error('Missing visitor visit_' + element.type);
        }
      } else {
        throw Error('Invalid node.');
      }
    }

  };

  return function(root) {
    return visitor.visit(root);
  };
})();

// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var GradientParser = (GradientParser || {});

GradientParser.parse = (function() {

  var tokens = {
    linearGradient: /^(\-(webkit|o|ms|moz)\-)?(linear\-gradient)/i,
    repeatingLinearGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-linear\-gradient)/i,
    radialGradient: /^(\-(webkit|o|ms|moz)\-)?(radial\-gradient)/i,
    repeatingRadialGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-radial\-gradient)/i,
    sideOrCorner: /^to (left (top|bottom)|right (top|bottom)|left|right|top|bottom)/i,
    extentKeywords: /^(closest\-side|closest\-corner|farthest\-side|farthest\-corner|contain|cover)/,
    positionKeywords: /^(left|center|right|top|bottom)/i,
    pixelValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))px/,
    percentageValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))\%/,
    emValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))em/,
    angleValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))deg/,
    startCall: /^\(/,
    endCall: /^\)/,
    comma: /^,/,
    hexColor: /^\#([0-9a-fA-F]+)/,
    literalColor: /^([a-zA-Z]+)/,
    rgbColor: /^rgb/i,
    rgbaColor: /^rgba/i,
    number: /^(([0-9]*\.[0-9]+)|([0-9]+\.?))/
  };

  var input = '';

  function error(msg) {
    var err = new Error(input + ': ' + msg);
    err.source = input;
    throw err;
  }

  function getAST() {
    var ast = matchListDefinitions();

    if (input.length > 0) {
      error('Invalid input not EOF');
    }

    return ast;
  }

  function matchListDefinitions() {
    return matchListing(matchDefinition);
  }

  function matchDefinition() {
    return matchGradient(
            'linear-gradient',
            tokens.linearGradient,
            matchLinearOrientation) ||

          matchGradient(
            'repeating-linear-gradient',
            tokens.repeatingLinearGradient,
            matchLinearOrientation) ||

          matchGradient(
            'radial-gradient',
            tokens.radialGradient,
            matchListRadialOrientations) ||

          matchGradient(
            'repeating-radial-gradient',
            tokens.repeatingRadialGradient,
            matchListRadialOrientations);
  }

  function matchGradient(gradientType, pattern, orientationMatcher) {
    return matchCall(pattern, function(captures) {

      var orientation = orientationMatcher();
      if (orientation) {
        if (!scan(tokens.comma)) {
          error('Missing comma before color stops');
        }
      }

      return {
        type: gradientType,
        orientation: orientation,
        colorStops: matchListing(matchColorStop)
      };
    });
  }

  function matchCall(pattern, callback) {
    var captures = scan(pattern);

    if (captures) {
      if (!scan(tokens.startCall)) {
        error('Missing (');
      }

      var result = callback(captures);

      if (!scan(tokens.endCall)) {
        error('Missing )');
      }

      return result;
    }
  }

  function matchLinearOrientation() {
    return matchSideOrCorner() ||
      matchAngle();
  }

  function matchSideOrCorner() {
    return match('directional', tokens.sideOrCorner, 1);
  }

  function matchAngle() {
    return match('angular', tokens.angleValue, 1);
  }

  function matchListRadialOrientations() {
    var radialOrientations,
        radialOrientation = matchRadialOrientation(),
        lookaheadCache;

    if (radialOrientation) {
      radialOrientations = [];
      radialOrientations.push(radialOrientation);

      lookaheadCache = input;
      if (scan(tokens.comma)) {
        radialOrientation = matchRadialOrientation();
        if (radialOrientation) {
          radialOrientations.push(radialOrientation);
        } else {
          input = lookaheadCache;
        }
      }
    }

    return radialOrientations;
  }

  function matchRadialOrientation() {
    var radialType = matchCircle() ||
      matchEllipse();

    if (radialType) {
      radialType.at = matchAtPosition();
    } else {
      var extent = matchExtentKeyword();
      if (extent) {
        radialType = extent;
        var positionAt = matchAtPosition();
        if (positionAt) {
          radialType.at = positionAt;
        }
      } else {
        var defaultPosition = matchPositioning();
        if (defaultPosition) {
          radialType = {
            type: 'default-radial',
            at: defaultPosition
          };
        }
      }
    }

    return radialType;
  }

  function matchCircle() {
    var circle = match('shape', /^(circle)/i, 0);

    if (circle) {
      circle.style = matchLength() || matchExtentKeyword();
    }

    return circle;
  }

  function matchEllipse() {
    var ellipse = match('shape', /^(ellipse)/i, 0);

    if (ellipse) {
      ellipse.style =  matchDistance() || matchExtentKeyword();
    }

    return ellipse;
  }

  function matchExtentKeyword() {
    return match('extent-keyword', tokens.extentKeywords, 1);
  }

  function matchAtPosition() {
    if (match('position', /^at/, 0)) {
      var positioning = matchPositioning();

      if (!positioning) {
        error('Missing positioning value');
      }

      return positioning;
    }
  }

  function matchPositioning() {
    var location = matchCoordinates();

    if (location.x || location.y) {
      return {
        type: 'position',
        value: location
      };
    }
  }

  function matchCoordinates() {
    return {
      x: matchDistance(),
      y: matchDistance()
    };
  }

  function matchListing(matcher) {
    var captures = matcher(),
      result = [];

    if (captures) {
      result.push(captures);
      while (scan(tokens.comma)) {
        captures = matcher();
        if (captures) {
          result.push(captures);
        } else {
          error('One extra comma');
        }
      }
    }

    return result;
  }

  function matchColorStop() {
    var color = matchColor();

    if (!color) {
      error('Expected color definition');
    }

    color.length = matchDistance();
    return color;
  }

  function matchColor() {
    return matchHexColor() ||
      matchRGBAColor() ||
      matchRGBColor() ||
      matchLiteralColor();
  }

  function matchLiteralColor() {
    return match('literal', tokens.literalColor, 0);
  }

  function matchHexColor() {
    return match('hex', tokens.hexColor, 1);
  }

  function matchRGBColor() {
    return matchCall(tokens.rgbColor, function() {
      return  {
        type: 'rgb',
        value: matchListing(matchNumber)
      };
    });
  }

  function matchRGBAColor() {
    return matchCall(tokens.rgbaColor, function() {
      return  {
        type: 'rgba',
        value: matchListing(matchNumber)
      };
    });
  }

  function matchNumber() {
    return scan(tokens.number)[1];
  }

  function matchDistance() {
    return match('%', tokens.percentageValue, 1) ||
      matchPositionKeyword() ||
      matchLength();
  }

  function matchPositionKeyword() {
    return match('position-keyword', tokens.positionKeywords, 1);
  }

  function matchLength() {
    return match('px', tokens.pixelValue, 1) ||
      match('em', tokens.emValue, 1);
  }

  function match(type, pattern, captureIndex) {
    var captures = scan(pattern);
    if (captures) {
      return {
        type: type,
        value: captures[captureIndex]
      };
    }
  }

  function scan(regexp) {
    var captures,
        blankCaptures;

    blankCaptures = /^[\n\r\t\s]+/.exec(input);
    if (blankCaptures) {
        consume(blankCaptures[0].length);
    }

    captures = regexp.exec(input);
    if (captures) {
        consume(captures[0].length);
    }

    return captures;
  }

  function consume(size) {
    input = input.substr(size);
  }

  return function(code) {
    input = code.toString();
    return getAST();
  };
})();

exports.q = GradientParser.parse;
__webpack_unused_export__ = GradientParser.stringify;


/***/ }),

/***/ 482:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parse = __webpack_require__(809);
var walk = __webpack_require__(449);
var stringify = __webpack_require__(63);

function ValueParser(value) {
  if (this instanceof ValueParser) {
    this.nodes = parse(value);
    return this;
  }
  return new ValueParser(value);
}

ValueParser.prototype.toString = function() {
  return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
};

ValueParser.prototype.walk = function(cb, bubble) {
  walk(this.nodes, cb, bubble);
  return this;
};

ValueParser.unit = __webpack_require__(882);

ValueParser.walk = walk;

ValueParser.stringify = stringify;

module.exports = ValueParser;


/***/ }),

/***/ 809:
/***/ ((module) => {

var openParentheses = "(".charCodeAt(0);
var closeParentheses = ")".charCodeAt(0);
var singleQuote = "'".charCodeAt(0);
var doubleQuote = '"'.charCodeAt(0);
var backslash = "\\".charCodeAt(0);
var slash = "/".charCodeAt(0);
var comma = ",".charCodeAt(0);
var colon = ":".charCodeAt(0);
var star = "*".charCodeAt(0);
var uLower = "u".charCodeAt(0);
var uUpper = "U".charCodeAt(0);
var plus = "+".charCodeAt(0);
var isUnicodeRange = /^[a-f0-9?-]+$/i;

module.exports = function(input) {
  var tokens = [];
  var value = input;

  var next,
    quote,
    prev,
    token,
    escape,
    escapePos,
    whitespacePos,
    parenthesesOpenPos;
  var pos = 0;
  var code = value.charCodeAt(pos);
  var max = value.length;
  var stack = [{ nodes: tokens }];
  var balanced = 0;
  var parent;

  var name = "";
  var before = "";
  var after = "";

  while (pos < max) {
    // Whitespaces
    if (code <= 32) {
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      token = value.slice(pos, next);

      prev = tokens[tokens.length - 1];
      if (code === closeParentheses && balanced) {
        after = token;
      } else if (prev && prev.type === "div") {
        prev.after = token;
      } else if (
        code === comma ||
        code === colon ||
        (code === slash &&
          value.charCodeAt(next + 1) !== star &&
          (!parent ||
            (parent && parent.type === "function" && parent.value !== "calc")))
      ) {
        before = token;
      } else {
        tokens.push({
          type: "space",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;

      // Quotes
    } else if (code === singleQuote || code === doubleQuote) {
      next = pos;
      quote = code === singleQuote ? "'" : '"';
      token = {
        type: "string",
        sourceIndex: pos,
        quote: quote
      };
      do {
        escape = false;
        next = value.indexOf(quote, next + 1);
        if (~next) {
          escapePos = next;
          while (value.charCodeAt(escapePos - 1) === backslash) {
            escapePos -= 1;
            escape = !escape;
          }
        } else {
          value += quote;
          next = value.length - 1;
          token.unclosed = true;
        }
      } while (escape);
      token.value = value.slice(pos + 1, next);

      tokens.push(token);
      pos = next + 1;
      code = value.charCodeAt(pos);

      // Comments
    } else if (code === slash && value.charCodeAt(pos + 1) === star) {
      token = {
        type: "comment",
        sourceIndex: pos
      };

      next = value.indexOf("*/", pos);
      if (next === -1) {
        token.unclosed = true;
        next = value.length;
      }

      token.value = value.slice(pos + 2, next);
      tokens.push(token);

      pos = next + 2;
      code = value.charCodeAt(pos);

      // Operation within calc
    } else if (
      (code === slash || code === star) &&
      parent &&
      parent.type === "function" &&
      parent.value === "calc"
    ) {
      token = value[pos];
      tokens.push({
        type: "word",
        sourceIndex: pos - before.length,
        value: token
      });
      pos += 1;
      code = value.charCodeAt(pos);

      // Dividers
    } else if (code === slash || code === comma || code === colon) {
      token = value[pos];

      tokens.push({
        type: "div",
        sourceIndex: pos - before.length,
        value: token,
        before: before,
        after: ""
      });
      before = "";

      pos += 1;
      code = value.charCodeAt(pos);

      // Open parentheses
    } else if (openParentheses === code) {
      // Whitespaces after open parentheses
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      parenthesesOpenPos = pos;
      token = {
        type: "function",
        sourceIndex: pos - name.length,
        value: name,
        before: value.slice(parenthesesOpenPos + 1, next)
      };
      pos = next;

      if (name === "url" && code !== singleQuote && code !== doubleQuote) {
        next -= 1;
        do {
          escape = false;
          next = value.indexOf(")", next + 1);
          if (~next) {
            escapePos = next;
            while (value.charCodeAt(escapePos - 1) === backslash) {
              escapePos -= 1;
              escape = !escape;
            }
          } else {
            value += ")";
            next = value.length - 1;
            token.unclosed = true;
          }
        } while (escape);
        // Whitespaces before closed
        whitespacePos = next;
        do {
          whitespacePos -= 1;
          code = value.charCodeAt(whitespacePos);
        } while (code <= 32);
        if (parenthesesOpenPos < whitespacePos) {
          if (pos !== whitespacePos + 1) {
            token.nodes = [
              {
                type: "word",
                sourceIndex: pos,
                value: value.slice(pos, whitespacePos + 1)
              }
            ];
          } else {
            token.nodes = [];
          }
          if (token.unclosed && whitespacePos + 1 !== next) {
            token.after = "";
            token.nodes.push({
              type: "space",
              sourceIndex: whitespacePos + 1,
              value: value.slice(whitespacePos + 1, next)
            });
          } else {
            token.after = value.slice(whitespacePos + 1, next);
          }
        } else {
          token.after = "";
          token.nodes = [];
        }
        pos = next + 1;
        code = value.charCodeAt(pos);
        tokens.push(token);
      } else {
        balanced += 1;
        token.after = "";
        tokens.push(token);
        stack.push(token);
        tokens = token.nodes = [];
        parent = token;
      }
      name = "";

      // Close parentheses
    } else if (closeParentheses === code && balanced) {
      pos += 1;
      code = value.charCodeAt(pos);

      parent.after = after;
      after = "";
      balanced -= 1;
      stack.pop();
      parent = stack[balanced];
      tokens = parent.nodes;

      // Words
    } else {
      next = pos;
      do {
        if (code === backslash) {
          next += 1;
        }
        next += 1;
        code = value.charCodeAt(next);
      } while (
        next < max &&
        !(
          code <= 32 ||
          code === singleQuote ||
          code === doubleQuote ||
          code === comma ||
          code === colon ||
          code === slash ||
          code === openParentheses ||
          (code === star &&
            parent &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === slash &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === closeParentheses && balanced)
        )
      );
      token = value.slice(pos, next);

      if (openParentheses === code) {
        name = token;
      } else if (
        (uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) &&
        plus === token.charCodeAt(1) &&
        isUnicodeRange.test(token.slice(2))
      ) {
        tokens.push({
          type: "unicode-range",
          sourceIndex: pos,
          value: token
        });
      } else {
        tokens.push({
          type: "word",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;
    }
  }

  for (pos = stack.length - 1; pos; pos -= 1) {
    stack[pos].unclosed = true;
  }

  return stack[0].nodes;
};


/***/ }),

/***/ 63:
/***/ ((module) => {

function stringifyNode(node, custom) {
  var type = node.type;
  var value = node.value;
  var buf;
  var customResult;

  if (custom && (customResult = custom(node)) !== undefined) {
    return customResult;
  } else if (type === "word" || type === "space") {
    return value;
  } else if (type === "string") {
    buf = node.quote || "";
    return buf + value + (node.unclosed ? "" : buf);
  } else if (type === "comment") {
    return "/*" + value + (node.unclosed ? "" : "*/");
  } else if (type === "div") {
    return (node.before || "") + value + (node.after || "");
  } else if (Array.isArray(node.nodes)) {
    buf = stringify(node.nodes, custom);
    if (type !== "function") {
      return buf;
    }
    return (
      value +
      "(" +
      (node.before || "") +
      buf +
      (node.after || "") +
      (node.unclosed ? "" : ")")
    );
  }
  return value;
}

function stringify(nodes, custom) {
  var result, i;

  if (Array.isArray(nodes)) {
    result = "";
    for (i = nodes.length - 1; ~i; i -= 1) {
      result = stringifyNode(nodes[i], custom) + result;
    }
    return result;
  }
  return stringifyNode(nodes, custom);
}

module.exports = stringify;


/***/ }),

/***/ 882:
/***/ ((module) => {

var minus = "-".charCodeAt(0);
var plus = "+".charCodeAt(0);
var dot = ".".charCodeAt(0);
var exp = "e".charCodeAt(0);
var EXP = "E".charCodeAt(0);

// Check if three code points would start a number
// https://www.w3.org/TR/css-syntax-3/#starts-with-a-number
function likeNumber(value) {
  var code = value.charCodeAt(0);
  var nextCode;

  if (code === plus || code === minus) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    var nextNextCode = value.charCodeAt(2);

    if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code === dot) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code >= 48 && code <= 57) {
    return true;
  }

  return false;
}

// Consume a number
// https://www.w3.org/TR/css-syntax-3/#consume-number
module.exports = function(value) {
  var pos = 0;
  var length = value.length;
  var code;
  var nextCode;
  var nextNextCode;

  if (length === 0 || !likeNumber(value)) {
    return false;
  }

  code = value.charCodeAt(pos);

  if (code === plus || code === minus) {
    pos++;
  }

  while (pos < length) {
    code = value.charCodeAt(pos);

    if (code < 48 || code > 57) {
      break;
    }

    pos += 1;
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);

  if (code === dot && nextCode >= 48 && nextCode <= 57) {
    pos += 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);
  nextNextCode = value.charCodeAt(pos + 2);

  if (
    (code === exp || code === EXP) &&
    ((nextCode >= 48 && nextCode <= 57) ||
      ((nextCode === plus || nextCode === minus) &&
        nextNextCode >= 48 &&
        nextNextCode <= 57))
  ) {
    pos += nextCode === plus || nextCode === minus ? 3 : 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  return {
    number: value.slice(0, pos),
    unit: value.slice(pos)
  };
};


/***/ }),

/***/ 449:
/***/ ((module) => {

module.exports = function walk(nodes, cb, bubble) {
  var i, max, node, result;

  for (i = 0, max = nodes.length; i < max; i += 1) {
    node = nodes[i];
    if (!bubble) {
      result = cb(node, i, nodes);
    }

    if (
      result !== false &&
      node.type === "function" &&
      Array.isArray(node.nodes)
    ) {
      walk(node.nodes, cb, bubble);
    }

    if (bubble) {
      cb(node, i, nodes);
    }
  }
};


/***/ }),

/***/ 396:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Container = __webpack_require__(793)

class AtRule extends Container {
  constructor(defaults) {
    super(defaults)
    this.type = 'atrule'
  }

  append(...children) {
    if (!this.proxyOf.nodes) this.nodes = []
    return super.append(...children)
  }

  prepend(...children) {
    if (!this.proxyOf.nodes) this.nodes = []
    return super.prepend(...children)
  }
}

module.exports = AtRule
AtRule.default = AtRule

Container.registerAtRule(AtRule)


/***/ }),

/***/ 371:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Node = __webpack_require__(152)

class Comment extends Node {
  constructor(defaults) {
    super(defaults)
    this.type = 'comment'
  }
}

module.exports = Comment
Comment.default = Comment


/***/ }),

/***/ 793:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { isClean, my } = __webpack_require__(151)
let Declaration = __webpack_require__(238)
let Comment = __webpack_require__(371)
let Node = __webpack_require__(152)

let parse, Rule, AtRule

function cleanSource(nodes) {
  return nodes.map(i => {
    if (i.nodes) i.nodes = cleanSource(i.nodes)
    delete i.source
    return i
  })
}

function markDirtyUp(node) {
  node[isClean] = false
  if (node.proxyOf.nodes) {
    for (let i of node.proxyOf.nodes) {
      markDirtyUp(i)
    }
  }
}

class Container extends Node {
  push(child) {
    child.parent = this
    this.proxyOf.nodes.push(child)
    return this
  }

  each(callback) {
    if (!this.proxyOf.nodes) return undefined
    let iterator = this.getIterator()

    let index, result
    while (this.indexes[iterator] < this.proxyOf.nodes.length) {
      index = this.indexes[iterator]
      result = callback(this.proxyOf.nodes[index], index)
      if (result === false) break

      this.indexes[iterator] += 1
    }

    delete this.indexes[iterator]
    return result
  }

  walk(callback) {
    return this.each((child, i) => {
      let result
      try {
        result = callback(child, i)
      } catch (e) {
        throw child.addToError(e)
      }
      if (result !== false && child.walk) {
        result = child.walk(callback)
      }

      return result
    })
  }

  walkDecls(prop, callback) {
    if (!callback) {
      callback = prop
      return this.walk((child, i) => {
        if (child.type === 'decl') {
          return callback(child, i)
        }
      })
    }
    if (prop instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === 'decl' && prop.test(child.prop)) {
          return callback(child, i)
        }
      })
    }
    return this.walk((child, i) => {
      if (child.type === 'decl' && child.prop === prop) {
        return callback(child, i)
      }
    })
  }

  walkRules(selector, callback) {
    if (!callback) {
      callback = selector

      return this.walk((child, i) => {
        if (child.type === 'rule') {
          return callback(child, i)
        }
      })
    }
    if (selector instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === 'rule' && selector.test(child.selector)) {
          return callback(child, i)
        }
      })
    }
    return this.walk((child, i) => {
      if (child.type === 'rule' && child.selector === selector) {
        return callback(child, i)
      }
    })
  }

  walkAtRules(name, callback) {
    if (!callback) {
      callback = name
      return this.walk((child, i) => {
        if (child.type === 'atrule') {
          return callback(child, i)
        }
      })
    }
    if (name instanceof RegExp) {
      return this.walk((child, i) => {
        if (child.type === 'atrule' && name.test(child.name)) {
          return callback(child, i)
        }
      })
    }
    return this.walk((child, i) => {
      if (child.type === 'atrule' && child.name === name) {
        return callback(child, i)
      }
    })
  }

  walkComments(callback) {
    return this.walk((child, i) => {
      if (child.type === 'comment') {
        return callback(child, i)
      }
    })
  }

  append(...children) {
    for (let child of children) {
      let nodes = this.normalize(child, this.last)
      for (let node of nodes) this.proxyOf.nodes.push(node)
    }

    this.markDirty()

    return this
  }

  prepend(...children) {
    children = children.reverse()
    for (let child of children) {
      let nodes = this.normalize(child, this.first, 'prepend').reverse()
      for (let node of nodes) this.proxyOf.nodes.unshift(node)
      for (let id in this.indexes) {
        this.indexes[id] = this.indexes[id] + nodes.length
      }
    }

    this.markDirty()

    return this
  }

  cleanRaws(keepBetween) {
    super.cleanRaws(keepBetween)
    if (this.nodes) {
      for (let node of this.nodes) node.cleanRaws(keepBetween)
    }
  }

  insertBefore(exist, add) {
    exist = this.index(exist)

    let type = exist === 0 ? 'prepend' : false
    let nodes = this.normalize(add, this.proxyOf.nodes[exist], type).reverse()
    for (let node of nodes) this.proxyOf.nodes.splice(exist, 0, node)

    let index
    for (let id in this.indexes) {
      index = this.indexes[id]
      if (exist <= index) {
        this.indexes[id] = index + nodes.length
      }
    }

    this.markDirty()

    return this
  }

  insertAfter(exist, add) {
    exist = this.index(exist)

    let nodes = this.normalize(add, this.proxyOf.nodes[exist]).reverse()
    for (let node of nodes) this.proxyOf.nodes.splice(exist + 1, 0, node)

    let index
    for (let id in this.indexes) {
      index = this.indexes[id]
      if (exist < index) {
        this.indexes[id] = index + nodes.length
      }
    }

    this.markDirty()

    return this
  }

  removeChild(child) {
    child = this.index(child)
    this.proxyOf.nodes[child].parent = undefined
    this.proxyOf.nodes.splice(child, 1)

    let index
    for (let id in this.indexes) {
      index = this.indexes[id]
      if (index >= child) {
        this.indexes[id] = index - 1
      }
    }

    this.markDirty()

    return this
  }

  removeAll() {
    for (let node of this.proxyOf.nodes) node.parent = undefined
    this.proxyOf.nodes = []

    this.markDirty()

    return this
  }

  replaceValues(pattern, opts, callback) {
    if (!callback) {
      callback = opts
      opts = {}
    }

    this.walkDecls(decl => {
      if (opts.props && !opts.props.includes(decl.prop)) return
      if (opts.fast && !decl.value.includes(opts.fast)) return

      decl.value = decl.value.replace(pattern, callback)
    })

    this.markDirty()

    return this
  }

  every(condition) {
    return this.nodes.every(condition)
  }

  some(condition) {
    return this.nodes.some(condition)
  }

  index(child) {
    if (typeof child === 'number') return child
    if (child.proxyOf) child = child.proxyOf
    return this.proxyOf.nodes.indexOf(child)
  }

  get first() {
    if (!this.proxyOf.nodes) return undefined
    return this.proxyOf.nodes[0]
  }

  get last() {
    if (!this.proxyOf.nodes) return undefined
    return this.proxyOf.nodes[this.proxyOf.nodes.length - 1]
  }

  normalize(nodes, sample) {
    if (typeof nodes === 'string') {
      nodes = cleanSource(parse(nodes).nodes)
    } else if (Array.isArray(nodes)) {
      nodes = nodes.slice(0)
      for (let i of nodes) {
        if (i.parent) i.parent.removeChild(i, 'ignore')
      }
    } else if (nodes.type === 'root' && this.type !== 'document') {
      nodes = nodes.nodes.slice(0)
      for (let i of nodes) {
        if (i.parent) i.parent.removeChild(i, 'ignore')
      }
    } else if (nodes.type) {
      nodes = [nodes]
    } else if (nodes.prop) {
      if (typeof nodes.value === 'undefined') {
        throw new Error('Value field is missed in node creation')
      } else if (typeof nodes.value !== 'string') {
        nodes.value = String(nodes.value)
      }
      nodes = [new Declaration(nodes)]
    } else if (nodes.selector) {
      nodes = [new Rule(nodes)]
    } else if (nodes.name) {
      nodes = [new AtRule(nodes)]
    } else if (nodes.text) {
      nodes = [new Comment(nodes)]
    } else {
      throw new Error('Unknown node type in node creation')
    }

    let processed = nodes.map(i => {
      // istanbul ignore next
      if (!i[my]) Container.rebuild(i)
      i = i.proxyOf
      if (i.parent) i.parent.removeChild(i)
      if (i[isClean]) markDirtyUp(i)
      if (typeof i.raws.before === 'undefined') {
        if (sample && typeof sample.raws.before !== 'undefined') {
          i.raws.before = sample.raws.before.replace(/\S/g, '')
        }
      }
      i.parent = this
      return i
    })

    return processed
  }

  getProxyProcessor() {
    return {
      set(node, prop, value) {
        if (node[prop] === value) return true
        node[prop] = value
        if (prop === 'name' || prop === 'params' || prop === 'selector') {
          node.markDirty()
        }
        return true
      },

      get(node, prop) {
        if (prop === 'proxyOf') {
          return node
        } else if (!node[prop]) {
          return node[prop]
        } else if (
          prop === 'each' ||
          (typeof prop === 'string' && prop.startsWith('walk'))
        ) {
          return (...args) => {
            return node[prop](
              ...args.map(i => {
                if (typeof i === 'function') {
                  return (child, index) => i(child.toProxy(), index)
                } else {
                  return i
                }
              })
            )
          }
        } else if (prop === 'every' || prop === 'some') {
          return cb => {
            return node[prop]((child, ...other) =>
              cb(child.toProxy(), ...other)
            )
          }
        } else if (prop === 'root') {
          return () => node.root().toProxy()
        } else if (prop === 'nodes') {
          return node.nodes.map(i => i.toProxy())
        } else if (prop === 'first' || prop === 'last') {
          return node[prop].toProxy()
        } else {
          return node[prop]
        }
      }
    }
  }

  getIterator() {
    if (!this.lastEach) this.lastEach = 0
    if (!this.indexes) this.indexes = {}

    this.lastEach += 1
    let iterator = this.lastEach
    this.indexes[iterator] = 0

    return iterator
  }
}

Container.registerParse = dependant => {
  parse = dependant
}

Container.registerRule = dependant => {
  Rule = dependant
}

Container.registerAtRule = dependant => {
  AtRule = dependant
}

module.exports = Container
Container.default = Container

// istanbul ignore next
Container.rebuild = node => {
  if (node.type === 'atrule') {
    Object.setPrototypeOf(node, AtRule.prototype)
  } else if (node.type === 'rule') {
    Object.setPrototypeOf(node, Rule.prototype)
  } else if (node.type === 'decl') {
    Object.setPrototypeOf(node, Declaration.prototype)
  } else if (node.type === 'comment') {
    Object.setPrototypeOf(node, Comment.prototype)
  }

  node[my] = true

  if (node.nodes) {
    node.nodes.forEach(child => {
      Container.rebuild(child)
    })
  }
}


/***/ }),

/***/ 614:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { red, bold, gray, options: colorette } = __webpack_require__(539)

let terminalHighlight = __webpack_require__(746)

class CssSyntaxError extends Error {
  constructor(message, line, column, source, file, plugin) {
    super(message)
    this.name = 'CssSyntaxError'
    this.reason = message

    if (file) {
      this.file = file
    }
    if (source) {
      this.source = source
    }
    if (plugin) {
      this.plugin = plugin
    }
    if (typeof line !== 'undefined' && typeof column !== 'undefined') {
      this.line = line
      this.column = column
    }

    this.setMessage()

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CssSyntaxError)
    }
  }

  setMessage() {
    this.message = this.plugin ? this.plugin + ': ' : ''
    this.message += this.file ? this.file : '<css input>'
    if (typeof this.line !== 'undefined') {
      this.message += ':' + this.line + ':' + this.column
    }
    this.message += ': ' + this.reason
  }

  showSourceCode(color) {
    if (!this.source) return ''

    let css = this.source
    if (color == null) color = colorette.enabled
    if (terminalHighlight) {
      if (color) css = terminalHighlight(css)
    }

    let lines = css.split(/\r?\n/)
    let start = Math.max(this.line - 3, 0)
    let end = Math.min(this.line + 2, lines.length)

    let maxWidth = String(end).length

    let mark, aside
    if (color) {
      mark = text => bold(red(text))
      aside = text => gray(text)
    } else {
      mark = aside = str => str
    }

    return lines
      .slice(start, end)
      .map((line, index) => {
        let number = start + 1 + index
        let gutter = ' ' + (' ' + number).slice(-maxWidth) + ' | '
        if (number === this.line) {
          let spacing =
            aside(gutter.replace(/\d/g, ' ')) +
            line.slice(0, this.column - 1).replace(/[^\t]/g, ' ')
          return mark('>') + aside(gutter) + line + '\n ' + spacing + mark('^')
        }
        return ' ' + aside(gutter) + line
      })
      .join('\n')
  }

  toString() {
    let code = this.showSourceCode()
    if (code) {
      code = '\n\n' + code + '\n'
    }
    return this.name + ': ' + this.message + code
  }
}

module.exports = CssSyntaxError
CssSyntaxError.default = CssSyntaxError


/***/ }),

/***/ 238:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Node = __webpack_require__(152)

class Declaration extends Node {
  constructor(defaults) {
    if (
      defaults &&
      typeof defaults.value !== 'undefined' &&
      typeof defaults.value !== 'string'
    ) {
      defaults = { ...defaults, value: String(defaults.value) }
    }
    super(defaults)
    this.type = 'decl'
  }

  get variable() {
    return this.prop.startsWith('--') || this.prop[0] === '$'
  }
}

module.exports = Declaration
Declaration.default = Declaration


/***/ }),

/***/ 145:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Container = __webpack_require__(793)

let LazyResult, Processor

class Document extends Container {
  constructor(defaults) {
    // type needs to be passed to super, otherwise child roots won't be normalized correctly
    super({ type: 'document', ...defaults })

    if (!this.nodes) {
      this.nodes = []
    }
  }

  toResult(opts = {}) {
    let lazy = new LazyResult(new Processor(), this, opts)

    return lazy.stringify()
  }
}

Document.registerLazyResult = dependant => {
  LazyResult = dependant
}

Document.registerProcessor = dependant => {
  Processor = dependant
}

module.exports = Document
Document.default = Document


/***/ }),

/***/ 438:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Declaration = __webpack_require__(238)
let PreviousMap = __webpack_require__(878)
let Comment = __webpack_require__(371)
let AtRule = __webpack_require__(396)
let Input = __webpack_require__(106)
let Root = __webpack_require__(644)
let Rule = __webpack_require__(534)

function fromJSON(json, inputs) {
  if (Array.isArray(json)) return json.map(n => fromJSON(n))

  let { inputs: ownInputs, ...defaults } = json
  if (ownInputs) {
    inputs = []
    for (let input of ownInputs) {
      let inputHydrated = { ...input, __proto__: Input.prototype }
      if (inputHydrated.map) {
        inputHydrated.map = {
          ...inputHydrated.map,
          __proto__: PreviousMap.prototype
        }
      }
      inputs.push(inputHydrated)
    }
  }
  if (defaults.nodes) {
    defaults.nodes = json.nodes.map(n => fromJSON(n, inputs))
  }
  if (defaults.source) {
    let { inputId, ...source } = defaults.source
    defaults.source = source
    if (inputId != null) {
      defaults.source.input = inputs[inputId]
    }
  }
  if (defaults.type === 'root') {
    return new Root(defaults)
  } else if (defaults.type === 'decl') {
    return new Declaration(defaults)
  } else if (defaults.type === 'rule') {
    return new Rule(defaults)
  } else if (defaults.type === 'comment') {
    return new Comment(defaults)
  } else if (defaults.type === 'atrule') {
    return new AtRule(defaults)
  } else {
    throw new Error('Unknown node type: ' + json.type)
  }
}

module.exports = fromJSON
fromJSON.default = fromJSON


/***/ }),

/***/ 106:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { SourceMapConsumer, SourceMapGenerator } = __webpack_require__(866)
let { fileURLToPath, pathToFileURL } = __webpack_require__(739)
let { resolve, isAbsolute } = __webpack_require__(197)
let { nanoid } = __webpack_require__(463)

let terminalHighlight = __webpack_require__(746)
let CssSyntaxError = __webpack_require__(614)
let PreviousMap = __webpack_require__(878)

let fromOffsetCache = Symbol('fromOffsetCache')

let sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator)
let pathAvailable = Boolean(resolve && isAbsolute)

class Input {
  constructor(css, opts = {}) {
    if (
      css === null ||
      typeof css === 'undefined' ||
      (typeof css === 'object' && !css.toString)
    ) {
      throw new Error(`PostCSS received ${css} instead of CSS string`)
    }

    this.css = css.toString()

    if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
      this.hasBOM = true
      this.css = this.css.slice(1)
    } else {
      this.hasBOM = false
    }

    if (opts.from) {
      if (
        !pathAvailable ||
        /^\w+:\/\//.test(opts.from) ||
        isAbsolute(opts.from)
      ) {
        this.file = opts.from
      } else {
        this.file = resolve(opts.from)
      }
    }

    if (pathAvailable && sourceMapAvailable) {
      let map = new PreviousMap(this.css, opts)
      if (map.text) {
        this.map = map
        let file = map.consumer().file
        if (!this.file && file) this.file = this.mapResolve(file)
      }
    }

    if (!this.file) {
      this.id = '<input css ' + nanoid(6) + '>'
    }
    if (this.map) this.map.file = this.from
  }

  fromOffset(offset) {
    let lastLine, lineToIndex
    if (!this[fromOffsetCache]) {
      let lines = this.css.split('\n')
      lineToIndex = new Array(lines.length)
      let prevIndex = 0

      for (let i = 0, l = lines.length; i < l; i++) {
        lineToIndex[i] = prevIndex
        prevIndex += lines[i].length + 1
      }

      this[fromOffsetCache] = lineToIndex
    } else {
      lineToIndex = this[fromOffsetCache]
    }
    lastLine = lineToIndex[lineToIndex.length - 1]

    let min = 0
    if (offset >= lastLine) {
      min = lineToIndex.length - 1
    } else {
      let max = lineToIndex.length - 2
      let mid
      while (min < max) {
        mid = min + ((max - min) >> 1)
        if (offset < lineToIndex[mid]) {
          max = mid - 1
        } else if (offset >= lineToIndex[mid + 1]) {
          min = mid + 1
        } else {
          min = mid
          break
        }
      }
    }
    return {
      line: min + 1,
      col: offset - lineToIndex[min] + 1
    }
  }

  error(message, line, column, opts = {}) {
    let result
    if (!column) {
      let pos = this.fromOffset(line)
      line = pos.line
      column = pos.col
    }
    let origin = this.origin(line, column)
    if (origin) {
      result = new CssSyntaxError(
        message,
        origin.line,
        origin.column,
        origin.source,
        origin.file,
        opts.plugin
      )
    } else {
      result = new CssSyntaxError(
        message,
        line,
        column,
        this.css,
        this.file,
        opts.plugin
      )
    }

    result.input = { line, column, source: this.css }
    if (this.file) {
      if (pathToFileURL) {
        result.input.url = pathToFileURL(this.file).toString()
      }
      result.input.file = this.file
    }

    return result
  }

  origin(line, column) {
    if (!this.map) return false
    let consumer = this.map.consumer()

    let from = consumer.originalPositionFor({ line, column })
    if (!from.source) return false

    let fromUrl

    if (isAbsolute(from.source)) {
      fromUrl = pathToFileURL(from.source)
    } else {
      fromUrl = new URL(
        from.source,
        this.map.consumer().sourceRoot || pathToFileURL(this.map.mapFile)
      )
    }

    let result = {
      url: fromUrl.toString(),
      line: from.line,
      column: from.column
    }

    if (fromUrl.protocol === 'file:') {
      if (fileURLToPath) {
        result.file = fileURLToPath(fromUrl)
      } else {
        // istanbul ignore next
        throw new Error(`file: protocol is not available in this PostCSS build`)
      }
    }

    let source = consumer.sourceContentFor(from.source)
    if (source) result.source = source

    return result
  }

  mapResolve(file) {
    if (/^\w+:\/\//.test(file)) {
      return file
    }
    return resolve(this.map.consumer().sourceRoot || this.map.root || '.', file)
  }

  get from() {
    return this.file || this.id
  }

  toJSON() {
    let json = {}
    for (let name of ['hasBOM', 'css', 'file', 'id']) {
      if (this[name] != null) {
        json[name] = this[name]
      }
    }
    if (this.map) {
      json.map = { ...this.map }
      if (json.map.consumerCache) {
        json.map.consumerCache = undefined
      }
    }
    return json
  }
}

module.exports = Input
Input.default = Input

if (terminalHighlight && terminalHighlight.registerInput) {
  terminalHighlight.registerInput(Input)
}


/***/ }),

/***/ 966:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { isClean, my } = __webpack_require__(151)
let MapGenerator = __webpack_require__(604)
let stringify = __webpack_require__(303)
let Container = __webpack_require__(793)
let Document = __webpack_require__(145)
let warnOnce = __webpack_require__(156)
let Result = __webpack_require__(717)
let parse = __webpack_require__(577)
let Root = __webpack_require__(644)

const TYPE_TO_CLASS_NAME = {
  document: 'Document',
  root: 'Root',
  atrule: 'AtRule',
  rule: 'Rule',
  decl: 'Declaration',
  comment: 'Comment'
}

const PLUGIN_PROPS = {
  postcssPlugin: true,
  prepare: true,
  Once: true,
  Document: true,
  Root: true,
  Declaration: true,
  Rule: true,
  AtRule: true,
  Comment: true,
  DeclarationExit: true,
  RuleExit: true,
  AtRuleExit: true,
  CommentExit: true,
  RootExit: true,
  DocumentExit: true,
  OnceExit: true
}

const NOT_VISITORS = {
  postcssPlugin: true,
  prepare: true,
  Once: true
}

const CHILDREN = 0

function isPromise(obj) {
  return typeof obj === 'object' && typeof obj.then === 'function'
}

function getEvents(node) {
  let key = false
  let type = TYPE_TO_CLASS_NAME[node.type]
  if (node.type === 'decl') {
    key = node.prop.toLowerCase()
  } else if (node.type === 'atrule') {
    key = node.name.toLowerCase()
  }

  if (key && node.append) {
    return [
      type,
      type + '-' + key,
      CHILDREN,
      type + 'Exit',
      type + 'Exit-' + key
    ]
  } else if (key) {
    return [type, type + '-' + key, type + 'Exit', type + 'Exit-' + key]
  } else if (node.append) {
    return [type, CHILDREN, type + 'Exit']
  } else {
    return [type, type + 'Exit']
  }
}

function toStack(node) {
  let events
  if (node.type === 'document') {
    events = ['Document', CHILDREN, 'DocumentExit']
  } else if (node.type === 'root') {
    events = ['Root', CHILDREN, 'RootExit']
  } else {
    events = getEvents(node)
  }

  return {
    node,
    events,
    eventIndex: 0,
    visitors: [],
    visitorIndex: 0,
    iterator: 0
  }
}

function cleanMarks(node) {
  node[isClean] = false
  if (node.nodes) node.nodes.forEach(i => cleanMarks(i))
  return node
}

let postcss = {}

class LazyResult {
  constructor(processor, css, opts) {
    this.stringified = false
    this.processed = false

    let root
    if (
      typeof css === 'object' &&
      css !== null &&
      (css.type === 'root' || css.type === 'document')
    ) {
      root = cleanMarks(css)
    } else if (css instanceof LazyResult || css instanceof Result) {
      root = cleanMarks(css.root)
      if (css.map) {
        if (typeof opts.map === 'undefined') opts.map = {}
        if (!opts.map.inline) opts.map.inline = false
        opts.map.prev = css.map
      }
    } else {
      let parser = parse
      if (opts.syntax) parser = opts.syntax.parse
      if (opts.parser) parser = opts.parser
      if (parser.parse) parser = parser.parse

      try {
        root = parser(css, opts)
      } catch (error) {
        this.processed = true
        this.error = error
      }

      if (root && !root[my]) {
        // istanbul ignore next
        Container.rebuild(root)
      }
    }

    this.result = new Result(processor, root, opts)
    this.helpers = { ...postcss, result: this.result, postcss }
    this.plugins = this.processor.plugins.map(plugin => {
      if (typeof plugin === 'object' && plugin.prepare) {
        return { ...plugin, ...plugin.prepare(this.result) }
      } else {
        return plugin
      }
    })
  }

  get [Symbol.toStringTag]() {
    return 'LazyResult'
  }

  get processor() {
    return this.result.processor
  }

  get opts() {
    return this.result.opts
  }

  get css() {
    return this.stringify().css
  }

  get content() {
    return this.stringify().content
  }

  get map() {
    return this.stringify().map
  }

  get root() {
    return this.sync().root
  }

  get messages() {
    return this.sync().messages
  }

  warnings() {
    return this.sync().warnings()
  }

  toString() {
    return this.css
  }

  then(onFulfilled, onRejected) {
    if (false) {}
    return this.async().then(onFulfilled, onRejected)
  }

  catch(onRejected) {
    return this.async().catch(onRejected)
  }

  finally(onFinally) {
    return this.async().then(onFinally, onFinally)
  }

  async() {
    if (this.error) return Promise.reject(this.error)
    if (this.processed) return Promise.resolve(this.result)
    if (!this.processing) {
      this.processing = this.runAsync()
    }
    return this.processing
  }

  sync() {
    if (this.error) throw this.error
    if (this.processed) return this.result
    this.processed = true

    if (this.processing) {
      throw this.getAsyncError()
    }

    for (let plugin of this.plugins) {
      let promise = this.runOnRoot(plugin)
      if (isPromise(promise)) {
        throw this.getAsyncError()
      }
    }

    this.prepareVisitors()
    if (this.hasListener) {
      let root = this.result.root
      while (!root[isClean]) {
        root[isClean] = true
        this.walkSync(root)
      }
      if (this.listeners.OnceExit) {
        if (root.type === 'document') {
          for (let subRoot of root.nodes) {
            this.visitSync(this.listeners.OnceExit, subRoot)
          }
        } else {
          this.visitSync(this.listeners.OnceExit, root)
        }
      }
    }

    return this.result
  }

  stringify() {
    if (this.error) throw this.error
    if (this.stringified) return this.result
    this.stringified = true

    this.sync()

    let opts = this.result.opts
    let str = stringify
    if (opts.syntax) str = opts.syntax.stringify
    if (opts.stringifier) str = opts.stringifier
    if (str.stringify) str = str.stringify

    let map = new MapGenerator(str, this.result.root, this.result.opts)
    let data = map.generate()
    this.result.css = data[0]
    this.result.map = data[1]

    return this.result
  }

  walkSync(node) {
    node[isClean] = true
    let events = getEvents(node)
    for (let event of events) {
      if (event === CHILDREN) {
        if (node.nodes) {
          node.each(child => {
            if (!child[isClean]) this.walkSync(child)
          })
        }
      } else {
        let visitors = this.listeners[event]
        if (visitors) {
          if (this.visitSync(visitors, node.toProxy())) return
        }
      }
    }
  }

  visitSync(visitors, node) {
    for (let [plugin, visitor] of visitors) {
      this.result.lastPlugin = plugin
      let promise
      try {
        promise = visitor(node, this.helpers)
      } catch (e) {
        throw this.handleError(e, node.proxyOf)
      }
      if (node.type !== 'root' && node.type !== 'document' && !node.parent) {
        return true
      }
      if (isPromise(promise)) {
        throw this.getAsyncError()
      }
    }
  }

  runOnRoot(plugin) {
    this.result.lastPlugin = plugin
    try {
      if (typeof plugin === 'object' && plugin.Once) {
        if (this.result.root.type === 'document') {
          let roots = this.result.root.nodes.map(root =>
            plugin.Once(root, this.helpers)
          )

          if (isPromise(roots[0])) {
            return Promise.all(roots)
          }

          return roots
        }

        return plugin.Once(this.result.root, this.helpers)
      } else if (typeof plugin === 'function') {
        return plugin(this.result.root, this.result)
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  getAsyncError() {
    throw new Error('Use process(css).then(cb) to work with async plugins')
  }

  handleError(error, node) {
    let plugin = this.result.lastPlugin
    try {
      if (node) node.addToError(error)
      this.error = error
      if (error.name === 'CssSyntaxError' && !error.plugin) {
        error.plugin = plugin.postcssPlugin
        error.setMessage()
      } else if (plugin.postcssVersion) {
        if (false) {}
      }
    } catch (err) {
      // istanbul ignore next
      if (console && console.error) console.error(err)
    }
    return error
  }

  async runAsync() {
    this.plugin = 0
    for (let i = 0; i < this.plugins.length; i++) {
      let plugin = this.plugins[i]
      let promise = this.runOnRoot(plugin)
      if (isPromise(promise)) {
        try {
          await promise
        } catch (error) {
          throw this.handleError(error)
        }
      }
    }

    this.prepareVisitors()
    if (this.hasListener) {
      let root = this.result.root
      while (!root[isClean]) {
        root[isClean] = true
        let stack = [toStack(root)]
        while (stack.length > 0) {
          let promise = this.visitTick(stack)
          if (isPromise(promise)) {
            try {
              await promise
            } catch (e) {
              let node = stack[stack.length - 1].node
              throw this.handleError(e, node)
            }
          }
        }
      }

      if (this.listeners.OnceExit) {
        for (let [plugin, visitor] of this.listeners.OnceExit) {
          this.result.lastPlugin = plugin
          try {
            if (root.type === 'document') {
              let roots = root.nodes.map(subRoot =>
                visitor(subRoot, this.helpers)
              )

              await Promise.all(roots)
            } else {
              await visitor(root, this.helpers)
            }
          } catch (e) {
            throw this.handleError(e)
          }
        }
      }
    }

    this.processed = true
    return this.stringify()
  }

  prepareVisitors() {
    this.listeners = {}
    let add = (plugin, type, cb) => {
      if (!this.listeners[type]) this.listeners[type] = []
      this.listeners[type].push([plugin, cb])
    }
    for (let plugin of this.plugins) {
      if (typeof plugin === 'object') {
        for (let event in plugin) {
          if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
            throw new Error(
              `Unknown event ${event} in ${plugin.postcssPlugin}. ` +
                `Try to update PostCSS (${this.processor.version} now).`
            )
          }
          if (!NOT_VISITORS[event]) {
            if (typeof plugin[event] === 'object') {
              for (let filter in plugin[event]) {
                if (filter === '*') {
                  add(plugin, event, plugin[event][filter])
                } else {
                  add(
                    plugin,
                    event + '-' + filter.toLowerCase(),
                    plugin[event][filter]
                  )
                }
              }
            } else if (typeof plugin[event] === 'function') {
              add(plugin, event, plugin[event])
            }
          }
        }
      }
    }
    this.hasListener = Object.keys(this.listeners).length > 0
  }

  visitTick(stack) {
    let visit = stack[stack.length - 1]
    let { node, visitors } = visit

    if (node.type !== 'root' && node.type !== 'document' && !node.parent) {
      stack.pop()
      return
    }

    if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
      let [plugin, visitor] = visitors[visit.visitorIndex]
      visit.visitorIndex += 1
      if (visit.visitorIndex === visitors.length) {
        visit.visitors = []
        visit.visitorIndex = 0
      }
      this.result.lastPlugin = plugin
      try {
        return visitor(node.toProxy(), this.helpers)
      } catch (e) {
        throw this.handleError(e, node)
      }
    }

    if (visit.iterator !== 0) {
      let iterator = visit.iterator
      let child
      while ((child = node.nodes[node.indexes[iterator]])) {
        node.indexes[iterator] += 1
        if (!child[isClean]) {
          child[isClean] = true
          stack.push(toStack(child))
          return
        }
      }
      visit.iterator = 0
      delete node.indexes[iterator]
    }

    let events = visit.events
    while (visit.eventIndex < events.length) {
      let event = events[visit.eventIndex]
      visit.eventIndex += 1
      if (event === CHILDREN) {
        if (node.nodes && node.nodes.length) {
          node[isClean] = true
          visit.iterator = node.getIterator()
        }
        return
      } else if (this.listeners[event]) {
        visit.visitors = this.listeners[event]
        return
      }
    }
    stack.pop()
  }
}

LazyResult.registerPostcss = dependant => {
  postcss = dependant
}

module.exports = LazyResult
LazyResult.default = LazyResult

Root.registerLazyResult(LazyResult)
Document.registerLazyResult(LazyResult)


/***/ }),

/***/ 752:
/***/ ((module) => {

"use strict";


let list = {
  split(string, separators, last) {
    let array = []
    let current = ''
    let split = false

    let func = 0
    let quote = false
    let escape = false

    for (let letter of string) {
      if (escape) {
        escape = false
      } else if (letter === '\\') {
        escape = true
      } else if (quote) {
        if (letter === quote) {
          quote = false
        }
      } else if (letter === '"' || letter === "'") {
        quote = letter
      } else if (letter === '(') {
        func += 1
      } else if (letter === ')') {
        if (func > 0) func -= 1
      } else if (func === 0) {
        if (separators.includes(letter)) split = true
      }

      if (split) {
        if (current !== '') array.push(current.trim())
        current = ''
        split = false
      } else {
        current += letter
      }
    }

    if (last || current !== '') array.push(current.trim())
    return array
  },

  space(string) {
    let spaces = [' ', '\n', '\t']
    return list.split(string, spaces)
  },

  comma(string) {
    return list.split(string, [','], true)
  }
}

module.exports = list
list.default = list


/***/ }),

/***/ 604:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { SourceMapConsumer, SourceMapGenerator } = __webpack_require__(866)
let { dirname, resolve, relative, sep } = __webpack_require__(197)
let { pathToFileURL } = __webpack_require__(739)

let sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator)
let pathAvailable = Boolean(dirname && resolve && relative && sep)

class MapGenerator {
  constructor(stringify, root, opts) {
    this.stringify = stringify
    this.mapOpts = opts.map || {}
    this.root = root
    this.opts = opts
  }

  isMap() {
    if (typeof this.opts.map !== 'undefined') {
      return !!this.opts.map
    }
    return this.previous().length > 0
  }

  previous() {
    if (!this.previousMaps) {
      this.previousMaps = []
      this.root.walk(node => {
        if (node.source && node.source.input.map) {
          let map = node.source.input.map
          if (!this.previousMaps.includes(map)) {
            this.previousMaps.push(map)
          }
        }
      })
    }

    return this.previousMaps
  }

  isInline() {
    if (typeof this.mapOpts.inline !== 'undefined') {
      return this.mapOpts.inline
    }

    let annotation = this.mapOpts.annotation
    if (typeof annotation !== 'undefined' && annotation !== true) {
      return false
    }

    if (this.previous().length) {
      return this.previous().some(i => i.inline)
    }
    return true
  }

  isSourcesContent() {
    if (typeof this.mapOpts.sourcesContent !== 'undefined') {
      return this.mapOpts.sourcesContent
    }
    if (this.previous().length) {
      return this.previous().some(i => i.withContent())
    }
    return true
  }

  clearAnnotation() {
    if (this.mapOpts.annotation === false) return

    let node
    for (let i = this.root.nodes.length - 1; i >= 0; i--) {
      node = this.root.nodes[i]
      if (node.type !== 'comment') continue
      if (node.text.indexOf('# sourceMappingURL=') === 0) {
        this.root.removeChild(i)
      }
    }
  }

  setSourcesContent() {
    let already = {}
    this.root.walk(node => {
      if (node.source) {
        let from = node.source.input.from
        if (from && !already[from]) {
          already[from] = true
          this.map.setSourceContent(
            this.toUrl(this.path(from)),
            node.source.input.css
          )
        }
      }
    })
  }

  applyPrevMaps() {
    for (let prev of this.previous()) {
      let from = this.toUrl(this.path(prev.file))
      let root = prev.root || dirname(prev.file)
      let map

      if (this.mapOpts.sourcesContent === false) {
        map = new SourceMapConsumer(prev.text)
        if (map.sourcesContent) {
          map.sourcesContent = map.sourcesContent.map(() => null)
        }
      } else {
        map = prev.consumer()
      }

      this.map.applySourceMap(map, from, this.toUrl(this.path(root)))
    }
  }

  isAnnotation() {
    if (this.isInline()) {
      return true
    }
    if (typeof this.mapOpts.annotation !== 'undefined') {
      return this.mapOpts.annotation
    }
    if (this.previous().length) {
      return this.previous().some(i => i.annotation)
    }
    return true
  }

  toBase64(str) {
    if (Buffer) {
      return Buffer.from(str).toString('base64')
    } else {
      // istanbul ignore next
      return window.btoa(unescape(encodeURIComponent(str)))
    }
  }

  addAnnotation() {
    let content

    if (this.isInline()) {
      content =
        'data:application/json;base64,' + this.toBase64(this.map.toString())
    } else if (typeof this.mapOpts.annotation === 'string') {
      content = this.mapOpts.annotation
    } else if (typeof this.mapOpts.annotation === 'function') {
      content = this.mapOpts.annotation(this.opts.to, this.root)
    } else {
      content = this.outputFile() + '.map'
    }

    let eol = '\n'
    if (this.css.includes('\r\n')) eol = '\r\n'

    this.css += eol + '/*# sourceMappingURL=' + content + ' */'
  }

  outputFile() {
    if (this.opts.to) {
      return this.path(this.opts.to)
    }
    if (this.opts.from) {
      return this.path(this.opts.from)
    }
    return 'to.css'
  }

  generateMap() {
    this.generateString()
    if (this.isSourcesContent()) this.setSourcesContent()
    if (this.previous().length > 0) this.applyPrevMaps()
    if (this.isAnnotation()) this.addAnnotation()

    if (this.isInline()) {
      return [this.css]
    }
    return [this.css, this.map]
  }

  path(file) {
    if (file.indexOf('<') === 0) return file
    if (/^\w+:\/\//.test(file)) return file
    if (this.mapOpts.absolute) return file

    let from = this.opts.to ? dirname(this.opts.to) : '.'

    if (typeof this.mapOpts.annotation === 'string') {
      from = dirname(resolve(from, this.mapOpts.annotation))
    }

    file = relative(from, file)
    return file
  }

  toUrl(path) {
    if (sep === '\\') {
      // istanbul ignore next
      path = path.replace(/\\/g, '/')
    }
    return encodeURI(path).replace(/[#?]/g, encodeURIComponent)
  }

  sourcePath(node) {
    if (this.mapOpts.from) {
      return this.toUrl(this.mapOpts.from)
    } else if (this.mapOpts.absolute) {
      if (pathToFileURL) {
        return pathToFileURL(node.source.input.from).toString()
      } else {
        // istanbul ignore next
        throw new Error(
          '`map.absolute` option is not available in this PostCSS build'
        )
      }
    } else {
      return this.toUrl(this.path(node.source.input.from))
    }
  }

  generateString() {
    this.css = ''
    this.map = new SourceMapGenerator({ file: this.outputFile() })

    let line = 1
    let column = 1

    let noSource = '<no source>'
    let mapping = {
      source: '',
      generated: { line: 0, column: 0 },
      original: { line: 0, column: 0 }
    }

    let lines, last
    this.stringify(this.root, (str, node, type) => {
      this.css += str

      if (node && type !== 'end') {
        mapping.generated.line = line
        mapping.generated.column = column - 1
        if (node.source && node.source.start) {
          mapping.source = this.sourcePath(node)
          mapping.original.line = node.source.start.line
          mapping.original.column = node.source.start.column - 1
          this.map.addMapping(mapping)
        } else {
          mapping.source = noSource
          mapping.original.line = 1
          mapping.original.column = 0
          this.map.addMapping(mapping)
        }
      }

      lines = str.match(/\n/g)
      if (lines) {
        line += lines.length
        last = str.lastIndexOf('\n')
        column = str.length - last
      } else {
        column += str.length
      }

      if (node && type !== 'start') {
        let p = node.parent || { raws: {} }
        if (node.type !== 'decl' || node !== p.last || p.raws.semicolon) {
          if (node.source && node.source.end) {
            mapping.source = this.sourcePath(node)
            mapping.original.line = node.source.end.line
            mapping.original.column = node.source.end.column - 1
            mapping.generated.line = line
            mapping.generated.column = column - 2
            this.map.addMapping(mapping)
          } else {
            mapping.source = noSource
            mapping.original.line = 1
            mapping.original.column = 0
            mapping.generated.line = line
            mapping.generated.column = column - 1
            this.map.addMapping(mapping)
          }
        }
      }
    })
  }

  generate() {
    this.clearAnnotation()

    if (pathAvailable && sourceMapAvailable && this.isMap()) {
      return this.generateMap()
    }

    let result = ''
    this.stringify(this.root, i => {
      result += i
    })
    return [result]
  }
}

module.exports = MapGenerator


/***/ }),

/***/ 152:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { isClean, my } = __webpack_require__(151)
let CssSyntaxError = __webpack_require__(614)
let Stringifier = __webpack_require__(668)
let stringify = __webpack_require__(303)

function cloneNode(obj, parent) {
  let cloned = new obj.constructor()

  for (let i in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, i)) {
      // istanbul ignore next
      continue
    }
    if (i === 'proxyCache') continue
    let value = obj[i]
    let type = typeof value

    if (i === 'parent' && type === 'object') {
      if (parent) cloned[i] = parent
    } else if (i === 'source') {
      cloned[i] = value
    } else if (Array.isArray(value)) {
      cloned[i] = value.map(j => cloneNode(j, cloned))
    } else {
      if (type === 'object' && value !== null) value = cloneNode(value)
      cloned[i] = value
    }
  }

  return cloned
}

class Node {
  constructor(defaults = {}) {
    this.raws = {}
    this[isClean] = false
    this[my] = true

    for (let name in defaults) {
      if (name === 'nodes') {
        this.nodes = []
        for (let node of defaults[name]) {
          if (typeof node.clone === 'function') {
            this.append(node.clone())
          } else {
            this.append(node)
          }
        }
      } else {
        this[name] = defaults[name]
      }
    }
  }

  error(message, opts = {}) {
    if (this.source) {
      let pos = this.positionBy(opts)
      return this.source.input.error(message, pos.line, pos.column, opts)
    }
    return new CssSyntaxError(message)
  }

  warn(result, text, opts) {
    let data = { node: this }
    for (let i in opts) data[i] = opts[i]
    return result.warn(text, data)
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this)
    }
    this.parent = undefined
    return this
  }

  toString(stringifier = stringify) {
    if (stringifier.stringify) stringifier = stringifier.stringify
    let result = ''
    stringifier(this, i => {
      result += i
    })
    return result
  }

  assign(overrides = {}) {
    for (let name in overrides) {
      this[name] = overrides[name]
    }
    return this
  }

  clone(overrides = {}) {
    let cloned = cloneNode(this)
    for (let name in overrides) {
      cloned[name] = overrides[name]
    }
    return cloned
  }

  cloneBefore(overrides = {}) {
    let cloned = this.clone(overrides)
    this.parent.insertBefore(this, cloned)
    return cloned
  }

  cloneAfter(overrides = {}) {
    let cloned = this.clone(overrides)
    this.parent.insertAfter(this, cloned)
    return cloned
  }

  replaceWith(...nodes) {
    if (this.parent) {
      let bookmark = this
      let foundSelf = false
      for (let node of nodes) {
        if (node === this) {
          foundSelf = true
        } else if (foundSelf) {
          this.parent.insertAfter(bookmark, node)
          bookmark = node
        } else {
          this.parent.insertBefore(bookmark, node)
        }
      }

      if (!foundSelf) {
        this.remove()
      }
    }

    return this
  }

  next() {
    if (!this.parent) return undefined
    let index = this.parent.index(this)
    return this.parent.nodes[index + 1]
  }

  prev() {
    if (!this.parent) return undefined
    let index = this.parent.index(this)
    return this.parent.nodes[index - 1]
  }

  before(add) {
    this.parent.insertBefore(this, add)
    return this
  }

  after(add) {
    this.parent.insertAfter(this, add)
    return this
  }

  root() {
    let result = this
    while (result.parent && result.parent.type !== 'document') {
      result = result.parent
    }
    return result
  }

  raw(prop, defaultType) {
    let str = new Stringifier()
    return str.raw(this, prop, defaultType)
  }

  cleanRaws(keepBetween) {
    delete this.raws.before
    delete this.raws.after
    if (!keepBetween) delete this.raws.between
  }

  toJSON(_, inputs) {
    let fixed = {}
    let emitInputs = inputs == null
    inputs = inputs || new Map()
    let inputsNextIndex = 0

    for (let name in this) {
      if (!Object.prototype.hasOwnProperty.call(this, name)) {
        // istanbul ignore next
        continue
      }
      if (name === 'parent' || name === 'proxyCache') continue
      let value = this[name]

      if (Array.isArray(value)) {
        fixed[name] = value.map(i => {
          if (typeof i === 'object' && i.toJSON) {
            return i.toJSON(null, inputs)
          } else {
            return i
          }
        })
      } else if (typeof value === 'object' && value.toJSON) {
        fixed[name] = value.toJSON(null, inputs)
      } else if (name === 'source') {
        let inputId = inputs.get(value.input)
        if (inputId == null) {
          inputId = inputsNextIndex
          inputs.set(value.input, inputsNextIndex)
          inputsNextIndex++
        }
        fixed[name] = {
          inputId,
          start: value.start,
          end: value.end
        }
      } else {
        fixed[name] = value
      }
    }

    if (emitInputs) {
      fixed.inputs = [...inputs.keys()].map(input => input.toJSON())
    }

    return fixed
  }

  positionInside(index) {
    let string = this.toString()
    let column = this.source.start.column
    let line = this.source.start.line

    for (let i = 0; i < index; i++) {
      if (string[i] === '\n') {
        column = 1
        line += 1
      } else {
        column += 1
      }
    }

    return { line, column }
  }

  positionBy(opts) {
    let pos = this.source.start
    if (opts.index) {
      pos = this.positionInside(opts.index)
    } else if (opts.word) {
      let index = this.toString().indexOf(opts.word)
      if (index !== -1) pos = this.positionInside(index)
    }
    return pos
  }

  getProxyProcessor() {
    return {
      set(node, prop, value) {
        if (node[prop] === value) return true
        node[prop] = value
        if (
          prop === 'prop' ||
          prop === 'value' ||
          prop === 'name' ||
          prop === 'params' ||
          prop === 'important' ||
          prop === 'text'
        ) {
          node.markDirty()
        }
        return true
      },

      get(node, prop) {
        if (prop === 'proxyOf') {
          return node
        } else if (prop === 'root') {
          return () => node.root().toProxy()
        } else {
          return node[prop]
        }
      }
    }
  }

  toProxy() {
    if (!this.proxyCache) {
      this.proxyCache = new Proxy(this, this.getProxyProcessor())
    }
    return this.proxyCache
  }

  addToError(error) {
    error.postcssNode = this
    if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
      let s = this.source
      error.stack = error.stack.replace(
        /\n\s{4}at /,
        `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
      )
    }
    return error
  }

  markDirty() {
    if (this[isClean]) {
      this[isClean] = false
      let next = this
      while ((next = next.parent)) {
        next[isClean] = false
      }
    }
  }

  get proxyOf() {
    return this
  }
}

module.exports = Node
Node.default = Node


/***/ }),

/***/ 577:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Container = __webpack_require__(793)
let Parser = __webpack_require__(339)
let Input = __webpack_require__(106)

function parse(css, opts) {
  let input = new Input(css, opts)
  let parser = new Parser(input)
  try {
    parser.parse()
  } catch (e) {
    if (false) {}
    throw e
  }

  return parser.root
}

module.exports = parse
parse.default = parse

Container.registerParse(parse)


/***/ }),

/***/ 339:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Declaration = __webpack_require__(238)
let tokenizer = __webpack_require__(781)
let Comment = __webpack_require__(371)
let AtRule = __webpack_require__(396)
let Root = __webpack_require__(644)
let Rule = __webpack_require__(534)

class Parser {
  constructor(input) {
    this.input = input

    this.root = new Root()
    this.current = this.root
    this.spaces = ''
    this.semicolon = false
    this.customProperty = false

    this.createTokenizer()
    this.root.source = { input, start: { offset: 0, line: 1, column: 1 } }
  }

  createTokenizer() {
    this.tokenizer = tokenizer(this.input)
  }

  parse() {
    let token
    while (!this.tokenizer.endOfFile()) {
      token = this.tokenizer.nextToken()

      switch (token[0]) {
        case 'space':
          this.spaces += token[1]
          break

        case ';':
          this.freeSemicolon(token)
          break

        case '}':
          this.end(token)
          break

        case 'comment':
          this.comment(token)
          break

        case 'at-word':
          this.atrule(token)
          break

        case '{':
          this.emptyRule(token)
          break

        default:
          this.other(token)
          break
      }
    }
    this.endFile()
  }

  comment(token) {
    let node = new Comment()
    this.init(node, token[2])
    node.source.end = this.getPosition(token[3] || token[2])

    let text = token[1].slice(2, -2)
    if (/^\s*$/.test(text)) {
      node.text = ''
      node.raws.left = text
      node.raws.right = ''
    } else {
      let match = text.match(/^(\s*)([^]*\S)(\s*)$/)
      node.text = match[2]
      node.raws.left = match[1]
      node.raws.right = match[3]
    }
  }

  emptyRule(token) {
    let node = new Rule()
    this.init(node, token[2])
    node.selector = ''
    node.raws.between = ''
    this.current = node
  }

  other(start) {
    let end = false
    let type = null
    let colon = false
    let bracket = null
    let brackets = []
    let customProperty = start[1].startsWith('--')

    let tokens = []
    let token = start
    while (token) {
      type = token[0]
      tokens.push(token)

      if (type === '(' || type === '[') {
        if (!bracket) bracket = token
        brackets.push(type === '(' ? ')' : ']')
      } else if (customProperty && colon && type === '{') {
        if (!bracket) bracket = token
        brackets.push('}')
      } else if (brackets.length === 0) {
        if (type === ';') {
          if (colon) {
            this.decl(tokens, customProperty)
            return
          } else {
            break
          }
        } else if (type === '{') {
          this.rule(tokens)
          return
        } else if (type === '}') {
          this.tokenizer.back(tokens.pop())
          end = true
          break
        } else if (type === ':') {
          colon = true
        }
      } else if (type === brackets[brackets.length - 1]) {
        brackets.pop()
        if (brackets.length === 0) bracket = null
      }

      token = this.tokenizer.nextToken()
    }

    if (this.tokenizer.endOfFile()) end = true
    if (brackets.length > 0) this.unclosedBracket(bracket)

    if (end && colon) {
      while (tokens.length) {
        token = tokens[tokens.length - 1][0]
        if (token !== 'space' && token !== 'comment') break
        this.tokenizer.back(tokens.pop())
      }
      this.decl(tokens, customProperty)
    } else {
      this.unknownWord(tokens)
    }
  }

  rule(tokens) {
    tokens.pop()

    let node = new Rule()
    this.init(node, tokens[0][2])

    node.raws.between = this.spacesAndCommentsFromEnd(tokens)
    this.raw(node, 'selector', tokens)
    this.current = node
  }

  decl(tokens, customProperty) {
    let node = new Declaration()
    this.init(node, tokens[0][2])

    let last = tokens[tokens.length - 1]
    if (last[0] === ';') {
      this.semicolon = true
      tokens.pop()
    }
    node.source.end = this.getPosition(last[3] || last[2])

    while (tokens[0][0] !== 'word') {
      if (tokens.length === 1) this.unknownWord(tokens)
      node.raws.before += tokens.shift()[1]
    }
    node.source.start = this.getPosition(tokens[0][2])

    node.prop = ''
    while (tokens.length) {
      let type = tokens[0][0]
      if (type === ':' || type === 'space' || type === 'comment') {
        break
      }
      node.prop += tokens.shift()[1]
    }

    node.raws.between = ''

    let token
    while (tokens.length) {
      token = tokens.shift()

      if (token[0] === ':') {
        node.raws.between += token[1]
        break
      } else {
        if (token[0] === 'word' && /\w/.test(token[1])) {
          this.unknownWord([token])
        }
        node.raws.between += token[1]
      }
    }

    if (node.prop[0] === '_' || node.prop[0] === '*') {
      node.raws.before += node.prop[0]
      node.prop = node.prop.slice(1)
    }
    let firstSpaces = this.spacesAndCommentsFromStart(tokens)
    this.precheckMissedSemicolon(tokens)

    for (let i = tokens.length - 1; i >= 0; i--) {
      token = tokens[i]
      if (token[1].toLowerCase() === '!important') {
        node.important = true
        let string = this.stringFrom(tokens, i)
        string = this.spacesFromEnd(tokens) + string
        if (string !== ' !important') node.raws.important = string
        break
      } else if (token[1].toLowerCase() === 'important') {
        let cache = tokens.slice(0)
        let str = ''
        for (let j = i; j > 0; j--) {
          let type = cache[j][0]
          if (str.trim().indexOf('!') === 0 && type !== 'space') {
            break
          }
          str = cache.pop()[1] + str
        }
        if (str.trim().indexOf('!') === 0) {
          node.important = true
          node.raws.important = str
          tokens = cache
        }
      }

      if (token[0] !== 'space' && token[0] !== 'comment') {
        break
      }
    }

    let hasWord = tokens.some(i => i[0] !== 'space' && i[0] !== 'comment')
    this.raw(node, 'value', tokens)
    if (hasWord) {
      node.raws.between += firstSpaces
    } else {
      node.value = firstSpaces + node.value
    }

    if (node.value.includes(':') && !customProperty) {
      this.checkMissedSemicolon(tokens)
    }
  }

  atrule(token) {
    let node = new AtRule()
    node.name = token[1].slice(1)
    if (node.name === '') {
      this.unnamedAtrule(node, token)
    }
    this.init(node, token[2])

    let type
    let prev
    let shift
    let last = false
    let open = false
    let params = []
    let brackets = []

    while (!this.tokenizer.endOfFile()) {
      token = this.tokenizer.nextToken()
      type = token[0]

      if (type === '(' || type === '[') {
        brackets.push(type === '(' ? ')' : ']')
      } else if (type === '{' && brackets.length > 0) {
        brackets.push('}')
      } else if (type === brackets[brackets.length - 1]) {
        brackets.pop()
      }

      if (brackets.length === 0) {
        if (type === ';') {
          node.source.end = this.getPosition(token[2])
          this.semicolon = true
          break
        } else if (type === '{') {
          open = true
          break
        } else if (type === '}') {
          if (params.length > 0) {
            shift = params.length - 1
            prev = params[shift]
            while (prev && prev[0] === 'space') {
              prev = params[--shift]
            }
            if (prev) {
              node.source.end = this.getPosition(prev[3] || prev[2])
            }
          }
          this.end(token)
          break
        } else {
          params.push(token)
        }
      } else {
        params.push(token)
      }

      if (this.tokenizer.endOfFile()) {
        last = true
        break
      }
    }

    node.raws.between = this.spacesAndCommentsFromEnd(params)
    if (params.length) {
      node.raws.afterName = this.spacesAndCommentsFromStart(params)
      this.raw(node, 'params', params)
      if (last) {
        token = params[params.length - 1]
        node.source.end = this.getPosition(token[3] || token[2])
        this.spaces = node.raws.between
        node.raws.between = ''
      }
    } else {
      node.raws.afterName = ''
      node.params = ''
    }

    if (open) {
      node.nodes = []
      this.current = node
    }
  }

  end(token) {
    if (this.current.nodes && this.current.nodes.length) {
      this.current.raws.semicolon = this.semicolon
    }
    this.semicolon = false

    this.current.raws.after = (this.current.raws.after || '') + this.spaces
    this.spaces = ''

    if (this.current.parent) {
      this.current.source.end = this.getPosition(token[2])
      this.current = this.current.parent
    } else {
      this.unexpectedClose(token)
    }
  }

  endFile() {
    if (this.current.parent) this.unclosedBlock()
    if (this.current.nodes && this.current.nodes.length) {
      this.current.raws.semicolon = this.semicolon
    }
    this.current.raws.after = (this.current.raws.after || '') + this.spaces
  }

  freeSemicolon(token) {
    this.spaces += token[1]
    if (this.current.nodes) {
      let prev = this.current.nodes[this.current.nodes.length - 1]
      if (prev && prev.type === 'rule' && !prev.raws.ownSemicolon) {
        prev.raws.ownSemicolon = this.spaces
        this.spaces = ''
      }
    }
  }

  // Helpers

  getPosition(offset) {
    let pos = this.input.fromOffset(offset)
    return {
      offset,
      line: pos.line,
      column: pos.col
    }
  }

  init(node, offset) {
    this.current.push(node)
    node.source = {
      start: this.getPosition(offset),
      input: this.input
    }
    node.raws.before = this.spaces
    this.spaces = ''
    if (node.type !== 'comment') this.semicolon = false
  }

  raw(node, prop, tokens) {
    let token, type
    let length = tokens.length
    let value = ''
    let clean = true
    let next, prev
    let pattern = /^([#.|])?(\w)+/i

    for (let i = 0; i < length; i += 1) {
      token = tokens[i]
      type = token[0]

      if (type === 'comment' && node.type === 'rule') {
        prev = tokens[i - 1]
        next = tokens[i + 1]

        if (
          prev[0] !== 'space' &&
          next[0] !== 'space' &&
          pattern.test(prev[1]) &&
          pattern.test(next[1])
        ) {
          value += token[1]
        } else {
          clean = false
        }

        continue
      }

      if (type === 'comment' || (type === 'space' && i === length - 1)) {
        clean = false
      } else {
        value += token[1]
      }
    }
    if (!clean) {
      let raw = tokens.reduce((all, i) => all + i[1], '')
      node.raws[prop] = { value, raw }
    }
    node[prop] = value
  }

  spacesAndCommentsFromEnd(tokens) {
    let lastTokenType
    let spaces = ''
    while (tokens.length) {
      lastTokenType = tokens[tokens.length - 1][0]
      if (lastTokenType !== 'space' && lastTokenType !== 'comment') break
      spaces = tokens.pop()[1] + spaces
    }
    return spaces
  }

  spacesAndCommentsFromStart(tokens) {
    let next
    let spaces = ''
    while (tokens.length) {
      next = tokens[0][0]
      if (next !== 'space' && next !== 'comment') break
      spaces += tokens.shift()[1]
    }
    return spaces
  }

  spacesFromEnd(tokens) {
    let lastTokenType
    let spaces = ''
    while (tokens.length) {
      lastTokenType = tokens[tokens.length - 1][0]
      if (lastTokenType !== 'space') break
      spaces = tokens.pop()[1] + spaces
    }
    return spaces
  }

  stringFrom(tokens, from) {
    let result = ''
    for (let i = from; i < tokens.length; i++) {
      result += tokens[i][1]
    }
    tokens.splice(from, tokens.length - from)
    return result
  }

  colon(tokens) {
    let brackets = 0
    let token, type, prev
    for (let [i, element] of tokens.entries()) {
      token = element
      type = token[0]

      if (type === '(') {
        brackets += 1
      }
      if (type === ')') {
        brackets -= 1
      }
      if (brackets === 0 && type === ':') {
        if (!prev) {
          this.doubleColon(token)
        } else if (prev[0] === 'word' && prev[1] === 'progid') {
          continue
        } else {
          return i
        }
      }

      prev = token
    }
    return false
  }

  // Errors

  unclosedBracket(bracket) {
    throw this.input.error('Unclosed bracket', bracket[2])
  }

  unknownWord(tokens) {
    throw this.input.error('Unknown word', tokens[0][2])
  }

  unexpectedClose(token) {
    throw this.input.error('Unexpected }', token[2])
  }

  unclosedBlock() {
    let pos = this.current.source.start
    throw this.input.error('Unclosed block', pos.line, pos.column)
  }

  doubleColon(token) {
    throw this.input.error('Double colon', token[2])
  }

  unnamedAtrule(node, token) {
    throw this.input.error('At-rule without name', token[2])
  }

  precheckMissedSemicolon(/* tokens */) {
    // Hook for Safe Parser
  }

  checkMissedSemicolon(tokens) {
    let colon = this.colon(tokens)
    if (colon === false) return

    let founded = 0
    let token
    for (let j = colon - 1; j >= 0; j--) {
      token = tokens[j]
      if (token[0] !== 'space') {
        founded += 1
        if (founded === 2) break
      }
    }
    throw this.input.error('Missed semicolon', token[2])
  }
}

module.exports = Parser


/***/ }),

/***/ 895:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let CssSyntaxError = __webpack_require__(614)
let Declaration = __webpack_require__(238)
let LazyResult = __webpack_require__(966)
let Container = __webpack_require__(793)
let Processor = __webpack_require__(846)
let stringify = __webpack_require__(303)
let fromJSON = __webpack_require__(438)
let Document = __webpack_require__(145)
let Warning = __webpack_require__(38)
let Comment = __webpack_require__(371)
let AtRule = __webpack_require__(396)
let Result = __webpack_require__(717)
let Input = __webpack_require__(106)
let parse = __webpack_require__(577)
let list = __webpack_require__(752)
let Rule = __webpack_require__(534)
let Root = __webpack_require__(644)
let Node = __webpack_require__(152)

function postcss(...plugins) {
  if (plugins.length === 1 && Array.isArray(plugins[0])) {
    plugins = plugins[0]
  }
  return new Processor(plugins)
}

postcss.plugin = function plugin(name, initializer) {
  if (console && console.warn) {
    console.warn(
      name +
        ': postcss.plugin was deprecated. Migration guide:\n' +
        'https://evilmartians.com/chronicles/postcss-8-plugin-migration'
    )
    if (process.env.LANG && process.env.LANG.startsWith('cn')) {
      // istanbul ignore next
      console.warn(
        name +
          ': 里面 postcss.plugin 被弃用. 迁移指南:\n' +
          'https://www.w3ctech.com/topic/2226'
      )
    }
  }
  function creator(...args) {
    let transformer = initializer(...args)
    transformer.postcssPlugin = name
    transformer.postcssVersion = new Processor().version
    return transformer
  }

  let cache
  Object.defineProperty(creator, 'postcss', {
    get() {
      if (!cache) cache = creator()
      return cache
    }
  })

  creator.process = function (css, processOpts, pluginOpts) {
    return postcss([creator(pluginOpts)]).process(css, processOpts)
  }

  return creator
}

postcss.stringify = stringify
postcss.parse = parse
postcss.fromJSON = fromJSON
postcss.list = list

postcss.comment = defaults => new Comment(defaults)
postcss.atRule = defaults => new AtRule(defaults)
postcss.decl = defaults => new Declaration(defaults)
postcss.rule = defaults => new Rule(defaults)
postcss.root = defaults => new Root(defaults)
postcss.document = defaults => new Document(defaults)

postcss.CssSyntaxError = CssSyntaxError
postcss.Declaration = Declaration
postcss.Container = Container
postcss.Document = Document
postcss.Comment = Comment
postcss.Warning = Warning
postcss.AtRule = AtRule
postcss.Result = Result
postcss.Input = Input
postcss.Rule = Rule
postcss.Root = Root
postcss.Node = Node

LazyResult.registerPostcss(postcss)

module.exports = postcss
postcss.default = postcss


/***/ }),

/***/ 878:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let { SourceMapConsumer, SourceMapGenerator } = __webpack_require__(866)
let { existsSync, readFileSync } = __webpack_require__(977)
let { dirname, join } = __webpack_require__(197)

function fromBase64(str) {
  if (Buffer) {
    return Buffer.from(str, 'base64').toString()
  } else {
    // istanbul ignore next
    return window.atob(str)
  }
}

class PreviousMap {
  constructor(css, opts) {
    if (opts.map === false) return
    this.loadAnnotation(css)
    this.inline = this.startWith(this.annotation, 'data:')

    let prev = opts.map ? opts.map.prev : undefined
    let text = this.loadMap(opts.from, prev)
    if (!this.mapFile && opts.from) {
      this.mapFile = opts.from
    }
    if (this.mapFile) this.root = dirname(this.mapFile)
    if (text) this.text = text
  }

  consumer() {
    if (!this.consumerCache) {
      this.consumerCache = new SourceMapConsumer(this.text)
    }
    return this.consumerCache
  }

  withContent() {
    return !!(
      this.consumer().sourcesContent &&
      this.consumer().sourcesContent.length > 0
    )
  }

  startWith(string, start) {
    if (!string) return false
    return string.substr(0, start.length) === start
  }

  getAnnotationURL(sourceMapString) {
    return sourceMapString
      .match(/\/\*\s*# sourceMappingURL=((?:(?!sourceMappingURL=).)*)\*\//)[1]
      .trim()
  }

  loadAnnotation(css) {
    let annotations = css.match(
      /\/\*\s*# sourceMappingURL=(?:(?!sourceMappingURL=).)*\*\//gm
    )

    if (annotations && annotations.length > 0) {
      // Locate the last sourceMappingURL to avoid picking up
      // sourceMappingURLs from comments, strings, etc.
      let lastAnnotation = annotations[annotations.length - 1]
      if (lastAnnotation) {
        this.annotation = this.getAnnotationURL(lastAnnotation)
      }
    }
  }

  decodeInline(text) {
    let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/
    let baseUri = /^data:application\/json;base64,/
    let charsetUri = /^data:application\/json;charset=utf-?8,/
    let uri = /^data:application\/json,/

    if (charsetUri.test(text) || uri.test(text)) {
      return decodeURIComponent(text.substr(RegExp.lastMatch.length))
    }

    if (baseCharsetUri.test(text) || baseUri.test(text)) {
      return fromBase64(text.substr(RegExp.lastMatch.length))
    }

    let encoding = text.match(/data:application\/json;([^,]+),/)[1]
    throw new Error('Unsupported source map encoding ' + encoding)
  }

  loadFile(path) {
    this.root = dirname(path)
    if (existsSync(path)) {
      this.mapFile = path
      return readFileSync(path, 'utf-8').toString().trim()
    }
  }

  loadMap(file, prev) {
    if (prev === false) return false

    if (prev) {
      if (typeof prev === 'string') {
        return prev
      } else if (typeof prev === 'function') {
        let prevPath = prev(file)
        if (prevPath) {
          let map = this.loadFile(prevPath)
          if (!map) {
            throw new Error(
              'Unable to load previous source map: ' + prevPath.toString()
            )
          }
          return map
        }
      } else if (prev instanceof SourceMapConsumer) {
        return SourceMapGenerator.fromSourceMap(prev).toString()
      } else if (prev instanceof SourceMapGenerator) {
        return prev.toString()
      } else if (this.isMap(prev)) {
        return JSON.stringify(prev)
      } else {
        throw new Error(
          'Unsupported previous source map format: ' + prev.toString()
        )
      }
    } else if (this.inline) {
      return this.decodeInline(this.annotation)
    } else if (this.annotation) {
      let map = this.annotation
      if (file) map = join(dirname(file), map)
      return this.loadFile(map)
    }
  }

  isMap(map) {
    if (typeof map !== 'object') return false
    return (
      typeof map.mappings === 'string' ||
      typeof map._mappings === 'string' ||
      Array.isArray(map.sections)
    )
  }
}

module.exports = PreviousMap
PreviousMap.default = PreviousMap


/***/ }),

/***/ 846:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let LazyResult = __webpack_require__(966)
let Document = __webpack_require__(145)
let Root = __webpack_require__(644)

class Processor {
  constructor(plugins = []) {
    this.version = '8.3.5'
    this.plugins = this.normalize(plugins)
  }

  use(plugin) {
    this.plugins = this.plugins.concat(this.normalize([plugin]))
    return this
  }

  process(css, opts = {}) {
    if (
      this.plugins.length === 0 &&
      typeof opts.parser === 'undefined' &&
      typeof opts.stringifier === 'undefined' &&
      typeof opts.syntax === 'undefined' &&
      !opts.hideNothingWarning
    ) {
      if (false) {}
    }
    return new LazyResult(this, css, opts)
  }

  normalize(plugins) {
    let normalized = []
    for (let i of plugins) {
      if (i.postcss === true) {
        i = i()
      } else if (i.postcss) {
        i = i.postcss
      }

      if (typeof i === 'object' && Array.isArray(i.plugins)) {
        normalized = normalized.concat(i.plugins)
      } else if (typeof i === 'object' && i.postcssPlugin) {
        normalized.push(i)
      } else if (typeof i === 'function') {
        normalized.push(i)
      } else if (typeof i === 'object' && (i.parse || i.stringify)) {
        if (false) {}
      } else {
        throw new Error(i + ' is not a PostCSS plugin')
      }
    }
    return normalized
  }
}

module.exports = Processor
Processor.default = Processor

Root.registerProcessor(Processor)
Document.registerProcessor(Processor)


/***/ }),

/***/ 717:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Warning = __webpack_require__(38)

class Result {
  constructor(processor, root, opts) {
    this.processor = processor
    this.messages = []
    this.root = root
    this.opts = opts
    this.css = undefined
    this.map = undefined
  }

  toString() {
    return this.css
  }

  warn(text, opts = {}) {
    if (!opts.plugin) {
      if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
        opts.plugin = this.lastPlugin.postcssPlugin
      }
    }

    let warning = new Warning(text, opts)
    this.messages.push(warning)

    return warning
  }

  warnings() {
    return this.messages.filter(i => i.type === 'warning')
  }

  get content() {
    return this.css
  }
}

module.exports = Result
Result.default = Result


/***/ }),

/***/ 644:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Container = __webpack_require__(793)

let LazyResult, Processor

class Root extends Container {
  constructor(defaults) {
    super(defaults)
    this.type = 'root'
    if (!this.nodes) this.nodes = []
  }

  removeChild(child, ignore) {
    let index = this.index(child)

    if (!ignore && index === 0 && this.nodes.length > 1) {
      this.nodes[1].raws.before = this.nodes[index].raws.before
    }

    return super.removeChild(child)
  }

  normalize(child, sample, type) {
    let nodes = super.normalize(child)

    if (sample) {
      if (type === 'prepend') {
        if (this.nodes.length > 1) {
          sample.raws.before = this.nodes[1].raws.before
        } else {
          delete sample.raws.before
        }
      } else if (this.first !== sample) {
        for (let node of nodes) {
          node.raws.before = sample.raws.before
        }
      }
    }

    return nodes
  }

  toResult(opts = {}) {
    let lazy = new LazyResult(new Processor(), this, opts)
    return lazy.stringify()
  }
}

Root.registerLazyResult = dependant => {
  LazyResult = dependant
}

Root.registerProcessor = dependant => {
  Processor = dependant
}

module.exports = Root
Root.default = Root


/***/ }),

/***/ 534:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Container = __webpack_require__(793)
let list = __webpack_require__(752)

class Rule extends Container {
  constructor(defaults) {
    super(defaults)
    this.type = 'rule'
    if (!this.nodes) this.nodes = []
  }

  get selectors() {
    return list.comma(this.selector)
  }

  set selectors(values) {
    let match = this.selector ? this.selector.match(/,\s*/) : null
    let sep = match ? match[0] : ',' + this.raw('between', 'beforeOpen')
    this.selector = values.join(sep)
  }
}

module.exports = Rule
Rule.default = Rule

Container.registerRule(Rule)


/***/ }),

/***/ 668:
/***/ ((module) => {

"use strict";


const DEFAULT_RAW = {
  colon: ': ',
  indent: '    ',
  beforeDecl: '\n',
  beforeRule: '\n',
  beforeOpen: ' ',
  beforeClose: '\n',
  beforeComment: '\n',
  after: '\n',
  emptyBody: '',
  commentLeft: ' ',
  commentRight: ' ',
  semicolon: false
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1)
}

class Stringifier {
  constructor(builder) {
    this.builder = builder
  }

  stringify(node, semicolon) {
    /* istanbul ignore if */
    if (!this[node.type]) {
      throw new Error(
        'Unknown AST node type ' +
          node.type +
          '. ' +
          'Maybe you need to change PostCSS stringifier.'
      )
    }
    this[node.type](node, semicolon)
  }

  document(node) {
    this.body(node)
  }

  root(node) {
    this.body(node)
    if (node.raws.after) this.builder(node.raws.after)
  }

  comment(node) {
    let left = this.raw(node, 'left', 'commentLeft')
    let right = this.raw(node, 'right', 'commentRight')
    this.builder('/*' + left + node.text + right + '*/', node)
  }

  decl(node, semicolon) {
    let between = this.raw(node, 'between', 'colon')
    let string = node.prop + between + this.rawValue(node, 'value')

    if (node.important) {
      string += node.raws.important || ' !important'
    }

    if (semicolon) string += ';'
    this.builder(string, node)
  }

  rule(node) {
    this.block(node, this.rawValue(node, 'selector'))
    if (node.raws.ownSemicolon) {
      this.builder(node.raws.ownSemicolon, node, 'end')
    }
  }

  atrule(node, semicolon) {
    let name = '@' + node.name
    let params = node.params ? this.rawValue(node, 'params') : ''

    if (typeof node.raws.afterName !== 'undefined') {
      name += node.raws.afterName
    } else if (params) {
      name += ' '
    }

    if (node.nodes) {
      this.block(node, name + params)
    } else {
      let end = (node.raws.between || '') + (semicolon ? ';' : '')
      this.builder(name + params + end, node)
    }
  }

  body(node) {
    let last = node.nodes.length - 1
    while (last > 0) {
      if (node.nodes[last].type !== 'comment') break
      last -= 1
    }

    let semicolon = this.raw(node, 'semicolon')
    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i]
      let before = this.raw(child, 'before')
      if (before) this.builder(before)
      this.stringify(child, last !== i || semicolon)
    }
  }

  block(node, start) {
    let between = this.raw(node, 'between', 'beforeOpen')
    this.builder(start + between + '{', node, 'start')

    let after
    if (node.nodes && node.nodes.length) {
      this.body(node)
      after = this.raw(node, 'after')
    } else {
      after = this.raw(node, 'after', 'emptyBody')
    }

    if (after) this.builder(after)
    this.builder('}', node, 'end')
  }

  raw(node, own, detect) {
    let value
    if (!detect) detect = own

    // Already had
    if (own) {
      value = node.raws[own]
      if (typeof value !== 'undefined') return value
    }

    let parent = node.parent

    if (detect === 'before') {
      // Hack for first rule in CSS
      if (!parent || (parent.type === 'root' && parent.first === node)) {
        return ''
      }

      // `root` nodes in `document` should use only their own raws
      if (parent && parent.type === 'document') {
        return ''
      }
    }

    // Floating child without parent
    if (!parent) return DEFAULT_RAW[detect]

    // Detect style by other nodes
    let root = node.root()
    if (!root.rawCache) root.rawCache = {}
    if (typeof root.rawCache[detect] !== 'undefined') {
      return root.rawCache[detect]
    }

    if (detect === 'before' || detect === 'after') {
      return this.beforeAfter(node, detect)
    } else {
      let method = 'raw' + capitalize(detect)
      if (this[method]) {
        value = this[method](root, node)
      } else {
        root.walk(i => {
          value = i.raws[own]
          if (typeof value !== 'undefined') return false
        })
      }
    }

    if (typeof value === 'undefined') value = DEFAULT_RAW[detect]

    root.rawCache[detect] = value
    return value
  }

  rawSemicolon(root) {
    let value
    root.walk(i => {
      if (i.nodes && i.nodes.length && i.last.type === 'decl') {
        value = i.raws.semicolon
        if (typeof value !== 'undefined') return false
      }
    })
    return value
  }

  rawEmptyBody(root) {
    let value
    root.walk(i => {
      if (i.nodes && i.nodes.length === 0) {
        value = i.raws.after
        if (typeof value !== 'undefined') return false
      }
    })
    return value
  }

  rawIndent(root) {
    if (root.raws.indent) return root.raws.indent
    let value
    root.walk(i => {
      let p = i.parent
      if (p && p !== root && p.parent && p.parent === root) {
        if (typeof i.raws.before !== 'undefined') {
          let parts = i.raws.before.split('\n')
          value = parts[parts.length - 1]
          value = value.replace(/\S/g, '')
          return false
        }
      }
    })
    return value
  }

  rawBeforeComment(root, node) {
    let value
    root.walkComments(i => {
      if (typeof i.raws.before !== 'undefined') {
        value = i.raws.before
        if (value.includes('\n')) {
          value = value.replace(/[^\n]+$/, '')
        }
        return false
      }
    })
    if (typeof value === 'undefined') {
      value = this.raw(node, null, 'beforeDecl')
    } else if (value) {
      value = value.replace(/\S/g, '')
    }
    return value
  }

  rawBeforeDecl(root, node) {
    let value
    root.walkDecls(i => {
      if (typeof i.raws.before !== 'undefined') {
        value = i.raws.before
        if (value.includes('\n')) {
          value = value.replace(/[^\n]+$/, '')
        }
        return false
      }
    })
    if (typeof value === 'undefined') {
      value = this.raw(node, null, 'beforeRule')
    } else if (value) {
      value = value.replace(/\S/g, '')
    }
    return value
  }

  rawBeforeRule(root) {
    let value
    root.walk(i => {
      if (i.nodes && (i.parent !== root || root.first !== i)) {
        if (typeof i.raws.before !== 'undefined') {
          value = i.raws.before
          if (value.includes('\n')) {
            value = value.replace(/[^\n]+$/, '')
          }
          return false
        }
      }
    })
    if (value) value = value.replace(/\S/g, '')
    return value
  }

  rawBeforeClose(root) {
    let value
    root.walk(i => {
      if (i.nodes && i.nodes.length > 0) {
        if (typeof i.raws.after !== 'undefined') {
          value = i.raws.after
          if (value.includes('\n')) {
            value = value.replace(/[^\n]+$/, '')
          }
          return false
        }
      }
    })
    if (value) value = value.replace(/\S/g, '')
    return value
  }

  rawBeforeOpen(root) {
    let value
    root.walk(i => {
      if (i.type !== 'decl') {
        value = i.raws.between
        if (typeof value !== 'undefined') return false
      }
    })
    return value
  }

  rawColon(root) {
    let value
    root.walkDecls(i => {
      if (typeof i.raws.between !== 'undefined') {
        value = i.raws.between.replace(/[^\s:]/g, '')
        return false
      }
    })
    return value
  }

  beforeAfter(node, detect) {
    let value
    if (node.type === 'decl') {
      value = this.raw(node, null, 'beforeDecl')
    } else if (node.type === 'comment') {
      value = this.raw(node, null, 'beforeComment')
    } else if (detect === 'before') {
      value = this.raw(node, null, 'beforeRule')
    } else {
      value = this.raw(node, null, 'beforeClose')
    }

    let buf = node.parent
    let depth = 0
    while (buf && buf.type !== 'root') {
      depth += 1
      buf = buf.parent
    }

    if (value.includes('\n')) {
      let indent = this.raw(node, null, 'indent')
      if (indent.length) {
        for (let step = 0; step < depth; step++) value += indent
      }
    }

    return value
  }

  rawValue(node, prop) {
    let value = node[prop]
    let raw = node.raws[prop]
    if (raw && raw.value === value) {
      return raw.raw
    }

    return value
  }
}

module.exports = Stringifier


/***/ }),

/***/ 303:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


let Stringifier = __webpack_require__(668)

function stringify(node, builder) {
  let str = new Stringifier(builder)
  str.stringify(node)
}

module.exports = stringify
stringify.default = stringify


/***/ }),

/***/ 151:
/***/ ((module) => {

"use strict";


module.exports.isClean = Symbol('isClean')

module.exports.my = Symbol('my')


/***/ }),

/***/ 781:
/***/ ((module) => {

"use strict";


const SINGLE_QUOTE = "'".charCodeAt(0)
const DOUBLE_QUOTE = '"'.charCodeAt(0)
const BACKSLASH = '\\'.charCodeAt(0)
const SLASH = '/'.charCodeAt(0)
const NEWLINE = '\n'.charCodeAt(0)
const SPACE = ' '.charCodeAt(0)
const FEED = '\f'.charCodeAt(0)
const TAB = '\t'.charCodeAt(0)
const CR = '\r'.charCodeAt(0)
const OPEN_SQUARE = '['.charCodeAt(0)
const CLOSE_SQUARE = ']'.charCodeAt(0)
const OPEN_PARENTHESES = '('.charCodeAt(0)
const CLOSE_PARENTHESES = ')'.charCodeAt(0)
const OPEN_CURLY = '{'.charCodeAt(0)
const CLOSE_CURLY = '}'.charCodeAt(0)
const SEMICOLON = ';'.charCodeAt(0)
const ASTERISK = '*'.charCodeAt(0)
const COLON = ':'.charCodeAt(0)
const AT = '@'.charCodeAt(0)

const RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g
const RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g
const RE_BAD_BRACKET = /.[\n"'(/\\]/
const RE_HEX_ESCAPE = /[\da-f]/i

module.exports = function tokenizer(input, options = {}) {
  let css = input.css.valueOf()
  let ignore = options.ignoreErrors

  let code, next, quote, content, escape
  let escaped, escapePos, prev, n, currentToken

  let length = css.length
  let pos = 0
  let buffer = []
  let returned = []

  function position() {
    return pos
  }

  function unclosed(what) {
    throw input.error('Unclosed ' + what, pos)
  }

  function endOfFile() {
    return returned.length === 0 && pos >= length
  }

  function nextToken(opts) {
    if (returned.length) return returned.pop()
    if (pos >= length) return

    let ignoreUnclosed = opts ? opts.ignoreUnclosed : false

    code = css.charCodeAt(pos)

    switch (code) {
      case NEWLINE:
      case SPACE:
      case TAB:
      case CR:
      case FEED: {
        next = pos
        do {
          next += 1
          code = css.charCodeAt(next)
        } while (
          code === SPACE ||
          code === NEWLINE ||
          code === TAB ||
          code === CR ||
          code === FEED
        )

        currentToken = ['space', css.slice(pos, next)]
        pos = next - 1
        break
      }

      case OPEN_SQUARE:
      case CLOSE_SQUARE:
      case OPEN_CURLY:
      case CLOSE_CURLY:
      case COLON:
      case SEMICOLON:
      case CLOSE_PARENTHESES: {
        let controlChar = String.fromCharCode(code)
        currentToken = [controlChar, controlChar, pos]
        break
      }

      case OPEN_PARENTHESES: {
        prev = buffer.length ? buffer.pop()[1] : ''
        n = css.charCodeAt(pos + 1)
        if (
          prev === 'url' &&
          n !== SINGLE_QUOTE &&
          n !== DOUBLE_QUOTE &&
          n !== SPACE &&
          n !== NEWLINE &&
          n !== TAB &&
          n !== FEED &&
          n !== CR
        ) {
          next = pos
          do {
            escaped = false
            next = css.indexOf(')', next + 1)
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos
                break
              } else {
                unclosed('bracket')
              }
            }
            escapePos = next
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1
              escaped = !escaped
            }
          } while (escaped)

          currentToken = ['brackets', css.slice(pos, next + 1), pos, next]

          pos = next
        } else {
          next = css.indexOf(')', pos + 1)
          content = css.slice(pos, next + 1)

          if (next === -1 || RE_BAD_BRACKET.test(content)) {
            currentToken = ['(', '(', pos]
          } else {
            currentToken = ['brackets', content, pos, next]
            pos = next
          }
        }

        break
      }

      case SINGLE_QUOTE:
      case DOUBLE_QUOTE: {
        quote = code === SINGLE_QUOTE ? "'" : '"'
        next = pos
        do {
          escaped = false
          next = css.indexOf(quote, next + 1)
          if (next === -1) {
            if (ignore || ignoreUnclosed) {
              next = pos + 1
              break
            } else {
              unclosed('string')
            }
          }
          escapePos = next
          while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
            escapePos -= 1
            escaped = !escaped
          }
        } while (escaped)

        currentToken = ['string', css.slice(pos, next + 1), pos, next]
        pos = next
        break
      }

      case AT: {
        RE_AT_END.lastIndex = pos + 1
        RE_AT_END.test(css)
        if (RE_AT_END.lastIndex === 0) {
          next = css.length - 1
        } else {
          next = RE_AT_END.lastIndex - 2
        }

        currentToken = ['at-word', css.slice(pos, next + 1), pos, next]

        pos = next
        break
      }

      case BACKSLASH: {
        next = pos
        escape = true
        while (css.charCodeAt(next + 1) === BACKSLASH) {
          next += 1
          escape = !escape
        }
        code = css.charCodeAt(next + 1)
        if (
          escape &&
          code !== SLASH &&
          code !== SPACE &&
          code !== NEWLINE &&
          code !== TAB &&
          code !== CR &&
          code !== FEED
        ) {
          next += 1
          if (RE_HEX_ESCAPE.test(css.charAt(next))) {
            while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
              next += 1
            }
            if (css.charCodeAt(next + 1) === SPACE) {
              next += 1
            }
          }
        }

        currentToken = ['word', css.slice(pos, next + 1), pos, next]

        pos = next
        break
      }

      default: {
        if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
          next = css.indexOf('*/', pos + 2) + 1
          if (next === 0) {
            if (ignore || ignoreUnclosed) {
              next = css.length
            } else {
              unclosed('comment')
            }
          }

          currentToken = ['comment', css.slice(pos, next + 1), pos, next]
          pos = next
        } else {
          RE_WORD_END.lastIndex = pos + 1
          RE_WORD_END.test(css)
          if (RE_WORD_END.lastIndex === 0) {
            next = css.length - 1
          } else {
            next = RE_WORD_END.lastIndex - 2
          }

          currentToken = ['word', css.slice(pos, next + 1), pos, next]
          buffer.push(currentToken)
          pos = next
        }

        break
      }
    }

    pos++
    return currentToken
  }

  function back(token) {
    returned.push(token)
  }

  return {
    back,
    nextToken,
    endOfFile,
    position
  }
}


/***/ }),

/***/ 156:
/***/ ((module) => {

"use strict";


let printed = {}

module.exports = function warnOnce(message) {
  if (printed[message]) return
  printed[message] = true

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(message)
  }
}


/***/ }),

/***/ 38:
/***/ ((module) => {

"use strict";


class Warning {
  constructor(text, opts = {}) {
    this.type = 'warning'
    this.text = text

    if (opts.node && opts.node.source) {
      let pos = opts.node.positionBy(opts)
      this.line = pos.line
      this.column = pos.column
    }

    for (let opt in opts) this[opt] = opts[opt]
  }

  toString() {
    if (this.node) {
      return this.node.error(this.text, {
        plugin: this.plugin,
        index: this.index,
        word: this.word
      }).message
    }

    if (this.plugin) {
      return this.plugin + ': ' + this.text
    }

    return this.text
  }
}

module.exports = Warning
Warning.default = Warning


/***/ }),

/***/ 746:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 539:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 977:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 197:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 866:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 739:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 463:
/***/ ((module) => {

// This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
// optimize the gzip compression for this alphabet.
let urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'

let customAlphabet = (alphabet, size) => {
  return () => {
    let id = ''
    // A compact alternative for `for (var i = 0; i < step; i++)`.
    let i = size
    while (i--) {
      // `| 0` is more compact and faster than `Math.floor()`.
      id += alphabet[(Math.random() * alphabet.length) | 0]
    }
    return id
  }
}

let nanoid = (size = 21) => {
  let id = ''
  // A compact alternative for `for (var i = 0; i < step; i++)`.
  let i = size
  while (i--) {
    // `| 0` is more compact and faster than `Math.floor()`.
    id += urlAlphabet[(Math.random() * 64) | 0]
  }
  return id
}

module.exports = { nanoid, customAlphabet }


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  documentToSVG: () => (/* binding */ documentToSVG),
  elementToSVG: () => (/* binding */ elementToSVG),
  inlineResources: () => (/* reexport */ inlineResources)
});

// EXTERNAL MODULE: ./node_modules/postcss/lib/postcss.js
var lib_postcss = __webpack_require__(895);
;// CONCATENATED MODULE: ./node_modules/postcss/lib/postcss.mjs


/* harmony default export */ const postcss_lib_postcss = ((/* unused pure expression or super */ null && (postcss)));

const stringify = lib_postcss.stringify
const fromJSON = lib_postcss.fromJSON
const postcss_plugin = lib_postcss.plugin
const parse = lib_postcss.parse
const list = lib_postcss.list

const postcss_document = lib_postcss.document
const comment = lib_postcss.comment
const atRule = lib_postcss.atRule
const rule = lib_postcss.rule
const decl = lib_postcss.decl
const root = lib_postcss.root

const CssSyntaxError = lib_postcss.CssSyntaxError
const Declaration = lib_postcss.Declaration
const Container = lib_postcss.Container
const Document = lib_postcss.Document
const Comment = lib_postcss.Comment
const Warning = lib_postcss.Warning
const AtRule = lib_postcss.AtRule
const Result = lib_postcss.Result
const Input = lib_postcss.Input
const Rule = lib_postcss.Rule
const Root = lib_postcss.Root
const postcss_Node = lib_postcss.Node

// EXTERNAL MODULE: ./node_modules/postcss-value-parser/lib/index.js
var lib = __webpack_require__(482);
;// CONCATENATED MODULE: ./lib/css.js
const isCSSFontFaceRule = (rule) => rule.type === CSSRule.FONT_FACE_RULE;
const isInline = (styles) => styles.displayOutside === 'inline' || styles.display.startsWith('inline-');
const isPositioned = (styles) => styles.position !== 'static';
const isInFlow = (styles) => styles.float !== 'none' && styles.position !== 'absolute' && styles.position !== 'fixed';
const isTransparent = (color) => color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
const hasUniformBorder = (styles) => parseFloat(styles.borderTopWidth) !== 0 &&
    styles.borderTopStyle !== 'none' &&
    styles.borderTopStyle !== 'inset' &&
    styles.borderTopStyle !== 'outset' &&
    !isTransparent(styles.borderTopColor) &&
    // Cannot use border property directly as in Firefox those are empty strings.
    // Need to get the specific border properties from the specific sides.
    // https://stackoverflow.com/questions/41696063/getcomputedstyle-returns-empty-strings-on-ff-when-instead-crome-returns-a-comp
    styles.borderTopWidth === styles.borderLeftWidth &&
    styles.borderTopWidth === styles.borderRightWidth &&
    styles.borderTopWidth === styles.borderBottomWidth &&
    styles.borderTopColor === styles.borderLeftColor &&
    styles.borderTopColor === styles.borderRightColor &&
    styles.borderTopColor === styles.borderBottomColor &&
    styles.borderTopStyle === styles.borderLeftStyle &&
    styles.borderTopStyle === styles.borderRightStyle &&
    styles.borderTopStyle === styles.borderBottomStyle;
/** The 4 sides of a box. */
const SIDES = ['top', 'bottom', 'right', 'left'];
/** Whether the given side is a horizontal side. */
const isHorizontal = (side) => side === 'bottom' || side === 'top';
/**
 * The two corners for each side, in order of lower coordinate to higher coordinate.
 */
const CORNERS = {
    top: ['left', 'right'],
    bottom: ['left', 'right'],
    left: ['top', 'bottom'],
    right: ['top', 'bottom'],
};
/**
 * Returns the (elliptic) border radii for a given side.
 * For example, for the top side it will return the horizontal top-left and the horizontal top-right border radii.
 */
function getBorderRadiiForSide(side, styles, bounds) {
    var _a, _b, _c, _d;
    const [horizontalStyle1, verticalStyle1] = styles
        .getPropertyValue(isHorizontal(side)
        ? `border-${side}-${CORNERS[side][0]}-radius`
        : `border-${CORNERS[side][0]}-${side}-radius`)
        .split(' ');
    const [horizontalStyle2, verticalStyle2] = styles
        .getPropertyValue(isHorizontal(side)
        ? `border-${side}-${CORNERS[side][1]}-radius`
        : `border-${CORNERS[side][1]}-${side}-radius`)
        .split(' ');
    if (isHorizontal(side)) {
        return [
            (_a = parseCSSLength(horizontalStyle1 || '0px', bounds.width)) !== null && _a !== void 0 ? _a : 0,
            (_b = parseCSSLength(horizontalStyle2 || '0px', bounds.width)) !== null && _b !== void 0 ? _b : 0,
        ];
    }
    return [
        (_c = parseCSSLength(verticalStyle1 || horizontalStyle1 || '0px', bounds.height)) !== null && _c !== void 0 ? _c : 0,
        (_d = parseCSSLength(verticalStyle2 || horizontalStyle2 || '0px', bounds.height)) !== null && _d !== void 0 ? _d : 0,
    ];
}
/**
 * Returns the factor by which all border radii have to be scaled to fit correctly.
 *
 * @see https://drafts.csswg.org/css-backgrounds-3/#corner-overlap
 */
const calculateOverlappingCurvesFactor = (styles, bounds) => Math.min(...SIDES.map(side => {
    const length = isHorizontal(side) ? bounds.width : bounds.height;
    const radiiSum = getBorderRadiiForSide(side, styles, bounds).reduce((sum, radius) => sum + radius, 0);
    return length / radiiSum;
}), 1);
const isVisible = (styles) => styles.displayOutside !== 'none' &&
    styles.display !== 'none' &&
    styles.visibility !== 'hidden' &&
    styles.opacity !== '0';
function parseCSSLength(length, containerLength) {
    if (length.endsWith('px')) {
        return parseFloat(length);
    }
    if (length.endsWith('%')) {
        return (parseFloat(length) / 100) * containerLength;
    }
    return undefined;
}
const unescapeStringValue = (value) => value
    // Replace hex escape sequences
    .replace(/\\([\da-f]{1,2})/gi, (substring, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)))
    // Replace all other escapes (quotes, backslash, etc)
    .replace(/\\(.)/g, '$1');
function copyCssStyles(from, to) {
    for (const property of from) {
        to.setProperty(property, from.getPropertyValue(property), from.getPropertyPriority(property));
    }
}
//# sourceMappingURL=css.js.map
;// CONCATENATED MODULE: ./lib/dom.js
// Namespaces
const svgNamespace = 'http://www.w3.org/2000/svg';
const xlinkNamespace = 'http://www.w3.org/1999/xlink';
const xhtmlNamespace = 'http://www.w3.org/1999/xhtml';
// DOM
const isElement = (node) => node.nodeType === Node.ELEMENT_NODE;
const isTextNode = (node) => node.nodeType === Node.TEXT_NODE;
const isCommentNode = (node) => node.nodeType === Node.COMMENT_NODE;
// SVG
const isSVGElement = (element) => element.namespaceURI === svgNamespace;
const isSVGSVGElement = (element) => isSVGElement(element) && element.tagName === 'svg';
const isSVGGraphicsElement = (element) => isSVGElement(element) && 'getCTM' in element && 'getScreenCTM' in element;
const isSVGGroupElement = (element) => isSVGElement(element) && element.tagName === 'g';
const isSVGAnchorElement = (element) => isSVGElement(element) && element.tagName === 'a';
const isSVGTextContentElement = (element) => isSVGElement(element) && 'textLength' in element;
const isSVGImageElement = (element) => element.tagName === 'image' && isSVGElement(element);
const isSVGStyleElement = (element) => element.tagName === 'style' && isSVGElement(element);
// HTML
const isHTMLElement = (element) => element.namespaceURI === xhtmlNamespace;
const isHTMLAnchorElement = (element) => element.tagName === 'A' && isHTMLElement(element);
const isHTMLLabelElement = (element) => element.tagName === 'LABEL' && isHTMLElement(element);
const isHTMLImageElement = (element) => element.tagName === 'IMG' && isHTMLElement(element);
const isHTMLInputElement = (element) => element.tagName === 'INPUT' && isHTMLElement(element);
const hasLabels = (element) => 'labels' in element;
function* traverseDOM(node, shouldEnter = () => true) {
    yield node;
    if (shouldEnter(node)) {
        for (const childNode of node.childNodes) {
            yield* traverseDOM(childNode);
        }
    }
}
//# sourceMappingURL=dom.js.map
;// CONCATENATED MODULE: ./lib/stacking.js


const stackingContextEstablishingProperties = new Set([
    'clipPath',
    'contain',
    'filter',
    'isolation',
    'mask',
    'maskBorder',
    'maskImage',
    'mixBlendMode',
    'opacity',
    'perspective',
    'position',
    'transform',
    'webkitOverflowScrolling',
    'zIndex',
]);
function establishesStackingContext(styles, parentStyles) {
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
    return !!(((styles.position === 'absolute' || styles.position === 'relative') && styles.zIndex !== 'auto') ||
        styles.position === 'fixed' ||
        styles.position === 'sticky' ||
        (parentStyles &&
            (parentStyles.display === 'flex' || parentStyles.display === 'grid') &&
            styles.zIndex !== 'auto') ||
        parseFloat(styles.opacity) !== 1 ||
        styles.mixBlendMode !== 'normal' ||
        styles.transform !== 'none' ||
        styles.filter !== 'none' ||
        styles.perspective !== 'none' ||
        styles.clipPath !== 'none' ||
        styles.mask !== 'none' ||
        styles.maskImage !== 'none' ||
        styles.maskBorder !== 'none' ||
        styles.isolation === 'isolate' ||
        styles.webkitOverflowScrolling === 'touch' ||
        styles.contain === 'layout' ||
        styles.contain === 'paint' ||
        styles.contain === 'strict' ||
        styles.contain === 'content' ||
        styles.willChange.split(',').some(property => stackingContextEstablishingProperties.has(property.trim())));
}
const STACKING_LAYER_NAMES = [
    'rootBackgroundAndBorders',
    'childStackingContextsWithNegativeStackLevels',
    'inFlowNonInlineNonPositionedDescendants',
    'nonPositionedFloats',
    'inFlowInlineLevelNonPositionedDescendants',
    'childStackingContextsWithStackLevelZeroAndPositionedDescendantsWithStackLevelZero',
    'childStackingContextsWithPositiveStackLevels',
];
function createStackingLayer(parent, layerName) {
    const layer = parent.ownerDocument.createElementNS(svgNamespace, 'g');
    layer.dataset.stackingLayer = layerName;
    parent.append(layer);
    return layer;
}
function createStackingLayers(container) {
    container.dataset.stackingContext = 'true';
    return {
        rootBackgroundAndBorders: createStackingLayer(container, 'rootBackgroundAndBorders'),
        childStackingContextsWithNegativeStackLevels: createStackingLayer(container, 'childStackingContextsWithNegativeStackLevels'),
        inFlowNonInlineNonPositionedDescendants: createStackingLayer(container, 'inFlowNonInlineNonPositionedDescendants'),
        nonPositionedFloats: createStackingLayer(container, 'nonPositionedFloats'),
        inFlowInlineLevelNonPositionedDescendants: createStackingLayer(container, 'inFlowInlineLevelNonPositionedDescendants'),
        childStackingContextsWithStackLevelZeroAndPositionedDescendantsWithStackLevelZero: createStackingLayer(container, 'childStackingContextsWithStackLevelZeroAndPositionedDescendantsWithStackLevelZero'),
        childStackingContextsWithPositiveStackLevels: createStackingLayer(container, 'childStackingContextsWithPositiveStackLevels'),
    };
}
function determineStackingLayer(styles, parentStyles) {
    // https://www.w3.org/TR/CSS22/visuren.html#layers
    // https://www.w3.org/TR/CSS22/zindex.html
    // Note: the root element is not handled here, but in handleElement().
    const zIndex = styles.zIndex !== 'auto' ? parseInt(styles.zIndex, 10) : undefined;
    if (zIndex !== undefined && zIndex < 0 && establishesStackingContext(styles, parentStyles)) {
        return 'childStackingContextsWithNegativeStackLevels';
    }
    if (isInFlow(styles) && !isInline(styles) && !isPositioned(styles)) {
        return 'inFlowNonInlineNonPositionedDescendants';
    }
    if (!isPositioned(styles) && styles.float !== 'none') {
        return 'nonPositionedFloats';
    }
    if (isInFlow(styles) && isInline(styles) && !isPositioned(styles)) {
        return 'inFlowInlineLevelNonPositionedDescendants';
    }
    if (zIndex === 0 && (isPositioned(styles) || establishesStackingContext(styles, parentStyles))) {
        return 'childStackingContextsWithStackLevelZeroAndPositionedDescendantsWithStackLevelZero';
    }
    if (zIndex !== undefined && zIndex > 0 && establishesStackingContext(styles, parentStyles)) {
        return 'childStackingContextsWithPositiveStackLevels';
    }
    return undefined;
}
function sortChildrenByZIndex(parent) {
    const sorted = [...parent.children].sort((a, b) => {
        const zIndexA = a.dataset.zIndex;
        const zIndexB = b.dataset.zIndex;
        if (!zIndexA || !zIndexB) {
            // E.g. a <clipPath>
            return 0;
        }
        return parseInt(zIndexA, 10) - parseInt(zIndexB, 10);
    });
    for (const child of sorted) {
        parent.append(child);
    }
}
function sortStackingLayerChildren(stackingLayers) {
    sortChildrenByZIndex(stackingLayers.childStackingContextsWithNegativeStackLevels);
    sortChildrenByZIndex(stackingLayers.childStackingContextsWithPositiveStackLevels);
}
/**
 * Removes all stacking layers that are empty.
 */
function cleanupStackingLayerChildren(stackingLayers) {
    for (const name of STACKING_LAYER_NAMES) {
        const layer = stackingLayers[name];
        if (!layer.hasChildNodes()) {
            layer.remove();
        }
    }
}
//# sourceMappingURL=stacking.js.map
;// CONCATENATED MODULE: ./lib/accessibility.js

const isStandaloneFooter = (element) => !element.closest('article, aside, main, nav, section, [role="article"], [role="complementary"], [role="main"], [role="navigation"], [role="region"]');
function getAccessibilityAttributes(element, { labels, getUniqueId }) {
    var _a, _b, _c;
    // https://www.w3.org/TR/html-aria/
    const attributes = new Map();
    switch (element.tagName) {
        case 'A':
            attributes.set('role', 'link');
            break;
        case 'ARTICLE':
            attributes.set('role', 'article');
            break;
        case 'ASIDE':
            attributes.set('role', 'complementary');
            break;
        case 'BODY':
            attributes.set('role', 'document');
            break;
        case 'BUTTON':
        case 'SUMMARY':
            attributes.set('role', 'button');
            break;
        case 'DD':
            attributes.set('role', 'definition');
            break;
        case 'DETAILS':
            attributes.set('role', 'group');
            break;
        case 'DFN':
            attributes.set('role', 'term');
            break;
        case 'DIALOG':
            attributes.set('role', 'dialog');
            break;
        case 'DT':
            attributes.set('role', 'term');
            break;
        case 'FIELDSET':
            attributes.set('role', 'group');
            break;
        case 'FIGURE':
            attributes.set('role', 'figure');
            break;
        case 'FOOTER':
            if (isStandaloneFooter(element)) {
                attributes.set('role', 'contentinfo');
            }
            break;
        case 'FORM':
            attributes.set('role', 'form');
            break;
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'H6':
            attributes.set('role', 'heading');
            attributes.set('aria-level', element.tagName.slice(1));
            break;
        case 'HEADER':
            if (isStandaloneFooter(element)) {
                attributes.set('role', 'banner');
            }
            break;
        case 'HR':
            attributes.set('role', 'separator');
            break;
        case 'IMG': {
            const alt = element.getAttribute('alt');
            if (alt === null || alt !== '') {
                attributes.set('role', 'img');
                if (alt) {
                    attributes.set('aria-label', alt);
                }
            }
            break;
        }
        case 'INPUT':
            switch (element.type) {
                case 'button':
                case 'image':
                case 'reset':
                case 'submit':
                    attributes.set('role', 'button');
                    break;
                case 'number':
                    attributes.set('role', 'spinbutton');
                    break;
                case 'range':
                    attributes.set('role', 'slider');
                    break;
                case 'checkbox':
                    attributes.set('role', 'checkbox');
                    break;
                case 'radio':
                    attributes.set('role', 'radio');
                    break;
                case 'email':
                case 'tel':
                    if (!element.hasAttribute('list')) {
                        attributes.set('role', 'textbox');
                    }
                    break;
            }
            break;
        case 'LI':
            if (((_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.tagName) === 'OL' ||
                ((_b = element.parentElement) === null || _b === void 0 ? void 0 : _b.tagName) === 'UL' ||
                ((_c = element.parentElement) === null || _c === void 0 ? void 0 : _c.tagName) === 'MENU') {
                attributes.set('role', 'listitem');
            }
            break;
        case 'LINK':
            if (element.href) {
                attributes.set('role', 'link');
            }
            break;
        case 'MAIN':
            attributes.set('role', 'main');
            break;
        case 'MATH':
            attributes.set('role', 'math');
            break;
        case 'OL':
        case 'UL':
        case 'MENU':
            attributes.set('role', 'list');
            break;
        case 'NAV':
            attributes.set('role', 'navigation');
            break;
        case 'OPTION':
            attributes.set('role', 'option');
            break;
        case 'PROGRESS':
            attributes.set('role', 'progressbar');
            break;
        case 'SECTION':
            attributes.set('role', 'region');
            break;
        case 'SELECT':
            attributes.set('role', !element.hasAttribute('multiple') && element.size <= 1 ? 'combobox' : 'listbox');
            break;
        case 'TABLE':
            attributes.set('role', 'table');
            break;
        case 'THEAD':
        case 'TBODY':
        case 'TFOOT':
            attributes.set('role', 'rowgroup');
            break;
        case 'TEXTAREA':
            attributes.set('role', 'textbox');
            break;
        case 'TD':
            attributes.set('role', 'cell');
            break;
        case 'TH':
            attributes.set('role', element.closest('thead') ? 'columnheader' : 'rowheader');
            break;
        case 'TR':
            attributes.set('role', 'tablerow');
            break;
    }
    if (element.hasAttribute('disabled')) {
        attributes.set('aria-disabled', 'true');
    }
    if (element.hasAttribute('placeholder')) {
        attributes.set('aria-placeholder', element.getAttribute('placeholder') || '');
    }
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex) {
        attributes.set('tabindex', tabIndex);
    }
    if (isHTMLElement(element) && hasLabels(element) && element.labels) {
        // Need to invert the label[for] / [aria-labelledby] relationship
        attributes.set('aria-labelledby', [...element.labels]
            .map(label => {
            let labelId = label.id || labels.get(label);
            if (!labelId) {
                labelId = getUniqueId('label');
                labels.set(label, labelId);
            }
            return labelId;
        })
            .join(' '));
    }
    for (const attribute of element.attributes) {
        if (attribute.name.startsWith('aria-')) {
            attributes.set(attribute.name, attribute.value);
        }
    }
    const customRole = element.getAttribute('role');
    if (customRole) {
        attributes.set('role', customRole);
    }
    return attributes;
}
//# sourceMappingURL=accessibility.js.map
// EXTERNAL MODULE: ./node_modules/gradient-parser/build/node.js
var node = __webpack_require__(190);
;// CONCATENATED MODULE: ./lib/gradients.js
/* eslint-disable id-length */


const positionsForOrientation = (orientation) => {
    const positions = {
        x1: '0%',
        x2: '0%',
        y1: '0%',
        y2: '0%',
    };
    if ((orientation === null || orientation === void 0 ? void 0 : orientation.type) === 'angular') {
        const anglePI = orientation.value * (Math.PI / 180);
        positions.x1 = `${Math.round(50 + Math.sin(anglePI + Math.PI) * 50)}%`;
        positions.y1 = `${Math.round(50 + Math.cos(anglePI) * 50)}%`;
        positions.x2 = `${Math.round(50 + Math.sin(anglePI) * 50)}%`;
        positions.y2 = `${Math.round(50 + Math.cos(anglePI + Math.PI) * 50)}%`;
    }
    else if ((orientation === null || orientation === void 0 ? void 0 : orientation.type) === 'directional') {
        switch (orientation.value) {
            case 'left':
                positions.x1 = '100%';
                break;
            case 'top':
                positions.y1 = '100%';
                break;
            case 'right':
                positions.x2 = '100%';
                break;
            case 'bottom':
                positions.y2 = '100%';
                break;
        }
    }
    return positions;
};
function convertLinearGradient(css, { svgDocument }) {
    const { orientation, colorStops } = node/* parse */.q(css)[0];
    const { x1, x2, y1, y2 } = positionsForOrientation(orientation);
    const getColorStops = (colorStop, index) => {
        const offset = `${(index / (colorStops.length - 1)) * 100}%`;
        let stopColor = 'rgb(0,0,0)';
        let stopOpacity = 1;
        switch (colorStop.type) {
            case 'rgb': {
                const [red, green, blue] = colorStop.value;
                stopColor = `rgb(${red},${green},${blue})`;
                break;
            }
            case 'rgba': {
                const [red, green, blue, alpha] = colorStop.value;
                stopColor = `rgb(${red},${green},${blue})`;
                stopOpacity = alpha;
                break;
            }
            case 'hex': {
                stopColor = `#${colorStop.value}`;
                break;
            }
            case 'literal': {
                stopColor = colorStop.value;
                break;
            }
        }
        const stop = svgDocument.createElementNS(svgNamespace, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', stopColor);
        stop.setAttribute('stop-opacity', stopOpacity.toString());
        return stop;
    };
    const linearGradient = svgDocument.createElementNS(svgNamespace, 'linearGradient');
    linearGradient.setAttribute('x1', x1);
    linearGradient.setAttribute('y1', y1);
    linearGradient.setAttribute('x2', x2);
    linearGradient.setAttribute('y2', y2);
    linearGradient.append(...colorStops.map(getColorStops));
    return linearGradient;
}
//# sourceMappingURL=gradients.js.map
;// CONCATENATED MODULE: ./lib/util.js
const createIdGenerator = () => {
    const nextCounts = new Map();
    return prefix => {
        var _a;
        const count = (_a = nextCounts.get(prefix)) !== null && _a !== void 0 ? _a : 1;
        nextCounts.set(prefix, count + 1);
        return `${prefix}${count}`;
    };
};
const isDefined = (value) => value !== null && value !== undefined;
/**
 * Check if two rectangles (e.g. an element and the capture area) intersect.
 */
const doRectanglesIntersect = (a, b) => !(a.bottom < b.top || // A is above B
    a.top > b.bottom || // A is below B
    a.right < b.left || // A is left of B
    // A is right of B
    a.left > b.right);
/**
 * Calculates the length of the diagonale of a given rectangle.
 */
function diagonale(box) {
    return Math.sqrt(box.width ** 2 + box.height ** 2);
}
function withTimeout(timeout, message, func) {
    return Promise.race([
        func(),
        new Promise((resolve, reject) => setTimeout(() => reject(new Error(message)), timeout)),
    ]);
}
/**
 * Type guard to check if an object is a specific member of a tagged union type.
 *
 * @param key The key to check
 * @param value The value the key has to be.
 */
const isTaggedUnionMember = (key, value) => (object) => object[key] === value;
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ./lib/text.js



function handleTextNode(textNode, context) {
    if (!textNode.ownerDocument.defaultView) {
        throw new Error("Element's ownerDocument has no defaultView");
    }
    const window = textNode.ownerDocument.defaultView;
    const parentElement = textNode.parentElement;
    const styles = window.getComputedStyle(parentElement);
    if (!isVisible(styles)) {
        return;
    }
    const selection = window.getSelection();
    assert(selection, 'Could not obtain selection from window. Selection is needed for detecting whitespace collapsing in text.');
    const svgTextElement = context.svgDocument.createElementNS(svgNamespace, 'text');
    // Copy text styles
    // https://css-tricks.com/svg-properties-and-css
    copyTextStyles(styles, svgTextElement);
    const tabSize = parseInt(styles.tabSize, 10);
    // Make sure the y attribute is the bottom of the box, not the baseline
    svgTextElement.setAttribute('dominant-baseline', 'text-after-edge');
    const lineRange = textNode.ownerDocument.createRange();
    lineRange.setStart(textNode, 0);
    lineRange.setEnd(textNode, 0);
    while (true) {
        const addTextSpanForLineRange = () => {
            if (lineRange.collapsed) {
                return;
            }
            const lineRectangle = lineRange.getClientRects()[0];
            if (!doRectanglesIntersect(lineRectangle, context.options.captureArea)) {
                return;
            }
            const textSpan = context.svgDocument.createElementNS(svgNamespace, 'tspan');
            textSpan.setAttribute('xml:space', 'preserve');
            // lineRange.toString() returns the text including whitespace.
            // by adding the range to a Selection, then getting the text from that selection,
            // we can let the DOM handle whitespace collapsing the same way as innerText (but for a Range).
            // For this to work, the parent element must not forbid user selection.
            const previousUserSelect = parentElement.style.userSelect;
            parentElement.style.userSelect = 'all';
            try {
                selection.removeAllRanges();
                selection.addRange(lineRange);
                textSpan.textContent = selection
                    .toString()
                    // SVG does not support tabs in text. Tabs get rendered as one space character. Convert the
                    // tabs to spaces according to tab-size instead.
                    // Ideally we would keep the tab and create offset tspans.
                    .replace(/\t/g, ' '.repeat(tabSize));
            }
            finally {
                parentElement.style.userSelect = previousUserSelect;
                selection.removeAllRanges();
            }
            textSpan.setAttribute('x', lineRectangle.x.toString());
            textSpan.setAttribute('y', lineRectangle.bottom.toString()); // intentionally bottom because of dominant-baseline setting
            textSpan.setAttribute('textLength', lineRectangle.width.toString());
            textSpan.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            svgTextElement.append(textSpan);
        };
        try {
            lineRange.setEnd(textNode, lineRange.endOffset + 1);
        }
        catch (error) {
            if (error.code === DOMException.INDEX_SIZE_ERR) {
                // Reached the end
                addTextSpanForLineRange();
                break;
            }
            throw error;
        }
        // getClientRects() returns one rectangle for each line of a text node.
        const lineRectangles = lineRange.getClientRects();
        // If no lines
        if (!lineRectangles[0]) {
            // Pure whitespace text nodes are collapsed and not rendered.
            return;
        }
        // If two (unique) lines
        // For some reason, Chrome returns 2 identical DOMRects for text with text-overflow: ellipsis.
        if (lineRectangles[1] && lineRectangles[0].top !== lineRectangles[1].top) {
            // Crossed a line break.
            // Go back one character to select exactly the previous line.
            lineRange.setEnd(textNode, lineRange.endOffset - 1);
            // Add <tspan> for exactly that line
            addTextSpanForLineRange();
            // Start on the next line.
            lineRange.setStart(textNode, lineRange.endOffset);
        }
    }
    context.currentSvgParent.append(svgTextElement);
}
const textAttributes = new Set([
    'color',
    'dominant-baseline',
    'font-family',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'direction',
    'letter-spacing',
    'text-decoration',
    'text-anchor',
    'text-decoration',
    'text-rendering',
    'unicode-bidi',
    'word-spacing',
    'writing-mode',
    'user-select',
]);
function copyTextStyles(styles, svgElement) {
    for (const textProperty of textAttributes) {
        const value = styles.getPropertyValue(textProperty);
        if (value) {
            svgElement.setAttribute(textProperty, value);
        }
    }
    // tspan uses fill, CSS uses color
    svgElement.setAttribute('fill', styles.color);
}
//# sourceMappingURL=text.js.map
;// CONCATENATED MODULE: ./lib/svg.js





/**
 * Recursively clone an `<svg>` element, inlining it into the output SVG document with the necessary transforms.
 */
function handleSvgNode(node, context) {
    if (isElement(node)) {
        if (!isSVGElement(node)) {
            return;
        }
        handleSvgElement(node, context);
    }
    else if (isTextNode(node)) {
        const clonedTextNode = node.cloneNode(true);
        context.currentSvgParent.append(clonedTextNode);
    }
}
const ignoredElements = new Set(['script', 'style', 'foreignElement']);
const URL_ID_REFERENCE_REGEX = /\burl\(["']?#/;
function handleSvgElement(element, context) {
    var _a, _b, _c, _d;
    if (ignoredElements.has(element.tagName)) {
        return;
    }
    let elementToAppend;
    if (isSVGSVGElement(element)) {
        const contentContainer = context.svgDocument.createElementNS(svgNamespace, 'g');
        elementToAppend = contentContainer;
        contentContainer.classList.add('svg-content', ...element.classList);
        contentContainer.dataset.viewBox = (_a = element.getAttribute('viewBox')) !== null && _a !== void 0 ? _a : '';
        contentContainer.dataset.width = (_b = element.getAttribute('width')) !== null && _b !== void 0 ? _b : '';
        contentContainer.dataset.height = (_c = element.getAttribute('height')) !== null && _c !== void 0 ? _c : '';
        // Since the SVG is getting inlined into the output SVG, we need to transform its contents according to its
        // viewBox, width, height and preserveAspectRatio. We can use getScreenCTM() for this on one of its
        // SVGGraphicsElement children (in Chrome calling it on the <svg> works too, but not in Firefox:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=873106).
        for (const child of element.children) {
            if (!isSVGGraphicsElement(child)) {
                continue;
            }
            let viewBoxTransformMatrix = 
            // When this function is called on an inline <svg> element in the original DOM, we want
            // getScreenCTM() to map it to the DOM coordinate system. When this function is called from
            // inlineResources() the <svg> is already embedded into the output <svg>. In that case the output
            // SVG already has a viewBox, and the coordinate system of the SVG is not equal to the coordinate
            // system of the screen, therefor we need to use getCTM() to map it into the output SVG's
            // coordinate system.
            child.ownerDocument !== context.svgDocument &&
                // When we inline an SVG, we put a transform on it for the getScreenCTM(). When that SVG also
                // contains another SVG, the inner SVG should just get transformed relative to the outer SVG, not
                // relative to the screen, because the transforms will stack in the output SVG.
                !((_d = element.parentElement) === null || _d === void 0 ? void 0 : _d.closest('svg'))
                ? child.getScreenCTM()
                : child.getCTM();
            // This should only be null if the <svg> is `display: none`
            if (!viewBoxTransformMatrix) {
                break;
            }
            // Make sure to handle a child that already has a transform. That transform should only apply to the
            // child, not to the entire SVG contents, so we need to calculate it out.
            if (child.transform.baseVal.numberOfItems > 0) {
                child.transform.baseVal.consolidate();
                const existingTransform = child.transform.baseVal.getItem(0).matrix;
                viewBoxTransformMatrix = viewBoxTransformMatrix.multiply(existingTransform.inverse());
            }
            contentContainer.transform.baseVal.appendItem(contentContainer.transform.baseVal.createSVGTransformFromMatrix(viewBoxTransformMatrix));
            break;
        }
    }
    else {
        // Clone element
        if (isSVGAnchorElement(element) && !context.options.keepLinks) {
            elementToAppend = context.svgDocument.createElementNS(svgNamespace, 'g');
        }
        else {
            elementToAppend = element.cloneNode(false);
        }
        // Remove event handlers
        for (const attribute of elementToAppend.attributes) {
            if (attribute.localName.startsWith('on')) {
                elementToAppend.attributes.removeNamedItemNS(attribute.namespaceURI, attribute.localName);
            }
            else if (attribute.localName === 'href' && attribute.value.startsWith('javascript:')) {
                elementToAppend.attributes.removeNamedItemNS(attribute.namespaceURI, attribute.localName);
            }
        }
        const window = element.ownerDocument.defaultView;
        assert(window, "Element's ownerDocument has no defaultView");
        const svgViewportElement = element.ownerSVGElement;
        assert(svgViewportElement, 'Expected element to have ownerSVGElement');
        const styles = window.getComputedStyle(element);
        if (isSVGGraphicsElement(element)) {
            copyGraphicalPresentationAttributes(styles, elementToAppend, svgViewportElement.viewBox.animVal);
            if (isSVGTextContentElement(element)) {
                copyTextStyles(styles, elementToAppend);
            }
        }
        // Namespace ID references url(#...)
        for (const attribute of elementToAppend.attributes) {
            if (attribute.localName === 'href') {
                if (attribute.value.startsWith('#')) {
                    attribute.value = attribute.value.replace('#', `#${context.idPrefix}`);
                }
            }
            else if (URL_ID_REFERENCE_REGEX.test(attribute.value)) {
                attribute.value = rewriteUrlIdReferences(attribute.value, context);
            }
        }
        for (const property of elementToAppend.style) {
            const value = elementToAppend.style.getPropertyValue(property);
            if (URL_ID_REFERENCE_REGEX.test(value)) {
                elementToAppend.style.setProperty(property, rewriteUrlIdReferences(value, context), elementToAppend.style.getPropertyPriority(property));
            }
        }
    }
    // Make sure all IDs are unique
    if (elementToAppend.id) {
        elementToAppend.id = context.idPrefix + elementToAppend.id;
    }
    context.currentSvgParent.append(elementToAppend);
    for (const child of element.childNodes) {
        handleSvgNode(child, { ...context, currentSvgParent: elementToAppend });
    }
}
const graphicalPresentationAttributes = [
    'alignment-baseline',
    'baseline-shift',
    // 'clip',
    'clip-path',
    'clip-rule',
    'color',
    'color-interpolation',
    'color-interpolation-filters',
    // 'color-profile',
    'color-rendering',
    // 'cursor',
    'direction',
    // 'display',
    // 'enable-background',
    'fill',
    'fill-opacity',
    'fill-rule',
    'filter',
    'flood-color',
    'flood-opacity',
    'image-rendering',
    'lighting-color',
    'marker-end',
    'marker-mid',
    'marker-start',
    'mask',
    'opacity',
    // 'overflow',
    'pointer-events',
    'shape-rendering',
    // 'solid-color',
    // 'solid-opacity',
    'stop-color',
    'stop-opacity',
    'stroke',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-opacity',
    'stroke-width',
    'transform',
    'vector-effect',
    'visibility',
];
const defaults = {
    'alignment-baseline': 'auto',
    'baseline-shift': '0px',
    'clip-path': 'none',
    'clip-rule': 'nonzero',
    'color-interpolation-filters': 'linearrgb',
    'color-interpolation': 'srgb',
    'color-rendering': 'auto',
    'fill-opacity': '1',
    'fill-rule': 'nonzero',
    'flood-color': 'rgb(0, 0, 0)',
    'flood-opacity': '1',
    'image-rendering': 'auto',
    'lighting-color': 'rgb(255, 255, 255)',
    'marker-end': 'none',
    'marker-mid': 'none',
    'marker-start': 'none',
    'pointer-events': 'auto',
    'shape-rendering': 'auto',
    'stop-color': 'rgb(0, 0, 0)',
    'stop-opacity': '1',
    'stroke-dasharray': 'none',
    'stroke-dashoffset': '0px',
    'stroke-linecap': 'butt',
    'stroke-linejoin': 'miter',
    'stroke-miterlimit': '4',
    'stroke-opacity': '1',
    'stroke-width': '1px',
    'vector-effect': 'none',
    color: '',
    direction: 'ltr',
    fill: '',
    filter: 'none',
    mask: 'none',
    opacity: '1',
    stroke: '',
    transform: 'none',
    visibility: 'visible',
};
/**
 * Prefixes all ID references of the form `url(#id)` in the given string.
 */
function rewriteUrlIdReferences(value, { idPrefix }) {
    const parsedValue = lib(value);
    parsedValue.walk(node => {
        if (node.type !== 'function' || node.value !== 'url') {
            return;
        }
        const urlArgument = node.nodes[0];
        if (!urlArgument) {
            return;
        }
        urlArgument.value = urlArgument.value.replace('#', `#${idPrefix}`);
    });
    return lib.stringify(parsedValue.nodes);
}
function copyGraphicalPresentationAttributes(styles, target, viewBox) {
    var _a;
    for (const attribute of graphicalPresentationAttributes) {
        let value = styles.getPropertyValue(attribute);
        if (value && value !== defaults[attribute]) {
            if (value.endsWith('%')) {
                // E.g. https://svgwg.org/svg2-draft/painting.html#StrokeWidth
                // Percentages:	refer to the normalized diagonal of the current SVG viewport (see Units)
                value = (_a = parseCSSLength(value, diagonale(viewBox))) !== null && _a !== void 0 ? _a : 0;
            }
            target.setAttribute(attribute, value.toString());
        }
    }
}
//# sourceMappingURL=svg.js.map
;// CONCATENATED MODULE: ./lib/element.js










function handleElement(element, context) {
    var _a, _b, _c, _d, _e, _f, _g;
    const cleanupFunctions = [];
    try {
        const window = element.ownerDocument.defaultView;
        if (!window) {
            throw new Error("Element's ownerDocument has no defaultView");
        }
        const bounds = element.getBoundingClientRect(); // Includes borders
        const rectanglesIntersect = doRectanglesIntersect(bounds, context.options.captureArea);
        const styles = window.getComputedStyle(element);
        const parentStyles = element.parentElement && window.getComputedStyle(element.parentElement);
        const svgContainer = isHTMLAnchorElement(element) && context.options.keepLinks
            ? createSvgAnchor(element, context)
            : context.svgDocument.createElementNS(svgNamespace, 'g');
        // Add IDs, classes, debug info
        svgContainer.dataset.tag = element.tagName.toLowerCase();
        const id = element.id || context.getUniqueId(element.classList[0] || element.tagName.toLowerCase());
        svgContainer.id = id;
        const className = element.getAttribute('class');
        if (className) {
            svgContainer.setAttribute('class', className);
        }
        // Title
        if (isHTMLElement(element) && element.title) {
            const svgTitle = context.svgDocument.createElementNS(svgNamespace, 'title');
            svgTitle.textContent = element.title;
            svgContainer.prepend(svgTitle);
        }
        // Which parent should the container itself be appended to?
        const stackingLayerName = determineStackingLayer(styles, parentStyles);
        const stackingLayer = stackingLayerName
            ? context.stackingLayers[stackingLayerName]
            : context.parentStackingLayer;
        if (stackingLayer) {
            context.currentSvgParent.setAttribute('aria-owns', [context.currentSvgParent.getAttribute('aria-owns'), svgContainer.id].filter(Boolean).join(' '));
        }
        // If the parent is within the same stacking layer, append to the parent.
        // Otherwise append to the right stacking layer.
        const elementToAppendTo = context.parentStackingLayer === stackingLayer ? context.currentSvgParent : stackingLayer;
        svgContainer.dataset.zIndex = styles.zIndex; // Used for sorting
        elementToAppendTo.append(svgContainer);
        // If the element establishes a stacking context, create subgroups for each stacking layer.
        let childContext;
        let backgroundContainer;
        let ownStackingLayers;
        if (establishesStackingContext(styles, parentStyles)) {
            ownStackingLayers = createStackingLayers(svgContainer);
            backgroundContainer = ownStackingLayers.rootBackgroundAndBorders;
            childContext = {
                ...context,
                currentSvgParent: svgContainer,
                stackingLayers: ownStackingLayers,
                parentStackingLayer: stackingLayer,
            };
        }
        else {
            backgroundContainer = svgContainer;
            childContext = {
                ...context,
                currentSvgParent: svgContainer,
                parentStackingLayer: stackingLayer,
            };
        }
        // Opacity
        if (styles.opacity !== '1') {
            svgContainer.setAttribute('opacity', styles.opacity);
        }
        // Accessibility
        for (const [name, value] of getAccessibilityAttributes(element, context)) {
            svgContainer.setAttribute(name, value);
        }
        // Handle ::before and ::after by creating temporary child elements in the DOM.
        // Avoid infinite loop, in case `element` already is already a synthetic element created by us for a pseudo element.
        if (isHTMLElement(element) && !element.dataset.pseudoElement) {
            const handlePseudoElement = (pseudoSelector, position) => {
                const pseudoElementStyles = window.getComputedStyle(element, pseudoSelector);
                const content = lib(pseudoElementStyles.content).nodes.find(isTaggedUnionMember('type', 'string'));
                if (!content) {
                    return;
                }
                // Pseudo elements are inline by default (like a span)
                const span = element.ownerDocument.createElement('span');
                span.dataset.pseudoElement = pseudoSelector;
                copyCssStyles(pseudoElementStyles, span.style);
                span.textContent = unescapeStringValue(content.value);
                element.dataset.pseudoElementOwner = id;
                cleanupFunctions.push(() => element.removeAttribute('data-pseudo-element-owner'));
                const style = element.ownerDocument.createElement('style');
                // Hide the *actual* pseudo element temporarily while we have a real DOM equivalent in the DOM
                style.textContent = `[data-pseudo-element-owner="${id}"]${pseudoSelector} { display: none !important; }`;
                element.before(style);
                cleanupFunctions.push(() => style.remove());
                element[position](span);
                cleanupFunctions.push(() => span.remove());
            };
            handlePseudoElement('::before', 'prepend');
            handlePseudoElement('::after', 'append');
            // TODO handle ::marker etc
        }
        if (rectanglesIntersect) {
            addBackgroundAndBorders(styles, bounds, backgroundContainer, window, context);
        }
        // If element is overflow: hidden, create a masking rectangle to hide any overflowing content of any descendants.
        // Use <mask> instead of <clipPath> as Figma supports <mask>, but not <clipPath>.
        if (styles.overflow !== 'visible') {
            const mask = context.svgDocument.createElementNS(svgNamespace, 'mask');
            mask.id = context.getUniqueId('mask-for-' + id);
            const visibleRectangle = createBox(bounds, context);
            visibleRectangle.setAttribute('fill', '#ffffff');
            mask.append(visibleRectangle);
            svgContainer.append(mask);
            svgContainer.setAttribute('mask', `url(#${mask.id})`);
            childContext = {
                ...childContext,
                ancestorMasks: [{ mask, forElement: element }, ...childContext.ancestorMasks],
            };
        }
        if (isHTMLElement(element) &&
            (styles.position === 'absolute' || styles.position === 'fixed') &&
            context.ancestorMasks.length > 0 &&
            element.offsetParent) {
            // Absolute and fixed elements are out of the flow and will bleed out of an `overflow: hidden` ancestor
            // as long as their offsetParent is higher up than the mask element.
            for (const { mask, forElement } of context.ancestorMasks) {
                if (element.offsetParent.contains(forElement) || element.offsetParent === forElement) {
                    // Add a cutout to the ancestor mask
                    const visibleRectangle = createBox(bounds, context);
                    visibleRectangle.setAttribute('fill', '#ffffff');
                    mask.append(visibleRectangle);
                }
                else {
                    break;
                }
            }
        }
        if (rectanglesIntersect &&
            isHTMLImageElement(element) &&
            // Make sure the element has a src/srcset attribute (the relative URL). `element.src` is absolute and always defined.
            (element.getAttribute('src') || element.getAttribute('srcset'))) {
            const svgImage = context.svgDocument.createElementNS(svgNamespace, 'image');
            svgImage.id = `${id}-image`; // read by inlineResources()
            svgImage.setAttribute('xlink:href', element.currentSrc || element.src);
            const paddingLeft = (_a = parseCSSLength(styles.paddingLeft, bounds.width)) !== null && _a !== void 0 ? _a : 0;
            const paddingRight = (_b = parseCSSLength(styles.paddingRight, bounds.width)) !== null && _b !== void 0 ? _b : 0;
            const paddingTop = (_c = parseCSSLength(styles.paddingTop, bounds.height)) !== null && _c !== void 0 ? _c : 0;
            const paddingBottom = (_d = parseCSSLength(styles.paddingBottom, bounds.height)) !== null && _d !== void 0 ? _d : 0;
            svgImage.setAttribute('x', (bounds.x + paddingLeft).toString());
            svgImage.setAttribute('y', (bounds.y + paddingTop).toString());
            svgImage.setAttribute('width', (bounds.width - paddingLeft - paddingRight).toString());
            svgImage.setAttribute('height', (bounds.height - paddingTop - paddingBottom).toString());
            if (element.alt) {
                svgImage.setAttribute('aria-label', element.alt);
            }
            svgContainer.append(svgImage);
        }
        else if (rectanglesIntersect && isHTMLInputElement(element) && bounds.width > 0 && bounds.height > 0) {
            // Handle button labels or input field content
            if (element.value) {
                const svgTextElement = context.svgDocument.createElementNS(svgNamespace, 'text');
                copyTextStyles(styles, svgTextElement);
                svgTextElement.setAttribute('dominant-baseline', 'central');
                svgTextElement.setAttribute('xml:space', 'preserve');
                svgTextElement.setAttribute('x', (bounds.x + ((_e = parseCSSLength(styles.paddingLeft, bounds.width)) !== null && _e !== void 0 ? _e : 0)).toString());
                const top = bounds.top + ((_f = parseCSSLength(styles.paddingTop, bounds.height)) !== null && _f !== void 0 ? _f : 0);
                const bottom = bounds.bottom + ((_g = parseCSSLength(styles.paddingBottom, bounds.height)) !== null && _g !== void 0 ? _g : 0);
                const middle = (top + bottom) / 2;
                svgTextElement.setAttribute('y', middle.toString());
                svgTextElement.textContent = element.value;
                childContext.stackingLayers.inFlowInlineLevelNonPositionedDescendants.append(svgTextElement);
            }
        }
        else if (rectanglesIntersect && isSVGSVGElement(element) && isVisible(styles)) {
            handleSvgNode(element, { ...childContext, idPrefix: `${id}-` });
        }
        else {
            // Walk children even if rectangles don't intersect,
            // because children can overflow the parent's bounds as long as overflow: visible (default).
            for (const child of element.childNodes) {
                walkNode(child, childContext);
            }
            if (ownStackingLayers) {
                sortStackingLayerChildren(ownStackingLayers);
                cleanupStackingLayerChildren(ownStackingLayers);
            }
        }
    }
    finally {
        for (const cleanup of cleanupFunctions) {
            cleanup();
        }
    }
}
function addBackgroundAndBorders(styles, bounds, backgroundAndBordersContainer, window, context) {
    var _a, _b, _c, _d;
    if (isVisible(styles)) {
        if (bounds.width > 0 &&
            bounds.height > 0 &&
            (!isTransparent(styles.backgroundColor) || hasUniformBorder(styles) || styles.backgroundImage !== 'none')) {
            const box = createBackgroundAndBorderBox(bounds, styles, context);
            backgroundAndBordersContainer.append(box);
            if (styles.backgroundImage !== 'none') {
                const backgrounds = lib(styles.backgroundImage)
                    .nodes.filter(isTaggedUnionMember('type', 'function'))
                    .reverse();
                const xBackgroundPositions = styles.backgroundPositionX.split(/\s*,\s*/g);
                const yBackgroundPositions = styles.backgroundPositionY.split(/\s*,\s*/g);
                const backgroundRepeats = styles.backgroundRepeat.split(/\s*,\s*/g);
                for (const [index, backgroundNode] of backgrounds.entries()) {
                    const backgroundPositionX = (_a = parseCSSLength(xBackgroundPositions[index], bounds.width)) !== null && _a !== void 0 ? _a : 0;
                    const backgroundPositionY = (_b = parseCSSLength(yBackgroundPositions[index], bounds.height)) !== null && _b !== void 0 ? _b : 0;
                    const backgroundRepeat = backgroundRepeats[index];
                    if (backgroundNode.value === 'url' && backgroundNode.nodes[0]) {
                        const urlArgument = backgroundNode.nodes[0];
                        const image = context.svgDocument.createElementNS(svgNamespace, 'image');
                        image.id = context.getUniqueId('background-image'); // read by inlineResources()
                        const [cssWidth = 'auto', cssHeight = 'auto'] = styles.backgroundSize.split(' ');
                        const backgroundWidth = (_c = parseCSSLength(cssWidth, bounds.width)) !== null && _c !== void 0 ? _c : bounds.width;
                        const backgroundHeight = (_d = parseCSSLength(cssHeight, bounds.height)) !== null && _d !== void 0 ? _d : bounds.height;
                        image.setAttribute('width', backgroundWidth.toString());
                        image.setAttribute('height', backgroundHeight.toString());
                        if (cssWidth !== 'auto' && cssHeight !== 'auto') {
                            image.setAttribute('preserveAspectRatio', 'none');
                        }
                        else if (styles.backgroundSize === 'contain') {
                            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                        }
                        else if (styles.backgroundSize === 'cover') {
                            image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
                        }
                        // Technically not correct, because relative URLs should be resolved relative to the stylesheet,
                        // not the page. But we have no means to know what stylesheet the style came from
                        // (unless we iterate through all rules in all style sheets and find the matching one).
                        const url = new URL(unescapeStringValue(urlArgument.value), window.location.href);
                        image.setAttribute('xlink:href', url.href);
                        if (backgroundRepeat === 'no-repeat' ||
                            (backgroundPositionX === 0 &&
                                backgroundPositionY === 0 &&
                                backgroundWidth === bounds.width &&
                                backgroundHeight === bounds.height)) {
                            image.setAttribute('x', bounds.x.toString());
                            image.setAttribute('y', bounds.y.toString());
                            backgroundAndBordersContainer.append(image);
                        }
                        else {
                            image.setAttribute('x', '0');
                            image.setAttribute('y', '0');
                            const pattern = context.svgDocument.createElementNS(svgNamespace, 'pattern');
                            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
                            pattern.setAttribute('patternContentUnits', 'userSpaceOnUse');
                            pattern.setAttribute('x', (bounds.x + backgroundPositionX).toString());
                            pattern.setAttribute('y', (bounds.y + backgroundPositionY).toString());
                            pattern.setAttribute('width', (backgroundRepeat === 'repeat' || backgroundRepeat === 'repeat-x'
                                ? backgroundWidth
                                : // If background shouldn't repeat on this axis, make the tile as big as the element so the repetition is cut off.
                                    backgroundWidth + bounds.x + backgroundPositionX).toString());
                            pattern.setAttribute('height', (backgroundRepeat === 'repeat' || backgroundRepeat === 'repeat-y'
                                ? backgroundHeight
                                : // If background shouldn't repeat on this axis, make the tile as big as the element so the repetition is cut off.
                                    backgroundHeight + bounds.y + backgroundPositionY).toString());
                            pattern.id = context.getUniqueId('pattern');
                            pattern.append(image);
                            box.before(pattern);
                            box.setAttribute('fill', `url(#${pattern.id})`);
                        }
                    }
                    else if (/^(-webkit-)?linear-gradient$/.test(backgroundNode.value)) {
                        const linearGradientCss = lib.stringify(backgroundNode);
                        const svgLinearGradient = convertLinearGradient(linearGradientCss, context);
                        if (backgroundPositionX !== 0 || backgroundPositionY !== 0) {
                            svgLinearGradient.setAttribute('gradientTransform', `translate(${backgroundPositionX}, ${backgroundPositionY})`);
                        }
                        svgLinearGradient.id = context.getUniqueId('linear-gradient');
                        box.before(svgLinearGradient);
                        box.setAttribute('fill', `url(#${svgLinearGradient.id})`);
                    }
                }
            }
        }
        if (!hasUniformBorder(styles)) {
            // Draw lines for each border
            for (const borderLine of createBorders(styles, bounds, context)) {
                backgroundAndBordersContainer.append(borderLine);
            }
        }
    }
}
function createBox(bounds, context) {
    const box = context.svgDocument.createElementNS(svgNamespace, 'rect');
    // TODO consider rotation
    box.setAttribute('width', bounds.width.toString());
    box.setAttribute('height', bounds.height.toString());
    box.setAttribute('x', bounds.x.toString());
    box.setAttribute('y', bounds.y.toString());
    return box;
}
function createBackgroundAndBorderBox(bounds, styles, context) {
    const background = createBox(bounds, context);
    // TODO handle background image and other properties
    if (styles.backgroundColor) {
        background.setAttribute('fill', styles.backgroundColor);
    }
    if (hasUniformBorder(styles)) {
        // Uniform border, use stroke
        // Cannot use borderColor/borderWidth directly as in Firefox those are empty strings.
        // Need to get the border property from some specific side (they are all the same in this condition).
        // https://stackoverflow.com/questions/41696063/getcomputedstyle-returns-empty-strings-on-ff-when-instead-crome-returns-a-comp
        background.setAttribute('stroke', styles.borderTopColor);
        background.setAttribute('stroke-width', styles.borderTopWidth);
        if (styles.borderTopStyle === 'dashed') {
            // > Displays a series of short square-ended dashes or line segments.
            // > The exact size and length of the segments are not defined by the specification and are implementation-specific.
            background.setAttribute('stroke-dasharray', '1');
        }
    }
    // Set border radius
    // Approximation, always assumes uniform border-radius by using the top-left horizontal radius and the top-left vertical radius for all corners.
    // TODO support irregular border radii on all corners by drawing border as a <path>.
    const overlappingCurvesFactor = calculateOverlappingCurvesFactor(styles, bounds);
    const radiusX = getBorderRadiiForSide('top', styles, bounds)[0] * overlappingCurvesFactor;
    const radiusY = getBorderRadiiForSide('left', styles, bounds)[0] * overlappingCurvesFactor;
    if (radiusX !== 0) {
        background.setAttribute('rx', radiusX.toString());
    }
    if (radiusY !== 0) {
        background.setAttribute('ry', radiusY.toString());
    }
    return background;
}
function* createBorders(styles, bounds, context) {
    for (const side of ['top', 'bottom', 'right', 'left']) {
        if (hasBorder(styles, side)) {
            yield createBorder(styles, bounds, side, context);
        }
    }
}
function hasBorder(styles, side) {
    return (!!styles.getPropertyValue(`border-${side}-color`) &&
        !isTransparent(styles.getPropertyValue(`border-${side}-color`)) &&
        styles.getPropertyValue(`border-${side}-width`) !== '0px');
}
function createBorder(styles, bounds, side, context) {
    // TODO handle border-radius for non-uniform borders
    const border = context.svgDocument.createElementNS(svgNamespace, 'line');
    border.setAttribute('stroke-linecap', 'square');
    const color = styles.getPropertyValue(`border-${side}-color`);
    border.setAttribute('stroke', color);
    border.setAttribute('stroke-width', styles.getPropertyValue(`border-${side}-width`));
    // Handle inset/outset borders
    const borderStyle = styles.getPropertyValue(`border-${side}-style`);
    if ((borderStyle === 'inset' && (side === 'top' || side === 'left')) ||
        (borderStyle === 'outset' && (side === 'right' || side === 'bottom'))) {
        const match = color.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
        if (!match) {
            throw new Error(`Unexpected color: ${color}`);
        }
        const components = match.slice(1, 4).map(value => parseInt(value, 10) * 0.3);
        if (match[4]) {
            components.push(parseFloat(match[4]));
        }
        // Low-light border
        // https://stackoverflow.com/questions/4147940/how-do-browsers-determine-which-exact-colors-to-use-for-border-inset-or-outset
        border.setAttribute('stroke', `rgba(${components.join(', ')})`);
    }
    if (side === 'top') {
        border.setAttribute('x1', bounds.left.toString());
        border.setAttribute('x2', bounds.right.toString());
        border.setAttribute('y1', bounds.top.toString());
        border.setAttribute('y2', bounds.top.toString());
    }
    else if (side === 'left') {
        border.setAttribute('x1', bounds.left.toString());
        border.setAttribute('x2', bounds.left.toString());
        border.setAttribute('y1', bounds.top.toString());
        border.setAttribute('y2', bounds.bottom.toString());
    }
    else if (side === 'right') {
        border.setAttribute('x1', bounds.right.toString());
        border.setAttribute('x2', bounds.right.toString());
        border.setAttribute('y1', bounds.top.toString());
        border.setAttribute('y2', bounds.bottom.toString());
    }
    else if (side === 'bottom') {
        border.setAttribute('x1', bounds.left.toString());
        border.setAttribute('x2', bounds.right.toString());
        border.setAttribute('y1', bounds.bottom.toString());
        border.setAttribute('y2', bounds.bottom.toString());
    }
    return border;
}
function createSvgAnchor(element, context) {
    const svgAnchor = context.svgDocument.createElementNS(svgNamespace, 'a');
    if (element.href && !element.href.startsWith('javascript:')) {
        svgAnchor.setAttribute('href', element.href);
    }
    if (element.rel) {
        svgAnchor.setAttribute('rel', element.rel);
    }
    if (element.target) {
        svgAnchor.setAttribute('target', element.target);
    }
    if (element.download) {
        svgAnchor.setAttribute('download', element.download);
    }
    return svgAnchor;
}
//# sourceMappingURL=element.js.map
;// CONCATENATED MODULE: ./lib/traversal.js



function walkNode(node, context) {
    if (isElement(node)) {
        handleElement(node, context);
    }
    else if (isTextNode(node)) {
        handleTextNode(node, context);
    }
}
//# sourceMappingURL=traversal.js.map
;// CONCATENATED MODULE: ./lib/inline.js






/**
 * Inlines all external resources of the given element, such as fonts and images.
 *
 * Fonts and binary images are inlined as Base64 data: URIs.
 *
 * Images that reference another SVG are inlined by inlining the embedded SVG into the output SVG.
 * Note: The passed element needs to be attached to a document with a window (`defaultView`) for this so that `getComputedStyle()` can be used.
 */
async function inlineResources(element) {
    await Promise.all([
        ...[...element.children].map(inlineResources),
        (async () => {
            var _a;
            if (isSVGImageElement(element)) {
                const blob = await withTimeout(10000, `Timeout fetching ${element.href.baseVal}`, () => fetchResource(element.href.baseVal));
                if (blob.type === 'image/svg+xml') {
                    // If the image is an SVG, inline it into the output SVG.
                    // Some tools (e.g. Figma) do not support nested SVG.
                    assert(element.ownerDocument, 'Expected <image> element to have ownerDocument');
                    // Replace <image> with inline <svg>
                    const embeddedSvgDocument = new DOMParser().parseFromString(await blob.text(), 'image/svg+xml');
                    const svgRoot = embeddedSvgDocument.documentElement;
                    svgRoot.setAttribute('x', element.getAttribute('x'));
                    svgRoot.setAttribute('y', element.getAttribute('y'));
                    svgRoot.setAttribute('width', element.getAttribute('width'));
                    svgRoot.setAttribute('height', element.getAttribute('height'));
                    svgRoot.remove();
                    element.replaceWith(svgRoot);
                    try {
                        // Let handleSvgNode inline the <svg> into a simple <g>
                        const svgDocument = element.ownerDocument;
                        const mount = svgDocument.createElementNS(svgNamespace, 'g');
                        assert(element.id, '<image> element must have ID');
                        handleSvgNode(svgRoot, {
                            currentSvgParent: mount,
                            svgDocument,
                            idPrefix: `${element.id}-`,
                            options: {
                                // SVGs embedded through <img> are never interactive.
                                keepLinks: false,
                                captureArea: svgRoot.viewBox.baseVal,
                            },
                        });
                        // Replace the <svg> element with the <g>
                        mount.dataset.tag = 'img';
                        mount.setAttribute('role', 'img');
                        svgRoot.replaceWith(mount);
                    }
                    finally {
                        svgRoot.remove();
                    }
                }
                else {
                    // Inline binary images as base64 data: URL
                    const dataUrl = await blobToDataURL(blob);
                    element.dataset.src = element.href.baseVal;
                    element.setAttribute('xlink:href', dataUrl.href);
                }
            }
            else if (isSVGStyleElement(element)) {
                try {
                    const promises = [];
                    // Walk the stylesheet and replace @font-face src URLs with data URIs
                    const parsedSheet = parse((_a = element.textContent) !== null && _a !== void 0 ? _a : '');
                    parsedSheet.walkAtRules('font-face', fontFaceRule => {
                        fontFaceRule.walkDecls('src', sourceDeclaration => {
                            const parsedSourceValue = lib(sourceDeclaration.value);
                            parsedSourceValue.walk(node => {
                                if (node.type === 'function' && node.value === 'url' && node.nodes[0]) {
                                    const urlArgumentNode = node.nodes[0];
                                    if (urlArgumentNode.type === 'string' || urlArgumentNode.type === 'word') {
                                        promises.push(inlineCssFontUrlArgumentNode(urlArgumentNode));
                                    }
                                }
                            });
                            sourceDeclaration.value = lib.stringify(parsedSourceValue.nodes);
                        });
                    });
                    await Promise.all(promises);
                    // Update <style> element with updated CSS
                    element.textContent = parsedSheet.toString();
                }
                catch (error) {
                    console.error('Error inlining stylesheet', element.sheet, error);
                }
            }
        })().catch(error => {
            console.error('Error inlining resource for element', element, error);
        }),
    ]);
}
/**
 * Fetches the font from a `url()` CSS node and replaces it with a `data:` URI of the content.
 */
async function inlineCssFontUrlArgumentNode(urlArgumentNode) {
    try {
        const url = new URL(unescapeStringValue(urlArgumentNode.value));
        const blob = await withTimeout(10000, `Timeout fetching ${url.href}`, () => fetchResource(url.href));
        if (!blob.type.startsWith('font/') &&
            !blob.type.startsWith('application/font-') &&
            !blob.type.startsWith('application/x-font-') &&
            !blob.type.startsWith('image/svg+xml') &&
            !blob.type.startsWith('application/vnd.ms-fontobject')) {
            throw new Error(`Invalid response MIME type inlining font at ${url.href}: Expected font MIME type, got ${blob.type}`);
        }
        const dataUrl = await blobToDataURL(blob);
        urlArgumentNode.value = dataUrl.href;
    }
    catch (error) {
        console.error(`Error inlining ${urlArgumentNode.value}`, error);
    }
}
async function fetchResource(url) {
    assert(url, 'No URL passed');
    const headers = new Headers();
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    const blob = await response.blob();
    return blob;
}
async function blobToDataURL(blob) {
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
        reader.addEventListener('error', () => reject(new Error('Error loading resource with FileLoader')));
        reader.addEventListener('load', () => resolve());
        reader.readAsDataURL(blob);
    });
    return new URL(reader.result);
}
//# sourceMappingURL=inline.js.map
;// CONCATENATED MODULE: ./lib/index.js







function documentToSVG(document, options) {
    return elementToSVG(document.documentElement, options);
}
function elementToSVG(element, options) {
    var _a, _b, _c, _d;
    const svgDocument = element.ownerDocument.implementation.createDocument(svgNamespace, 'svg', null);
    const svgElement = svgDocument.documentElement;
    svgElement.setAttribute('xmlns', svgNamespace);
    svgElement.setAttribute('xmlns:xlink', xlinkNamespace);
    svgElement.append(svgDocument.createComment(
    // "--" is invalid in comments, percent-encode.
    ` Generated by dom-to-svg from ${element.ownerDocument.location.href.replace(/--/g, '%2D%2D')} `));
    // Copy @font-face rules
    const styleElement = svgDocument.createElementNS(svgNamespace, 'style');
    for (const styleSheet of element.ownerDocument.styleSheets) {
        try {
            // Make font URLs absolute (need to be resolved relative to the stylesheet)
            for (const rule of (_a = styleSheet.rules) !== null && _a !== void 0 ? _a : []) {
                if (!isCSSFontFaceRule(rule)) {
                    continue;
                }
                const styleSheetHref = (_b = rule.parentStyleSheet) === null || _b === void 0 ? void 0 : _b.href;
                if (styleSheetHref) {
                    // Note: Firefox does not implement rule.style.src, need to use rule.style.getPropertyValue()
                    const parsedSourceValue = lib(rule.style.getPropertyValue('src'));
                    parsedSourceValue.walk(node => {
                        if (node.type === 'function' && node.value === 'url' && node.nodes[0]) {
                            const urlArgumentNode = node.nodes[0];
                            if (urlArgumentNode.type === 'string' || urlArgumentNode.type === 'word') {
                                urlArgumentNode.value = new URL(unescapeStringValue(urlArgumentNode.value), styleSheetHref).href;
                            }
                        }
                    });
                    // Firefox does not support changing `src` on CSSFontFaceRule declarations, need to use PostCSS.
                    const updatedFontFaceRule = parse(rule.cssText);
                    updatedFontFaceRule.walkDecls('src', declaration => {
                        declaration.value = lib.stringify(parsedSourceValue.nodes);
                    });
                    styleElement.append(updatedFontFaceRule.toString() + '\n');
                }
            }
        }
        catch (error) {
            console.error('Error resolving @font-face src URLs for styleSheet, skipping', styleSheet, error);
        }
    }
    svgElement.append(styleElement);
    walkNode(element, {
        svgDocument,
        currentSvgParent: svgElement,
        stackingLayers: createStackingLayers(svgElement),
        parentStackingLayer: svgElement,
        getUniqueId: createIdGenerator(),
        labels: new Map(),
        ancestorMasks: [],
        options: {
            captureArea: (_c = options === null || options === void 0 ? void 0 : options.captureArea) !== null && _c !== void 0 ? _c : element.getBoundingClientRect(),
            keepLinks: (options === null || options === void 0 ? void 0 : options.keepLinks) !== false,
        },
    });
    const bounds = (_d = options === null || options === void 0 ? void 0 : options.captureArea) !== null && _d !== void 0 ? _d : element.getBoundingClientRect();

    svgElement.setAttribute('width', bounds.width.toString());
    svgElement.setAttribute('height', bounds.height.toString());
    svgElement.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
    return svgDocument;
}

//# sourceMappingURL=index.js.map
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
