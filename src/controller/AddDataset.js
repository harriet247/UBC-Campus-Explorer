"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
class AddDataset {
    constructor(dataMap) {
        Util_1.default.trace("AddDataset Class ::init()");
        this.dataMap = dataMap;
        this.internalDataset = {
            id: "",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 0,
            result: [],
        };
    }
    checkIdValidity(id) {
        if (id === null) {
            return [false, "Invalid id: should not be null"];
        }
        else if (id.includes("_")) {
            return [false, "Invalid id: should not contains underscore"];
        }
        else if (id.replace(/\s/g, "").length === 0) {
            return [false, "Invalid id: should not be only whitespace"];
        }
        else if ([...this.dataMap.keys()].includes(id)) {
            return [false, "Invalid id: repeated id discovered"];
        }
        return [true, "the id is valid"];
    }
    parseInternalDatasetToDataMap(id, texts, kind) {
        if (texts.length === 0) {
            return false;
        }
        if (!AddDataset.checkKindValidity(kind)) {
            return false;
        }
        let response;
        for (const text of texts) {
            if (text.replace(/\s/g, "").length === 0) {
                continue;
            }
            try {
                response = JSON.parse(text);
            }
            catch (e) {
                continue;
            }
            if (!response.hasOwnProperty("result")) {
                continue;
            }
            else if (!(response.result instanceof Array)) {
                continue;
            }
            else if (response.result.length <= 0) {
                continue;
            }
            else {
                this.copyData(response);
            }
        }
        if (this.internalDataset.result.length <= 0) {
            return false;
        }
        else {
            this.setRestOfInternalDataset(id, kind);
            this.dataMap.set(id, this.internalDataset);
            return true;
        }
    }
    copyData(response) {
        for (let section of response.result) {
            if (AddDataset.isSectionValid(section)) {
                this.internalDataset.result.push(AddDataset.createLecture(section));
            }
        }
    }
    static isSectionValid(section) {
        return !(!section.hasOwnProperty("Subject") ||
            !section.hasOwnProperty("Course") ||
            !section.hasOwnProperty("Avg") ||
            !section.hasOwnProperty("Professor") ||
            !section.hasOwnProperty("Title") ||
            !section.hasOwnProperty("Pass") ||
            !section.hasOwnProperty("Fail") ||
            !section.hasOwnProperty("Audit") ||
            !section.hasOwnProperty("id") ||
            !section.hasOwnProperty("Year"));
    }
    static createLecture(section) {
        let lecture = {
            dept: "NOT INITIALIZED",
            id: "NOT INITIALIZED",
            avg: -1,
            instructor: "NOT INITIALIZED",
            title: "NOT INITIALIZED",
            pass: -1,
            fail: -1,
            audit: -1,
            uuid: "NOT INITIALIZED",
            year: -1,
        };
        lecture.audit = section.Audit;
        lecture.avg = section.Avg;
        lecture.dept = section.Subject;
        lecture.id = section.Course;
        lecture.instructor = section.Professor;
        lecture.title = section.Title;
        lecture.pass = section.Pass;
        lecture.fail = section.Fail;
        lecture.uuid = section.id.toString();
        lecture.year =
            section.hasOwnProperty("Section") && section.Section === "overall"
                ? 1900
                : +section.Year;
        return lecture;
    }
    static checkKindValidity(kind) {
        return kind === IInsightFacade_1.InsightDatasetKind.Courses;
    }
    setRestOfInternalDataset(id, kind) {
        this.internalDataset.id = id;
        this.internalDataset.kind = kind;
        this.internalDataset.numRows = this.internalDataset.result.length;
    }
}
exports.default = AddDataset;
//# sourceMappingURL=AddDataset.js.map