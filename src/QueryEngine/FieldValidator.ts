import {InsightError, InsightDatasetKind} from "../controller/IInsightFacade";

export default class FieldValidator {
    protected sKey: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname",
        "shortname", "number", "name", "address", "type", "furniture", "href"];

    protected mKey: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    protected cKey: string[] = ["dept", "id", "instructor", "title", "uuid", "avg", "pass", "fail", "audit", "year"];
    protected rKey: string[] = ["fullname", "shortname", "number", "name", "address",
        "type", "furniture", "href", "lat", "lon", "seats"];

    protected sCheckField: string[] = [];
    protected mCheckField: string[] = [];
    protected allCheckField: string[] = [];
    protected applyKey: string[] = [];
    protected anyKeyField: string[] = [];
    protected queryKind: InsightDatasetKind;

    constructor(sCheckField: string[], mCheckField: string[], allCheckField: string[],
                applyKey: string[], anyKeyField: string[] = [], queryKind: InsightDatasetKind) {
        this.sCheckField = sCheckField;
        this.mCheckField = mCheckField;
        this.allCheckField = allCheckField;
        this.applyKey = applyKey;
        this.anyKeyField = anyKeyField;
        this.queryKind = queryKind;
    }

    public validateSCheckField() {
        const sKeyC: string[] = this.sKey.slice(0, 5);
        const sKeyR: string[] = this.sKey.slice(5);
        const finSField: string[] = this.sCheckField;
        if (this.queryKind === InsightDatasetKind.Courses) {
            for (const sFieldKey of finSField) {
                if (sKeyC.indexOf(sFieldKey) === -1) {
                    throw new InsightError("wrong sfield for courses kind");
                }
            }
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            for (const sFieldKey of finSField) {
                if (sKeyR.indexOf(sFieldKey) === -1) {
                    throw new InsightError("wrong sfield for rooms kind");
                }
            }
        } else {
            throw new InsightError("invalid query when checking sfield list");
        }
    }

    public validateMCheckField() {
        const mKeyC: string[] = this.mKey.slice(0, 5);
        const mKeyR: string[] = this.mKey.slice(5);
        const finMField: string[] = this.mCheckField;
        if (this.queryKind === InsightDatasetKind.Courses) {
            for (const mFieldKey of finMField) {
                if (mKeyC.indexOf(mFieldKey) === -1) {
                    throw new InsightError("wrong mfield for courses kind");
                }
            }
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            for (const mFieldKey of finMField) {
                if (mKeyR.indexOf(mFieldKey) === -1) {
                    throw new InsightError("wrong mfield for rooms kind");
                }
            }
        } else {
            throw new InsightError("invalid query when checking mfield list");
        }
    }

    public validateAllField() {
        const finAllField: string[] = this.allCheckField;
        if (this.queryKind === InsightDatasetKind.Courses) {
            for (const cFieldKey of finAllField) {
                if (this.cKey.indexOf(cFieldKey) === -1) {
                    throw new InsightError("wrong allfield for courses kind");
                }
            }
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            for (const rFieldKey of finAllField) {
                if (this.rKey.indexOf(rFieldKey) === -1) {
                    throw new InsightError("wrong allfield for rooms kind");
                }
            }
        } else {
            throw new InsightError("invalid query when checking allfield list");
        }
    }

// TODO: fix second option
    public validateAnyField() {
        const anyKeyC: string[] = [...this.cKey, ...this.applyKey];
        const anyKeyR: string[] = [...this.rKey, ...this.applyKey];
        if (this.queryKind === InsightDatasetKind.Courses) {
            for (const key of this.anyKeyField) {
                if (anyKeyC.indexOf(key) === -1) {
                    throw new InsightError("key is not a any key for courses" + key);
                }
            }
        } else if (this.queryKind === InsightDatasetKind.Rooms) {
            for (const key of this.anyKeyField) {
                if (anyKeyR.indexOf(key) === -1) {
                    throw new InsightError("key is not a any key for rooms" + key);
                }
            }
        } else {
            throw new InsightError("invalid query when checking allfield list");
        }
    }
}
