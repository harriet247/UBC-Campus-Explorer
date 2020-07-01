import {InsightError, InsightDatasetKind} from "../controller/IInsightFacade";
import {O_DIRECT, O_DSYNC} from "constants";

export default class OptionPolice {
    protected optionBody: any;
    public applyKey: string[] = [];
    protected groupKey: string[] = [];
    protected allKey: string[] = [
        "dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year",
        "fullname", "shortname", "number", "name", "address", "type", "furniture", "href", "lat", "lon", "seats"
    ];

    protected hasTRANS: boolean = false;
    public idList: string[] = [];
    public sCheckField: string[] = []; // need to keep track of these two for other police
    public mCheckField: string[] = [];
    public allKeyCheckField: string[] = [];
    public anyKeyCheckField: string[] = [];

    constructor(sCheckField: string[], mCheckField: string[], optionBody: any, idList: string[],
                applyKey: string[], groupKey: string[], hasTRANS: boolean) {
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.optionBody = optionBody;
        this.idList = idList;
        this.applyKey = applyKey;
        this.groupKey = groupKey;
        this.hasTRANS = hasTRANS;
    }

    public getidList() {
        return this.idList;
    }

    public getAllKeyCheckField() {
        return this.allKeyCheckField;
    }

    public getAnyKeyCheckField() {
        return this.anyKeyCheckField;
    }

    public validateOptions(optionBody: any) {
        if (typeof optionBody !== "object") {
            throw new InsightError("It has to be an object");
        } else if (Array.isArray(optionBody)) {
            throw new InsightError("It can't be an array");
        } else if (Object.keys(optionBody).length === 0) {
            throw new InsightError("OPTION missing COLUMNS and ORDER");
        } else if (Object.keys(optionBody).length > 2) {
            throw new InsightError("excess keys in option body");
        } else if (!optionBody.hasOwnProperty("COLUMNS")) {
            throw new InsightError("It doesn't have columns");
        } else if (!Array.isArray(Object.values(optionBody)[0])) {
            throw new InsightError("COLUMNS has to be an array");
        } else if (Object.values(Object.values(optionBody)[0]).length === 0) {
            throw new InsightError("COLUMNS can't be an empty array");
        } else if (optionBody.hasOwnProperty("ORDER")) {
            this.validateColumnsWithOrder(
                Object.values(optionBody)[0], // column array
                Object.values(optionBody)[1],
            );
        } else if (optionBody.hasOwnProperty("COLUMNS")) {
            this.validateColumns(Object.values(optionBody)[0]); // pass in the COLUMN array and ORDER object
        } else {
            throw new InsightError("invalid query string");
        }
    }

    public validateColumnsWithOrder(columnsKey: any, orderKey: any) {
        const idTemp: any = columnsKey; // an array
        const idOrder: any = orderKey; // either be an object{} or a string
        for (const key of idTemp) {
            if (key === null) {
                throw new InsightError("having null for the split in COLUMN");
            } else if (typeof key !== "string") {
                throw new InsightError(
                    "having a non-string item in the split of COLUMN ",
                );
            }
            let idString: string[] = key.split("_");
            if (idString.length > 2) {
                throw new InsightError("wrong ID in column");
            } else {
                this.validateColWithOrderHelper(idString);
            }
        }
        if (idOrder === null) {
            throw new InsightError("having null in ORDER");
        } else if (typeof idOrder === "object") {
            this.validateOrderWithDir(idOrder, idTemp); // pass in order value to check dir and keys
        } else if (Array.isArray(idOrder)) {
            throw new InsightError("order can't be an array");
        } else if (typeof idOrder !== "string") {
            throw new InsightError("having a non-string item in ORDER");
        } else if (typeof idOrder === "string") {
            this.isAnykeyCorrect(idOrder); // pass in order value to check anykey
            let idOrderTemp = idOrder.split("_");
            if (idOrderTemp.length > 2) {
            throw new InsightError("wrong ID in order for having underscore");
            } else {
            if (idTemp.indexOf(idOrder) === -1) {
                throw new InsightError("can't order by a key that is not in column");
            } else {
                if (idOrderTemp.length > 1) {
                    this.idList.push(idOrderTemp[0]);
                }
            }
        }
        }

    }

