import restify = require("restify");
import InsightFacade from "../controller/InsightFacade";
import {InsightDataset, InsightError, NotFoundError} from "../controller/IInsightFacade";

export default class InsightEndpoint {

    public static addDataset(insightFacade: InsightFacade) {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
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
                .catch((err: InsightError) => {
                    res.json(400, {
                        error: err.message
                    });
                    return next();
                });
        };
    }

    public static removeDataset(insightFacade: InsightFacade) {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
            const id = req.params.id;
            return insightFacade.removeDataset(id)
                .then((str: string) => {
                    res.json(200, {
                        result: str
                    });
                    return next();
                })
                .catch((err: any) => {
                    if (err instanceof InsightError) {
                        res.json(400, {
                            error: err.message
                        });
                    } else if (err instanceof NotFoundError) {
                        res.json(404, {
                            error: err.message
                        });
                    }
                    return next();
                });

        };

    }

    public static listDataset(insightFacade: InsightFacade) {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
            return insightFacade.listDatasets()
                .then((arr: InsightDataset[]) => {
                    res.json(200, {
                        result: arr
                    });
                    return next();
                });
        };
    }

    public static performQuery(insightFacade: InsightFacade) {
        return (req: restify.Request, res: restify.Response, next: restify.Next) => {
            return insightFacade.listDatasets()
                .then((arr: InsightDataset[]) => {
                    if (arr.length === 0) {
                        res.json(400, {
                            error: "There is no dataset available for query"
                        });
                        return next();
                    } else {
                        return insightFacade.performQuery(req.body);
                    }
                })
                .then((arr: any[]) => {
                    res.json(200, {
                        result: arr
                    });
                    return next();
                })
                .catch((err: any) => {
                    res.json(400, {
                        error: err.message
                    });
                    return next();
                });
        };
    }
}
