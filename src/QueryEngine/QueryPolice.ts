import {InsightError, InsightDatasetKind} from "../controller/IInsightFacade";
import OptionPolice from "./OptionPolice";
import TransPolice from "./TransPolice";
import FieldValidator from "./FieldValidator";
// TODO: revoke all methods requiering querykind after checking idlist
export default class QueryPolice {
    protected sKey: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname",
        "shortname", "number", "name", "address", "type", "furniture", "href"];

    protected mKey: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];

    protected sComp: string[] = ["IS"];
    protected mComp: string[] = ["LT", "GT", "EQ"];
    protected arrayComp: string[] = ["AND", "OR"];
    protected notComp: string[] = ["NOT"];
    protected applyToken: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    public idList: string[] = [];
    public groupKey: string[] = [];
    public applyKey: string[] = []; // has only applykey
    public optionPolice: OptionPolice;
    public transPolice: TransPolice;
    public fieldValidator: FieldValidator;
    public sCheckField: string[] = []; // need to keep track of these two for other police
    public mCheckField: string[] = [];

    public validateQuery(query: any) {
        if (!query.hasOwnProperty("WHERE")) {
            throw new InsightError("Missing WHERE");
        } else if (!query.hasOwnProperty("OPTIONS")) {
            throw new InsightError("Missing OPTIONS");
        } else if ((Object.keys(query).length > 2) &&
            (!query.hasOwnProperty("TRANSFORMATIONS"))) {
            throw new InsightError("Excess keys in query with no TRANSFORMATIONS");
        } else if ((Object.keys(query).length > 3) &&
            (!query.hasOwnProperty("TRANSFORMATIONS"))) {
            throw new InsightError("Excess keys in query with TRANSFORMATIONS");
        } else {
            if (typeof query["WHERE"] !== "object") {
                throw new InsightError("query body must be an object");
            } else if (Array.isArray(query["WHERE"])) {
                throw new InsightError("WHERE can't be an array object");
            } else if (Object.keys(query["WHERE"]).length > 1) {
                throw new InsightError("WHERE body has excess keys");
            } else {
                this.validateCorrectQuery(query);
            }
        }
    }

    public validateCorrectQuery(query: any) {
        this.validateBody(query["WHERE"]); // pass in WHERE object which is the body
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            this.transPolice = new TransPolice(this.sCheckField, this.mCheckField,
                this.idList, this.groupKey, this.applyKey);
            this.transPolice.validateTrans(query["TRANSFORMATIONS"]);
            this.idList = this.transPolice.getIDList();
            this.groupKey = this.transPolice.getGroupKey();
            this.applyKey = this.transPolice.getApplyKey();
            this.optionPolice = new OptionPolice(this.sCheckField, this.mCheckField, query["OPTIONS"],
                this.idList, this.applyKey, this.groupKey, true);
            this.optionPolice.validateOptions(query["OPTIONS"]);
        } else {// pass in OPTION object
            this.optionPolice = new OptionPolice(this.sCheckField, this.mCheckField, query["OPTIONS"],
                this.idList, this.applyKey, this.groupKey, false);
            this.optionPolice.validateOptions(query["OPTIONS"]);
        }
        this.validateAPPList(this.applyKey);
    }

    public validateBody(queryBody: any) {
        if (Object.values(queryBody).length !== 0) {
            switch (Object.keys(queryBody)[0]) {
                case "OR":
                    if (!Array.isArray(queryBody["OR"])) {
                        throw new InsightError("OR is not an array");
                    } else if (queryBody["OR"].length === 0) {
                        throw new InsightError("OR cant be an empty array");
                    } else {
                        for (const key in queryBody["OR"]) {
                            this.validateArray(Object.keys(queryBody["OR"][key]));
                            this.validateBody(queryBody["OR"][key]); // validate each object inside OR array
                        }
                    }
                    break;
                case "AND":
                    if (!Array.isArray(queryBody["AND"])) {
                        throw new InsightError("AND is not an array");
                    } else if (queryBody["AND"].length === 0) {
                        throw new InsightError("AND is an empty array");
                    } else {
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
                    throw new InsightError("Invalid query in query body");
            }
        }
    }

    public validateNOT(notVal: any) {
        if (typeof notVal !== "object") {
            throw new InsightError("the value in not is not an object");
        } else if (Array.isArray(notVal)) {
            throw new InsightError("NOT can't be an array");
        } else if (Object.keys(notVal).length === 0) {
            throw new InsightError("NOT has o key");
        } else if (Object.keys(notVal).length > 1) {
            throw new InsightError("NOT has excess keys");
        }
    }

    public validateArray(arrayObj: any) {
        if (arrayObj.length > 1) {
            throw new InsightError("excess keys in array object");
        }
    }

    // Fix the extra *** error
    public validateSfield(sFieldKey: any) {
        if (typeof sFieldKey !== "object") {
            throw new InsightError("It has to be an object");
        } else if (Array.isArray(sFieldKey)) {
            throw new InsightError("It can't be an array");
        } else if (Object.keys(sFieldKey).length === 0) {
            throw new InsightError("It has 0 keys");
        } else if (Object.keys(sFieldKey).length > 1) {
            throw new InsightError("It has excess keys");
        } else {
            const reg = RegExp(
                "^\\*[a-zA-Z0-9]*[^\\*]$|^[^\\*]*[a-zA-z0-9]*\\*$|^\\*[a-zA-Z0-9]*\\*$",
            );
            let val: any = Object.values(sFieldKey); // value after the "courses_avg" should be a string
            let idTemp: string = Object.keys(sFieldKey)[0]; // "cou_rses_avg"
            let idString: string[] = idTemp.split("_"); // "courses","avg" --> this is an array
            if (idString.length > 2) {
                throw new InsightError("invalid ID string");
            } else if (val.length === 0) {
                throw new InsightError("0 key in s field value");
            } else if (val.length > 1) {
                throw new InsightError("excess key in s field value");
            } else if (typeof val[0] !== "string") {
                throw new InsightError("Wrong value type");
            } else if (typeof val[0] === null) {
                throw new InsightError("having null in s field value");
            } else if (typeof val[0] === "string") {
                if (val[0].includes("*")) {
                    if (!reg.test(val[0])) {
                        throw new InsightError(
                            "regex error for wrong potition/extra asterick *",
                        );
                    }
                }
            }
            this.sCheckField.push(idString[idString.length - 1]);
            this.idList.push(idString[0]); // cant reach here if there's an error above ?
        }
    }

    public validateMfield(mFieldKey: any) {
        if (typeof mFieldKey !== "object") {
            throw new InsightError("It has to be an object");
        } else if (Array.isArray(mFieldKey)) {
            throw new InsightError("It can't be an array");
        } else if (Object.keys(mFieldKey).length === 0) {
            throw new InsightError("It has 0 key");
        } else if (Object.keys(mFieldKey).length > 1) {
            throw new InsightError("It has excess keys");
        } else {
            let val: any = Object.values(mFieldKey); // value after the "courses_avg"
            let idTemp: string = Object.keys(mFieldKey)[0]; // "courses_avg"
            let idString: string[] = idTemp.split("_"); // "courses","avg" --> this is an array
            if (idString.length > 2) {
                throw new InsightError("invalid ID string");
            } else if (val.length === 0) {
                throw new InsightError("Empty in m value field");
            } else if (val.length > 1) {
                throw new InsightError("excess key in m value field");
            } else if (typeof val[0] !== "number") {
                throw new InsightError("wrong key type in m value field");
            } else if (val[0] === null) {
                throw new InsightError("m value field cant have a null");
            }
            this.mCheckField.push(idString[idString.length - 1]);
            this.idList.push(idString[0]);
        }
    }

    public validateIDList(idSet: any[]) {
        this.idList = [...this.idList, ...this.optionPolice.getidList()];
        if (this.idList.length !== 0) {
            const temp: string = this.idList[0];
            for (const id of this.idList) {
                if (temp !== id) {
                    throw new InsightError(
                        "Try to access more than one dataset",
                    );
                }
            }
        } else if (!idSet.includes(this.idList[0])) {
            throw new InsightError("Try to access non-added dataset");
        } else {
            throw new InsightError(
                "there's no dataset asked to be accessed in the query",
            );
        }
    }

    public validateAPPList(applyList: string[]) {
        if (!(applyList.length === new Set(applyList).size)) {
            throw new InsightError("Having duplicates in applylist");
        }
    }

    public validateKind(query: any , queryKind: InsightDatasetKind) {
        let finSField: string[] = [];
        let finMField: string[] = [];
        let finAllField: string[] = [];
        let finApplyKey: string[] = [];
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            finSField = [...this.sCheckField, ...this.transPolice.getSCheckField()];
            finMField = [...this.mCheckField, ...this.transPolice.getMCheckField()];
            finAllField = [...this.transPolice.getAllKeyCheckField(),
                ...this.optionPolice.getAllKeyCheckField()];
            finApplyKey = this.transPolice.getApplyKey();
        } else if (!query .hasOwnProperty("TRANSFORMATIONS")) {
            finSField = this.sCheckField;
            finMField = this.mCheckField;
            finAllField = this.optionPolice.getAllKeyCheckField();
        }
        const finAnyKedyField: string[] = this.optionPolice.getAnyKeyCheckField();
        this.fieldValidator = new FieldValidator(finSField, finMField, finAllField
            , finApplyKey, finAnyKedyField, queryKind);
        this.fieldValidator.validateSCheckField();
        this.fieldValidator.validateMCheckField();
        this.fieldValidator.validateAllField();
        if (query.hasOwnProperty("TRANSFORMATIONS")) {
            this.fieldValidator.validateAnyField();
        }
    }

    public getQueryID(): string {
        return this.idList[0];
    }
}
