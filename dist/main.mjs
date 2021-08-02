#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};

// node_modules/.pnpm/puka@1.0.1/node_modules/puka/index.js
var require_puka = __commonJS({
  "node_modules/.pnpm/puka@1.0.1/node_modules/puka/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var formatSymbol = Symbol("format");
    var preformatSymbol = Symbol("preformat");
    var stickySupported = true;
    try {
      new RegExp("", "y");
    } catch (e) {
      stickySupported = false;
    }
    var sticky = stickySupported ? (source) => new RegExp(source, "y") : (source) => new RegExp(`^(?:${source})`);
    var execFrom = stickySupported ? (re, haystack, index) => (re.lastIndex = index, re.exec(haystack)) : (re, haystack, index) => re.exec(haystack.substr(index));
    function quoteForCmd(text, forceQuote) {
      let caretDepth = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
      if (!text.length) {
        return '""';
      }
      if (/[\n\r]/.test(text)) {
        throw new Error("Line breaks can't be quoted on Windows");
      }
      const caretEscape = /["%]/.test(text);
      text = quoteForWin32(text, forceQuote || !caretEscape && /[&()<>^|]/.test(text));
      if (caretEscape) {
        do {
          text = text.replace(/[\t "%&()<>^|]/g, "^$&");
        } while (caretDepth--);
      }
      return text;
    }
    var quoteForWin32 = (text, forceQuote) => forceQuote || /[\t "]/.test(text) ? `"${text.replace(/\\+(?=$|")/g, "$&$&").replace(/"/g, '\\"')}"` : text;
    var cmdMetaChars = /[\t\n\r "%&()<>^|]/;
    var Win32Context = class {
      constructor() {
        this.currentScope = newScope(null);
        this.scopesByObject = new Map();
        this.argDetectState = 0;
        this.argSet = new Set();
      }
      read(text) {
        const length = text.length;
        for (let pos = 0, match; pos < length; ) {
          while (match = execFrom(reUnimportant, text, pos)) {
            if (match[2] == null) {
              if (match[1] != null) {
                this.argDetectState = this.argDetectState === 0 ? ADS_FLAG_INITIAL_REDIRECT : 0;
              } else if (this.argDetectState !== ADS_FLAG_ARGS) {
                this.argDetectState |= ADS_FLAG_WORD;
              }
            } else {
              if ((this.argDetectState & ADS_FLAG_WORD) !== 0) {
                this.argDetectState = ADS_FLAG_ARGS & ~this.argDetectState >> 1;
              }
            }
            pos += match[0].length;
          }
          if (pos >= length)
            break;
          if (match = execFrom(reSeqOp, text, pos)) {
            this.seq();
            pos += match[0].length;
          } else {
            const char = text.charCodeAt(pos);
            if (char === CARET) {
              pos += 2;
            } else if (char === QUOTE) {
              pos += execFrom(reNotQuote, text, pos + 1)[0].length + 2;
            } else {
              if (char === OPEN_PAREN) {
                this.enterScope();
              } else if (char === CLOSE_PAREN) {
                this.exitScope();
              } else if (char === PIPE) {
                this.pipe();
              } else {
                this.argDetectState = this.argDetectState === 0 ? ADS_FLAG_INITIAL_REDIRECT : 0;
              }
              pos++;
            }
          }
        }
      }
      enterScope() {
        this.currentScope = newScope(this.currentScope);
        this.argDetectState = 0;
      }
      exitScope() {
        this.currentScope = this.currentScope.parent || (this.currentScope.parent = newScope(null));
        this.argDetectState = ADS_FLAG_ARGS;
      }
      seq() {
        this.currentScope = newScope(this.currentScope.parent);
        this.argDetectState = 0;
      }
      pipe() {
        this.currentScope.depthDelta = 1;
        this.argDetectState = 0;
      }
      mark(obj) {
        this.scopesByObject.set(obj, this.currentScope);
        if (this.argDetectState === ADS_FLAG_ARGS) {
          this.argSet.add(obj);
        } else {
          this.argDetectState |= ADS_FLAG_WORD;
        }
      }
      at(obj) {
        const scope = this.scopesByObject.get(obj);
        return {
          depth: getDepth(scope),
          isArgument: this.argSet.has(obj),
          isNative: scope.isNative
        };
      }
    };
    var ADS_FLAG_WORD = 1;
    var ADS_FLAG_ARGS = 2;
    var ADS_FLAG_INITIAL_REDIRECT = 4;
    var getDepth = (scope) => scope === null ? 0 : scope.depth !== -1 ? scope.depth : scope.depth = getDepth(scope.parent) + scope.depthDelta;
    var newScope = (parent) => ({
      parent,
      depthDelta: 0,
      depth: -1,
      isNative: false
    });
    var CARET = "^".charCodeAt();
    var QUOTE = '"'.charCodeAt();
    var OPEN_PAREN = "(".charCodeAt();
    var CLOSE_PAREN = ")".charCodeAt();
    var PIPE = "|".charCodeAt();
    var reNotQuote = sticky('[^"]*');
    var reSeqOp = sticky("&&?|\\|\\|");
    var reUnimportant = sticky('(\\d*>&)|[^\\s"$&()<>^|]+|(\\s+)');
    var quoteForSh2 = (text, forceQuote) => text.length ? forceQuote || shMetaChars.test(text) ? `'${text.replace(/'/g, "'\\''")}'`.replace(/^(?:'')+(?!$)/, "").replace(/\\'''/g, "\\'") : text : "''";
    var shMetaChars = /[\t\n\r "#$&'()*;<>?\\`|~]/;
    function Formatter() {
    }
    Object.assign(Formatter, {
      for(platform) {
        return platform == null ? Formatter.default || (Formatter.default = Formatter.for(process.platform)) : Formatter._registry.get(platform) || Formatter._registry.get("sh");
      },
      declare(props) {
        const platform = props && props.platform || "sh";
        const existingFormatter = Formatter._registry.get(platform);
        const formatter = Object.assign(existingFormatter || new Formatter(), props);
        formatter.emptyString === void 0 && (formatter.emptyString = formatter.quote("", true));
        existingFormatter || Formatter._registry.set(formatter.platform, formatter);
      },
      _registry: new Map(),
      prototype: {
        platform: "sh",
        quote: quoteForSh2,
        metaChars: shMetaChars,
        hasExtraMetaChars: false,
        statementSeparator: ";",
        createContext() {
          return defaultContext;
        }
      }
    });
    var defaultContext = {
      at() {
      }
    };
    Formatter.declare();
    Formatter.declare({
      platform: "win32",
      quote(text, forceQuote, opts) {
        const caretDepth = opts ? (opts.depth || 0) + (opts.isArgument && !opts.isNative ? 1 : 0) : 0;
        return quoteForCmd(text, forceQuote, caretDepth);
      },
      metaChars: cmdMetaChars,
      hasExtraMetaChars: true,
      statementSeparator: "&",
      createContext(root) {
        const context = new this.Context();
        root[preformatSymbol](context);
        return context;
      },
      Context: Win32Context
    });
    var isObject2 = (any) => any === Object(any);
    function memoize(f) {
      const cache = new WeakMap();
      return (arg) => {
        let result = cache.get(arg);
        if (result === void 0) {
          result = f(arg);
          cache.set(arg, result);
        }
        return result;
      };
    }
    var ShellStringText = class {
      constructor(contents, untested) {
        this.contents = contents;
        this.untested = untested;
      }
      [formatSymbol](formatter, context) {
        const unformattedContents = this.contents;
        const length = unformattedContents.length;
        const contents = new Array(length);
        for (let i = 0; i < length; i++) {
          const c = unformattedContents[i];
          contents[i] = isObject2(c) && formatSymbol in c ? c[formatSymbol](formatter) : c;
        }
        for (let unquoted2 = true, i = 0; i < length; i++) {
          const content = contents[i];
          if (content === null) {
            unquoted2 = !unquoted2;
          } else {
            if (unquoted2 && (formatter.hasExtraMetaChars || this.untested && this.untested.has(i)) && formatter.metaChars.test(content)) {
              return formatter.quote(contents.join(""), false, context.at(this));
            }
          }
        }
        const parts = [];
        for (let quoted = null, i = 0; i < length; i++) {
          const content = contents[i];
          if (content === null) {
            quoted = quoted ? (parts.push(formatter.quote(quoted.join(""), true, context.at(this))), null) : [];
          } else {
            (quoted || parts).push(content);
          }
        }
        const result = parts.join("");
        return result.length ? result : formatter.emptyString;
      }
      [preformatSymbol](context) {
        context.mark(this);
      }
    };
    var ShellStringUnquoted = class {
      constructor(value) {
        this.value = value;
      }
      [formatSymbol]() {
        return this.value;
      }
      [preformatSymbol](context) {
        context.read(this.value);
      }
    };
    var shellStringSemicolon = {
      [formatSymbol](formatter) {
        return formatter.statementSeparator;
      },
      [preformatSymbol](context) {
        context.seq();
      }
    };
    var PLACEHOLDER = {};
    var parse = memoize((templateSpans) => {
      const TOKEN_TEXT = 0;
      const TOKEN_QUOTE = 1;
      const TOKEN_SEMI = 2;
      const TOKEN_UNQUOTED = 3;
      const TOKEN_SPACE = 4;
      const TOKEN_REDIRECT = 5;
      const result = [];
      let placeholderCount = 0;
      let prefix = null;
      let onlyPrefixOnce = false;
      let contents = [];
      let quote = 0;
      const lastSpan = templateSpans.length - 1;
      for (let spanIndex = 0; spanIndex <= lastSpan; spanIndex++) {
        const templateSpan = templateSpans[spanIndex];
        const posEnd = templateSpan.length;
        let tokenStart = 0;
        if (spanIndex) {
          placeholderCount++;
          contents.push(PLACEHOLDER);
        }
        const recognized = [];
        let firstWordBreak = -1;
        let lastWordBreak = -1;
        {
          let pos = 0, match;
          while (pos < posEnd) {
            if (quote) {
              if (match = execFrom(quote === CHAR_SQUO ? reQuotation1 : reQuotation2, templateSpan, pos)) {
                recognized.push(TOKEN_TEXT, pos);
                pos += match[0].length;
              }
              if (pos < posEnd) {
                recognized.push(TOKEN_QUOTE, pos++);
                quote = 0;
              }
            } else {
              if (match = execFrom(reRedirectOrSpace, templateSpan, pos)) {
                firstWordBreak < 0 && (firstWordBreak = pos);
                lastWordBreak = pos;
                recognized.push(match[1] ? TOKEN_REDIRECT : TOKEN_SPACE, pos);
                pos += match[0].length;
              }
              if (match = execFrom(reText, templateSpan, pos)) {
                const setBreaks = match[1] != null;
                setBreaks && firstWordBreak < 0 && (firstWordBreak = pos);
                recognized.push(setBreaks ? TOKEN_UNQUOTED : TOKEN_TEXT, pos);
                pos += match[0].length;
                setBreaks && (lastWordBreak = pos);
              }
              const char = templateSpan.charCodeAt(pos);
              if (char === CHAR_SEMI) {
                firstWordBreak < 0 && (firstWordBreak = pos);
                recognized.push(TOKEN_SEMI, pos++);
                lastWordBreak = pos;
              } else if (char === CHAR_SQUO || char === CHAR_DQUO) {
                recognized.push(TOKEN_QUOTE, pos++);
                quote = char;
              }
            }
          }
        }
        spanIndex === 0 && (firstWordBreak = -1);
        spanIndex === lastSpan && (lastWordBreak = posEnd);
        const iEnd = recognized.length;
        for (let i = 0, type = -1; i <= iEnd; i += 2) {
          let typeNext = -1, pos;
          if (i === iEnd) {
            pos = posEnd;
          } else {
            typeNext = recognized[i];
            pos = recognized[i + 1];
            typeNext >= TOKEN_SPACE && pos !== lastWordBreak && (typeNext = TOKEN_UNQUOTED);
          }
          const breakHere = pos === firstWordBreak || pos === lastWordBreak;
          if (pos && (breakHere || typeNext !== type)) {
            let value = type === TOKEN_QUOTE ? null : type === TOKEN_SEMI ? shellStringSemicolon : templateSpan.substring(tokenStart, pos);
            if (type >= TOKEN_SEMI) {
              type === TOKEN_SEMI || (value = new ShellStringUnquoted(value));
              if (contents.length) {
                result.push(new ShellStringText(contents, null));
                contents = [];
              }
              if (type >= TOKEN_SPACE) {
                prefix = value;
                onlyPrefixOnce = type === TOKEN_SPACE;
              } else {
                result.push(value);
              }
            } else {
              contents.push(value);
            }
            tokenStart = pos;
          }
          if (breakHere) {
            if (placeholderCount) {
              result.push({
                contents,
                placeholderCount,
                prefix,
                onlyPrefixOnce
              });
            } else {
              contents.length && result.push(new ShellStringText(contents, null));
            }
            placeholderCount = 0;
            prefix = null;
            onlyPrefixOnce = false;
            contents = [];
          }
          type = typeNext;
        }
      }
      if (quote) {
        throw new SyntaxError(`String is missing a ${String.fromCharCode(quote)} character`);
      }
      return result;
    });
    var CHAR_SEMI = ";".charCodeAt();
    var CHAR_SQUO = "'".charCodeAt();
    var CHAR_DQUO = '"'.charCodeAt();
    var reQuotation1 = sticky("[^']+");
    var reQuotation2 = sticky('[^"]+');
    var reText = sticky("[^\\s\"#$&'();<>\\\\`|]+|([#$&()\\\\`|]+)");
    var reRedirectOrSpace = sticky("(\\s*\\d*[<>]+\\s*)|\\s+");
    var BitSet = class {
      constructor() {
        this.vector = new Int32Array(1);
      }
      has(n) {
        return (this.vector[n >>> 5] & 1 << n) !== 0;
      }
      add(n) {
        const i = n >>> 5, requiredLength = i + 1;
        let vector = this.vector, _vector = vector, length = _vector.length;
        if (requiredLength > length) {
          while (requiredLength > (length *= 2))
            ;
          const oldValues = vector;
          vector = new Int32Array(length);
          vector.set(oldValues);
          this.vector = vector;
        }
        vector[i] |= 1 << n;
      }
    };
    function evaluate(template, values) {
      values = values.map(toStringishArray);
      const children = [];
      let valuesStart = 0;
      for (let i = 0, iMax = template.length; i < iMax; i++) {
        const word = template[i];
        if (formatSymbol in word) {
          children.push(word);
          continue;
        }
        const contents = word.contents, placeholderCount = word.placeholderCount, prefix = word.prefix, onlyPrefixOnce = word.onlyPrefixOnce;
        const kMax = contents.length;
        const valuesEnd = valuesStart + placeholderCount;
        const tuples = cartesianProduct(values, valuesStart, valuesEnd);
        valuesStart = valuesEnd;
        for (let j = 0, jMax = tuples.length; j < jMax; j++) {
          const needSpace = j > 0;
          const tuple = tuples[j];
          (needSpace || prefix) && children.push(needSpace && (onlyPrefixOnce || !prefix) ? unquotedSpace : prefix);
          let interpolatedContents = [];
          let untested = null;
          let quoting = false;
          let tupleIndex = 0;
          for (let k = 0; k < kMax; k++) {
            const content = contents[k];
            if (content === PLACEHOLDER) {
              const value = tuple[tupleIndex++];
              if (quoting) {
                interpolatedContents.push(value);
              } else {
                if (isObject2(value) && formatSymbol in value) {
                  if (interpolatedContents.length) {
                    children.push(new ShellStringText(interpolatedContents, untested));
                    interpolatedContents = [];
                    untested = null;
                  }
                  children.push(value);
                } else {
                  (untested || (untested = new BitSet())).add(interpolatedContents.length);
                  interpolatedContents.push(value);
                }
              }
            } else {
              interpolatedContents.push(content);
              content === null && (quoting = !quoting);
            }
          }
          if (interpolatedContents.length) {
            children.push(new ShellStringText(interpolatedContents, untested));
          }
        }
      }
      return children;
    }
    var primToStringish = (value) => value == null ? "" + value : value;
    function toStringishArray(value) {
      let array;
      switch (true) {
        default:
          if (isObject2(value)) {
            if (Array.isArray(value)) {
              array = value;
              break;
            }
            if (Symbol.iterator in value) {
              array = Array.from(value);
              break;
            }
          }
          array = [value];
      }
      return array.map(primToStringish);
    }
    function cartesianProduct(arrs, start, end) {
      const size = end - start;
      let resultLength = 1;
      for (let i = start; i < end; i++) {
        resultLength *= arrs[i].length;
      }
      if (resultLength > 1e6) {
        throw new RangeError("Far too many elements to interpolate");
      }
      const result = new Array(resultLength);
      const indices = new Array(size).fill(0);
      for (let i = 0; i < resultLength; i++) {
        const value = result[i] = new Array(size);
        for (let j = 0; j < size; j++) {
          value[j] = arrs[j + start][indices[j]];
        }
        for (let j = size - 1; j >= 0; j--) {
          if (++indices[j] < arrs[j + start].length)
            break;
          indices[j] = 0;
        }
      }
      return result;
    }
    var unquotedSpace = new ShellStringUnquoted(" ");
    var ShellString = class {
      constructor(children) {
        this.children = children;
      }
      static sh(templateSpans) {
        for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          values[_key - 1] = arguments[_key];
        }
        return new ShellString(evaluate(parse(templateSpans), values));
      }
      toString(platform) {
        return this[formatSymbol](Formatter.for(platform));
      }
      [formatSymbol](formatter) {
        let context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : formatter.createContext(this);
        return this.children.map((child) => child[formatSymbol](formatter, context)).join("");
      }
      [preformatSymbol](context) {
        const children = this.children;
        for (let i = 0, iMax = children.length; i < iMax; i++) {
          const child = children[i];
          if (preformatSymbol in child) {
            child[preformatSymbol](context);
          }
        }
      }
    };
    function quoteForShell(text, forceQuote, platform) {
      return Formatter.for(platform).quote(text, forceQuote);
    }
    var sh = function() {
      return ShellString.sh.apply(ShellString, arguments).toString();
    };
    var unquoted = (value) => new ShellStringUnquoted(value);
    exports.Formatter = Formatter;
    exports.ShellString = ShellString;
    exports.ShellStringText = ShellStringText;
    exports.ShellStringUnquoted = ShellStringUnquoted;
    exports.quoteForCmd = quoteForCmd;
    exports.quoteForSh = quoteForSh2;
    exports.quoteForShell = quoteForShell;
    exports.sh = sh;
    exports.shellStringSemicolon = shellStringSemicolon;
    exports.formatSymbol = formatSymbol;
    exports.preformatSymbol = preformatSymbol;
    exports.unquoted = unquoted;
  }
});

// src/main.ts
import hasha from "hasha";
import fg from "fast-glob";

// node_modules/.pnpm/hash-obj@4.0.0/node_modules/hash-obj/index.js
import crypto from "crypto";

// node_modules/.pnpm/is-obj@3.0.0/node_modules/is-obj/index.js
function isObject(value) {
  const type = typeof value;
  return value !== null && (type === "object" || type === "function");
}

// node_modules/.pnpm/is-plain-obj@4.0.0/node_modules/is-plain-obj/index.js
function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

// node_modules/.pnpm/sort-keys@5.0.0/node_modules/sort-keys/index.js
function sortKeys(object, options = {}) {
  if (!isPlainObject(object) && !Array.isArray(object)) {
    throw new TypeError("Expected a plain object or array");
  }
  const { deep, compare } = options;
  const seenInput = [];
  const seenOutput = [];
  const deepSortArray = (array) => {
    const seenIndex = seenInput.indexOf(array);
    if (seenIndex !== -1) {
      return seenOutput[seenIndex];
    }
    const result = [];
    seenInput.push(array);
    seenOutput.push(result);
    result.push(...array.map((item) => {
      if (Array.isArray(item)) {
        return deepSortArray(item);
      }
      if (isPlainObject(item)) {
        return _sortKeys(item);
      }
      return item;
    }));
    return result;
  };
  const _sortKeys = (object2) => {
    const seenIndex = seenInput.indexOf(object2);
    if (seenIndex !== -1) {
      return seenOutput[seenIndex];
    }
    const result = {};
    const keys = Object.keys(object2).sort(compare);
    seenInput.push(object2);
    seenOutput.push(result);
    for (const key of keys) {
      const value = object2[key];
      let newValue;
      if (deep && Array.isArray(value)) {
        newValue = deepSortArray(value);
      } else {
        newValue = deep && isPlainObject(value) ? _sortKeys(value) : value;
      }
      Object.defineProperty(result, key, {
        ...Object.getOwnPropertyDescriptor(object2, key),
        value: newValue
      });
    }
    return result;
  };
  if (Array.isArray(object)) {
    return deep ? deepSortArray(object) : object.slice();
  }
  return _sortKeys(object);
}

// node_modules/.pnpm/hash-obj@4.0.0/node_modules/hash-obj/index.js
function hashObject(object, { encoding = "hex", algorithm = "sha512" } = {}) {
  if (!isObject(object)) {
    throw new TypeError("Expected an object");
  }
  if (encoding === "buffer") {
    encoding = void 0;
  }
  return crypto.createHash(algorithm).update(JSON.stringify(sortKeys(object, { deep: true })), "utf8").digest(encoding);
}

// src/main.ts
import fs from "fs-extra";
import { Command } from "commander";
import { exec } from "promisify-child-process";

// node_modules/.pnpm/indent-string@5.0.0/node_modules/indent-string/index.js
function indentString(string, count = 1, options = {}) {
  const {
    indent = " ",
    includeEmptyLines = false
  } = options;
  if (typeof string !== "string") {
    throw new TypeError(`Expected \`input\` to be a \`string\`, got \`${typeof string}\``);
  }
  if (typeof count !== "number") {
    throw new TypeError(`Expected \`count\` to be a \`number\`, got \`${typeof count}\``);
  }
  if (count < 0) {
    throw new RangeError(`Expected \`count\` to be at least 0, got \`${count}\``);
  }
  if (typeof indent !== "string") {
    throw new TypeError(`Expected \`options.indent\` to be a \`string\`, got \`${typeof indent}\``);
  }
  if (count === 0) {
    return string;
  }
  const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;
  return string.replace(regex, indent.repeat(count));
}

// node_modules/.pnpm/clean-stack@4.1.0/node_modules/clean-stack/index.js
import os from "os";

// node_modules/.pnpm/escape-string-regexp@5.0.0/node_modules/escape-string-regexp/index.js
function escapeStringRegexp(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

// node_modules/.pnpm/clean-stack@4.1.0/node_modules/clean-stack/index.js
var extractPathRegex = /\s+at.*[(\s](.*)\)?/;
var pathRegex = /^(?:(?:(?:node|node:[\w/]+|(?:(?:node:)?internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)(?:\.js)?:\d+:\d+)|native)/;
var homeDir = typeof os.homedir === "undefined" ? "" : os.homedir().replace(/\\/g, "/");
function cleanStack(stack, { pretty = false, basePath } = {}) {
  const basePathRegex = basePath && new RegExp(`(at | \\()${escapeStringRegexp(basePath.replace(/\\/g, "/"))}`, "g");
  if (typeof stack !== "string") {
    return void 0;
  }
  return stack.replace(/\\/g, "/").split("\n").filter((line) => {
    const pathMatches = line.match(extractPathRegex);
    if (pathMatches === null || !pathMatches[1]) {
      return true;
    }
    const match = pathMatches[1];
    if (match.includes(".app/Contents/Resources/electron.asar") || match.includes(".app/Contents/Resources/default_app.asar")) {
      return false;
    }
    return !pathRegex.test(match);
  }).filter((line) => line.trim() !== "").map((line) => {
    if (basePathRegex) {
      line = line.replace(basePathRegex, "$1");
    }
    if (pretty) {
      line = line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDir, "~")));
    }
    return line;
  }).join("\n");
}

// node_modules/.pnpm/aggregate-error@4.0.0/node_modules/aggregate-error/index.js
var cleanInternalStack = (stack) => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, "");
var AggregateError = class extends Error {
  #errors;
  name = "AggregateError";
  constructor(errors) {
    if (!Array.isArray(errors)) {
      throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
    }
    errors = errors.map((error) => {
      if (error instanceof Error) {
        return error;
      }
      if (error !== null && typeof error === "object") {
        return Object.assign(new Error(error.message), error);
      }
      return new Error(error);
    });
    let message = errors.map((error) => {
      return typeof error.stack === "string" ? cleanInternalStack(cleanStack(error.stack)) : String(error);
    }).join("\n");
    message = "\n" + indentString(message, 4);
    super(message);
    this.#errors = errors;
  }
  get errors() {
    return this.#errors.slice();
  }
};

// node_modules/.pnpm/p-map@5.1.0/node_modules/p-map/index.js
async function pMap(iterable, mapper, {
  concurrency = Number.POSITIVE_INFINITY,
  stopOnError = true
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper function is required");
    }
    if (!((Number.isSafeInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency >= 1)) {
      throw new TypeError(`Expected \`concurrency\` to be an integer from 1 and up or \`Infinity\`, got \`${concurrency}\` (${typeof concurrency})`);
    }
    const result = [];
    const errors = [];
    const skippedIndexes = [];
    const iterator = iterable[Symbol.iterator]();
    let isRejected = false;
    let isIterableDone = false;
    let resolvingCount = 0;
    let currentIndex = 0;
    const next = () => {
      if (isRejected) {
        return;
      }
      const nextItem = iterator.next();
      const index = currentIndex;
      currentIndex++;
      if (nextItem.done) {
        isIterableDone = true;
        if (resolvingCount === 0) {
          if (!stopOnError && errors.length > 0) {
            reject(new AggregateError(errors));
          } else {
            for (const skippedIndex of skippedIndexes) {
              result.splice(skippedIndex, 1);
            }
            resolve(result);
          }
        }
        return;
      }
      resolvingCount++;
      (async () => {
        try {
          const element = await nextItem.value;
          if (isRejected) {
            return;
          }
          const value = await mapper(element, index);
          if (value === pMapSkip) {
            skippedIndexes.push(index);
          } else {
            result[index] = value;
          }
          resolvingCount--;
          next();
        } catch (error) {
          if (stopOnError) {
            isRejected = true;
            reject(error);
          } else {
            errors.push(error);
            resolvingCount--;
            next();
          }
        }
      })();
    };
    for (let index = 0; index < concurrency; index++) {
      next();
      if (isIterableDone) {
        break;
      }
    }
  });
}
var pMapSkip = Symbol("skip");

// src/main.ts
var import_puka = __toModule(require_puka());
import { cpus } from "os";

// package.json
var version = "0.0.1";

// src/main.ts
var { writeFile, readFile } = fs;
var lockFileName = ".postmon-lock";
var program = new Command();
var { args } = program.version(version, "-v, --version", "output the current version").option("-d, --debug", "Echo additional debugging messages").argument("<exec...>", "Command line to execute if there are changes").parse(process.argv);
var debug = program.getOptionValue("debug");
if (debug)
  console.log("args", args);
if (debug)
  console.log("cpus", cpus().length);
(async () => {
  const numberOfCores = cpus().length;
  if (numberOfCores <= 0) {
    console.error("Error, can't detect your CPU");
    process.exit(1);
  }
  if (debug)
    console.log("[postmon] Starting... cwd:", process.cwd(), "cores:", numberOfCores);
  if (debug)
    console.time("finding files");
  const files = await fg(["**/*.ts"], { dot: true });
  if (debug)
    console.timeEnd("finding files");
  if (debug)
    console.log("[postmon] Found", files.length, "matches");
  const mapper = async (file) => {
    return await hasha.fromFile(file, { algorithm: "md5" });
  };
  if (debug)
    console.time("hashing files");
  const matches = await pMap(files, mapper, { concurrency: numberOfCores });
  if (debug)
    console.timeEnd("hashing files");
  if (debug)
    console.log("rendered", JSON.stringify(matches).length, "bytes of state object");
  if (debug)
    console.time("hashing object");
  const overallHash = hashObject([matches.sort(), files.sort()], { algorithm: "sha512" });
  if (debug)
    console.timeEnd("hashing object");
  let storedHash = "";
  try {
    const fileContents = await readFile(lockFileName);
    storedHash = fileContents.toString();
  } catch {
    console.warn(`[postmon] First time setup -- will create ${lockFileName} file if successful...`);
  }
  if (storedHash === overallHash) {
    console.log("[postmon] No changes detected -- skipping execution.");
    return;
  }
  console.log(`[postmon] Executing: ${args.map((e) => (0, import_puka.quoteForSh)(e)).join(" ")}`);
  const output = await exec(args.map((e) => (0, import_puka.quoteForSh)(e)).join(" "), {});
  console.log(output.stdout);
  await writeFile(lockFileName, overallHash);
  console.log(`[postmon] Written new hash to ${lockFileName}`);
})();
//# sourceMappingURL=main.mjs.map
