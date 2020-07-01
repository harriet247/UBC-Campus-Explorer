
/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    let query = { WHERE: {}, OPTIONS: {COLUMNS: []}};

    let htmlElem = document.getElementsByClassName("tab-panel active")[0];
    let datasetType = htmlElem.getAttribute("data-type");
    let htmlCon = htmlElem.getElementsByClassName("form-group conditions")[0];
    let htmlCol = htmlElem.getElementsByClassName("form-group columns")[0];
    let htmlOrder = htmlElem.getElementsByClassName("form-group order")[0];
    let htmlGroup = htmlElem.getElementsByClassName("form-group groups")[0];
    let htmlTrans = htmlElem.getElementsByClassName("form-group transformations")[0];

    constructBody(datasetType, htmlCon, query);
    constructTransformations(datasetType, htmlGroup, htmlTrans, query);
    constructOptions(datasetType, htmlCol, htmlOrder, query);
    console.log(query);
    return query;
};

function constructBody(dataset, htmlCon, query) {
    let acturalCon = htmlCon.getElementsByClassName("control-group condition-type")[0];
    let arrCon = Array.from(acturalCon.children);
    let queryCon = "";
    for (let a of arrCon) {
        if (a.children[0].checked) {
            queryCon = a.children[0].value;
        }
    }
    switch (queryCon) {
        case "all":
            queryCon = "AND";
            query["WHERE"][queryCon] = [];
            break;
        case "any":
            queryCon = "OR";
            query["WHERE"][queryCon] = [];
            break;
        case "none":
            queryCon = "NOT";
            query["WHERE"][queryCon] = {};
            break;
    }
    let logicContainer = Array.from(htmlCon.querySelector(".conditions-container").children);
    if (logicContainer.length > 0) {  // TODO: need to double check when length ==0
        let logicObjArr = [];
        for (let container of logicContainer) {
            let containerObj = {};
            let controlFields = Array.from(container.querySelector(".control.fields").children[0].options);
            let controlOp = Array.from(container.querySelector(".control.operators").children[0].options);
            let controlTerm = container.querySelector(".control.term").children[0].value;
            let field = "";
            let op = "";
            let value;
            controlFields.forEach(function (optionELem) {
                if (optionELem.selected) {
                    field = dataset + "_" + optionELem.value; //"courses_avg"
                }
            });
            controlOp.forEach(function (optionELem) {
                if (optionELem.selected) {
                    op = optionELem.value; //"IS"
                }
            });
            value = controlTerm; //“67” or "abv"

            // combine all
            let inner = {};
            if (value !== "") { // avoid cases of convert "" to 0
               let num = +value;
                if (isNaN(num)) {
                    inner[field] = value;
                } else {
                    inner[field] = num;
                }
            } else { // keep ""
                inner[field] = value;
            }

            containerObj[op] = inner;
            if (container .querySelector(".control.not").children[0].checked) {
                let temp = containerObj;
                let notTemp = {NOT: "{}"};
                notTemp["NOT"] = temp;
                containerObj = notTemp;
            }
            logicObjArr.push(containerObj);
        }
        if (queryCon !== "NOT") {
            if(logicObjArr.length === 1){
                query["WHERE"] = logicObjArr[0];
            } else {
                query["WHERE"][queryCon] = logicObjArr;
            }
        } else {
            if (logicObjArr.length === 1) {
                query["WHERE"][queryCon] = logicObjArr[0]; // just one object
            } else { // add another or layer inside NOT
                let wrapper = {};
                wrapper["OR"] = logicObjArr;
                query["WHERE"][queryCon] = wrapper;
            }
        }
    } else {
        query["WHERE"] = {};
    }
}

function constructTransformations(dataset, htmlGroup, htmlTrans, query) {
    // TODO: 添加是否需要加入trans的条件-->看htmlTrans是否有被选中的dropdown对象
    let transContainer = htmlTrans.getElementsByClassName("transformations-container")[0];
    let groupCheckBox = Array.from(htmlGroup.querySelector(".control-group").children);
        let selected = groupCheckBox.filter(function (checkbox) {
            return checkbox.children[0].checked;
        });
    if (transContainer.children.length > 0 || selected.length > 0) {
        let acturalSelected = selected.map(function (field) {
            return dataset + "_" + field.children[0].value;
        });
        query["TRANSFORMATIONS"] = {GROUP: [], APPLY: []};
        query["TRANSFORMATIONS"]["GROUP"] = acturalSelected;
            let transConArr = Array.from(transContainer.children);
            let applyArr = [];
            for (let trans of transConArr) {
                let applyObj = {};
                let applykey = trans.querySelector(".control.term").children[0].value;
                let applyOpArr = Array.from(trans.querySelector(".control.operators").children[0].options);
                let applyFieldArr = Array.from(trans.querySelector(".control.fields").children[0].options);
                let applyOp = "";
                let applyField = "";
                applyOpArr.forEach(function (optionElem) {
                    if (optionElem.selected) {
                        applyOp = optionElem.value;
                    }
                });
                applyFieldArr.forEach(function (optionElem) {
                    if (optionElem.selected) {
                        applyField = dataset + "_" + optionElem.value;
                    }
                });
                // combine all
                applyObj[applykey] = {};
                let inner = {};
                inner[applyOp] = applyField;
                applyObj[applykey] = inner;
                applyArr.push(applyObj);
            }
            query["TRANSFORMATIONS"]["APPLY"] = applyArr;
    }
}

function constructOptions(dataset, htmlCol, htmlOrder, query) {
    //column
    let colFieldArr = Array.from(htmlCol.querySelector(".control-group").children);
    let selectedCol = colFieldArr.filter(function (field) {
        return field.children[0].checked;
    });
    let colArr = selectedCol.map(function (selected) {
        if(selected.className === "control transformation"){
            return selected.children[0].value;
        } else{
            return dataset + "_" + selected.children[0].value;
        }
    });
    query["OPTIONS"]["COLUMNS"] = colArr;
    //sort
    let orderGroup = htmlOrder.querySelector(".control-group").children[0];
    let controlDir = htmlOrder.querySelector(".control-group").children[1];
    let dirSelect = controlDir.children[0].checked;
    let orderArr = Array.from(orderGroup.children[0]);
    let selectedOrder = orderArr.filter(function (order) {
        return order.selected;
    });
    let orderKey = selectedOrder.map(function (selected) {
        if(selected.className === "transformation"){
            return selected.value;
        } else{
            return dataset + "_" + selected.value;
        }
    });

    // if ((!dirSelect) && (selectedOrder.length === 1)) {
    //     query["OPTIONS"]["ORDER"] = orderKey[0]; // 只有当没选dir且order key只有一个时才能是order ： anykey的情况
    // } else
    if(selectedOrder.length > 0 || dirSelect) {
        query["OPTIONS"]["ORDER"] = {dir: "", keys: []};
        query["OPTIONS"]["ORDER"]["keys"] = orderKey;

        if (dirSelect) {
            query["OPTIONS"]["ORDER"]["dir"] = "DOWN";
        } else {
            query["OPTIONS"]["ORDER"]["dir"] = "UP";
        }
    }
}

