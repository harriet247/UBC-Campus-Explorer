import {InsightError, InsightDatasetKind} from "../controller/IInsightFacade";

export default class TransPolice {
    protected mKey: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    protected cKey: string[] = ["dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
    protected rKey: string[] = ["fullName", "shortName", "number", "name", "address",
        "type", "furniture", "href", "lat", "lon", "seats"];

    protected applyToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    public idList: string[] = [];
    public groupKey: string[] = [];
    public applyKey: string[] = []; // has only applykey
    public sCheckField: string[] = []; // need to keep track of these two for other police
    public mCheckField: string[] = [];
    public allKeyCheckField: string[] = [];

    constructor(sCheckField: string[], mCheckField: string[], idList: string[],
                groupKey: string[], applyKey: string[]) {
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.groupKey = groupKey;
        this.idList = idList;
        this.applyKey = applyKey;
    }

    public getIDList() {
        return this.idList;
    }

    public getApplyKey() {
        return this.applyKey;
    }

    public getGroupKey() {
        return this.groupKey;
    }

    public getSCheckField() {
        return this.sCheckField;
    }

    public getMCheckField() {
        return this.mCheckField;
    }

    public getAllKeyCheckField() {
        return this.allKeyCheckField;
    }


    public validateTrans(transBody: any) {
        let acturalBody: any = transBody;
        if (typeof acturalBody !== "object") {
            throw new InsightError("TRANS is not an object");
        } else if (Array.isArray(acturalBody)) {
            throw new InsightError("TRANS can't be an array");
        } else if (!this.isTRANSCorrect(acturalBody)) {
            throw new InsightError("TRANS body structure is not correct");
        }
    }

    public isTRANSCorrect(transBody: any) {
        let actualBody: any = transBody;
        if (Object.keys(transBody).length === 0) {
            throw new InsightError("TRANSFORMATIONS has 0 keys");
        } else if (!transBody.hasOwnProperty("GROUP")) {
            throw new InsightError("TRANSFORMATIONS doesn't have GROUP");
        } else if (!transBody.hasOwnProperty("APPLY")) {
            throw new InsightError("TRANSFORMATIONS doesn't have APPLY");
        } else if (Object.keys(transBody).length > 2) {
            throw new InsightError("TRANSFORMATION has excess keys other than GROUP and APPLY");
        } else if (typeof actualBody["GROUP"] !== "object") {
            throw new InsightError("GROUP is not an object");
        } else if (!Array.isArray(actualBody["GROUP"])) {
            throw new InsightError("GROUP is not an array");
        } else if (actualBody["GROUP"].length === 0) {
            throw new InsightError("GROUP is an empty array ");
        } else if (!this.isGROUPcorrect(actualBody["GROUP"])) {
            throw new InsightError("GROUP body is not correct");
        } else if (typeof actualBody["APPLY"] !== "object") {
            throw new InsightError("APPLY is not an object");
        } else if (!Array.isArray(actualBody["APPLY"])) {
            throw new InsightError("APPLY is not an array ");
        } else if (!this.isAPPLYcorrect(actualBody["APPLY"])) {
            throw new InsightError("APPLY body is not correct");
        } else {
            return true;
        }
    }

    public isGROUPcorrect(groupArr: string[]) {
        for (const groupItem of groupArr) {
            let groupItemTemp = groupItem.split("_");
            if (typeof groupItem !== "string") {
                throw new InsightError("GROUP item can't be a non string item");
            } else if (groupItemTemp.length > 2) {
                throw new InsightError("GROUP item id contains an underscore");
            } else {
                this.allKeyCheckField.push(groupItemTemp[groupItemTemp.length - 1]);
                this.groupKey.push(groupItemTemp[groupItemTemp.length - 1]); // "title"
                this.idList.push(groupItemTemp[0]);
            }
        }
        return true;
    }

    public isAPPLYcorrect(applyArr: any[]) {
        for (const applyItem of applyArr) {
            if (typeof applyItem !== "object") {
                throw new InsightError("APPLY arr has non object item");
            } else if (Array.isArray(applyItem)) {
                throw new InsightError("APPLY item can't be a arrar");
            } else if (Object.keys(applyItem).length === 0) {
                throw new InsightError("Apply rule should only have 1 key, has 0");
            } else if (Object.keys(applyItem).length > 1) {
                throw new InsightError("Apply rule should only have 1 key, has excess keys");
            } else if (Object.keys(applyItem)[0].includes("_")) {
                throw new InsightError("Cannot have underscore in applyKey");
            } else if (typeof Object.values(applyItem)[0] !== "object") {
                throw new InsightError("APPLY item has non object value");
            } else if (this.isAPPLYValueCorrect(applyItem)) {
                this.applyKey.push(Object.keys(applyItem)[0]); // "maxSeats"
            } else {
                return false;
            }
        }
        return true;
    }

    public isAPPLYValueCorrect(applyItem: any) { // the entire apply object in the arr
        const appTokenTemp = Object.keys(Object.values(applyItem)[0])[0];
        const realAppBody = Object.values(applyItem)[0];
        if (Object.keys(applyItem).length === 0) {
            throw new InsightError("Apply body should only have 1 key, has 0");
        } else if (Object.keys(applyItem).length > 1) {
            throw new InsightError("Apply body should only have 1 key, has excess keys");
        } else if (this.applyToken.indexOf(appTokenTemp) === -1) {
            throw new InsightError("Invalid APPLY TOKEN");
        } else {
            if (typeof Object.values(realAppBody)[0] !== "string") {
                throw new InsightError("Invalid apply rule target key, having non string value");
            } else {
                this.isTokenFieldValueMatch(appTokenTemp, Object.values(realAppBody)[0]);
                return true;
            }
        }
    }

    public isTokenFieldValueMatch(token: string, applyItemVal: any) {
        let applyItemValTemp = applyItemVal.split("_");
        if (applyItemValTemp.length > 2) {
            throw new InsightError("having extra underscore in apply token value");
        } else {
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
                    throw new InsightError("unexpected token");
            }
        }
    }
}