    public validateColWithOrderHelper(idString: string[]) {
        const colKey: string[] = [...this.applyKey, ...this.groupKey];
        if (this.hasTRANS) {
            if (colKey.indexOf(idString[idString.length - 1]) === -1) {
                throw new InsightError("using non apply key nor group key in column");
            } else {
                if (idString.length > 1) {
                    this.idList.push(idString[0]);
                }
            }
        } else if (!this.hasTRANS) {
            this.allKeyCheckField.push(idString[idString.length - 1]);
            if (idString.length > 1) {
                this.idList.push(idString[0]);
            }
        }
    }

    public validateColumns(columnsKey: any) {
        const idTemp: any = columnsKey;
        const colKey: string[] = [...this.applyKey, ...this.groupKey]; // containig all keys col can use
        for (const key of idTemp) {
            if (key === null) {
                throw new InsightError("null in COLUMN");
            } else if (typeof key !== "string") {
                throw new InsightError("having a non-string item in COLUMN");
            }
            let idString: string[] = key.split("_");
            if (idString.length > 2) {
                throw new InsightError("wrong ID in column");
            } else {
                if (this.hasTRANS) {
                    if (colKey.indexOf(idString[idString.length - 1]) === -1) {
                        throw new InsightError("column using key not from apply key nor group key with no order");
                    } else {
                        if (idString.length > 1) {
                            this.idList.push(idString[0]);
                        }
                    }
                } else if (!this.hasTRANS) { // check if column using all key from different kind
                    this.allKeyCheckField.push(idString[idString.length - 1]);
                    if (idString.length > 1) {
                        this.idList.push(idString[0]);
                    }
                } else {
                    throw new InsightError("invalid query in column with no order");
                }
            }
        }
    }

    public validateOrderWithDir(orderBody: any, colArr: any) { // orderBody is an object with dir and keys as objkeys
        let actualOrder: any = orderBody;
        let actualCol: string[] = colArr;
        if (Array.isArray(orderBody)) {
            throw new InsightError("order body with dir can't be an array");
        } else if (Object.keys(orderBody).length === 0) {
            throw new InsightError("order body with dir can't be empty");
        } else if (Object.keys(orderBody).length > 2) {
            throw new InsightError("order body with dir has excess key");
        } else if (!this.isOrderWithDirComplete(orderBody)) {
            throw new InsightError("order body don't have both dir and keys");
        } else if (!this.isDirCorrect(Object.values(orderBody)[0])) {
            throw new InsightError("direction is not correct");
        } else if (typeof Object.values(orderBody)[1] !== "object") {
            throw new InsightError("keys is not an object");
        } else if ((!Array.isArray(Object.values(orderBody)[1]))) {
            throw new InsightError("keys is not an array");
        } else if (actualOrder["keys"].length === 0) {
            throw new InsightError("keys is an empty array");
        } else {
            for (const key of actualOrder["keys"]) {
                this.isAnykeyCorrect(key);
                if (actualCol.indexOf(key) === -1) {
                    throw new InsightError("order by a non existed key from column (keys array)");
                }
            }
        }
    }

    public isAnykeyCorrect(key: any) {
        const actualKey: string = key.split("_");
        if (typeof key !== "string") {
            throw new InsightError("can't have a non string key in keys array/anykey from order");
        } else if (key === null) {
            throw new InsightError("can't have a null in keys array/anykey from order");
        } else if (typeof key === "string") { // check if the anykey from combining dif all key
            if (actualKey.length > 1) {
                this.idList.push(actualKey[0]);
                this.anyKeyCheckField.push(actualKey[1]);
            } else {
                this.anyKeyCheckField.push(key);
            }
        } else {
            throw new InsightError("invalid query when checking anykey");
        }
    }

    public isDirCorrect(orderDir: any) {
        const dir: string[] = ["UP", "DOWN"];
        if (dir.indexOf(orderDir) === -1) {
            throw new InsightError("direction is not included in UP/DOWN");
        } else {
            return true;
        }
    }

    public isOrderWithDirComplete(orderBody: any) {
        if (!orderBody.hasOwnProperty("dir")) {
            throw new InsightError("no dir in order object value");
        } else if (!orderBody.hasOwnProperty("keys")) {
            throw new InsightError("no keys in order object value");
        } else {
            return true;
        }
    }

}
