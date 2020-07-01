import Log from "../Util";
import {InsightDatasetKind, InternalCourseDataset, InternalDataset, Lecture} from "./IInsightFacade";
import DatasetManager from "./DatasetManager";

export default class CourseManager extends DatasetManager {
    private readonly courseDataMap: Map<string, InternalDataset>;
    private readonly internalCourseDataset: InternalCourseDataset;

    constructor(courseDataMap: Map<string, InternalDataset>) {
        super();
        Log.trace("CourseManager Class ::init()");
        this.courseDataMap = courseDataMap;
        this.internalCourseDataset = {
            id: "",
            kind: InsightDatasetKind.Courses,
            numRows: 0,
            result: [],
        };
    }

    public checkIdValidity(id: string): [boolean, string] {
        return super.checkIdValidity(id, this.courseDataMap);
    }

    // REQUIRE: run checkIdValidity() before calling this method
    // return TRUE when successfully put dataset into courseDataMap
    public parseInternalDatasetToDataMap(
        id: string,
        texts: string[],
        kind: InsightDatasetKind,
    ): boolean {
        if (texts.length === 0) {
            return false;
        }
        let response: any;

        // copying every file
        for (const text of texts) {
            // Discard empty string
            if (text.replace(/\s/g, "").length === 0) {
                continue;
            }
            // If file is not valid text file, skip it
            try {
                response = JSON.parse(text);
            } catch (e) {
                continue;
            }
            // Find response with the key 'result'
            if (!response.hasOwnProperty("result")) {
                continue;
            } else if (!(response.result instanceof Array)) {
                continue;
            } else if (response.result.length <= 0) {
                continue;
            } else {
                // The actual copying data
                this.copyData(response);
            }
        }
        if (this.internalCourseDataset.result.length <= 0) {
            return false;
        } else {
            this.setRestOfInternalDataset(id, kind);
            this.courseDataMap.set(id, this.internalCourseDataset);
            return true;
        }
    }

    // copying in one file
    // REQUIRE: valid non-empty array type response
    // EFFECT: Copy data from response to internalCourseDataset.result: Lecture[]
    private copyData(response: any): void {
        for (let section of response.result) {
            if (CourseManager.isSectionValid(section)) {
                this.internalCourseDataset.result.push(
                    CourseManager.createLecture(section),
                );
            }
        }
    }

    private static isSectionValid(section: any): boolean {
        return !(
            !section.hasOwnProperty("Subject") ||
            !section.hasOwnProperty("Course") ||
            !section.hasOwnProperty("Avg") ||
            !section.hasOwnProperty("Professor") ||
            !section.hasOwnProperty("Title") ||
            !section.hasOwnProperty("Pass") ||
            !section.hasOwnProperty("Fail") ||
            !section.hasOwnProperty("Audit") ||
            !section.hasOwnProperty("id") ||
            !section.hasOwnProperty("Year")
        );
    }

    private static createLecture(section: any): Lecture {
        let lecture: Lecture = {
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

    private setRestOfInternalDataset(id: string, kind: InsightDatasetKind) {
        this.internalCourseDataset.id = id;
        this.internalCourseDataset.kind = kind;
        this.internalCourseDataset.numRows = this.internalCourseDataset.result.length;
    }
}
