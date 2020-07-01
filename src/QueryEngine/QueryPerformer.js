"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
const OptionPerformer_1 = require("./OptionPerformer");
class QueryPerformer {
    constructor(internalDataset, queryKind) {
        this.sKey = ["dept", "id", "instructor", "title", "uuid", "fullname",
            "shortname", "number", "name", "address", "type", "furniture", "href"];
        this.mKey = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        this.buildingList = ["fullname", "shortname", "address", "lat", "lon"];
        this.retRaw = [];
        this.retFin = [];
        this.retTempAND = [];
        this.retTempOR = [];
        this.realInternalResult = [];
        this.realRoomResult = [];
        this.id = internalDataset.id;
        this.queryKind = queryKind;
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            let temp = internalDataset;
            this.internalResultC = temp.result;
            for (const lec of this.internalResultC) {
                this.realInternalResult.push(lec);
            }
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            let temp = internalDataset;
            this.internalResultR = temp.bldgList;
            this.realInternalResult = this.RoomDataHelper();
        }
    }
    RoomDataHelper() {
        for (let i = 0; i < this.internalResultR.length; i++) {
            let obj = {};
            for (const str of this.buildingList) {
                obj[str] = Object.values(Object.values(this.internalResultR))[i][str];
            }
            let roomlist = Object.values(Object.values(this.internalResultR))[i]["roomList"];
            let copy = {};
            let test = {};
            for (const supList of roomlist) {
                copy = Object.assign({}, supList);
                test = Object.assign(Object.assign({}, supList), obj);
                this.realRoomResult.push(test);
            }
        }
        return this.realRoomResult;
    }
    traversalWhole(query) {
        if (Object.values(query["WHERE"]).length === 0) {
            for (const item of this.realInternalResult) {
                this.retRaw.push(item);
            }
        }
        else {
            this.retRaw = this.traversalBody(query["WHERE"]);
        }
        return this.retRaw;
    }
    traversalBody(queryBody) {
        switch (Object.keys(queryBody)[0]) {
            case "OR": {
                for (const item of queryBody["OR"]) {
                    this.retTempOR = this.ORDataCombine(this.retTempOR, this.traversalBody(item));
                }
                return this.retTempOR;
            }
            case "AND": {
                let i = 0;
                for (const item of queryBody["AND"]) {
                    if (i === 0) {
                        this.retTempAND = this.traversalBody(item);
                        i++;
                    }
                    else {
                        this.retTempAND = this.ANDDataCombine(this.retTempAND, this.traversalBody(item));
                    }
                }
                return this.retTempAND;
            }
            case "LT": {
                return this.mCompData(queryBody, "LT");
            }
            case "GT": {
                return this.mCompData(queryBody, "GT");
            }
            case "EQ": {
                return this.mCompData(queryBody, "EQ");
            }
            case "IS": {
                let temp = [];
                temp = this.sCompData(queryBody);
                return temp;
            }
            case "NOT": {
                let retTempNOT = [];
                retTempNOT = this.NOTDataCombine(this.realInternalResult, this.traversalBody(queryBody["NOT"]));
                return retTempNOT;
            }
        }
    }
    ORDataCombine(retList1, retList2) {
        return [...new Set([...retList1, ...retList2])];
    }
    ANDDataCombine(retList1, retList2) {
        return retList1.filter((x) => retList2.includes(x));
    }
    NOTDataCombine(retList1, retList2) {
        return retList1.filter((x) => !retList2.includes(x));
    }
    mCompData(mCompBody, prop) {
        let retTemp = [];
        let mFindVal = Object.values(Object.values(mCompBody)[0])[0];
        let mFindKey = 0;
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            mFindKey = Object.keys(this.internalResultC[0]).indexOf(Object.keys(Object.values(mCompBody)[0])[0].split("_")[1]);
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            mFindKey = Object.keys(this.realRoomResult[0]).indexOf(Object.keys(Object.values(mCompBody)[0])[0].split("_")[1]);
        }
        switch (prop) {
            case "LT":
                for (const item of this.realInternalResult) {
                    if (Object.values(item)[mFindKey] < mFindVal) {
                        retTemp.push(item);
                    }
                }
                break;
            case "GT":
                for (const item of this.realInternalResult) {
                    if (Object.values(item)[mFindKey] > mFindVal) {
                        retTemp.push(item);
                    }
                }
                break;
            case "EQ":
                for (const item of this.realInternalResult) {
                    if (Object.values(item)[mFindKey] === mFindVal) {
                        retTemp.push(item);
                    }
                }
                break;
        }
        return retTemp;
    }
    sCompData(sCompBody) {
        let retTemp = [];
        let realFindVal;
        let sFindVal = Object.values(Object.values(sCompBody)[0])[0];
        let sFindKeyIdx = Object.keys(this.realInternalResult[0]).indexOf(Object.keys(Object.values(sCompBody)[0])[0].split("_")[1]);
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            this.sCompDataHelperC(sFindVal, realFindVal, sFindKeyIdx, retTemp);
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            this.sCompDataHelperR(sFindVal, realFindVal, sFindKeyIdx, retTemp);
        }
        if (sFindVal === "*" || sFindVal === "**") {
            for (const item of this.realInternalResult) {
                retTemp.push(item);
            }
        }
        if (!sFindVal.includes("*")) {
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] === sFindVal) {
                    retTemp.push(item);
                }
            }
        }
        return retTemp;
    }
    sCompDataHelperC(sFindVal, realFindVal, sFindKeyIdx, retTemp) {
        if (sFindVal.startsWith("*") && !sFindVal.endsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].endsWith(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
        else if (sFindVal.endsWith("*") && !sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(0, sFindVal.length - 1);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].startsWith(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
        else if (sFindVal.endsWith("*") && sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length - 1);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].includes(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
    }
    sCompDataHelperR(sFindVal, realFindVal, sFindKeyIdx, retTemp) {
        if (sFindVal.startsWith("*") && !sFindVal.endsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].toString().endsWith(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
        else if (sFindVal.endsWith("*") && !sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(0, sFindVal.length - 1);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].toString().startsWith(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
        else if (sFindVal.endsWith("*") && sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length - 1);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (Object.values(item)[sFindKeyIdx].toString().includes(realFindVal)) {
                        retTemp.push(item);
                    }
                }
            }
        }
    }
    sortRetRaw(retRaw, query) {
        let retFin = [];
        this.optionPerformer = new OptionPerformer_1.default(retRaw, this.id, query.hasOwnProperty(("TRANSFORMATIONS")));
        this.optionPerformer.setOptionBody(query["OPTIONS"]);
        if (query.hasOwnProperty(("TRANSFORMATIONS"))) {
            this.optionPerformer.setTransBody(query["TRANSFORMATIONS"]);
        }
        retFin = this.optionPerformer.sortRetRaw(retRaw, query["OPTIONS"]);
        this.optionPerformer.checkLength(retFin);
        return retFin;
    }
}
exports.default = QueryPerformer;
//# sourceMappingURL=QueryPerformer.js.map