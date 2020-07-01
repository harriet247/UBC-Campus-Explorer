import {
    InsightDatasetKind,
    InternalDataset,
    InternalRoomDataset,
} from "../controller/IInsightFacade";
import {InternalCourseDataset} from "../controller/IInsightFacade";
import {Lecture} from "../controller/IInsightFacade";
import OptionPerformer from "./OptionPerformer";
// TODO: 1) room key cases 2) reverse sorting
// 3) sort by multiple keys 4) reject a regex error that shoulnt be an error
// 5) apply by multiple keys
export default class QueryPerformer {
    protected hasTrans: boolean;
    protected optionPerformer: OptionPerformer;
    protected internalResultR: any[];
    protected internalResultC: Lecture[];
    protected id: string;
    protected sKey: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname",
        "shortname", "number", "name", "address", "type", "furniture", "href"];

    protected mKey: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    protected buildingList: string[] = ["fullname", "shortname", "address", "lat", "lon"];
    public retRaw: any[] = [];
    public retFin: any[] = [];
    public retTempAND: any[] = [];
    public retTempOR: any[] = [];
    public queryKind: InsightDatasetKind;
    public realInternalResult: any[] = [];
    public realRoomResult: any[] = [];

    constructor(internalDataset: InternalDataset, queryKind: InsightDatasetKind) {
        this.id = internalDataset.id;
        this.queryKind = queryKind;
        if (this.queryKind === InsightDatasetKind.Courses) {
            let temp: InternalCourseDataset = internalDataset as InternalCourseDataset;
            this.internalResultC = temp.result;
            for (const lec of this.internalResultC) {
                this.realInternalResult.push(lec);
            }
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            let temp: InternalRoomDataset = internalDataset as InternalRoomDataset;
            this.internalResultR = temp.bldgList;
            this.realInternalResult = this.RoomDataHelper();
        }

    }

    public RoomDataHelper() {
        for (let i = 0; i < this.internalResultR.length; i++) {
            let obj: any = {};
            for (const str of this.buildingList) {
                obj[str] = Object.values(Object.values(this.internalResultR))[i][str];
            }
            let roomlist = Object.values(Object.values(this.internalResultR))[i]["roomList"];
            let copy: any = {};
            let test: any = {};
            for (const  supList of roomlist) {
                copy = {...supList};
                test = Object.assign({...supList}, obj);
                this.realRoomResult.push(test);
            }
        }
        return this.realRoomResult;
    }

    public traversalWhole(query: any): any[] {
        if (Object.values(query["WHERE"]).length === 0) {
            for (const item of this.realInternalResult) {
                this.retRaw.push(item);
            }
        } else {
            this.retRaw = this.traversalBody(query["WHERE"]);
        }
        return this.retRaw;
    }

    public traversalBody(queryBody: any): any[] {
        switch (Object.keys(queryBody)[0]) {
            case "OR": {
                for (const item of queryBody["OR"]) {
                    this.retTempOR = this.ORDataCombine(
                        this.retTempOR,
                        this.traversalBody(item),
                    );
                }
                return this.retTempOR;
            }
            case "AND": {
                let i = 0;
                for (const item of queryBody["AND"]) {
                    if (i === 0) {
                        this.retTempAND = this.traversalBody(item);
                        i++;
                    } else {
                        this.retTempAND = this.ANDDataCombine(
                            this.retTempAND,
                            this.traversalBody(item),
                        );
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
                let temp: any[] = [];
                temp = this.sCompData(queryBody);
                return temp;
            }
            case "NOT": {
                let retTempNOT: any[] = [];
                retTempNOT = this.NOTDataCombine(
                    this.realInternalResult,
                    this.traversalBody(queryBody["NOT"]));
                return retTempNOT;
            }
        }
    }

    public ORDataCombine(retList1: any[], retList2: any[]) {
        return [...new Set([...retList1, ...retList2])];
    }

    public ANDDataCombine(retList1: any[], retList2: any[]) {
        return retList1.filter((x: any) => retList2.includes(x));
    }

    public NOTDataCombine(retList1: any[], retList2: any[]) {
        return retList1.filter((x: any) => !retList2.includes(x));
    }

    public mCompData(mCompBody: any, prop: any) {
        let retTemp: any[] = [];
        let mFindVal: number = Object.values(Object.values(mCompBody)[0])[0];
        let mFindKey: number = 0;
        if (this.queryKind === InsightDatasetKind.Courses) {
            mFindKey = Object.keys(this.internalResultC[0]).indexOf( // TODO: fix the internalResultC
                Object.keys(Object.values(mCompBody)[0])[0].split("_")[1],
            ); // get avg/year stuffs' idx
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            mFindKey = Object.keys(this.realRoomResult[0]).indexOf( // TODO: fix the internalResultC
                Object.keys(Object.values(mCompBody)[0])[0].split("_")[1],
            );
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

    public sCompData(sCompBody: any) {
        let retTemp: any[] = [];
        let realFindVal: string;
        let sFindVal: string = Object.values(Object.values(sCompBody)[0])[0]; // could be a regex
        let sFindKeyIdx: number = Object.keys(this.realInternalResult[0]).indexOf(
            Object.keys(Object.values(sCompBody)[0])[0].split("_")[1],
        );
        if (this.queryKind === InsightDatasetKind.Courses) {
            this.sCompDataHelperC(sFindVal, realFindVal, sFindKeyIdx, retTemp);
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
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

    private sCompDataHelperC(sFindVal: string, realFindVal: string, sFindKeyIdx: number, retTemp: any[]) {
        if (sFindVal.startsWith("*") && !sFindVal.endsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].endsWith(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        } else if (sFindVal.endsWith("*") && !sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(0, sFindVal.length - 1);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].startsWith(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        } else if (sFindVal.endsWith("*") && sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length - 1);
            for (const item of this.internalResultC) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].includes(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        }
    }

    private sCompDataHelperR(sFindVal: string, realFindVal: string, sFindKeyIdx: number, retTemp: any[]) {
        if (sFindVal.startsWith("*") && !sFindVal.endsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].toString().endsWith(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        } else if (sFindVal.endsWith("*") && !sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(0, sFindVal.length - 1);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].toString().startsWith(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        } else if (sFindVal.endsWith("*") && sFindVal.startsWith("*")) {
            realFindVal = sFindVal.substring(1, sFindVal.length - 1);
            for (const item of this.realInternalResult) {
                if (Object.values(item)[sFindKeyIdx] !== "") {
                    if (
                        Object.values(item)[sFindKeyIdx].toString().includes(realFindVal)
                    ) {
                        retTemp.push(item);
                    }
                }
            }
        }
    }

    public sortRetRaw(retRaw: any[], query: any) {
        let retFin: any[] = [];
        this.optionPerformer = new OptionPerformer(retRaw, this.id,
            query.hasOwnProperty(("TRANSFORMATIONS")));
        this.optionPerformer.setOptionBody(query["OPTIONS"]);
        if (query.hasOwnProperty(("TRANSFORMATIONS"))) {
            this.optionPerformer.setTransBody(query["TRANSFORMATIONS"]);
        }
        retFin = this.optionPerformer.sortRetRaw(retRaw, query["OPTIONS"]);
        this.optionPerformer.checkLength(retFin);
        return retFin;
    }
}
