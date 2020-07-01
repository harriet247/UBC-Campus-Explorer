"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../controller/IInsightFacade");
class InsightEndpoint {
    static addDataset(insightFacade) {
        return (req, res, next) => {
            const id = req.params.id;
            const kind = req.params.kind;
            const content = req.body.toString("base64");
            return insightFacade.addDataset(id, content, kind)
                .then((arr) => {
                res.json(200, {
                    result: arr
                });
                return next();
            })
                .catch((err) => {
                res.json(400, {
                    error: err.message
                });
                return next();
            });
        };
    }
    static removeDataset(insightFacade) {
        return (req, res, next) => {
            const id = req.params.id;
            return insightFacade.removeDataset(id)
                .then((str) => {
                res.json(200, {
                    result: str
                });
                return next();
            })
                .catch((err) => {
                if (err instanceof IInsightFacade_1.InsightError) {
                    res.json(400, {
                        error: err.message
                    });
                }
                else if (err instanceof IInsightFacade_1.NotFoundError) {
                    res.json(404, {
                        error: err.message
                    });
                }
                return next();
            });
        };
    }
    static listDataset(insightFacade) {
        return (req, res, next) => {
            return insightFacade.listDatasets()
                .then((arr) => {
                res.json(200, {
                    result: arr
                });
                return next();
            });
        };
    }
    static performQuery(insightFacade) {
        return (req, res, next) => {
            return insightFacade.listDatasets()
                .then((arr) => {
                if (arr.length === 0) {
                    res.json(400, {
                        error: "There is no dataset available for query"
                    });
                    return next();
                }
                else {
                    return insightFacade.performQuery(req.body);
                }
            })
                .then((arr) => {
                res.json(200, {
                    result: arr
                });
                return next();
            })
                .catch((err) => {
                res.json(400, {
                    error: err.message
                });
                return next();
            });
        };
    }
}
exports.default = InsightEndpoint;
//# sourceMappingURL=InsightEndpoint.js.map