/* eslint-disable no-unused-vars */
/* global */

import { JobsSummaryPanel } from "../panels/JobsSummary.js";
import { MinionsPanel } from "../panels/Minions.js";
import { Page } from "./Page.js";
import { Utils } from "../Utils.js";

// We only need to verify these 2 modules
// additional tools like salt-api, salt-cloud, salt-proxy, salt-syndic
// are all forced to the same version due to to the strict version
// dependency on salt-common
const _MASTER = 1;
const _MINION = 2;

export class MinionsPage extends Page {
  constructor (pRouter) {
    super("minions", "Minions", "page-minions", "button-minions", pRouter);

    this.minions = new MinionsPanel();
    super.addPanel(this.minions);
    if (Utils.getQueryParam("popup") !== "true") {
      this.jobs = new JobsSummaryPanel();
      super.addPanel(this.jobs);
    }
  }

  onShow () {
    this.nrMinions = 0;
    this.nrOnline = 0;
    this.nrOffline = 0;

    // 1. Instant UI from cache
    const cachedMinions = this.router.minionRegistry.getAll();
    if (Object.keys(cachedMinions).length > 0) {
      this.minions.updateMinions(cachedMinions);
    }

    const useCacheGrains = Utils.getStorageItemBoolean(
      "session",
      "use_cache_for_grains",
      false,
    );
    this.minions.setWarningText(
      "info",
      useCacheGrains
        ? "the content of this screen is based on cached grains info, minion status or grain info may not be accurate"
        : "",
    );

    const skipWheelMinionsConnected = Utils.getStorageItemBoolean(
      "session",
      "skip_wheel_minions_connected",
      false,
    );

    const wheelKeyListAllPromise = this.api.getWheelKeyListAll();
    const wheelMinionsConnectedPromise = skipWheelMinionsConnected
      ? null
      : this.api.getWheelMinionsConnected();
    const localGrainsItemsPromise = useCacheGrains
      ? this.api.getRunnerCacheGrains(null)
      : this.api.getLocalGrainsItems(null);

    const runnerManageVersionsPromise = this.api.getRunnerManageVersions();

    const selectVisible = Utils.getStorageItemBoolean(
      "session",
      "select_visible",
      false,
    );
    this.minions.showSelectColumn(selectVisible);

    this.minions.loadMinionsTxt();

    wheelKeyListAllPromise.then(
      (pWheelKeyListAllData) => {
        this.minions._handleMinionsWheelKeyListAll(pWheelKeyListAllData);

        if (wheelMinionsConnectedPromise != null) {
          wheelMinionsConnectedPromise.then(
            (pWheelMinionsConnectedData) => {
              this.minions._handlewheelMinionsConnected(
                pWheelMinionsConnectedData,
                pWheelKeyListAllData,
              );
              return true;
            },
            (pWheelMinionsConnectedMsg) => {
              Utils.debug(
                "pWheelMinionsConnectedMsg",
                pWheelMinionsConnectedMsg,
              );
              return false;
            },
          );
        }

        localGrainsItemsPromise.then(
          (pLocalGrainsItemsData) => {
            // IMPORTANT: We pass the raw API response to updateMinions so it can upsert into registry
            this.minions.updateMinions(pLocalGrainsItemsData);
            return true;
          },
          (pLocalGrainsItemsMsg) => {
            const allMinionsErr = Utils.msgPerMinion(
              pWheelKeyListAllData.return[0].data.return.minions,
              JSON.stringify(pLocalGrainsItemsMsg),
            );
            this.minions.updateMinions({ return: [allMinionsErr] });
            return false;
          },
        );

        runnerManageVersionsPromise.then(
          (pRunnerManageVersionsData) => {
            this.minions._handleRunnerManageVersions(pRunnerManageVersionsData);
            return true;
          },
          (pRunnerManageVersionsMsg) => {
            this.minions._handleRunnerManageVersions(
              JSON.stringify(pRunnerManageVersionsMsg),
            );
            return false;
          },
        );
        return true;
      },
      (pWheelKeyListAllMsg) => {
        this.minions._handleMinionsWheelKeyListAll(JSON.stringify(pWheelKeyListAllMsg));
        if (wheelMinionsConnectedPromise != null) {
          Utils.ignorePromise(wheelMinionsConnectedPromise);
        }
        Utils.ignorePromise(localGrainsItemsPromise);
        Utils.ignorePromise(runnerManageVersionsPromise);
        return false;
      },
    );
  }

  handleSaltJobRetEvent (pData) {
    if (this.jobs) {
      this.jobs.handleSaltJobRetEvent(pData);
    }
  }
}
