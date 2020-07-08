const { exec } = require("child_process");

function execPromise(params) {
    return new Promise((resolve, reject) => {
        exec(params, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

function getGuid(app) {
    return execPromise(`cf app "${app}" --guid`);
}

function getEnv(guid) {
    return execPromise(`cf curl v2/apps/${guid}/env`);
}

async function loadEnv(app) {
    let guid = (await getGuid(app)).trim();
    let envStr = await getEnv(guid);
    let env = JSON.parse(envStr);
    console.log(JSON.stringify(env.system_env_json.VCAP_SERVICES));
}

loadEnv(process.argv[2]);