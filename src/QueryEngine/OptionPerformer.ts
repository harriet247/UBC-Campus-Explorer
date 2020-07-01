import Decimal from "decimal.js";
import {
    InsightError,
    ResultTooLargeError,
} from "../controller/IInsightFacade";
import SortPerformer from "./SortPerformer";

export default class OptionPerformer {
    protected sortPerforemer: SortPerformer;
    protected optionBody: any;
    protected transBody: any;
    protected hasTrans: boolean;
    protected retRaw: any[] = [];
    protected id: string;

    constructor(retRaw: any[], id: string, hasTrans: boolean) {
        this.retRaw = retRaw;
        this.id = id;
        this.hasTrans = hasTrans;
    }

    public setTransBody(transBody: any) {
        this.transBody = transBody;
    }

    public setOptionBody(optionBody: any) {
        this.optionBody = optionBody;
    }

    public sortRetRaw(retList: any[], optionBody: any): any[] {
        let retFin: any[] = [];
        let columnArr: string[] = Object.values(Object.values(optionBody)[0]);
        let order: any = Object.values(optionBody)[1];
        if (optionBody.hasOwnProperty("ORDER")) {
            retFin = this.findOPTIONSwithORDER(columnArr, order, retList);
        } else {
            retFin = this.findOPTIONS(
                Object.values(Object.values(optionBody)[0]), retList);
        }
        return retFin;
    }

