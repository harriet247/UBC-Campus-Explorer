import Decimal from "decimal.js";
import {
    InsightError,
} from "../controller/IInsightFacade";


export default class SortPerformer {
    protected hasDir: boolean;
    protected sortBody: any;
    protected transBody: any;
    protected hasTrans: boolean;
    protected sortList: any[] = [];
    protected id: string;
    protected sKey: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname",
        "shortname", "number", "name", "address", "type", "furniture", "href"];

    protected mKey: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];

    // TODO: fix the pass in value of sorting body (especially of dir)
    constructor(sortList: any[], id: string, hasTrans: boolean) {
        this.sortList = sortList;
        this.id = id;
        this.hasTrans = hasTrans;
    }

    public setSortBody(sortBody: any) {
        this.sortBody = sortBody;
    }

    public setHasDir(hasDir: boolean) {
        this.hasDir = hasDir;
    }

    public sortGeneral(): any[] {
        const orderKey = Object.values(this.sortBody)[1]; // can be 1)arr or 2)single anykey
        let retFin: any[] = [];
        if (this.hasDir) {
            const dir = Object.values(this.sortBody)[0];
            retFin = this.sortWithDir(dir, this.sortList, orderKey);
        } else {
            retFin = this.sortWithNoDir(this.sortList, orderKey);
        }
        return retFin;
    }

    public sortWithDir(dir: any, sortList: any[], orderKey: any): any[] { // this orderkey should be an string[]
        let direction = 0;
        if (dir === "UP") {
            direction = 1;
        } else if (dir === "DOWN") {
            direction = -1;
        } else {
            throw new InsightError("wrong with sortwithdir");
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

    public sortWithNoDir(sortList: any[], orderKey: any): any[] { // orderkey cant be an array but can be a applykey
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
