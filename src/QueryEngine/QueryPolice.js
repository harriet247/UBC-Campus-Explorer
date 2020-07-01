"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
const OptionPolice_1 = require("./OptionPolice");
const TransPolice_1 = require("./TransPolice");
const FieldValidator_1 = require("./FieldValidator");
class QueryPolice {
    constructor() {
        this.sKey = ["dept", "id", "instructor", "title", "uuid", "fullname",
            "shortname", "number", "name", "address", "type", "furniture", "href"];
        this.mKey = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        this.sComp = ["IS"];
        this.mComp = ["LT", "GT", "EQ"];
        this.arrayComp = ["AND", "OR"];
        this.notComp = ["NOT"];
        this.applyToken = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        this.idList = [];
        this.groupKey = [];
        this.applyKey = [];
        this.sCheckField = [];
        this.mCheckField = [];
    }
    validateQuery(query) {
        if (!query.hasOwnProperty("WHERE")) {
            throw new IInsightFacade_1.InsightError("Missing WHERE");
        }
        else if (!query.hasOwnProperty("OPTIONS")) {
            throw new IInsightFacade_1.InsightError("Missing OPTIONS");
        }
        else if ((Object.keys(query).length > 2) &&
            (!query.hasOwnProperty("TRANSFORMATIONS"))) {
            throw new IInsightFacade_1.InsightError("Excess keys in query with no TRANSFORMATIONS");
        }
        else if ((Object.keys(query).length > 3) &&
            (!query.hasOwnProperty("TRANSFORMATIONS"))) {
            throw new IInsightFacade_1.InsightError("Excess keys in query with TRANSFORMATIONS");
        }
        else {
            if (typeof query["WHERE"] !== "object") {
                throw new IInsightFacade_1.InsightError("query body must be an object");
            }
            else if (Array.isArray(query["WHERE"])) {
                throw new IInsightFacade_1.InsightError("WHERE can't be an array object");
            }
            else if (Object.keys(query["WHERE"]).length > 1) {
                throw new IInsightFacade_1.InsightError("WHERE body has excess keys");
            }
            else {
                this.validateCorrectQuery(query);
            }
        }
    }
    validateCorrectQuery(query) {
        this.validateBody(query["WHERE"]);
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            this.transPolice = new TransPolice_1.default(this.sCheckField, this.mCheckField, this.idList, this.groupKey, this.applyKey);
            this.transPolice.validateTrans(query["TRANSFORMATIONS"]);
            this.idList = this.transPolice.getIDList();
            this.groupKey = this.transPolice.getGroupKey();
            this.applyKey = this.transPolice.getApplyKey();
            this.optionPolice = new OptionPolice_1.default(this.sCheckField, this.mCheckField, query["OPTIONS"], this.idList, this.applyKey, this.groupKey, true);
            this.optionPolice.validateOptions(query["OPTIONS"]);
        }
        else {
            this.optionPolice = new OptionPolice_1.default(this.sCheckField, this.mCheckField, query["OPTIONS"], this.idList, this.applyKey, this.groupKey, false);
            this.optionPolice.validateOptions(query["OPTIONS"]);
        }
        this.validateAPPList(this.applyKey);
    }
    validateBody(queryBody) {
        if (Object.values(queryBody).length !== 0) {
            switch (Object.keys(queryBody)[0]) {
                case "OR":
                    if (!Array.isArray(queryBody["OR"])) {
                        throw new IInsightFacade_1.InsightError("OR is not an array");
                    }
                    else if (queryBody["OR"].length === 0) {
                        throw new IInsightFacade_1.InsightError("OR cant be an empty array");
                    }
                    else {
                        for (const key in queryBody["OR"]) {
                            this.validateArray(Object.keys(queryBody["OR"][key]));
                            this.validateBody(queryBody["OR"][key]);
                        }
                    }
                    break;
                case "AND":
                    if (!Array.isArray(queryBody["AND"])) {
                        throw new IInsightFacade_1.InsightError("AND is not an array");
                    }
                    else if (queryBody["AND"].length === 0) {
                        throw new IInsightFacade_1.InsightError("AND is an empty array");
                    }
                    else {
                        for (const key in queryBody["AND"]) {
                            this.validateArray(Object.keys(queryBody["AND"][key]));
                            this.validateBody(queryBody["AND"][key]);
                        }
                    }
                    break;
                case "NOT":
                    this.validateNOT(queryBody["NOT"]);
                    this.validateBody(queryBody["NOT"]);
                    break;
                case "LT":
                    this.validateMfield(queryBody["LT"]);
                    break;
                case "GT":
                    this.validateMfield(queryBody["GT"]);
                    break;
                case "EQ":
                    this.validateMfield(queryBody["EQ"]);
                    break;
                case "IS":
                    this.validateSfield(queryBody["IS"]);
                    break;
                default:
                    throw new IInsightFacade_1.InsightError("Invalid query in query body");
            }
        }
    }
    validateNOT(notVal) {
        if (typeof notVal !== "object") {
            throw new IInsightFacade_1.InsightError("the value in not is not an object");
        }
        else if (Array.isArray(notVal)) {
            throw new IInsightFacade_1.InsightError("NOT can't be an array");
        }
        else if (Object.keys(notVal).length === 0) {
            throw new IInsightFacade_1.InsightError("NOT has o key");
        }
        else if (Object.keys(notVal).length > 1) {
            throw new IInsightFacade_1.InsightError("NOT has excess keys");
        }
    }
    validateArray(arrayObj) {
        if (arrayObj.length > 1) {
            throw new IInsightFacade_1.InsightError("excess keys in array object");
        }
    }
    validateSfield(sFieldKey) {
        if (typeof sFieldKey !== "object") {
            throw new IInsightFacade_1.InsightError("It has to be an object");
        }
        else if (Array.isArray(sFieldKey)) {
            throw new IInsightFacade_1.InsightError("It can't be an array");
        }
        else if (Object.keys(sFieldKey).length === 0) {
            throw new IInsightFacade_1.InsightError("It has 0 keys");
        }
        else if (Object.keys(sFieldKey).length > 1) {
            throw new IInsightFacade_1.InsightError("It has excess keys");
        }
        else {
            const reg = RegExp("^\\*[a-zA-Z0-9]*[^\\*]$|^[^\\*]*[a-zA-z0-9]*\\*$|^\\*[a-zA-Z0-9]*\\*$");
            let val = Object.values(sFieldKey);
            let idTemp = Object.keys(sFieldKey)[0];
            let idString = idTemp.split("_");
            if (idString.length > 2) {
                throw new IInsightFacade_1.InsightError("invalid ID string");
            }
            else if (val.length === 0) {
                throw new IInsightFacade_1.InsightError("0 key in s field value");
            }
            else if (val.length > 1) {
                throw new IInsightFacade_1.InsightError("excess key in s field value");
            }
            else if (typeof val[0] !== "string") {
                throw new IInsightFacade_1.InsightError("Wrong value type");
            }
            else if (typeof val[0] === null) {
                throw new IInsightFacade_1.InsightError("having null in s field value");
            }
            else if (typeof val[0] === "string") {
                if (val[0].includes("*")) {
                    if (!reg.test(val[0])) {
                        throw new IInsightFacade_1.InsightError("regex error for wrong potition/extra asterick *");
                    }
                }
            }
            this.sCheckField.push(idString[idString.length - 1]);
            this.idList.push(idString[0]);
        }
    }
    validateMfield(mFieldKey) {
        if (typeof mFieldKey !== "object") {
            throw new IInsightFacade_1.InsightError("It has to be an object");
        }
        else if (Array.isArray(mFieldKey)) {
            throw new IInsightFacade_1.InsightError("It can't be an array");
        }
        else if (Object.keys(mFieldKey).length === 0) {
            throw new IInsightFacade_1.InsightError("It has 0 key");
        }
        else if (Object.keys(mFieldKey).length > 1) {
            throw new IInsightFacade_1.InsightError("It has excess keys");
        }
        else {
            let val = Object.values(mFieldKey);
            let idTemp = Object.keys(mFieldKey)[0];
            let idString = idTemp.split("_");
            if (idString.length > 2) {
                throw new IInsightFacade_1.InsightError("invalid ID string");
            }
            else if (val.length === 0) {
                throw new IInsightFacade_1.InsightError("Empty in m value field");
            }
            else if (val.length > 1) {
                throw new IInsightFacade_1.InsightError("excess key in m value field");
            }
            else if (typeof val[0] !== "number") {
                throw new IInsightFacade_1.InsightError("wrong key type in m value field");
            }
            else if (val[0] === null) {
                throw new IInsightFacade_1.InsightError("m value field cant have a null");
            }
            this.mCheckField.push(idString[idString.length - 1]);
            this.idList.push(idString[0]);
        }
    }
    validateIDList(idSet) {
        this.idList = [...this.idList, ...this.optionPolice.getidList()];
        if (this.idList.length !== 0) {
            const temp = this.idList[0];
            for (const id of this.idList) {
                if (temp !== id) {
                    throw new IInsightFacade_1.InsightError("Try to access more than one dataset");
                }
            }
        }
        else if (!idSet.includes(this.idList[0])) {
            throw new IInsightFacade_1.InsightError("Try to access non-added dataset");
        }
        else {
            throw new IInsightFacade_1.InsightError("there's no dataset asked to be accessed in the query");
        }
    }
    validateAPPList(applyList) {
        if (!(applyList.length === new Set(applyList).size)) {
            throw new IInsightFacade_1.InsightError("Having duplicates in applylist");
        }
    }
    validateKind(query, queryKind) {
        let finSField = [];
        let finMField = [];
        let finAllField = [];
        let finApplyKey = [];
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            finSField = [...this.sCheckField, ...this.transPolice.getSCheckField()];
            finMField = [...this.mCheckField, ...this.transPolice.getMCheckField()];
            finAllField = [...this.transPolice.getAllKeyCheckField(),
                ...this.optionPolice.getAllKeyCheckField()];
            finApplyKey = this.transPolice.getApplyKey();
        }
        else if (!query.hasOwnProperty("TRANSFORMATIONS")) {
            finSField = this.sCheckField;
            finMField = this.mCheckField;
            finAllField = this.optionPolice.getAllKeyCheckField();
        }
        const finAnyKedyField = this.optionPolice.getAnyKeyCheckField();
        this.fieldValidator = new FieldValidator_1.default(finSField, finMField, finAllField, finApplyKey, finAnyKedyField, queryKind);
        this.fieldValidator.validateSCheckField();
        this.fieldValidator.validateMCheckField();
        this.fieldValidator.validateAllField();
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            this.fieldValidator.validateAnyField();
        }
    }
    getQueryID() {
        return this.idList[0];
    }
}
exports.default = QueryPolice;
//# sourceMappingURL=QueryPolice.js.map