    public findOPTIONHelper(columnArray: any[], retRaw: any[]) {
        let retFin: any[] = [];
        let coArr: string[] = [];
        if (this.hasTrans) {
            coArr = [...columnArray, ...this.transBody["GROUP"]];
            coArr = coArr.filter(function (elem, idx, self) {
                return idx === self.indexOf(elem);
            });
        } else {
            coArr = columnArray;
        }
        let coField: string[] = [];
        for (const colKey of coArr) {
            let coRealSplit: string[] = colKey.split("_");
            if (coRealSplit.length > 1) {
                coField.push(coRealSplit[1]);
            } else {
                if (this.hasTrans) {
                    for (const item of this.transBody["APPLY"]) {
                        if (Object.keys(item).indexOf(colKey) !== -1) {
                            let actual = item;
                            let valkey = Object.values(Object.values(actual)[0])[0];
                            let valSplit = valkey.split("_");
                            let realKey = valSplit[1];
                            coField.push(realKey);
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        for (const lecture of retRaw) {
            let lectureKeys: string[] = Object.keys(lecture);
            let temp: any = {};
            for (const key of lectureKeys) {
                if (coField.includes(key)) {
                    temp[this.id + "_" + key] = Object.values(lecture)[
                        Object.keys(lecture).indexOf(key)
                        ];
                }
            }
            retFin.push(temp);
        }
        return retFin;
    }

    public findOPTIONSwithORDER(
        columnArray: any[], orderKey: any, retRaw: any[]) {
        let retFin = [];
        let order: string = orderKey;
        let appArr: string[];
        retFin = this.findOPTIONHelper(columnArray, retRaw);
        if (this.hasTrans) {
            let temp = this.sortGroup(this.transBody["GROUP"], retFin); // finish group
            retFin = this.applyHelper(this.transBody["APPLY"], temp, this.optionBody["COLUMNS"]);
            this.sortPerforemer = new SortPerformer(retFin, this.id, true);
            this.sortPerforemer.setSortBody(this.optionBody["ORDER"]);
            if (this.optionBody["ORDER"].hasOwnProperty("dir")) {
                this.sortPerforemer.setHasDir(true);
            } else {
                this.sortPerforemer.setHasDir(false);
            }
            retFin = this.sortPerforemer.sortGeneral();
        } else if (!this.hasTrans) { // sort by no trans, c1 design, no trans, no appkey
            if (!Array.isArray(this.optionBody["ORDER"])) {
                retFin = this.sortOrder(order, retFin); // pass in courses_dept and retfin without sorting
            } else {
                this.sortPerforemer = new SortPerformer(retFin, this.id, false);
                this.sortPerforemer.setSortBody(this.optionBody["ORDER"]);
                this.sortPerforemer.setHasDir(true);
                retFin = this.sortPerforemer.sortGeneral();
            }
        }
        return retFin;
    }

    public findOPTIONS(columnArray: any[], retRaw: any[]) { // option with no order, ?trans
        let retFin: any[] = [];
        let groupArr: string[] = [];
        retFin = this.findOPTIONHelper(columnArray, retRaw);
        if (this.hasTrans) {
            let temp = this.sortGroup(this.transBody["GROUP"], retFin); // finish group
            retFin = this.applyHelper(this.transBody["APPLY"], temp, this.optionBody["COLUMNS"]);
        }
        return retFin;
    }

    public sortOrder(order: string, sortList: any[]) { // no dir design
        return sortList.sort(function (a, b) {
            return a[order] > b[order] ? 1 : b[order] > a[order] ? -1 : 0;
        });
    }

    public sortGroup(groupArr: string[], retRaw: any[]) {
        let ret = [retRaw];
        for (let groupKey of groupArr) {
            let next = ret;
            ret = [];
            for (let obj of next) {
                let list = this.groupHelper(groupKey, obj);
                let noDuplicate = new Set();
                for (const item of list) {
                    noDuplicate.add(item[groupKey]);
                }
                for (let e of noDuplicate) {
                    let newGroup = obj.filter(function (o) {
                        return o[groupKey] === e;
                    });
                    ret.push(newGroup);
                }
            }
            if (this.optionBody["COLUMNS"].indexOf(groupKey) === -1) {
                for (const item of ret) {
                    for (let obj of item) {
                        delete obj[groupKey];
                    }
                }
            }
        }// check if need to delete group key
        return ret;
    }

    public groupHelper(groupKey: string, retList: any[]) { // groupkey as an arr
        const result = [...retList.reduce((r, o) => {
            let key = o[groupKey];
            const item = r.get(key) || Object.assign({}, o, {
                used: 0,
                instances: 0
            });
            item.used += o.used;
            item.instances += o.instances;

            return r.set(key, item);
        }, new Map()).values()];
        return result;
    }

    public shouldCheckApply(colArr: string[], applykey: string) {
        return (colArr.indexOf(applykey) !== -1);
    }

    public applyHelper(applyArr: any[], retGroup: any[], colArr: string[]) {
        let retList: any[] = [];
        let ret: any;
        for (const subGroup of retGroup) {
            ret = subGroup[0];
            if (applyArr.length !== 0) {
                for (const applyItem of applyArr) {
                    if (this.shouldCheckApply(colArr, Object.keys(applyItem)[0])) {
                        const appname: string = Object.keys(applyItem)[0];
                        const realApp = Object.values(applyItem)[0];
                        const token = Object.keys(realApp)[0];
                        switch (token) {
                            case "MAX":
                                ret[appname] = this.findMaxHelper(subGroup, Object.values(realApp)[0]);
                                break;
                            case "MIN":
                                ret[appname] = this.findMinHelper(subGroup, Object.values(realApp)[0]);
                                break;
                            case "AVG":
                                ret[appname] = this.findAvgHelper(subGroup, Object.values(realApp)[0]);
                                break;
                            case "SUM":
                                ret[appname] = this.findSumHelper(subGroup, Object.values(realApp)[0]);
                                break;
                            case "COUNT":
                                ret[appname] = this.findCountHelper(subGroup, Object.values(realApp)[0]);
                                break;
                        }
                        ret = this.appColumnDisplayHelper(ret, Object.values(realApp)[0]);
                    } else {
                        continue;
                    }
                }
                retList.push(ret);
            } else {
                retList.push(ret);
            }

        }
        return retList;
    }

    public appColumnDisplayHelper(rawObj: any, delCol: any) {
        let finObj: any = {};
        let propArrRaw = Object.keys(rawObj);
        let propArr = propArrRaw.filter(function (elem) {
            return elem !== delCol;
        });
        for (const prop of propArr) {
            finObj[prop] = rawObj[prop];
        }
        return finObj;
    }

    public findCountHelper(ret: any[], countField: string) {
        let temp = ret.map(function (elem) {
            return elem[countField];
        });
        return temp.filter(function (val, idx, elem) {
            return elem.indexOf(val) === idx;
        }).length;
    }

    public findSumHelper(retRaw: any[], sumField: string) {
        let sum: number = 0;
        for (const obj of retRaw) {
            sum += obj[sumField];
        }
        return Number(sum.toFixed(2));
    }

    public findAvgHelper(retRaw: any[], avgField: string) {
        const numRows: number = retRaw.length;
        let sum: Decimal = new Decimal(0);
        for (const obj of retRaw) {
            let temp: Decimal = new Decimal(obj[avgField]);
            sum.add(temp);
        }
        let avg = sum.toNumber() / numRows;
        return Number(avg.toFixed(2));
    }

    public findMaxHelper(retRaw: any[], maxField: string) {
        let temp: number = retRaw[0][maxField];
        let maxIdx: number = 0;
        for (let i = 0; i < retRaw.length; i++) {
            if (retRaw[i][maxField] > temp) {
                temp = retRaw[i][maxField];
                maxIdx = i;
            }
        }
        return retRaw[maxIdx][maxField];
    }

    public findMinHelper(retRaw: any[], minField: string) {
        let temp: number = retRaw[0][minField];
        let minIdx: number = 0;
        for (let i = 0; i < retRaw.length; i++) {
            if (retRaw[i][minField] < temp) {
                temp = retRaw[i][minField];
                minIdx = i;
            }
        }
        return retRaw[minIdx][minField];
    }

    public checkLength(retList: any[]) {
        if (retList.length > 5000) {
            throw new ResultTooLargeError("The result is exceeded 5000");
        }
    }

}
