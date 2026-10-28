/**
 * SortTable
 * version 2 (Refactored)
 *
 * Instructions:
 * Add class="sortable" to any table you'd like to make sortable
 * Click on the headers to sort
 *
 * Original by Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/
 * Refactored for SaltGUI modernization.
 */

import { Character } from "../scripts/Character.js";

export class SortTable {

  /**
   * Initializes a table to be sortable.
   * @param {HTMLTableElement} table 
   */
  static makeSortable(table) {
    // remove any previous sorting
    const sortfwdind = table.querySelector('#sorttable_sortfwdind');
    if (sortfwdind) sortfwdind.remove();
    const sortrevind = table.querySelector('#sorttable_sortrevind');
    if (sortrevind) sortrevind.remove();

    if (table.getElementsByTagName('thead').length === 0) {
      // table doesn't have a tHead. Since it should have, create one and
      // put the first table row in it.
      const the = document.createElement('thead');
      the.appendChild(table.rows[0]);
      table.insertBefore(the, table.firstChild);
    }
    // Safari doesn't support table.tHead, sigh
    if (table.tHead === null) table.tHead = table.getElementsByTagName('thead')[0];

    if (table.tHead.rows.length !== 1) return; // can't cope with two header rows

    // work through each column and calculate its type
    const headrow = table.tHead.rows[0].cells;
    for (let i = 0; i < headrow.length; i++) {
      // manually override the type with a sorttable_type attribute
      if (headrow[i].classList.contains("sorttable_sortable")) {
        headrow[i].sorttable_sortfunction = SortTable.sort_alpha;
        // make it clickable to sort
        headrow[i].sorttable_columnindex = i;
        headrow[i].sorttable_tbody = table.tBodies[0];
        headrow[i].addEventListener("click", () => SortTable.innerSortFunction(headrow[i]));
      }
    }
  }

  /**
   * Handles the actual sorting logic when a header is clicked.
   * @param {HTMLTableCellElement} clickElement 
   */
  static innerSortFunction(clickElement) {
    // remove sorttable_sorted classes
    let prev_sorttable_columnindex = -1;
    const theadrow = clickElement.parentNode;
    for (const cell of theadrow.childNodes) {
      if (cell.nodeType === 1) { // an element
        if (cell.className.includes("sorttable_sorted")) prev_sorttable_columnindex = cell.sorttable_columnindex;
        cell.classList.remove("sorttable_sorted_reverse");
        cell.classList.remove("sorttable_sorted");
      }
    }
    const parent = clickElement.parentElement;
    let sortfwdind = parent.querySelector('#sorttable_sortfwdind');
    if (sortfwdind) sortfwdind.remove();
    let sortrevind = parent.querySelector('#sorttable_sortrevind');
    if (sortrevind) sortrevind.remove();

    if (prev_sorttable_columnindex !== clickElement.sorttable_columnindex) {
      // pretend reverse sorting when sorting on another column,
      // so that new sort order is normal
      sortfwdind = null;
    }

    const reverse = sortfwdind !== null;
    if (sortfwdind) {
      clickElement.classList.add("sorttable_sorted_reverse");
      sortrevind = document.createElement('span');
      sortrevind.id = "sorttable_sortrevind";
      sortrevind.innerText = Character.NO_BREAK_SPACE + Character.CH_SORT_REVERSE;
      clickElement.appendChild(sortrevind);
    } else {
      clickElement.classList.add("sorttable_sorted");
      sortfwdind = document.createElement('span');
      sortfwdind.id = "sorttable_sortfwdind";
      sortfwdind.innerText = Character.NO_BREAK_SPACE + Character.CH_SORT_NORMAL;
      clickElement.appendChild(sortfwdind);
    }

    // build an array to sort. This is a Schwartzian transform thing,
    // i.e., we "decorate" each row with the actual sort key,
    // sort based on the sort keys, and then put the rows back in order
    // which is a lot faster because you only do getInnerText once per row
    const col = clickElement.sorttable_columnindex;
    const rows = clickElement.sorttable_tbody.rows;
    const row_array = Array.from(rows).map(row => [SortTable.getInnerText(row.cells[col]), row]);
    
    row_array.sort(clickElement.sorttable_sortfunction);
    if (reverse) row_array.reverse();

    const tb = clickElement.sorttable_tbody;
    for (const [_, row] of row_array) {
      tb.appendChild(row);
    }
  }

  /**
   * Extracts the sortable text from a node.
   * @param {Node} node 
   * @returns {string}
   */
  static getInnerText(node) {
    // gets the text we want to use for sorting for a cell.
    // strips leading and trailing whitespace.
    // this is *not* a generic getInnerText function; it's special to SortTable.
    // for example, you can override the cell text with a customkey attribute.
    // it also gets .value for <input> fields.

    if (!node) return "";

    const hasInputs = (typeof node.getElementsByTagName === 'function') &&
                   node.getElementsByTagName('input').length;

    if (node.getAttribute("sorttable_customkey") !== null) {
      return node.getAttribute("sorttable_customkey");
    } else if (typeof node.textContent !== 'undefined' && !hasInputs) {
      return node.textContent.trim();
    } else if (typeof node.innerText !== 'undefined' && !hasInputs) {
      return node.innerText.trim();
    } else if (typeof node.text !== 'undefined' && !hasInputs) {
      return node.text.trim();
    } else {
      switch (node.nodeType) {
        case 3: // TEXT_NODE
          if (node.nodeName.toLowerCase() === 'input') {
            return node.value.trim();
          }
          return node.nodeValue.trim();
        case 4: // ELEMENT_NODE
          return node.nodeValue.trim();
        case 1: // ELEMENT_NODE
        case 11: // DOCUMENT_FRAGMENT
          let innerText = '';
          for (const childNode of node.childNodes) {
            innerText += SortTable.getInnerText(childNode);
          }
          return innerText.trim();
        default:
          return '';
      }
    }
  }

  /**
   * Reverses the rows in a tbody.
   * @param {HTMLTableSectionElement} tbody 
   */
  static reverse(tbody) {
    // reverse the rows in a tbody
    const rows = Array.from(tbody.rows);
    for (let i = rows.length - 1; i >= 0; i--) {
      tbody.appendChild(rows[i]);
    }
  }

  /**
   * Simple alpha sort.
   * @param {Array} a 
   * @param {Array} b 
   * @returns {number}
   */
  static sort_alpha(a, b) {
    if (a[0] === b[0]) return 0;
    return a[0] < b[0] ? -1 : 1;
  }

  /**
   * Stable shaker sort.
   * @param {Array} list 
   * @param {Function} comp_func 
   */
  static shaker_sort(list, comp_func) {
    // A stable sort function to allow multi-level sorting of data
    // see: http://en.wikipedia.org/wiki/Cocktail_sort
    let b = 0;
    let t = list.length - 1;
    let swap = true;

    while (swap) {
      swap = false;
      for (let i = b; i < t; ++i) {
        if (comp_func(list[i], list[i + 1]) > 0) {
          [list[i], list[i + 1]] = [list[i + 1], list[i]];
          swap = true;
        }
      } // for
      t--;

      if (!swap) break;

      for (let i = t; i > b; --i) {
        if (comp_func(list[i], list[i - 1]) < 0) {
          [list[i], list[i - 1]] = [list[i - 1], list[i]];
          swap = true;
        }
      } // for
      b++;
    } // while(swap)
  }
}
