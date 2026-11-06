/* global */

/**
 * MinionRegistry manages the centralized state of all minions in the client.
 * This allows for fast UI rendering (using cached data) while background
 * updates ensure the data stays fresh.
 */
export class MinionRegistry {
  constructor () {
    this.minions = {};
    // map: minionId -> minionData object
  }

  /**
   * Updates or adds a minion to the registry.
   * @param {string} minionId
   * @param {Object} data
   * @returns {Object} The updated minion object.
   */
  upsert (minionId, data) {
    if (!this.minions[minionId]) {
      this.minions[minionId] = {};
    }

    // Merge data into existing record
    for (const key in data) {
      this.minions[minionId][key] = data[key];
    }

    return this.minions[minionId];
  }

  /**
   * Retrieves the current known state of a minion.
   * @param {string} minionId
   * @returns {Object|undefined}
   */
  get (minionId) {
    return this.minions[minionId];
  }

  /**
   * Retrieves all known minions.
   * @returns {Object}
   */
  getAll () {
    return this.minions;
  }

  /**
   * Removes a minion from the registry.
   * @param {string} minionId
   */
  remove (minionId) {
    delete this.minions[minionId];
  }

  /**
   * Checks if a minion exists in the registry.
   * @param {string} minionId
   * @returns {boolean}
   */
  has (minionId) {
    return !!this.minions[minionId];
  }
}
