const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

const keyPath = path.resolve(__dirname, `${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

const bigqueryClient = new BigQuery({
    keyFilename: keyPath,
});

async function runQuery(sqlQuery, params = {}) { 
    try {
        const options = {
            query: sqlQuery,
            params: params 
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