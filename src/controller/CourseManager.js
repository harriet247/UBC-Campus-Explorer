"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
const IInsightFacade_1 = require("./IInsightFacade");
const DatasetManager_1 = require("./DatasetManager");
class CourseManager extends DatasetManager_1.default {
    constructor(courseDataMap) {
        super();
        Util_1.default.trace("CourseManager Class ::init()");
        this.courseDataMap = courseDataMap;
        this.internalCourseDataset = {
            id: "",
            kind: IInsightFacade_1.InsightDatasetKind.Courses,
            numRows: 0,
            result: [],
        };
    }
    checkIdValidity(id) {
        return super.checkIdValidity(id, this.courseDataMap);
    }
    parseInternalDatasetToDataMap(id, texts, kind) {
        if (texts.length === 0) {
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
        if (this.internalCourseDataset.result.length <= 0) {
            return false;
        }
        else {
            this.setRestOfInternalDataset(id, kind);
            this.courseDataMap.set(id, this.internalCourseDataset);
            return true;
        }
    }
    copyData(response) {
        for (let section of response.result) {
            if (CourseManager.isSectionValid(section)) {
                this.internalCourseDataset.result.push(CourseManager.createLecture(section));
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
    setRestOfInternalDataset(id, kind) {
        this.internalCourseDataset.id = id;
        this.internalCourseDataset.kind = kind;
        this.internalCourseDataset.numRows = this.internalCourseDataset.result.length;
    }
}
exports.default = CourseManager;
//# sourceMappingURL=CourseManager.js.map