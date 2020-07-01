"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
class TransPolice {
    constructor(sCheckField, mCheckField, idList, groupKey, applyKey) {
        this.mKey = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        this.cKey = ["dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
        this.rKey = ["fullName", "shortName", "number", "name", "address",
            "type", "furniture", "href", "lat", "lon", "seats"];
        this.applyToken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        this.idList = [];
        this.groupKey = [];
        this.applyKey = [];
        this.sCheckField = [];
        this.mCheckField = [];
        this.allKeyCheckField = [];
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.groupKey = groupKey;
        this.idList = idList;
        this.applyKey = applyKey;
    }
    getIDList() {
        return this.idList;
    }
    getApplyKey() {
        return this.applyKey;
    }
    getGroupKey() {
        return this.groupKey;
    }
    getSCheckField() {
        return this.sCheckField;
    }
    getMCheckField() {
        return this.mCheckField;
    }
    getAllKeyCheckField() {
        return this.allKeyCheckField;
    }
    validateTrans(transBody) {
        let acturalBody = transBody;
        if (typeof acturalBody !== "object") {
            throw new IInsightFacade_1.InsightError("TRANS is not an object");
        }
        else if (Array.isArray(acturalBody)) {
            throw new IInsightFacade_1.InsightError("TRANS can't be an array");
        }
        else if (!this.isTRANSCorrect(acturalBody)) {
            throw new IInsightFacade_1.InsightError("TRANS body structure is not correct");
        }
    }
    isTRANSCorrect(transBody) {
        let actualBody = transBody;
        if (Object.keys(transBody).length === 0) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATIONS has 0 keys");
        }
        else if (!transBody.hasOwnProperty("GROUP")) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATIONS doesn't have GROUP");
        }
        else if (!transBody.hasOwnProperty("APPLY")) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATIONS doesn't have APPLY");
        }
        else if (Object.keys(transBody).length > 2) {
            throw new IInsightFacade_1.InsightError("TRANSFORMATION has excess keys other than GROUP and APPLY");
        }
        else if (typeof actualBody["GROUP"] !== "object") {
            throw new IInsightFacade_1.InsightError("GROUP is not an object");
        }
        else if (!Array.isArray(actualBody["GROUP"])) {
            throw new IInsightFacade_1.InsightError("GROUP is not an array");
        }
        else if (actualBody["GROUP"].length === 0) {
            throw new IInsightFacade_1.InsightError("GROUP is an empty array ");
        }
        else if (!this.isGROUPcorrect(actualBody["GROUP"])) {
            throw new IInsightFacade_1.InsightError("GROUP body is not correct");
        }
        else if (typeof actualBody["APPLY"] !== "object") {
            throw new IInsightFacade_1.InsightError("APPLY is not an object");
        }
        else if (!Array.isArray(actualBody["APPLY"])) {
            throw new IInsightFacade_1.InsightError("APPLY is not an array ");
        }
        else if (!this.isAPPLYcorrect(actualBody["APPLY"])) {
            throw new IInsightFacade_1.InsightError("APPLY body is not correct");
        }
        else {
            return true;
        }
    }
    isGROUPcorrect(groupArr) {
        for (const groupItem of groupArr) {
            let groupItemTemp = groupItem.split("_");
            if (typeof groupItem !== "string") {
                throw new IInsightFacade_1.InsightError("GROUP item can't be a non string item");
            }
            else if (groupItemTemp.length > 2) {
                throw new IInsightFacade_1.InsightError("GROUP item id contains an underscore");
            }
            else {
                this.allKeyCheckField.push(groupItemTemp[groupItemTemp.length - 1]);
                this.groupKey.push(groupItemTemp[groupItemTemp.length - 1]);
                this.idList.push(groupItemTemp[0]);
            }
        }
        return true;
    }
    isAPPLYcorrect(applyArr) {
        for (const applyItem of applyArr) {
            if (typeof applyItem !== "object") {
                throw new IInsightFacade_1.InsightError("APPLY arr has non object item");
            }
            else if (Array.isArray(applyItem)) {
                throw new IInsightFacade_1.InsightError("APPLY item can't be a arrar");
            }
            else if (Object.keys(applyItem).length === 0) {
                throw new IInsightFacade_1.InsightError("Apply rule should only have 1 key, has 0");
            }
            else if (Object.keys(applyItem).length > 1) {
                throw new IInsightFacade_1.InsightError("Apply rule should only have 1 key, has excess keys");
            }
            else if (Object.keys(applyItem)[0].includes("_")) {
                throw new IInsightFacade_1.InsightError("Cannot have underscore in applyKey");
            }
            else if (typeof Object.values(applyItem)[0] !== "object") {
                throw new IInsightFacade_1.InsightError("APPLY item has non object value");
            }
            else if (this.isAPPLYValueCorrect(applyItem)) {
                this.applyKey.push(Object.keys(applyItem)[0]);
            }
            else {
                return false;
            }
        }
        return true;
    }
    isAPPLYValueCorrect(applyItem) {
        const appTokenTemp = Object.keys(Object.values(applyItem)[0])[0];
        const realAppBody = Object.values(applyItem)[0];
        if (Object.keys(applyItem).length === 0) {
            throw new IInsightFacade_1.InsightError("Apply body should only have 1 key, has 0");
        }
        else if (Object.keys(applyItem).length > 1) {
            throw new IInsightFacade_1.InsightError("Apply body should only have 1 key, has excess keys");
        }
        else if (this.applyToken.indexOf(appTokenTemp) === -1) {
            throw new IInsightFacade_1.InsightError("Invalid APPLY TOKEN");
        }
        else {
            if (typeof Object.values(realAppBody)[0] !== "string") {
                throw new IInsightFacade_1.InsightError("Invalid apply rule target key, having non string value");
            }
            else {
                this.isTokenFieldValueMatch(appTokenTemp, Object.values(realAppBody)[0]);
                return true;
            }
        }
    }
    isTokenFieldValueMatch(token, applyItemVal) {
        let applyItemValTemp = applyItemVal.split("_");
        if (applyItemValTemp.length > 2) {
            throw new IInsightFacade_1.InsightError("having extra underscore in apply token value");
        }
        else {
            const applyItemValReal = applyItemValTemp[applyItemValTemp.length - 1];
            switch (token) {
                case "MAX":
                case "MIN":
                case "AVG":
                case "SUM":
                    this.mCheckField.push(applyItemValReal);
                    this.idList.push(applyItemValTemp[0]);
                    break;
                case "COUNT":
                    this.allKeyCheckField.push(applyItemValReal);
                    this.idList.push(applyItemValTemp[0]);
                    break;
                default:
                    throw new IInsightFacade_1.InsightError("unexpected token");
            }
        }
    }
}
exports.default = TransPolice;
//# sourceMappingURL=TransPolice.js.map