"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
class OptionPolice {
    constructor(sCheckField, mCheckField, optionBody, idList, applyKey, groupKey, hasTRANS) {
        this.applyKey = [];
        this.groupKey = [];
        this.allKey = [
            "dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year",
            "fullname", "shortname", "number", "name", "address", "type", "furniture", "href", "lat", "lon", "seats"
        ];
        this.hasTRANS = false;
        this.idList = [];
        this.sCheckField = [];
        this.mCheckField = [];
        this.allKeyCheckField = [];
        this.anyKeyCheckField = [];
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.optionBody = optionBody;
        this.idList = idList;
        this.applyKey = applyKey;
        this.groupKey = groupKey;
        this.hasTRANS = hasTRANS;
    }
    getidList() {
        return this.idList;
    }
    getAllKeyCheckField() {
        return this.allKeyCheckField;
    }
    getAnyKeyCheckField() {
        return this.anyKeyCheckField;
    }
    validateOptions(optionBody) {
        if (typeof optionBody !== "object") {
            throw new IInsightFacade_1.InsightError("It has to be an object");
        }
        else if (Array.isArray(optionBody)) {
            throw new IInsightFacade_1.InsightError("It can't be an array");
        }
        else if (Object.keys(optionBody).length === 0) {
            throw new IInsightFacade_1.InsightError("OPTION missing COLUMNS and ORDER");
        }
        else if (Object.keys(optionBody).length > 2) {
            throw new IInsightFacade_1.InsightError("excess keys in option body");
        }
        else if (!optionBody.hasOwnProperty("COLUMNS")) {
            throw new IInsightFacade_1.InsightError("It doesn't have columns");
        }
        else if (!Array.isArray(Object.values(optionBody)[0])) {
            throw new IInsightFacade_1.InsightError("COLUMNS has to be an array");
        }
        else if (Object.values(Object.values(optionBody)[0]).length === 0) {
            throw new IInsightFacade_1.InsightError("COLUMNS can't be an empty array");
        }
        else if (optionBody.hasOwnProperty("ORDER")) {
            this.validateColumnsWithOrder(Object.values(optionBody)[0], Object.values(optionBody)[1]);
        }
        else if (optionBody.hasOwnProperty("COLUMNS")) {
            this.validateColumns(Object.values(optionBody)[0]);
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query string");
        }
    }
    validateColumnsWithOrder(columnsKey, orderKey) {
        const idTemp = columnsKey;
        const idOrder = orderKey;
        for (const key of idTemp) {
            if (key === null) {
                throw new IInsightFacade_1.InsightError("having null for the split in COLUMN");
            }
            else if (typeof key !== "string") {
                throw new IInsightFacade_1.InsightError("having a non-string item in the split of COLUMN ");
            }
            let idString = key.split("_");
            if (idString.length > 2) {
                throw new IInsightFacade_1.InsightError("wrong ID in column");
            }
            else {
                this.validateColWithOrderHelper(idString);
            }
        }
        if (idOrder === null) {
            throw new IInsightFacade_1.InsightError("having null in ORDER");
        }
        else if (typeof idOrder === "object") {
            this.validateOrderWithDir(idOrder, idTemp);
        }
        else if (Array.isArray(idOrder)) {
            throw new IInsightFacade_1.InsightError("order can't be an array");
        }
        else if (typeof idOrder !== "string") {
            throw new IInsightFacade_1.InsightError("having a non-string item in ORDER");
        }
        else if (typeof idOrder === "string") {
            this.isAnykeyCorrect(idOrder);
            let idOrderTemp = idOrder.split("_");
            if (idOrderTemp.length > 2) {
                throw new IInsightFacade_1.InsightError("wrong ID in order for having underscore");
            }
            else {
                if (idTemp.indexOf(idOrder) === -1) {
                    throw new IInsightFacade_1.InsightError("can't order by a key that is not in column");
                }
                else {
                    if (idOrderTemp.length > 1) {
                        this.idList.push(idOrderTemp[0]);
                    }
                }
            }
        }
    }
    validateColWithOrderHelper(idString) {
        const colKey = [...this.applyKey, ...this.groupKey];
        if (this.hasTRANS) {
            if (colKey.indexOf(idString[idString.length - 1]) === -1) {
                throw new IInsightFacade_1.InsightError("using non apply key nor group key in column");
            }
            else {
                if (idString.length > 1) {
                    this.idList.push(idString[0]);
                }
            }
        }
        else if (!this.hasTRANS) {
            this.allKeyCheckField.push(idString[idString.length - 1]);
            if (idString.length > 1) {
                this.idList.push(idString[0]);
            }
        }
    }
    validateColumns(columnsKey) {
        const idTemp = columnsKey;
        const colKey = [...this.applyKey, ...this.groupKey];
        for (const key of idTemp) {
            if (key === null) {
                throw new IInsightFacade_1.InsightError("null in COLUMN");
            }
            else if (typeof key !== "string") {
                throw new IInsightFacade_1.InsightError("having a non-string item in COLUMN");
            }
            let idString = key.split("_");
            if (idString.length > 2) {
                throw new IInsightFacade_1.InsightError("wrong ID in column");
            }
            else {
                if (this.hasTRANS) {
                    if (colKey.indexOf(idString[idString.length - 1]) === -1) {
                        throw new IInsightFacade_1.InsightError("column using key not from apply key nor group key with no order");
                    }
                    else {
                        if (idString.length > 1) {
                            this.idList.push(idString[0]);
                        }
                    }
                }
                else if (!this.hasTRANS) {
                    this.allKeyCheckField.push(idString[idString.length - 1]);
                    if (idString.length > 1) {
                        this.idList.push(idString[0]);
                    }
                }
                else {
                    throw new IInsightFacade_1.InsightError("invalid query in column with no order");
                }
            }
        }
    }
    validateOrderWithDir(orderBody, colArr) {
        let actualOrder = orderBody;
        let actualCol = colArr;
        if (Array.isArray(orderBody)) {
            throw new IInsightFacade_1.InsightError("order body with dir can't be an array");
        }
        else if (Object.keys(orderBody).length === 0) {
            throw new IInsightFacade_1.InsightError("order body with dir can't be empty");
        }
        else if (Object.keys(orderBody).length > 2) {
            throw new IInsightFacade_1.InsightError("order body with dir has excess key");
        }
        else if (!this.isOrderWithDirComplete(orderBody)) {
            throw new IInsightFacade_1.InsightError("order body don't have both dir and keys");
        }
        else if (!this.isDirCorrect(Object.values(orderBody)[0])) {
            throw new IInsightFacade_1.InsightError("direction is not correct");
        }
        else if (typeof Object.values(orderBody)[1] !== "object") {
            throw new IInsightFacade_1.InsightError("keys is not an object");
        }
        else if ((!Array.isArray(Object.values(orderBody)[1]))) {
            throw new IInsightFacade_1.InsightError("keys is not an array");
        }
        else if (actualOrder["keys"].length === 0) {
            throw new IInsightFacade_1.InsightError("keys is an empty array");
        }
        else {
            for (const key of actualOrder["keys"]) {
                this.isAnykeyCorrect(key);
                if (actualCol.indexOf(key) === -1) {
                    throw new IInsightFacade_1.InsightError("order by a non existed key from column (keys array)");
                }
            }
        }
    }
    isAnykeyCorrect(key) {
        const actualKey = key.split("_");
        if (typeof key !== "string") {
            throw new IInsightFacade_1.InsightError("can't have a non string key in keys array/anykey from order");
        }
        else if (key === null) {
            throw new IInsightFacade_1.InsightError("can't have a null in keys array/anykey from order");
        }
        else if (typeof key === "string") {
            if (actualKey.length > 1) {
                this.idList.push(actualKey[0]);
                this.anyKeyCheckField.push(actualKey[1]);
            }
            else {
                this.anyKeyCheckField.push(key);
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query when checking anykey");
        }
    }
    isDirCorrect(orderDir) {
        const dir = ["UP", "DOWN"];
        if (dir.indexOf(orderDir) === -1) {
            throw new IInsightFacade_1.InsightError("direction is not included in UP/DOWN");
        }
        else {
            return true;
        }
    }
    isOrderWithDirComplete(orderBody) {
        if (!orderBody.hasOwnProperty("dir")) {
            throw new IInsightFacade_1.InsightError("no dir in order object value");
        }
        else if (!orderBody.hasOwnProperty("keys")) {
            throw new IInsightFacade_1.InsightError("no keys in order object value");
        }
        else {
            return true;
        }
    }
}
exports.default = OptionPolice;
//# sourceMappingURL=OptionPolice.js.map