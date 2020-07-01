/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let request = new XMLHttpRequest();
        let url = 'http://localhost:4321/query';
        request.open('POST', url);
        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(query));
        request.onload = () => {
            let result = JSON.parse(request.responseText);
            fulfill(result);
        };
        request.onerror = () => {
            reject("Rejected by the /query endpoint");
        };
    });
}
