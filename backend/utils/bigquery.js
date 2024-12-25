const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

const keyPath = path.join(__dirname, '../config/BLOCKED.json'); // Relative Path to Key File
const bigqueryClient = new BigQuery({
    keyFilename: keyPath,
});

async function runQuery(sqlQuery) {
    try {
        const options = {
            query: sqlQuery,
        };
        const [job] = await bigqueryClient.createQueryJob(options);
        const [rows] = await job.getQueryResults();
        return rows;
    } catch (error) {
        console.error('Error running query:', error);
        return null;
    }
}

module.exports = {
    runQuery,
};