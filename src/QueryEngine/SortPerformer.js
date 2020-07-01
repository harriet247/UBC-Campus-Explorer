"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
class SortPerformer {
    constructor(sortList, id, hasTrans) {
        this.sortList = [];
        this.sKey = ["dept", "id", "instructor", "title", "uuid", "fullname",
            "shortname", "number", "name", "address", "type", "furniture", "href"];
        this.mKey = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        this.sortList = sortList;
        this.id = id;
        this.hasTrans = hasTrans;
    }
    setSortBody(sortBody) {
        this.sortBody = sortBody;
    }
    setHasDir(hasDir) {
        this.hasDir = hasDir;
    }
    sortGeneral() {
        const orderKey = Object.values(this.sortBody)[1];
        let retFin = [];
        if (this.hasDir) {
            const dir = Object.values(this.sortBody)[0];
            retFin = this.sortWithDir(dir, this.sortList, orderKey);
        }
        else {
            retFin = this.sortWithNoDir(this.sortList, orderKey);
        }
        return retFin;
    }
    sortWithDir(dir, sortList, orderKey) {
        let direction = 0;
        if (dir === "UP") {
            direction = 1;
        }
        else if (dir === "DOWN") {
            direction = -1;
        }
        else {
            throw new IInsightFacade_1.InsightError("wrong with sortwithdir");
        }
        return sortList.sort(function (a, b) {
            let i = 0, result = 0;
            while (i < orderKey.length && result === 0) {
                result = direction * (a[orderKey[i]] < b[orderKey[i]] ? -1 :
                    (a[orderKey[i]] > b[orderKey[i]] ? 1 : 0));
                i++;
            }
            return result;
        });
    }
    sortWithNoDir(sortList, orderKey) {
        return sortList.sort(function (a, b) {
            let i = 0, result = 0;
            while (i < orderKey.length && result === 0) {
                result = (a[orderKey[i]] < b[orderKey[i]] ? -1 :
                    (a[orderKey[i]] > b[orderKey[i]] ? 1 : 0));
                i++;
            }
            return result;
        });
    }
}
exports.default = SortPerformer;
//# sourceMappingURL=SortPerformer.js.map