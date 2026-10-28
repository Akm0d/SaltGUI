/**
 * Hilitor - Word Highlighting Utility
 * Refactored for SaltGUI modernization.
 */
export class Hilitor {
  #targetNode;
  #hiliteTag;
  #skipTags;
  #colors = ["#ff6", "#a0ffff", "#9f9", "#f99", "#f6f"];
  #wordColor = {};
  #colorIdx = 0;
  #matchRegExp = "";
  #openLeft = false;
  #openRight = false;
  #endRegExp = /^[\w]+|[\w]+$/g;
  #breakRegExp = /[^\w'-]+/g;
  #nrHilites = 0;

  constructor(start, id, tag) {
    this.#targetNode = start;
    if (id) this.#targetNode = this.#targetNode.querySelector(id);
    this.#hiliteTag = tag || "MARK";
    this.#skipTags = new RegExp(`^(?:${this.#hiliteTag}|SCRIPT|FORM)$`);
  }

  setEndRegExp(regex) {
    this.#endRegExp = regex;
    return this.#endRegExp;
  }

  setBreakRegExp(regex) {
    this.#breakRegExp = regex;
    return this.#breakRegExp;
  }

  setMatchType(type) {
    switch (type) {
      case "left":
        this.#openLeft = false;
        this.#openRight = true;
        break;
      case "right":
        this.#openLeft = true;
        this.#openRight = false;
        break;
      case "open":
        this.#openLeft = this.#openRight = true;
        break;
      default:
        this.#openLeft = this.#openRight = false;
    }
  }

  setRegex(input, isCaseSensitive = false) {
    input = input.replace(this.#endRegExp, "");
    input = input.replace(this.#breakRegExp, "|");
    input = input.replace(/^\||\|$/g, "");
    if (input) {
      const re = `(?:${input})`;
      let pattern = re;
      if (!this.#openLeft) pattern = `\\b${pattern}`;
      if (!this.#openRight) pattern = `${pattern}\\b`;
      this.#matchRegExp = new RegExp(pattern, isCaseSensitive ? "" : "i");
      return this.#matchRegExp;
    }
    return false;
  }

  getRegex() {
    let retval = this.#matchRegExp.toString();
    retval = retval.replace(/^\/\(\b\)?|\(|\)|\(\b\)?\/i$/g, "");
    retval = retval.replace(/\|/g, " ");
    return retval;
  }

  hiliteWords(node, isCaseSensitive = false) {
    if (!node || !this.#matchRegExp) return;
    if (this.#skipTags.test(node.nodeName)) return;
    if (node.classList && node.classList.contains("no-search")) return;

    if (node.hasChildNodes()) {
      for (const childNode of node.childNodes) {
        this.hiliteWords(childNode, isCaseSensitive);
      }
    }

    if (node.nodeType === 3) { // NODE_TEXT
      let nv, regs;
      if (this.#nrHilites <= 25 && (nv = node.nodeValue) && (regs = this.#matchRegExp.exec(nv)) && regs[0].length > 0) {
        const found = isCaseSensitive ? regs[0] : regs[0].toLowerCase();
        if (!this.#wordColor[found]) {
          this.#wordColor[found] = this.#colors[this.#colorIdx++ % this.#colors.length];
        }

        const match = document.createElement(this.#hiliteTag);
        match.appendChild(document.createTextNode(regs[0]));
        match.style.backgroundColor = this.#wordColor[found];
        match.style.color = "#000";

        const after = node.splitText(regs.index);
        after.nodeValue = after.nodeValue.substring(found.length);
        node.parentNode.insertBefore(match, after);
        this.#nrHilites++;
      }
    }
  }

  remove() {
    const arr = this.#targetNode.getElementsByTagName(this.#hiliteTag);
    let el;
    while (arr.length && (el = arr[0])) {
      const parent = el.parentNode;
      parent.replaceChild(el.firstChild, el);
      parent.normalize();
    }
    this.#nrHilites = 0;
  }

  apply(input, isCaseSensitive = false) {
    this.remove();
    if (input === undefined || !input) return undefined;
    if (this.setRegex(input, isCaseSensitive)) {
      this.hiliteWords(this.#targetNode, isCaseSensitive);
    }
    return this.#matchRegExp;
  }
}

if (typeof window !== 'undefined') {
  window.Hilitor = Hilitor;
}
