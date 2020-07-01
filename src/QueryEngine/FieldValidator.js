"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
class FieldValidator {
    constructor(sCheckField, mCheckField, allCheckField, applyKey, anyKeyField = [], queryKind) {
        this.sKey = ["dept", "id", "instructor", "title", "uuid", "fullname",
            "shortname", "number", "name", "address", "type", "furniture", "href"];
        this.mKey = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
        this.cKey = ["dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
        this.rKey = ["fullname", "shortname", "number", "name", "address",
            "type", "furniture", "href", "lat", "lon", "seats"];
        this.sCheckField = [];
        this.mCheckField = [];
        this.allCheckField = [];
        this.applyKey = [];
        this.anyKeyField = [];
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.allCheckField = allCheckField;
        this.applyKey = applyKey;
        this.anyKeyField = anyKeyField;
        this.queryKind = queryKind;
    }
    validateSCheckField() {
        const sKeyC = this.sKey.slice(0, 5);
        const sKeyR = this.sKey.slice(5);
        const finSField = this.sCheckField;
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            for (const sFieldKey of finSField) {
                if (sKeyC.indexOf(sFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong sfield for courses kind");
                }
            }
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            for (const sFieldKey of finSField) {
                if (sKeyR.indexOf(sFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong sfield for rooms kind");
                }
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query when checking sfield list");
        }
    }
    validateMCheckField() {
        const mKeyC = this.mKey.slice(0, 5);
        const mKeyR = this.mKey.slice(5);
        const finMField = this.mCheckField;
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            for (const mFieldKey of finMField) {
                if (mKeyC.indexOf(mFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong mfield for courses kind");
                }
            }
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            for (const mFieldKey of finMField) {
                if (mKeyR.indexOf(mFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong mfield for rooms kind");
                }
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query when checking mfield list");
        }
    }
    validateAllField() {
        const finAllField = this.allCheckField;
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            for (const cFieldKey of finAllField) {
                if (this.cKey.indexOf(cFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong allfield for courses kind");
                }
            }
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            for (const rFieldKey of finAllField) {
                if (this.rKey.indexOf(rFieldKey) === -1) {
                    throw new IInsightFacade_1.InsightError("wrong allfield for rooms kind");
                }
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query when checking allfield list");
        }
    }
    validateAnyField() {
        const anyKeyC = [...this.cKey, ...this.applyKey];
        const anyKeyR = [...this.rKey, ...this.applyKey];
        if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Courses) {
            for (const key of this.anyKeyField) {
                if (anyKeyC.indexOf(key) === -1) {
                    throw new IInsightFacade_1.InsightError("key is not a any key for courses" + key);
                }
            }
        }
        else if (this.queryKind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            for (const key of this.anyKeyField) {
                if (anyKeyR.indexOf(key) === -1) {
                    throw new IInsightFacade_1.InsightError("key is not a any key for rooms" + key);
                }
            }
        }
        else {
            throw new IInsightFacade_1.InsightError("invalid query when checking allfield list");
        }
    }
}
exports.default = FieldValidator;
//# sourceMappingURL=FieldValidator.js.map