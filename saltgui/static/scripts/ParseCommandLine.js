// Function to parse a commandline
// The line is broken into individual tokens
// Each token that is recognized as a JS type will get that type
// Otherwise the token is considered to be a string
// name-value pairs in the form "name=value" are added to the "argsObject" dictionary
// other parameters are added to the "argsArray" array
// e.g.:
//   test "1 2 3" 4 x=7 {"a":1, "b":2}
// is a command line of 5 tokens
//   string: "test"
//   string: "1 2 3"
//   number: 4
//   number: 7
//   dictionary: {"a":1, "b": 2}
// the array will be filled with 4 elements
// the dictionary will be filled with one element named "x"

import {Character} from "./Character.js";

export class ParseCommandLine {

  static getPatJid () {
    return /^[2-9]\\d\\d\\d[01]\\d[0-3]\\d[0-2]\\d[0-5]\\d[0-5]\\d\\d\\d\\d\\d\\d\\d$/;
  }

  static getCommandFromCommandLine (pCommandLine) {
    const argsArray = [];
    const argsObject = {};
    ParseCommandLine.parseCommandLine(pCommandLine, argsArray, argsObject);
    return argsArray[0];
  }

  static parseCommandLine (pToRun, pArgsArray, pArgsObject) {
    const patPlaceHolder = /^<[a-z]+>/;
    const patNull = /^(?:None|null|Null|NULL)$/;
    const patBooleanFalse = /^(?:false|False|FALSE)$/;
    const patBooleanTrue = /^(?:true|True|TRUE)$/;
    const patInteger = /^(?:(?:0)|(?:[-+]?[1-9]\d*))$/;
    const patFloat = /^(?:[-+]?(?:(?:\d+)|(?:\d+[.]\d*)|(?:\d*[.]\d+))(?:[eE][-+]?\d+)?)$/;

    pToRun = pToRun.trim();

    while (pToRun.length > 0) {
      let name = null;
      let firstSpaceChar = pToRun.indexOf(" ");
      if (firstSpaceChar < 0) {
        firstSpaceChar = pToRun.length;
      }
      const firstEqualSign = pToRun.indexOf("=");
      if (firstEqualSign >= 0 && firstEqualSign < firstSpaceChar) {
        name = pToRun.substring(0, firstEqualSign);
        pToRun = pToRun.substring(firstEqualSign + 1);
        if (pToRun === "" || pToRun[0] === " ") {
          return "Must have value for named parameter '" + name + "'";
        }
      }

      if (patPlaceHolder.test(pToRun)) {
        const placeHolder = pToRun.replace(/>.*/, ">");
        return "Must fill in all placeholders, e.g. " + placeHolder;
      }

      let beginChar;
      let endChar;
      let objType;
      if (pToRun[0] === "{") {
        beginChar = "{";
        endChar = "}";
        objType = "dictionary";
      } else if (pToRun[0] === "[") {
        beginChar = "[";
        endChar = "]";
        objType = "array";
      } else if (pToRun.startsWith('"""')) {
        beginChar = '"""';
        endChar = '"""';
        objType = "triple-quoted-string";
      } else if (pToRun[0] === '"') {
        beginChar = '"';
        endChar = '"';
        objType = "double-quoted-string";
      }

      let value;
      if (objType) {
        const result = ParseCommandLine._getComplexToken(pToRun, beginChar, endChar, objType);
        if (result.error) {return result.error;}
        value = result.value;
        pToRun = result.pToRun;
      } else {
        let str = "";
        while (pToRun.length > 0 && pToRun[0] !== " ") {
          str += pToRun[0];
          pToRun = pToRun.substring(1);
        }

        if (patNull.test(str)) {
          value = null;
        } else if (patBooleanFalse.test(str)) {
          value = false;
        } else if (patBooleanTrue.test(str)) {
          value = true;
        } else if (ParseCommandLine.getPatJid().test(str)) {
          value = str;
        } else if (patInteger.test(str)) {
          value = parseInt(str, 10);
        } else if (patFloat.test(str)) {
          value = parseFloat(str);
          if (!isFinite(value)) {
            return "Numeric argument has overflowed or is infinity";
          }
        } else {
          value = str;
        }
      }

      if (name === null) {
        pArgsArray.push(value);
      } else if (name in pArgsObject) {
        return "Duplicate named variable '" + name + "'";
      } else {
        pArgsObject[name] = value;
      }

      pToRun = pToRun.trim();
    }

    return null;
  }

  static _getComplexToken (pToRun, beginChar, endChar, objType) {
    let charPos = beginChar.length;
    for (;;) {
      let endCharPos = pToRun.indexOf(endChar, charPos);
      if (endCharPos < 0) {
        return { error: "No valid " + objType + " found" };
      }

      try {
        let value;
        if (objType === "triple-quoted-string") {
          value = pToRun.substring(beginChar.length, endCharPos);
        } else {
          const fndStr = pToRun.substring(0, endCharPos + endChar.length);
          value = JSON.parse(fndStr);
        }

        endCharPos += endChar.length;
        if (endCharPos < pToRun.length && pToRun[endCharPos] !== " ") {
          return { error: "Valid " + objType + ", but followed by text:" + pToRun.substring(endCharPos) + Character.HORIZONTAL_ELLIPSIS };
        }

        return { pToRun: pToRun.substring(endCharPos), value };
      } catch (err) { // eslint-disable-line no-unused-vars
        charPos = endCharPos + 1;
      }
    }
  }
}
