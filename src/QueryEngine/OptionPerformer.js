"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_js_1 = require("decimal.js");
const IInsightFacade_1 = require("../controller/IInsightFacade");
const SortPerformer_1 = require("./SortPerformer");
class OptionPerformer {
    constructor(retRaw, id, hasTrans) {
        this.retRaw = [];
        this.retRaw = retRaw;
        this.id = id;
        this.hasTrans = hasTrans;
    }
    setTransBody(transBody) {
        this.transBody = transBody;
    }
    setOptionBody(optionBody) {
        this.optionBody = optionBody;
    }
    sortRetRaw(retList, optionBody) {
        let retFin = [];
        let columnArr = Object.values(Object.values(optionBody)[0]);
        let order = Object.values(optionBody)[1];
        if (optionBody.hasOwnProperty("ORDER")) {
            retFin = this.findOPTIONSwithORDER(columnArr, order, retList);
        }
        else {
            retFin = this.findOPTIONS(Object.values(Object.values(optionBody)[0]), retList);
        }
        return retFin;
    }
    findOPTIONHelper(columnArray, retRaw) {
        let retFin = [];
        let coArr = [];
        if (this.hasTrans) {
            coArr = [...columnArray, ...this.transBody["GROUP"]];
            coArr = coArr.filter(function (elem, idx, self) {
                return idx === self.indexOf(elem);
            });
        }
        else {
            coArr = columnArray;
        }
        let coField = [];
        for (const colKey of coArr) {
            let coRealSplit = colKey.split("_");
            if (coRealSplit.length > 1) {
                coField.push(coRealSplit[1]);
            }
            else {
                if (this.hasTrans) {
                    for (const item of this.transBody["APPLY"]) {
                        if (Object.keys(item).indexOf(colKey) !== -1) {
                            let actual = item;
                            let valkey = Object.values(Object.values(actual)[0])[0];
                            let valSplit = valkey.split("_");
                            let realKey = valSplit[1];
                            coField.push(realKey);
                        }
                        else {
                            break;
                        }
                    }
                }
            }
        }
        for (const lecture of retRaw) {
            let lectureKeys = Object.keys(lecture);
            let temp = {};
            for (const key of lectureKeys) {
                if (coField.includes(key)) {
                    temp[this.id + "_" + key] = Object.values(lecture)[Object.keys(lecture).indexOf(key)];
                }
            }
            retFin.push(temp);
        }
        return retFin;
    }
    findOPTIONSwithORDER(columnArray, orderKey, retRaw) {
        let retFin = [];
        let order = orderKey;
        let appArr;
        retFin = this.findOPTIONHelper(columnArray, retRaw);
        if (this.hasTrans) {
            let temp = this.sortGroup(this.transBody["GROUP"], retFin);
            retFin = this.applyHelper(this.transBody["APPLY"], temp, this.optionBody["COLUMNS"]);
            this.sortPerforemer = new SortPerformer_1.default(retFin, this.id, true);
            this.sortPerforemer.setSortBody(this.optionBody["ORDER"]);
            if (this.optionBody["ORDER"].hasOwnProperty("dir")) {
                this.sortPerforemer.setHasDir(true);
            }
            else {
                this.sortPerforemer.setHasDir(false);
            }
            retFin = this.sortPerforemer.sortGeneral();
        }
        else if (!this.hasTrans) {
            if (!Array.isArray(this.optionBody["ORDER"])) {
                retFin = this.sortOrder(order, retFin);
            }
            else {
                this.sortPerforemer = new SortPerformer_1.default(retFin, this.id, false);
                this.sortPerforemer.setSortBody(this.optionBody["ORDER"]);
                this.sortPerforemer.setHasDir(true);
                retFin = this.sortPerforemer.sortGeneral();
            }
        }
        return retFin;
    }
    findOPTIONS(columnArray, retRaw) {
        let retFin = [];
        let groupArr = [];
        retFin = this.findOPTIONHelper(columnArray, retRaw);
        if (this.hasTrans) {
            let temp = this.sortGroup(this.transBody["GROUP"], retFin);
            retFin = this.applyHelper(this.transBody["APPLY"], temp, this.optionBody["COLUMNS"]);
        }
        return retFin;
    }
    sortOrder(order, sortList) {
        return sortList.sort(function (a, b) {
            return a[order] > b[order] ? 1 : b[order] > a[order] ? -1 : 0;
        });
    }
    sortGroup(groupArr, retRaw) {
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
        }
        return ret;
    }
    groupHelper(groupKey, retList) {
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
    shouldCheckApply(colArr, applykey) {
        return (colArr.indexOf(applykey) !== -1);
    }
    applyHelper(applyArr, retGroup, colArr) {
        let retList = [];
        let ret;
        for (const subGroup of retGroup) {
            ret = subGroup[0];
            if (applyArr.length !== 0) {
                for (const applyItem of applyArr) {
                    if (this.shouldCheckApply(colArr, Object.keys(applyItem)[0])) {
                        const appname = Object.keys(applyItem)[0];
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
                    }
                    else {
                        continue;
                    }
                }
                retList.push(ret);
            }
            else {
                retList.push(ret);
            }
        }
        return retList;
    }
    appColumnDisplayHelper(rawObj, delCol) {
        let finObj = {};
        let propArrRaw = Object.keys(rawObj);
        let propArr = propArrRaw.filter(function (elem) {
            return elem !== delCol;
        });
        for (const prop of propArr) {
            finObj[prop] = rawObj[prop];
        }
        return finObj;
    }
    findCountHelper(ret, countField) {
        let temp = ret.map(function (elem) {
            return elem[countField];
        });
        return temp.filter(function (val, idx, elem) {
            return elem.indexOf(val) === idx;
        }).length;
    }
    findSumHelper(retRaw, sumField) {
        let sum = 0;
        for (const obj of retRaw) {
            sum += obj[sumField];
        }
        return Number(sum.toFixed(2));
    }
    findAvgHelper(retRaw, avgField) {
        const numRows = retRaw.length;
        let sum = new decimal_js_1.default(0);
        for (const obj of retRaw) {
            let temp = new decimal_js_1.default(obj[avgField]);
            sum.add(temp);
        }
        let avg = sum.toNumber() / numRows;
        return Number(avg.toFixed(2));
    }
    findMaxHelper(retRaw, maxField) {
        let temp = retRaw[0][maxField];
        let maxIdx = 0;
        for (let i = 0; i < retRaw.length; i++) {
            if (retRaw[i][maxField] > temp) {
                temp = retRaw[i][maxField];
                maxIdx = i;
            }
        }
        return retRaw[maxIdx][maxField];
    }
    findMinHelper(retRaw, minField) {
        let temp = retRaw[0][minField];
        let minIdx = 0;
        for (let i = 0; i < retRaw.length; i++) {
            if (retRaw[i][minField] < temp) {
                temp = retRaw[i][minField];
                minIdx = i;
            }
        }
        return retRaw[minIdx][minField];
    }
    checkLength(retList) {
        if (retList.length > 5000) {
            throw new IInsightFacade_1.ResultTooLargeError("The result is exceeded 5000");
        }
    }
}
exports.default = OptionPerformer;
//# sourceMappingURL=OptionPerformer.js.map