/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 6238:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(6024);
const crypto = __nccwpck_require__(6113);
const fs = __nccwpck_require__(7147);
const netlify = __nccwpck_require__(2893);

// Get token and create new Netlify instance.
token = core.getInput("netlify-token");
core.setSecret(token);

const client = new netlify(token);

getSiteIDFromName = async (client) => {
  const name = core.getInput("site-name");
  const site = await client.listSites({ name });

  return site[0]["site_id"];
};

pollDeploy = async (client, site_id) => {
  const deploys = await client.listSiteDeploys({ site_id });
  const deploy_id = deploys[0]["id"];

  while (true) {
    deploy = await client.getSiteDeploy({ site_id, deploy_id });

    if (deploy["state"] === "error") {
      throw Error("Existing build failed. Terminating upload...");
    } else if (deploy["state"] === "ready") {
      break;
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
};

getHash = (path) =>
  new Promise((resolve) => {
    const hash = crypto.createHash("sha1");
    fs.createReadStream(path)
      .on("data", (chunk) => {
        hash.update(chunk);
      })
      .on("end", () => {
        resolve(hash.digest("hex"));
      });
  });

cleanDestinationPath = (path) => {
  if ((chars = path.match(/[#?]/g)) !== null) {
    throw `Destination path contains illegal characters: ${chars.join(", ")}`;
  }

  if (path.startsWith("/")) {
    return path.slice(1);
  } else {
    return path;
  }
};

getFileList = async (client, path, digest, site_id) => {
  const files = await client.listSiteFiles({ site_id });

  var file_digests = {};
  files.forEach((e) => {
    file_digests[e["id"]] = e["sha"];
  });
  file_digests[path] = digest;

  return file_digests;
};

(async () => {
  try {
    const source_file = core.getInput("source-file");
    core.info(`Uploading file ${source_file} to Netlify...`);

    // Get the site ID from the name given to the action. Wait for current deploy to finish.
    const site_id = await getSiteIDFromName(client);
    await pollDeploy(client, site_id);

    // Get hash of file.
    const digest = await getHash(source_file);

    // Get desination file path and list of files.
    const destination = cleanDestinationPath(core.getInput("destination-path"));
    const files = await getFileList(client, "/" + destination, digest, site_id);

    const deploy = await client.createSiteDeploy({
      site_id,
      body: {
        files,
      },
    });

    // Upload file.
    await client.uploadDeployFile({
      deploy_id: deploy["id"],
      path: destination,
      body: fs.createReadStream(source_file),
    });

    core.info("File successfully uploaded to Netlify!");
  } catch (e) {
    core.setFailed(e.message);
  }
})();

module.exports = {
  getSiteIDFromName,
  pollDeploy,
  getHash,
  cleanDestinationPath,
  getFileList,
};


/***/ }),

/***/ 5350:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__nccwpck_require__(2037));
const utils_1 = __nccwpck_require__(7369);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 6024:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __nccwpck_require__(5350);
const file_command_1 = __nccwpck_require__(8466);
const utils_1 = __nccwpck_require__(7369);
const os = __importStar(__nccwpck_require__(2037));
const path = __importStar(__nccwpck_require__(1017));
const oidc_utils_1 = __nccwpck_require__(7557);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    return inputs;
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    command_1.issueCommand('error', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    command_1.issueCommand('warning', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    command_1.issueCommand('notice', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
function getIDToken(aud) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
    });
}
exports.getIDToken = getIDToken;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 8466:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issueCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(7147));
const os = __importStar(__nccwpck_require__(2037));
const utils_1 = __nccwpck_require__(7369);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 7557:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OidcClient = void 0;
const http_client_1 = __nccwpck_require__(9628);
const auth_1 = __nccwpck_require__(4946);
const core_1 = __nccwpck_require__(6024);
class OidcClient {
    static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry
        };
        return new http_client_1.HttpClient('actions/oidc-client', [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
    }
    static getRequestToken() {
        const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        if (!token) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable');
        }
        return token;
    }
    static getIDTokenUrl() {
        const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
        if (!runtimeUrl) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable');
        }
        return runtimeUrl;
    }
    static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
                .getJson(id_token_url)
                .catch(error => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`);
            });
            const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
                throw new Error('Response json body do not have ID Token field');
            }
            return id_token;
        });
    }
    static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // New ID Token is requested from action service
                let id_token_url = OidcClient.getIDTokenUrl();
                if (audience) {
                    const encodedAudience = encodeURIComponent(audience);
                    id_token_url = `${id_token_url}&audience=${encodedAudience}`;
                }
                core_1.debug(`ID token url is ${id_token_url}`);
                const id_token = yield OidcClient.getCall(id_token_url);
                core_1.setSecret(id_token);
                return id_token;
            }
            catch (error) {
                throw new Error(`Error message: ${error.message}`);
            }
        });
    }
}
exports.OidcClient = OidcClient;
//# sourceMappingURL=oidc-utils.js.map

/***/ }),

/***/ 7369:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 4946:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
class BasicCredentialHandler {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' +
                Buffer.from(this.username + ':' + this.password).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BasicCredentialHandler = BasicCredentialHandler;
class BearerCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] = 'Bearer ' + this.token;
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BearerCredentialHandler = BearerCredentialHandler;
class PersonalAccessTokenCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' + Buffer.from('PAT:' + this.token).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;


/***/ }),

/***/ 9628:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const http = __nccwpck_require__(3685);
const https = __nccwpck_require__(5687);
const pm = __nccwpck_require__(6305);
let tunnel;
var HttpCodes;
(function (HttpCodes) {
    HttpCodes[HttpCodes["OK"] = 200] = "OK";
    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
    HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
var Headers;
(function (Headers) {
    Headers["Accept"] = "accept";
    Headers["ContentType"] = "content-type";
})(Headers = exports.Headers || (exports.Headers = {}));
var MediaTypes;
(function (MediaTypes) {
    MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes = exports.MediaTypes || (exports.MediaTypes = {}));
/**
 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
 */
function getProxyUrl(serverUrl) {
    let proxyUrl = pm.getProxyUrl(new URL(serverUrl));
    return proxyUrl ? proxyUrl.href : '';
}
exports.getProxyUrl = getProxyUrl;
const HttpRedirectCodes = [
    HttpCodes.MovedPermanently,
    HttpCodes.ResourceMoved,
    HttpCodes.SeeOther,
    HttpCodes.TemporaryRedirect,
    HttpCodes.PermanentRedirect
];
const HttpResponseRetryCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
];
const RetryableHttpVerbs = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
const ExponentialBackoffCeiling = 10;
const ExponentialBackoffTimeSlice = 5;
class HttpClientError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpClientError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}
exports.HttpClientError = HttpClientError;
class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }
    readBody() {
        return new Promise(async (resolve, reject) => {
            let output = Buffer.alloc(0);
            this.message.on('data', (chunk) => {
                output = Buffer.concat([output, chunk]);
            });
            this.message.on('end', () => {
                resolve(output.toString());
            });
        });
    }
}
exports.HttpClientResponse = HttpClientResponse;
function isHttps(requestUrl) {
    let parsedUrl = new URL(requestUrl);
    return parsedUrl.protocol === 'https:';
}
exports.isHttps = isHttps;
class HttpClient {
    constructor(userAgent, handlers, requestOptions) {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._disposed = false;
        this.userAgent = userAgent;
        this.handlers = handlers || [];
        this.requestOptions = requestOptions;
        if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
                this._ignoreSslError = requestOptions.ignoreSslError;
            }
            this._socketTimeout = requestOptions.socketTimeout;
            if (requestOptions.allowRedirects != null) {
                this._allowRedirects = requestOptions.allowRedirects;
            }
            if (requestOptions.allowRedirectDowngrade != null) {
                this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
            }
            if (requestOptions.maxRedirects != null) {
                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
            if (requestOptions.keepAlive != null) {
                this._keepAlive = requestOptions.keepAlive;
            }
            if (requestOptions.allowRetries != null) {
                this._allowRetries = requestOptions.allowRetries;
            }
            if (requestOptions.maxRetries != null) {
                this._maxRetries = requestOptions.maxRetries;
            }
        }
    }
    options(requestUrl, additionalHeaders) {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }
    get(requestUrl, additionalHeaders) {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }
    del(requestUrl, additionalHeaders) {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }
    post(requestUrl, data, additionalHeaders) {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }
    patch(requestUrl, data, additionalHeaders) {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }
    put(requestUrl, data, additionalHeaders) {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }
    head(requestUrl, additionalHeaders) {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }
    sendStream(verb, requestUrl, stream, additionalHeaders) {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }
    /**
     * Gets a typed object from an endpoint
     * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
     */
    async getJson(requestUrl, additionalHeaders = {}) {
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        let res = await this.get(requestUrl, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async postJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.post(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async putJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.put(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async patchJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.patch(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    async request(verb, requestUrl, data, headers) {
        if (this._disposed) {
            throw new Error('Client has already been disposed.');
        }
        let parsedUrl = new URL(requestUrl);
        let info = this._prepareRequest(verb, parsedUrl, headers);
        // Only perform retries on reads since writes may not be idempotent.
        let maxTries = this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1
            ? this._maxRetries + 1
            : 1;
        let numTries = 0;
        let response;
        while (numTries < maxTries) {
            response = await this.requestRaw(info, data);
            // Check if it's an authentication challenge
            if (response &&
                response.message &&
                response.message.statusCode === HttpCodes.Unauthorized) {
                let authenticationHandler;
                for (let i = 0; i < this.handlers.length; i++) {
                    if (this.handlers[i].canHandleAuthentication(response)) {
                        authenticationHandler = this.handlers[i];
                        break;
                    }
                }
                if (authenticationHandler) {
                    return authenticationHandler.handleAuthentication(this, info, data);
                }
                else {
                    // We have received an unauthorized response but have no handlers to handle it.
                    // Let the response return to the caller.
                    return response;
                }
            }
            let redirectsRemaining = this._maxRedirects;
            while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1 &&
                this._allowRedirects &&
                redirectsRemaining > 0) {
                const redirectUrl = response.message.headers['location'];
                if (!redirectUrl) {
                    // if there's no location to redirect to, we won't
                    break;
                }
                let parsedRedirectUrl = new URL(redirectUrl);
                if (parsedUrl.protocol == 'https:' &&
                    parsedUrl.protocol != parsedRedirectUrl.protocol &&
                    !this._allowRedirectDowngrade) {
                    throw new Error('Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.');
                }
                // we need to finish reading the response before reassigning response
                // which will leak the open socket.
                await response.readBody();
                // strip authorization header if redirected to a different hostname
                if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                    for (let header in headers) {
                        // header names are case insensitive
                        if (header.toLowerCase() === 'authorization') {
                            delete headers[header];
                        }
                    }
                }
                // let's make the request with the new redirectUrl
                info = this._prepareRequest(verb, parsedRedirectUrl, headers);
                response = await this.requestRaw(info, data);
                redirectsRemaining--;
            }
            if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
                // If not a retry code, return immediately instead of retrying
                return response;
            }
            numTries += 1;
            if (numTries < maxTries) {
                await response.readBody();
                await this._performExponentialBackoff(numTries);
            }
        }
        return response;
    }
    /**
     * Needs to be called if keepAlive is set to true in request options.
     */
    dispose() {
        if (this._agent) {
            this._agent.destroy();
        }
        this._disposed = true;
    }
    /**
     * Raw request.
     * @param info
     * @param data
     */
    requestRaw(info, data) {
        return new Promise((resolve, reject) => {
            let callbackForResult = function (err, res) {
                if (err) {
                    reject(err);
                }
                resolve(res);
            };
            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }
    /**
     * Raw request with callback.
     * @param info
     * @param data
     * @param onResult
     */
    requestRawWithCallback(info, data, onResult) {
        let socket;
        if (typeof data === 'string') {
            info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
        }
        let callbackCalled = false;
        let handleResult = (err, res) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res);
            }
        };
        let req = info.httpModule.request(info.options, (msg) => {
            let res = new HttpClientResponse(msg);
            handleResult(null, res);
        });
        req.on('socket', sock => {
            socket = sock;
        });
        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + info.options.path), null);
        });
        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null);
        });
        if (data && typeof data === 'string') {
            req.write(data, 'utf8');
        }
        if (data && typeof data !== 'string') {
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        }
        else {
            req.end();
        }
    }
    /**
     * Gets an http agent. This function is useful when you need an http agent that handles
     * routing through a proxy server - depending upon the url and proxy environment variables.
     * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
     */
    getAgent(serverUrl) {
        let parsedUrl = new URL(serverUrl);
        return this._getAgent(parsedUrl);
    }
    _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        const usingSsl = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        const defaultPort = usingSsl ? 443 : 80;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port
            ? parseInt(info.parsedUrl.port)
            : defaultPort;
        info.options.path =
            (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        if (this.userAgent != null) {
            info.options.headers['user-agent'] = this.userAgent;
        }
        info.options.agent = this._getAgent(info.parsedUrl);
        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach(handler => {
                handler.prepareRequest(info.options);
            });
        }
        return info;
    }
    _mergeHeaders(headers) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers));
        }
        return lowercaseKeys(headers || {});
    }
    _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        let clientHeader;
        if (this.requestOptions && this.requestOptions.headers) {
            clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
        }
        return additionalHeaders[header] || clientHeader || _default;
    }
    _getAgent(parsedUrl) {
        let agent;
        let proxyUrl = pm.getProxyUrl(parsedUrl);
        let useProxy = proxyUrl && proxyUrl.hostname;
        if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
        }
        if (this._keepAlive && !useProxy) {
            agent = this._agent;
        }
        // if agent is already assigned use that agent.
        if (!!agent) {
            return agent;
        }
        const usingSsl = parsedUrl.protocol === 'https:';
        let maxSockets = 100;
        if (!!this.requestOptions) {
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        if (useProxy) {
            // If using proxy, need tunnel
            if (!tunnel) {
                tunnel = __nccwpck_require__(9958);
            }
            const agentOptions = {
                maxSockets: maxSockets,
                keepAlive: this._keepAlive,
                proxy: {
                    ...((proxyUrl.username || proxyUrl.password) && {
                        proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
                    }),
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                }
            };
            let tunnelAgent;
            const overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            }
            else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }
            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
        }
        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
            this._agent = agent;
        }
        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
        }
        if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, {
                rejectUnauthorized: false
            });
        }
        return agent;
    }
    _performExponentialBackoff(retryNumber) {
        retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
        const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
        return new Promise(resolve => setTimeout(() => resolve(), ms));
    }
    static dateTimeDeserializer(key, value) {
        if (typeof value === 'string') {
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }
        return value;
    }
    async _processResponse(res, options) {
        return new Promise(async (resolve, reject) => {
            const statusCode = res.message.statusCode;
            const response = {
                statusCode: statusCode,
                result: null,
                headers: {}
            };
            // not found leads to null obj returned
            if (statusCode == HttpCodes.NotFound) {
                resolve(response);
            }
            let obj;
            let contents;
            // get the result from the body
            try {
                contents = await res.readBody();
                if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                        obj = JSON.parse(contents, HttpClient.dateTimeDeserializer);
                    }
                    else {
                        obj = JSON.parse(contents);
                    }
                    response.result = obj;
                }
                response.headers = res.message.headers;
            }
            catch (err) {
                // Invalid resource (contents not json);  leaving result obj null
            }
            // note that 3xx redirects are handled by the http layer.
            if (statusCode > 299) {
                let msg;
                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                }
                else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                }
                else {
                    msg = 'Failed request: (' + statusCode + ')';
                }
                let err = new HttpClientError(msg, statusCode);
                err.result = response.result;
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    }
}
exports.HttpClient = HttpClient;


/***/ }),

/***/ 6305:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function getProxyUrl(reqUrl) {
    let usingSsl = reqUrl.protocol === 'https:';
    let proxyUrl;
    if (checkBypass(reqUrl)) {
        return proxyUrl;
    }
    let proxyVar;
    if (usingSsl) {
        proxyVar = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
    }
    else {
        proxyVar = process.env['http_proxy'] || process.env['HTTP_PROXY'];
    }
    if (proxyVar) {
        proxyUrl = new URL(proxyVar);
    }
    return proxyUrl;
}
exports.getProxyUrl = getProxyUrl;
function checkBypass(reqUrl) {
    if (!reqUrl.hostname) {
        return false;
    }
    let noProxy = process.env['no_proxy'] || process.env['NO_PROXY'] || '';
    if (!noProxy) {
        return false;
    }
    // Determine the request port
    let reqPort;
    if (reqUrl.port) {
        reqPort = Number(reqUrl.port);
    }
    else if (reqUrl.protocol === 'http:') {
        reqPort = 80;
    }
    else if (reqUrl.protocol === 'https:') {
        reqPort = 443;
    }
    // Format the request hostname and hostname with port
    let upperReqHosts = [reqUrl.hostname.toUpperCase()];
    if (typeof reqPort === 'number') {
        upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
    }
    // Compare request host against noproxy
    for (let upperNoProxyItem of noProxy
        .split(',')
        .map(x => x.trim().toUpperCase())
        .filter(x => x)) {
        if (upperReqHosts.some(x => x === upperNoProxyItem)) {
            return true;
        }
    }
    return false;
}
exports.checkBypass = checkBypass;


/***/ }),

/***/ 4353:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var GetIntrinsic = __nccwpck_require__(4880);

var callBind = __nccwpck_require__(8724);

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};


/***/ }),

/***/ 8724:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var bind = __nccwpck_require__(795);
var GetIntrinsic = __nccwpck_require__(4880);

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}


/***/ }),

/***/ 3967:
/***/ ((module) => {

"use strict";


/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};


/***/ }),

/***/ 795:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var implementation = __nccwpck_require__(3967);

module.exports = Function.prototype.bind || implementation;


/***/ }),

/***/ 4880:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = __nccwpck_require__(407)();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = __nccwpck_require__(795);
var hasOwn = __nccwpck_require__(1122);
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};


/***/ }),

/***/ 407:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = __nccwpck_require__(853);

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};


/***/ }),

/***/ 853:
/***/ ((module) => {

"use strict";


/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};


/***/ }),

/***/ 1122:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var bind = __nccwpck_require__(795);

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);


/***/ }),

/***/ 131:
/***/ ((module) => {

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match words composed of alphanumeric characters. */
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

/** Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23',
    rsComboSymbolsRange = '\\u20d0-\\u20f0',
    rsDingbatRange = '\\u2700-\\u27bf',
    rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
    rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
    rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
    rsPunctuationRange = '\\u2000-\\u206f',
    rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
    rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
    rsVarRange = '\\ufe0e\\ufe0f',
    rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

/** Used to compose unicode capture groups. */
var rsApos = "['\u2019]",
    rsAstral = '[' + rsAstralRange + ']',
    rsBreak = '[' + rsBreakRange + ']',
    rsCombo = '[' + rsComboMarksRange + rsComboSymbolsRange + ']',
    rsDigits = '\\d+',
    rsDingbat = '[' + rsDingbatRange + ']',
    rsLower = '[' + rsLowerRange + ']',
    rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsUpper = '[' + rsUpperRange + ']',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var rsLowerMisc = '(?:' + rsLower + '|' + rsMisc + ')',
    rsUpperMisc = '(?:' + rsUpper + '|' + rsMisc + ')',
    rsOptLowerContr = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
    rsOptUpperContr = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
    reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match apostrophes. */
var reApos = RegExp(rsApos, 'g');

/**
 * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
 * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
 */
var reComboMark = RegExp(rsCombo, 'g');

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/** Used to match complex or compound words. */
var reUnicodeWord = RegExp([
  rsUpper + '?' + rsLower + '+' + rsOptLowerContr + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
  rsUpperMisc + '+' + rsOptUpperContr + '(?=' + [rsBreak, rsUpper + rsLowerMisc, '$'].join('|') + ')',
  rsUpper + '?' + rsLowerMisc + '+' + rsOptLowerContr,
  rsUpper + '+' + rsOptUpperContr,
  rsDigits,
  rsEmoji
].join('|'), 'g');

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

/** Used to detect strings that need a more robust regexp to match words. */
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

/** Used to map Latin Unicode letters to basic Latin letters. */
var deburredLetters = {
  // Latin-1 Supplement block.
  '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
  '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
  '\xc7': 'C',  '\xe7': 'c',
  '\xd0': 'D',  '\xf0': 'd',
  '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
  '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
  '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
  '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
  '\xd1': 'N',  '\xf1': 'n',
  '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
  '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
  '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
  '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
  '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
  '\xc6': 'Ae', '\xe6': 'ae',
  '\xde': 'Th', '\xfe': 'th',
  '\xdf': 'ss',
  // Latin Extended-A block.
  '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
  '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
  '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
  '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
  '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
  '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
  '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
  '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
  '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
  '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
  '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
  '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
  '\u0134': 'J',  '\u0135': 'j',
  '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
  '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
  '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
  '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
  '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
  '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
  '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
  '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
  '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
  '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
  '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
  '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
  '\u0163': 't',  '\u0165': 't', '\u0167': 't',
  '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
  '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
  '\u0174': 'W',  '\u0175': 'w',
  '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
  '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
  '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
  '\u0132': 'IJ', '\u0133': 'ij',
  '\u0152': 'Oe', '\u0153': 'oe',
  '\u0149': "'n", '\u017f': 'ss'
};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array ? array.length : 0;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

/**
 * Splits an ASCII `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function asciiWords(string) {
  return string.match(reAsciiWord) || [];
}

/**
 * The base implementation of `_.propertyOf` without support for deep paths.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyOf(object) {
  return function(key) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
 * letters to basic Latin letters.
 *
 * @private
 * @param {string} letter The matched letter to deburr.
 * @returns {string} Returns the deburred letter.
 */
var deburrLetter = basePropertyOf(deburredLetters);

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

/**
 * Checks if `string` contains a word composed of Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a word is found, else `false`.
 */
function hasUnicodeWord(string) {
  return reHasUnicodeWord.test(string);
}

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

/**
 * Splits a Unicode `string` into an array of its words.
 *
 * @private
 * @param {string} The string to inspect.
 * @returns {Array} Returns the words of `string`.
 */
function unicodeWords(string) {
  return string.match(reUnicodeWord) || [];
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

/**
 * Creates a function like `_.lowerFirst`.
 *
 * @private
 * @param {string} methodName The name of the `String` case method to use.
 * @returns {Function} Returns the new case function.
 */
function createCaseFirst(methodName) {
  return function(string) {
    string = toString(string);

    var strSymbols = hasUnicode(string)
      ? stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

/**
 * Creates a function like `_.camelCase`.
 *
 * @private
 * @param {Function} callback The function to combine each word.
 * @returns {Function} Returns the new compounder function.
 */
function createCompounder(callback) {
  return function(string) {
    return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
  };
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the camel cased string.
 * @example
 *
 * _.camelCase('Foo Bar');
 * // => 'fooBar'
 *
 * _.camelCase('--foo-bar--');
 * // => 'fooBar'
 *
 * _.camelCase('__FOO_BAR__');
 * // => 'fooBar'
 */
var camelCase = createCompounder(function(result, word, index) {
  word = word.toLowerCase();
  return result + (index ? capitalize(word) : word);
});

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('FRED');
 * // => 'Fred'
 */
function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

/**
 * Deburrs `string` by converting
 * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
 * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
 * letters to basic Latin letters and removing
 * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to deburr.
 * @returns {string} Returns the deburred string.
 * @example
 *
 * _.deburr('d??j?? vu');
 * // => 'deja vu'
 */
function deburr(string) {
  string = toString(string);
  return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
}

/**
 * Converts the first character of `string` to upper case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.upperFirst('fred');
 * // => 'Fred'
 *
 * _.upperFirst('FRED');
 * // => 'FRED'
 */
var upperFirst = createCaseFirst('toUpperCase');

/**
 * Splits `string` into an array of its words.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to inspect.
 * @param {RegExp|string} [pattern] The pattern to match words.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {Array} Returns the words of `string`.
 * @example
 *
 * _.words('fred, barney, & pebbles');
 * // => ['fred', 'barney', 'pebbles']
 *
 * _.words('fred, barney, & pebbles', /[^, ]+/g);
 * // => ['fred', 'barney', '&', 'pebbles']
 */
function words(string, pattern, guard) {
  string = toString(string);
  pattern = guard ? undefined : pattern;

  if (pattern === undefined) {
    return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
  }
  return string.match(pattern) || [];
}

module.exports = camelCase;


/***/ }),

/***/ 4970:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.JSONHTTPError = exports.TextHTTPError = exports.HTTPError = exports.getPagination = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pagination = __nccwpck_require__(6510);

Object.defineProperty(exports, "getPagination", ({
  enumerable: true,
  get: function get() {
    return _pagination.getPagination;
  }
}));

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

var HTTPError = exports.HTTPError = function (_extendableBuiltin2) {
  _inherits(HTTPError, _extendableBuiltin2);

  function HTTPError(response) {
    _classCallCheck(this, HTTPError);

    var _this = _possibleConstructorReturn(this, (HTTPError.__proto__ || Object.getPrototypeOf(HTTPError)).call(this, response.statusText));

    _this.name = _this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(_this, _this.constructor);
    } else {
      _this.stack = new Error(response.statusText).stack;
    }
    _this.status = response.status;
    return _this;
  }

  return HTTPError;
}(_extendableBuiltin(Error));

var TextHTTPError = exports.TextHTTPError = function (_HTTPError) {
  _inherits(TextHTTPError, _HTTPError);

  function TextHTTPError(response, data) {
    _classCallCheck(this, TextHTTPError);

    var _this2 = _possibleConstructorReturn(this, (TextHTTPError.__proto__ || Object.getPrototypeOf(TextHTTPError)).call(this, response));

    _this2.data = data;
    return _this2;
  }

  return TextHTTPError;
}(HTTPError);

var JSONHTTPError = exports.JSONHTTPError = function (_HTTPError2) {
  _inherits(JSONHTTPError, _HTTPError2);

  function JSONHTTPError(response, json) {
    _classCallCheck(this, JSONHTTPError);

    var _this3 = _possibleConstructorReturn(this, (JSONHTTPError.__proto__ || Object.getPrototypeOf(JSONHTTPError)).call(this, response));

    _this3.json = json;
    return _this3;
  }

  return JSONHTTPError;
}(HTTPError);

var API = function () {
  function API() {
    var apiURL = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var options = arguments[1];

    _classCallCheck(this, API);

    this.apiURL = apiURL;
    if (this.apiURL.match(/\/[^\/]?/)) {
      // eslint-disable-line no-useless-escape
      this._sameOrigin = true;
    }
    this.defaultHeaders = options && options.defaultHeaders || {};
  }

  _createClass(API, [{
    key: "headers",
    value: function headers() {
      var _headers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return _extends({}, this.defaultHeaders, {
        "Content-Type": "application/json"
      }, _headers);
    }
  }, {
    key: "parseJsonResponse",
    value: function parseJsonResponse(response) {
      return response.json().then(function (json) {
        if (!response.ok) {
          return Promise.reject(new JSONHTTPError(response, json));
        }

        var pagination = (0, _pagination.getPagination)(response);
        return pagination ? { pagination: pagination, items: json } : json;
      });
    }
  }, {
    key: "request",
    value: function request(path) {
      var _this4 = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var headers = this.headers(options.headers || {});
      if (this._sameOrigin) {
        options.credentials = options.credentials || "same-origin";
      }
      return fetch(this.apiURL + path, _extends({}, options, { headers: headers })).then(function (response) {
        var contentType = response.headers.get("Content-Type");
        if (contentType && contentType.match(/json/)) {
          return _this4.parseJsonResponse(response);
        }

        if (!response.ok) {
          return response.text().then(function (data) {
            return Promise.reject(new TextHTTPError(response, data));
          });
        }
        return response.text().then(function (data) {
          data;
        });
      });
    }
  }]);

  return API;
}();

exports["default"] = API;

/***/ }),

/***/ 6510:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getPagination = getPagination;
function getPagination(response) {
  var links = response.headers.get("Link");
  var pagination = {};
  //var link, url, rel, m, page;
  if (links == null) {
    return null;
  }
  links = links.split(",");
  var total = response.headers.get("X-Total-Count");

  for (var i = 0, len = links.length; i < len; i++) {
    var link = links[i].replace(/(^\s*|\s*$)/, "");

    var _link$split = link.split(";"),
        _link$split2 = _slicedToArray(_link$split, 2),
        url = _link$split2[0],
        rel = _link$split2[1];

    var m = url.match(/page=(\d+)/);
    var page = m && parseInt(m[1], 10);
    if (rel.match(/last/)) {
      pagination.last = page;
    } else if (rel.match(/next/)) {
      pagination.next = page;
    } else if (rel.match(/prev/)) {
      pagination.prev = page;
    } else if (rel.match(/first/)) {
      pagination.first = page;
    }
  }

  pagination.last = Math.max(pagination.last || 0, pagination.prev && pagination.prev + 1 || 0);
  pagination.current = pagination.next ? pagination.next - 1 : pagination.last || 1;
  pagination.total = total ? parseInt(total, 10) : null;

  return pagination;
}

/***/ }),

/***/ 2893:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const dfn = __nccwpck_require__(6490)
const pWaitFor = __nccwpck_require__(7662)

const { getMethods } = __nccwpck_require__(4796)
const { getOperations } = __nccwpck_require__(4149)

class NetlifyAPI {
  constructor(firstArg, secondArg) {
    // variadic arguments
    const [accessTokenInput, opts = {}] = typeof firstArg === 'object' ? [null, firstArg] : [firstArg, secondArg]

    // default opts
    const {
      userAgent = 'netlify/js-client',
      scheme = dfn.schemes[0],
      host = dfn.host,
      pathPrefix = dfn.basePath,
      accessToken = accessTokenInput,
      globalParams = {},
      agent,
    } = opts

    const defaultHeaders = {
      'User-agent': userAgent,
      accept: 'application/json',
    }

    const basePath = getBasePath({ scheme, host, pathPrefix })
    const methods = getMethods({ basePath, defaultHeaders, agent, globalParams })
    Object.assign(this, { ...methods, defaultHeaders, scheme, host, pathPrefix, globalParams, accessToken, agent })
  }

  get accessToken() {
    const {
      defaultHeaders: { Authorization },
    } = this
    if (typeof Authorization !== 'string' || !Authorization.startsWith('Bearer ')) {
      return null
    }

    return Authorization.replace('Bearer ', '')
  }

  set accessToken(token) {
    if (!token) {
      delete this.defaultHeaders.Authorization
      return
    }

    this.defaultHeaders.Authorization = `Bearer ${token}`
  }

  get basePath() {
    return getBasePath({ scheme: this.scheme, host: this.host, pathPrefix: this.pathPrefix })
  }

  async getAccessToken(ticket, { poll = DEFAULT_TICKET_POLL, timeout = DEFAULT_TICKET_TIMEOUT } = {}) {
    const { id } = ticket

    // ticket capture
    let authorizedTicket
    const checkTicket = async () => {
      const t = await this.showTicket({ ticketId: id })
      if (t.authorized) {
        authorizedTicket = t
      }
      return Boolean(t.authorized)
    }

    await pWaitFor(checkTicket, {
      interval: poll,
      timeout,
      message: 'Timeout while waiting for ticket grant',
    })

    const accessTokenResponse = await this.exchangeTicket({ ticketId: authorizedTicket.id })
    // See https://open-api.netlify.com/#/default/exchangeTicket for shape
    this.accessToken = accessTokenResponse.access_token
    return accessTokenResponse.access_token
  }
}

const getBasePath = function ({ scheme, host, pathPrefix }) {
  return `${scheme}://${host}${pathPrefix}`
}

// 1 second
const DEFAULT_TICKET_POLL = 1e3
// 1 hour
const DEFAULT_TICKET_TIMEOUT = 3.6e6

module.exports = NetlifyAPI

module.exports.methods = getOperations()


/***/ }),

/***/ 5632:
/***/ ((module) => {

// Handle request body
const addBody = function (body, parameters, opts) {
  if (!body) {
    return opts
  }

  const bodyA = typeof body === 'function' ? body() : body

  if (isBinaryBody(parameters)) {
    return {
      ...opts,
      body: bodyA,
      headers: { 'Content-Type': 'application/octet-stream', ...opts.headers },
    }
  }

  return {
    ...opts,
    body: JSON.stringify(bodyA),
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  }
}

const isBinaryBody = function (parameters) {
  return Object.values(parameters.body).some(isBodyParam)
}

const isBodyParam = function ({ schema }) {
  return schema && schema.format === 'binary'
}

module.exports = { addBody }


/***/ }),

/***/ 4796:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const nodeFetch = __nccwpck_require__(2460)
// Webpack will sometimes export default exports in different places
const fetch = nodeFetch.default || nodeFetch

const { getOperations } = __nccwpck_require__(4149)

const { addBody } = __nccwpck_require__(5632)
const { parseResponse, getFetchError } = __nccwpck_require__(8528)
const { shouldRetry, waitForRetry, MAX_RETRY } = __nccwpck_require__(4377)
const { getUrl } = __nccwpck_require__(7159)

// For each OpenAPI operation, add a corresponding method.
// The `operationId` is the method name.
const getMethods = function ({ basePath, defaultHeaders, agent, globalParams }) {
  const operations = getOperations()
  const methods = operations.map((method) => getMethod({ method, basePath, defaultHeaders, agent, globalParams }))
  return Object.assign({}, ...methods)
}

const getMethod = function ({ method, basePath, defaultHeaders, agent, globalParams }) {
  return {
    [method.operationId](params, opts) {
      return callMethod({ method, basePath, defaultHeaders, agent, globalParams, params, opts })
    },
  }
}

const callMethod = async function ({ method, basePath, defaultHeaders, agent, globalParams, params, opts }) {
  const requestParams = { ...globalParams, ...params }
  const url = getUrl(method, basePath, requestParams)
  const response = await makeRequestOrRetry({ url, method, defaultHeaders, agent, requestParams, opts })

  const parsedResponse = await parseResponse(response)
  return parsedResponse
}

const getOpts = function ({ method: { verb, parameters }, defaultHeaders, agent, requestParams: { body }, opts }) {
  const optsA = addHttpMethod(verb, opts)
  const optsB = addDefaultHeaders(defaultHeaders, optsA)
  const optsC = addBody(body, parameters, optsB)
  const optsD = addAgent(agent, optsC)
  return optsD
}

// Add the HTTP method based on the OpenAPI definition
const addHttpMethod = function (verb, opts) {
  return { ...opts, method: verb.toUpperCase() }
}

// Assign default HTTP headers
const addDefaultHeaders = function (defaultHeaders, opts) {
  return { ...opts, headers: { ...defaultHeaders, ...opts.headers } }
}

// Assign fetch agent (like for example HttpsProxyAgent) if there is one
const addAgent = function (agent, opts) {
  if (agent) {
    return { ...opts, agent }
  }
  return opts
}

const makeRequestOrRetry = async function ({ url, method, defaultHeaders, agent, requestParams, opts }) {
  // Using a loop is simpler here
  for (let index = 0; index <= MAX_RETRY; index++) {
    const optsA = getOpts({ method, defaultHeaders, agent, requestParams, opts })
    // eslint-disable-next-line no-await-in-loop
    const { response, error } = await makeRequest(url, optsA)

    if (shouldRetry({ response, error }) && index !== MAX_RETRY) {
      // eslint-disable-next-line no-await-in-loop
      await waitForRetry(response)
      continue
    }

    if (error !== undefined) {
      throw error
    }

    return response
  }
}

const makeRequest = async function (url, opts) {
  try {
    const response = await fetch(url, opts)
    return { response }
  } catch (error) {
    const errorA = getFetchError(error, url, opts)
    return { error: errorA }
  }
}

module.exports = { getMethods }


/***/ }),

/***/ 8528:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { JSONHTTPError, TextHTTPError } = __nccwpck_require__(4970)
const omit = (__nccwpck_require__(7383)/* ["default"] */ .Z)

// Read and parse the HTTP response
const parseResponse = async function (response) {
  const responseType = getResponseType(response)
  const textResponse = await response.text()

  const parsedResponse = parseJsonResponse(response, textResponse, responseType)

  if (!response.ok) {
    const ErrorType = responseType === 'json' ? JSONHTTPError : TextHTTPError
    throw new ErrorType(response, parsedResponse)
  }

  return parsedResponse
}

const getResponseType = function ({ headers }) {
  const contentType = headers.get('Content-Type')

  if (contentType != null && contentType.includes('json')) {
    return 'json'
  }

  return 'text'
}

const parseJsonResponse = function (response, textResponse, responseType) {
  if (responseType === 'text') {
    return textResponse
  }

  try {
    return JSON.parse(textResponse)
  } catch (error) {
    throw new TextHTTPError(response, textResponse)
  }
}

const getFetchError = function (error, url, opts) {
  const data = omit(opts, ['Authorization'])
  error.name = 'FetchError'
  error.url = url
  error.data = data
  return error
}

module.exports = { parseResponse, getFetchError }


/***/ }),

/***/ 4377:
/***/ ((module) => {

// We retry:
//  - when receiving a rate limiting response
//  - on network failures due to timeouts
const shouldRetry = function ({ response = {}, error = {} }) {
  return isRetryStatus(response) || RETRY_ERROR_CODES.has(error.code)
}

const isRetryStatus = function ({ status }) {
  return typeof status === 'number' && (status === RATE_LIMIT_STATUS || String(status).startsWith('5'))
}

const waitForRetry = async function (response) {
  const delay = getDelay(response)
  await sleep(delay)
}

const getDelay = function (response) {
  if (response === undefined) {
    return DEFAULT_RETRY_DELAY
  }

  const rateLimitReset = response.headers.get(RATE_LIMIT_HEADER)

  if (!rateLimitReset) {
    return DEFAULT_RETRY_DELAY
  }

  return Math.max(Number(rateLimitReset) * SECS_TO_MSECS - Date.now(), MIN_RETRY_DELAY)
}

const sleep = function (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const DEFAULT_RETRY_DELAY = 5e3
const MIN_RETRY_DELAY = 1e3
const SECS_TO_MSECS = 1e3
const MAX_RETRY = 5
const RATE_LIMIT_STATUS = 429
const RATE_LIMIT_HEADER = 'X-RateLimit-Reset'
const RETRY_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET'])

module.exports = { shouldRetry, waitForRetry, MAX_RETRY }


/***/ }),

/***/ 7159:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const camelCase = __nccwpck_require__(131)
const queryString = __nccwpck_require__(737)

// Replace path parameters and query parameters in the URI, using the OpenAPI
// definition
const getUrl = function ({ path, parameters }, basePath, requestParams) {
  const url = `${basePath}${path}`
  const urlA = addPathParams(url, parameters, requestParams)
  const urlB = addQueryParams(urlA, parameters, requestParams)
  return urlB
}

const addPathParams = function (url, parameters, requestParams) {
  const pathParams = getRequestParams(parameters.path, requestParams, 'path variable')
  return Object.entries(pathParams).reduce(addPathParam, url)
}

const addPathParam = function (url, [name, value]) {
  return url.replace(`{${name}}`, value)
}

const addQueryParams = function (url, parameters, requestParams) {
  const queryParams = getRequestParams(parameters.query, requestParams, 'query variable')

  if (Object.keys(queryParams).length === 0) {
    return url
  }

  return `${url}?${queryString.stringify(queryParams, { arrayFormat: 'brackets' })}`
}

const getRequestParams = function (params, requestParams, name) {
  const entries = Object.values(params).map((param) => getRequestParam(param, requestParams, name))
  return Object.assign({}, ...entries)
}

const getRequestParam = function (param, requestParams, name) {
  const value = requestParams[param.name] || requestParams[camelCase(param.name)]

  if (value !== undefined) {
    return { [param.name]: value }
  }

  if (param.required) {
    throw new Error(`Missing required ${name} '${param.name}'`)
  }
}

module.exports = { getUrl }


/***/ }),

/***/ 4149:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const { paths } = __nccwpck_require__(6490)
const omit = (__nccwpck_require__(7383)/* ["default"] */ .Z)

// Retrieve all OpenAPI operations
const getOperations = function () {
  return Object.entries(paths).flatMap(([path, pathItem]) => {
    const operations = omit(pathItem, ['parameters'])
    return Object.entries(operations).map(([method, operation]) => {
      const parameters = getParameters(pathItem.parameters, operation.parameters)
      return { ...operation, verb: method, path, parameters }
    })
  })
}

const getParameters = function (pathParameters = [], operationParameters = []) {
  const parameters = [...pathParameters, ...operationParameters]
  return parameters.reduce(addParameter, { path: {}, query: {}, body: {} })
}

const addParameter = function (parameters, param) {
  return { ...parameters, [param.in]: { ...parameters[param.in], [param.name]: param } }
}

module.exports = { getOperations }


/***/ }),

/***/ 2460:
/***/ ((module, exports, __nccwpck_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({ value: true }));

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Stream = _interopDefault(__nccwpck_require__(2781));
var http = _interopDefault(__nccwpck_require__(3685));
var Url = _interopDefault(__nccwpck_require__(7310));
var https = _interopDefault(__nccwpck_require__(5687));
var zlib = _interopDefault(__nccwpck_require__(9796));

// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js

// fix for "Readable" isn't a named export issue
const Readable = Stream.Readable;

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
	constructor() {
		this[TYPE] = '';

		const blobParts = arguments[0];
		const options = arguments[1];

		const buffers = [];
		let size = 0;

		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) {
					buffer = element;
				} else if (ArrayBuffer.isView(element)) {
					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				} else if (element instanceof ArrayBuffer) {
					buffer = Buffer.from(element);
				} else if (element instanceof Blob) {
					buffer = element[BUFFER];
				} else {
					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
				}
				size += buffer.length;
				buffers.push(buffer);
			}
		}

		this[BUFFER] = Buffer.concat(buffers);

		let type = options && options.type !== undefined && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) {
			this[TYPE] = type;
		}
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	text() {
		return Promise.resolve(this[BUFFER].toString());
	}
	arrayBuffer() {
		const buf = this[BUFFER];
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		return Promise.resolve(ab);
	}
	stream() {
		const readable = new Readable();
		readable._read = function () {};
		readable.push(this[BUFFER]);
		readable.push(null);
		return readable;
	}
	toString() {
		return '[object Blob]';
	}
	slice() {
		const size = this.size;

		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === undefined) {
			relativeStart = 0;
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0);
		} else {
			relativeStart = Math.min(start, size);
		}
		if (end === undefined) {
			relativeEnd = size;
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0);
		} else {
			relativeEnd = Math.min(end, size);
		}
		const span = Math.max(relativeEnd - relativeStart, 0);

		const buffer = this[BUFFER];
		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
		const blob = new Blob([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(message, type, systemError) {
  Error.call(this, message);

  this.message = message;
  this.type = type;

  // when err.type is `system`, err.code contains system error code
  if (systemError) {
    this.code = this.errno = systemError.code;
  }

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

let convert;
try {
	convert = (__nccwpck_require__(5347).convert);
} catch (e) {}

const INTERNALS = Symbol('Body internals');

// fix an issue where "PassThrough" isn't a named export for node <10
const PassThrough = Stream.PassThrough;

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(body) {
	var _this = this;

	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	    _ref$size = _ref.size;

	let size = _ref$size === undefined ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

	if (body == null) {
		// body is undefined or null
		body = null;
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		body = Buffer.from(body.toString());
	} else if (isBlob(body)) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		body = Buffer.from(body);
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	} else if (body instanceof Stream) ; else {
		// none of the above
		// coerce to string then buffer
		body = Buffer.from(String(body));
	}
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;

	if (body instanceof Stream) {
		body.on('error', function (err) {
			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
			_this[INTERNALS].error = error;
		});
	}
}

Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},

	/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
	arrayBuffer() {
		return consumeBody.call(this).then(function (buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},

	/**
  * Return raw response as Blob
  *
  * @return Promise
  */
	blob() {
		let ct = this.headers && this.headers.get('content-type') || '';
		return consumeBody.call(this).then(function (buf) {
			return Object.assign(
			// Prevent copying
			new Blob([], {
				type: ct.toLowerCase()
			}), {
				[BUFFER]: buf
			});
		});
	},

	/**
  * Decode response as json
  *
  * @return  Promise
  */
	json() {
		var _this2 = this;

		return consumeBody.call(this).then(function (buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
			}
		});
	},

	/**
  * Decode response as text
  *
  * @return  Promise
  */
	text() {
		return consumeBody.call(this).then(function (buffer) {
			return buffer.toString();
		});
	},

	/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
	buffer() {
		return consumeBody.call(this);
	},

	/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
	textConverted() {
		var _this3 = this;

		return consumeBody.call(this).then(function (buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}
};

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});

Body.mixIn = function (proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
		// istanbul ignore else: future proof
		if (!(name in proto)) {
			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
			Object.defineProperty(proto, name, desc);
		}
	}
};

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody() {
	var _this4 = this;

	if (this[INTERNALS].disturbed) {
		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
	}

	this[INTERNALS].disturbed = true;

	if (this[INTERNALS].error) {
		return Body.Promise.reject(this[INTERNALS].error);
	}

	let body = this.body;

	// body is null
	if (body === null) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is blob
	if (isBlob(body)) {
		body = body.stream();
	}

	// body is buffer
	if (Buffer.isBuffer(body)) {
		return Body.Promise.resolve(body);
	}

	// istanbul ignore if: should never happen
	if (!(body instanceof Stream)) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is stream
	// get ready to actually consume the body
	let accum = [];
	let accumBytes = 0;
	let abort = false;

	return new Body.Promise(function (resolve, reject) {
		let resTimeout;

		// allow timeout on slow response body
		if (_this4.timeout) {
			resTimeout = setTimeout(function () {
				abort = true;
				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
			}, _this4.timeout);
		}

		// handle stream errors
		body.on('error', function (err) {
			if (err.name === 'AbortError') {
				// if the request was aborted, reject with this Error
				abort = true;
				reject(err);
			} else {
				// other errors, such as incorrect content-encoding
				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
			}
		});

		body.on('data', function (chunk) {
			if (abort || chunk === null) {
				return;
			}

			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
				return;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		});

		body.on('end', function () {
			if (abort) {
				return;
			}

			clearTimeout(resTimeout);

			try {
				resolve(Buffer.concat(accum, accumBytes));
			} catch (err) {
				// handle streams that have accumulated too much data (issue #414)
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
			}
		});
	});
}

/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */
function convertBody(buffer, headers) {
	if (typeof convert !== 'function') {
		throw new Error('The package `encoding` must be installed to use the textConverted() function');
	}

	const ct = headers.get('content-type');
	let charset = 'utf-8';
	let res, str;

	// header
	if (ct) {
		res = /charset=([^;]*)/i.exec(ct);
	}

	// no charset in content type, peek at response body for at most 1024 bytes
	str = buffer.slice(0, 1024).toString();

	// html5
	if (!res && str) {
		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	}

	// html4
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
		if (!res) {
			res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
			if (res) {
				res.pop(); // drop last quote
			}
		}

		if (res) {
			res = /charset=(.*)/i.exec(res.pop());
		}
	}

	// xml
	if (!res && str) {
		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	}

	// found charset
	if (res) {
		charset = res.pop();

		// prevent decode issues when sites use incorrect encoding
		// ref: https://hsivonen.fi/encoding-menu/
		if (charset === 'gb2312' || charset === 'gbk') {
			charset = 'gb18030';
		}
	}

	// turn raw buffers into a single utf-8 buffer
	return convert(buffer, 'UTF-8', charset).toString();
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}

/**
 * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob(obj) {
	return typeof obj === 'object' && typeof obj.arrayBuffer === 'function' && typeof obj.type === 'string' && typeof obj.stream === 'function' && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */
function clone(instance) {
	let p1, p2;
	let body = instance.body;

	// don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// tee instance body
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		// set instance body to teed body and return the other teed body
		instance[INTERNALS].body = p1;
		body = p2;
	}

	return body;
}

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Any options.body input
 */
function extractContentType(body) {
	if (body === null) {
		// body is null
		return null;
	} else if (typeof body === 'string') {
		// body is string
		return 'text/plain;charset=UTF-8';
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	} else if (isBlob(body)) {
		// body is blob
		return body.type || null;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return null;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return null;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return null;
	} else if (typeof body.getBoundary === 'function') {
		// detect form data input from form-data module
		return `multipart/form-data;boundary=${body.getBoundary()}`;
	} else if (body instanceof Stream) {
		// body is stream
		// can't really do much about this
		return null;
	} else {
		// Body constructor defaults other things to string
		return 'text/plain;charset=UTF-8';
	}
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */
function getTotalBytes(instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		return 0;
	} else if (isBlob(body)) {
		return body.size;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return body.length;
	} else if (body && typeof body.getLengthSync === 'function') {
		// detect form data input from form-data module
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
		body.hasKnownLength && body.hasKnownLength()) {
			// 2.x
			return body.getLengthSync();
		}
		return null;
	} else {
		// body is stream
		return null;
	}
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */
function writeToStream(dest, instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		dest.end();
	} else if (isBlob(body)) {
		body.stream().pipe(dest);
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		dest.write(body);
		dest.end();
	} else {
		// body is stream
		body.pipe(dest);
	}
}

// expose Promise
Body.Promise = global.Promise;

/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name) || name === '') {
		throw new TypeError(`${name} is not a legal HTTP header name`);
	}
}

function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) {
		throw new TypeError(`${value} is not a legal HTTP header value`);
	}
}

/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) {
		if (key.toLowerCase() === name) {
			return key;
		}
	}
	return undefined;
}

const MAP = Symbol('map');
class Headers {
	/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

		this[MAP] = Object.create(null);

		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);

			for (const headerName of headerNames) {
				for (const value of rawHeaders[headerName]) {
					this.append(headerName, value);
				}
			}

			return;
		}

		// We don't worry about converting prop to ByteString here as append()
		// will handle it.
		if (init == null) ; else if (typeof init === 'object') {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
						throw new TypeError('Each header pair must be iterable');
					}
					pairs.push(Array.from(pair));
				}

				for (const pair of pairs) {
					if (pair.length !== 2) {
						throw new TypeError('Each header pair must be a name/value tuple');
					}
					this.append(pair[0], pair[1]);
				}
			} else {
				// record<ByteString, ByteString>
				for (const key of Object.keys(init)) {
					const value = init[key];
					this.append(key, value);
				}
			}
		} else {
			throw new TypeError('Provided initializer must be an object');
		}
	}

	/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === undefined) {
			return null;
		}

		return this[MAP][key].join(', ');
	}

	/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0],
			      value = _pairs$i[1];

			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}

	/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== undefined ? key : name] = [value];
	}

	/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			this[MAP][key].push(value);
		} else {
			this[MAP][name] = [value];
		}
	}

	/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== undefined;
	}

	/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			delete this[MAP][key];
		}
	}

	/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */
	raw() {
		return this[MAP];
	}

	/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */
	keys() {
		return createHeadersIterator(this, 'key');
	}

	/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */
	values() {
		return createHeadersIterator(this, 'value');
	}

	/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */
	[Symbol.iterator]() {
		return createHeadersIterator(this, 'key+value');
	}
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator];

Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: 'Headers',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});

function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

	const keys = Object.keys(headers[MAP]).sort();
	return keys.map(kind === 'key' ? function (k) {
		return k.toLowerCase();
	} : kind === 'value' ? function (k) {
		return headers[MAP][k].join(', ');
	} : function (k) {
		return [k.toLowerCase(), headers[MAP][k].join(', ')];
	});
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
	next() {
		// istanbul ignore if
		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
			throw new TypeError('Value of `this` is not a HeadersIterator');
		}

		var _INTERNAL = this[INTERNAL];
		const target = _INTERNAL.target,
		      kind = _INTERNAL.kind,
		      index = _INTERNAL.index;

		const values = getHeaders(target, kind);
		const len = values.length;
		if (index >= len) {
			return {
				value: undefined,
				done: true
			};
		}

		this[INTERNAL].index = index + 1;

		return {
			value: values[index],
			done: false
		};
	}
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: 'HeadersIterator',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);

	// http.request() only supports string as Host header. This hack makes
	// specifying custom Host header possible.
	const hostHeaderKey = find(headers[MAP], 'Host');
	if (hostHeaderKey !== undefined) {
		obj[hostHeaderKey] = obj[hostHeaderKey][0];
	}

	return obj;
}

/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) {
			continue;
		}
		if (Array.isArray(obj[name])) {
			for (const val of obj[name]) {
				if (invalidHeaderCharRegex.test(val)) {
					continue;
				}
				if (headers[MAP][name] === undefined) {
					headers[MAP][name] = [val];
				} else {
					headers[MAP][name].push(val);
				}
			}
		} else if (!invalidHeaderCharRegex.test(obj[name])) {
			headers[MAP][name] = [obj[name]];
		}
	}
	return headers;
}

const INTERNALS$1 = Symbol('Response internals');

// fix an issue where "STATUS_CODES" aren't a named export for node <10
const STATUS_CODES = http.STATUS_CODES;

/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		Body.call(this, body, opts);

		const status = opts.status || 200;
		const headers = new Headers(opts.headers);

		if (body != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(body);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers,
			counter: opts.counter
		};
	}

	get url() {
		return this[INTERNALS$1].url || '';
	}

	get status() {
		return this[INTERNALS$1].status;
	}

	/**
  * Convenience property representing if the request ended normally
  */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}

	get redirected() {
		return this[INTERNALS$1].counter > 0;
	}

	get statusText() {
		return this[INTERNALS$1].statusText;
	}

	get headers() {
		return this[INTERNALS$1].headers;
	}

	/**
  * Clone this response
  *
  * @return  Response
  */
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected
		});
	}
}

Body.mixIn(Response.prototype);

Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	redirected: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});

Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: 'Response',
	writable: false,
	enumerable: false,
	configurable: true
});

const INTERNALS$2 = Symbol('Request internals');

// fix an issue where "format", "parse" aren't a named export for node <10
const parse_url = Url.parse;
const format_url = Url.format;

const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(input) {
	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === 'AbortSignal');
}

/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		let parsedURL;

		// normalize input
		if (!isRequest(input)) {
			if (input && input.href) {
				// in order to support Node.js' Url objects; though WHATWG's URL objects
				// will fall into this branch also (since their `toString()` will return
				// `href` property anyway)
				parsedURL = parse_url(input.href);
			} else {
				// coerce input to a string before attempting to parse
				parsedURL = parse_url(`${input}`);
			}
			input = {};
		} else {
			parsedURL = parse_url(input.url);
		}

		let method = init.method || input.method || 'GET';
		method = method.toUpperCase();

		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});

		const headers = new Headers(init.headers || input.headers || {});

		if (inputBody != null && !headers.has('Content-Type')) {
			const contentType = extractContentType(inputBody);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ? input.signal : null;
		if ('signal' in init) signal = init.signal;

		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal');
		}

		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal
		};

		// node-fetch-only options
		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}

	get method() {
		return this[INTERNALS$2].method;
	}

	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}

	get headers() {
		return this[INTERNALS$2].headers;
	}

	get redirect() {
		return this[INTERNALS$2].redirect;
	}

	get signal() {
		return this[INTERNALS$2].signal;
	}

	/**
  * Clone this request
  *
  * @return  Request
  */
	clone() {
		return new Request(this);
	}
}

Body.mixIn(Request.prototype);

Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: 'Request',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);

	// fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// Basic fetch
	if (!parsedURL.protocol || !parsedURL.hostname) {
		throw new TypeError('Only absolute URLs are supported');
	}

	if (!/^https?:$/.test(parsedURL.protocol)) {
		throw new TypeError('Only HTTP(S) protocols are supported');
	}

	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
		contentLengthValue = '0';
	}
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === 'number') {
			contentLengthValue = String(totalBytes);
		}
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate');
	}

	let agent = request.agent;
	if (typeof agent === 'function') {
		agent = agent(parsedURL);
	}

	if (!headers.has('Connection') && !agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent
	});
}

/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */
function AbortError(message) {
  Error.call(this, message);

  this.type = 'aborted';
  this.message = message;

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError';

// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;

/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch(url, opts) {

	// allow custom promise
	if (!fetch.Promise) {
		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
	}

	Body.Promise = fetch.Promise;

	// wrap http.request into fetch
	return new fetch.Promise(function (resolve, reject) {
		// build request object
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);

		const send = (options.protocol === 'https:' ? https : http).request;
		const signal = request.signal;

		let response = null;

		const abort = function abort() {
			let error = new AbortError('The user aborted a request.');
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error);
			}
			if (!response || !response.body) return;
			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};

		// send request
		const req = send(options);
		let reqTimeout;

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener('abort', abortAndFinalize);
			clearTimeout(reqTimeout);
		}

		if (request.timeout) {
			req.once('socket', function (socket) {
				reqTimeout = setTimeout(function () {
					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
					finalize();
				}, request.timeout);
			});
		}

		req.on('error', function (err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
			finalize();
		});

		req.on('response', function (res) {
			clearTimeout(reqTimeout);

			const headers = createHeadersLenient(res.headers);

			// HTTP fetch step 5
			if (fetch.isRedirect(res.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				const locationURL = location === null ? null : resolve_url(request.url, location);

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
						if (locationURL !== null) {
							// handle corrupted header
							try {
								headers.set('Location', locationURL);
							} catch (err) {
								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
								reject(err);
							}
						}
						break;
					case 'follow':
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal,
							timeout: request.timeout,
							size: request.size
						};

						// HTTP-redirect fetch step 9
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
							requestOpts.method = 'GET';
							requestOpts.body = undefined;
							requestOpts.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 15
						resolve(fetch(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}

			// prepare response
			res.once('end', function () {
				if (signal) signal.removeEventListener('abort', abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());

			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers: headers,
				size: request.size,
				timeout: request.timeout,
				counter: request.counter
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};

			// for gzip
			if (codings == 'gzip' || codings == 'x-gzip') {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// for deflate
			if (codings == 'deflate' || codings == 'x-deflate') {
				// handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = res.pipe(new PassThrough$1());
				raw.once('data', function (chunk) {
					// see http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = body.pipe(zlib.createInflate());
					} else {
						body = body.pipe(zlib.createInflateRaw());
					}
					response = new Response(body, response_options);
					resolve(response);
				});
				return;
			}

			// for br
			if (codings == 'br' && typeof zlib.createBrotliDecompress === 'function') {
				body = body.pipe(zlib.createBrotliDecompress());
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// otherwise, use response as-is
			response = new Response(body, response_options);
			resolve(response);
		});

		writeToStream(req, request);
	});
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */
fetch.isRedirect = function (code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};

// expose Promise
fetch.Promise = global.Promise;

module.exports = exports = fetch;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports["default"] = exports;
exports.Headers = Headers;
exports.Request = Request;
exports.Response = Response;
exports.FetchError = FetchError;


/***/ }),

/***/ 3343:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var match = String.prototype.match;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

var inspectCustom = (__nccwpck_require__(5038).custom);
var inspectSymbol = inspectCustom && isSymbol(inspectCustom) ? inspectCustom : null;
var toStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag !== 'undefined' ? Symbol.toStringTag : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
    }

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        return String(obj);
    }
    if (typeof obj === 'bigint') {
        return String(obj) + 'n';
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = seen.slice();
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function') {
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + keys.join(', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? String(obj).replace(/^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + String(obj.nodeName).toLowerCase();
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + String(obj.nodeName).toLowerCase() + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + xs.join(', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
            return obj[inspectSymbol]();
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        mapForEach.call(obj, function (value, key) {
            mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
        });
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        setForEach.call(obj, function (value) {
            setParts.push(inspect(value, obj));
        });
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? toStr(obj).slice(8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + [].concat(stringTag || [], protoTag || []).join(': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + ys.join(', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return String(s).replace(/"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16).toUpperCase();
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = Array(opts.indent + 1).join(' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: Array(depth + 1).join(baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ((/[^\w$]/).test(key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}


/***/ }),

/***/ 5038:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = __nccwpck_require__(3837).inspect;


/***/ }),

/***/ 7383:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
var __webpack_unused_export__;


__webpack_unused_export__ = ({
  value: true
});
exports.Z = void 0;

function omit(obj, fields) {
  // eslint-disable-next-line prefer-object-spread
  var shallowCopy = Object.assign({}, obj);

  for (var i = 0; i < fields.length; i += 1) {
    var key = fields[i];
    delete shallowCopy[key];
  }

  return shallowCopy;
}

var _default = omit;
exports.Z = _default;

/***/ }),

/***/ 5363:
/***/ ((module) => {

"use strict";

module.exports = (promise, onFinally) => {
	onFinally = onFinally || (() => {});

	return promise.then(
		val => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => val),
		err => new Promise(resolve => {
			resolve(onFinally());
		}).then(() => {
			throw err;
		})
	);
};


/***/ }),

/***/ 130:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const pFinally = __nccwpck_require__(5363);

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	const timer = setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	// TODO: Use native `finally` keyword when targeting Node.js 10
	pFinally(
		// eslint-disable-next-line promise/prefer-await-to-then
		promise.then(resolve, reject),
		() => {
			clearTimeout(timer);
		}
	);
});

module.exports = pTimeout;
// TODO: Remove this for the next major release
module.exports["default"] = pTimeout;

module.exports.TimeoutError = TimeoutError;


/***/ }),

/***/ 7662:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const pTimeout = __nccwpck_require__(130);

const pWaitFor = async (condition, options) => {
	options = {
		interval: 20,
		timeout: Infinity,
		leadingCheck: true,
		...options
	};

	let retryTimeout;

	const promise = new Promise((resolve, reject) => {
		const check = async () => {
			try {
				const value = await condition();

				if (typeof value !== 'boolean') {
					throw new TypeError('Expected condition to return a boolean');
				}

				if (value === true) {
					resolve();
				} else {
					retryTimeout = setTimeout(check, options.interval);
				}
			} catch (error) {
				reject(error);
			}
		};

		if (options.leadingCheck) {
			check();
		} else {
			retryTimeout = setTimeout(check, options.interval);
		}
	});

	if (options.timeout !== Infinity) {
		try {
			return await pTimeout(promise, options.timeout);
		} catch (error) {
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}

			throw error;
		}
	}

	return promise;
};

module.exports = pWaitFor;
// TODO: Remove this for the next major release
module.exports["default"] = pWaitFor;


/***/ }),

/***/ 1466:
/***/ ((module) => {

"use strict";


var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};


/***/ }),

/***/ 737:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var stringify = __nccwpck_require__(3769);
var parse = __nccwpck_require__(2061);
var formats = __nccwpck_require__(1466);

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};


/***/ }),

/***/ 2061:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var utils = __nccwpck_require__(3763);

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ??? character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ??? character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('???')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};


/***/ }),

/***/ 3769:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var getSideChannel = __nccwpck_require__(3355);
var utils = __nccwpck_require__(3763);
var formats = __nccwpck_require__(1466);
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    if (sideChannel.has(object)) {
        throw new RangeError('Cyclic object value');
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
            : prefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, true);
        var valueSideChannel = getSideChannel();
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('???')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};


/***/ }),

/***/ 3763:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var formats = __nccwpck_require__(1466);

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};


/***/ }),

/***/ 3355:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


var GetIntrinsic = __nccwpck_require__(4880);
var callBound = __nccwpck_require__(4353);
var inspect = __nccwpck_require__(3343);

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

module.exports = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};


/***/ }),

/***/ 9958:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = __nccwpck_require__(9306);


/***/ }),

/***/ 9306:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


var net = __nccwpck_require__(1808);
var tls = __nccwpck_require__(4404);
var http = __nccwpck_require__(3685);
var https = __nccwpck_require__(5687);
var events = __nccwpck_require__(2361);
var assert = __nccwpck_require__(9491);
var util = __nccwpck_require__(3837);


exports.httpOverHttp = httpOverHttp;
exports.httpsOverHttp = httpsOverHttp;
exports.httpOverHttps = httpOverHttps;
exports.httpsOverHttps = httpsOverHttps;


function httpOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  return agent;
}

function httpsOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}

function httpOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  return agent;
}

function httpsOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}


function TunnelingAgent(options) {
  var self = this;
  self.options = options || {};
  self.proxyOptions = self.options.proxy || {};
  self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
  self.requests = [];
  self.sockets = [];

  self.on('free', function onFree(socket, host, port, localAddress) {
    var options = toOptions(host, port, localAddress);
    for (var i = 0, len = self.requests.length; i < len; ++i) {
      var pending = self.requests[i];
      if (pending.host === options.host && pending.port === options.port) {
        // Detect the request to connect same origin server,
        // reuse the connection.
        self.requests.splice(i, 1);
        pending.request.onSocket(socket);
        return;
      }
    }
    socket.destroy();
    self.removeSocket(socket);
  });
}
util.inherits(TunnelingAgent, events.EventEmitter);

TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
  var self = this;
  var options = mergeOptions({request: req}, self.options, toOptions(host, port, localAddress));

  if (self.sockets.length >= this.maxSockets) {
    // We are over limit so we'll add it to the queue.
    self.requests.push(options);
    return;
  }

  // If we are under maxSockets create a new one.
  self.createSocket(options, function(socket) {
    socket.on('free', onFree);
    socket.on('close', onCloseOrRemove);
    socket.on('agentRemove', onCloseOrRemove);
    req.onSocket(socket);

    function onFree() {
      self.emit('free', socket, options);
    }

    function onCloseOrRemove(err) {
      self.removeSocket(socket);
      socket.removeListener('free', onFree);
      socket.removeListener('close', onCloseOrRemove);
      socket.removeListener('agentRemove', onCloseOrRemove);
    }
  });
};

TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
  var self = this;
  var placeholder = {};
  self.sockets.push(placeholder);

  var connectOptions = mergeOptions({}, self.proxyOptions, {
    method: 'CONNECT',
    path: options.host + ':' + options.port,
    agent: false,
    headers: {
      host: options.host + ':' + options.port
    }
  });
  if (options.localAddress) {
    connectOptions.localAddress = options.localAddress;
  }
  if (connectOptions.proxyAuth) {
    connectOptions.headers = connectOptions.headers || {};
    connectOptions.headers['Proxy-Authorization'] = 'Basic ' +
        new Buffer(connectOptions.proxyAuth).toString('base64');
  }

  debug('making CONNECT request');
  var connectReq = self.request(connectOptions);
  connectReq.useChunkedEncodingByDefault = false; // for v0.6
  connectReq.once('response', onResponse); // for v0.6
  connectReq.once('upgrade', onUpgrade);   // for v0.6
  connectReq.once('connect', onConnect);   // for v0.7 or later
  connectReq.once('error', onError);
  connectReq.end();

  function onResponse(res) {
    // Very hacky. This is necessary to avoid http-parser leaks.
    res.upgrade = true;
  }

  function onUpgrade(res, socket, head) {
    // Hacky.
    process.nextTick(function() {
      onConnect(res, socket, head);
    });
  }

  function onConnect(res, socket, head) {
    connectReq.removeAllListeners();
    socket.removeAllListeners();

    if (res.statusCode !== 200) {
      debug('tunneling socket could not be established, statusCode=%d',
        res.statusCode);
      socket.destroy();
      var error = new Error('tunneling socket could not be established, ' +
        'statusCode=' + res.statusCode);
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    if (head.length > 0) {
      debug('got illegal response body from proxy');
      socket.destroy();
      var error = new Error('got illegal response body from proxy');
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    debug('tunneling connection has established');
    self.sockets[self.sockets.indexOf(placeholder)] = socket;
    return cb(socket);
  }

  function onError(cause) {
    connectReq.removeAllListeners();

    debug('tunneling socket could not be established, cause=%s\n',
          cause.message, cause.stack);
    var error = new Error('tunneling socket could not be established, ' +
                          'cause=' + cause.message);
    error.code = 'ECONNRESET';
    options.request.emit('error', error);
    self.removeSocket(placeholder);
  }
};

TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
  var pos = this.sockets.indexOf(socket)
  if (pos === -1) {
    return;
  }
  this.sockets.splice(pos, 1);

  var pending = this.requests.shift();
  if (pending) {
    // If we have pending requests and a socket gets closed a new one
    // needs to be created to take over in the pool for the one that closed.
    this.createSocket(pending, function(socket) {
      pending.request.onSocket(socket);
    });
  }
};

function createSecureSocket(options, cb) {
  var self = this;
  TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
    var hostHeader = options.request.getHeader('host');
    var tlsOptions = mergeOptions({}, self.options, {
      socket: socket,
      servername: hostHeader ? hostHeader.replace(/:.*$/, '') : options.host
    });

    // 0 is dummy port for v0.6
    var secureSocket = tls.connect(0, tlsOptions);
    self.sockets[self.sockets.indexOf(socket)] = secureSocket;
    cb(secureSocket);
  });
}


function toOptions(host, port, localAddress) {
  if (typeof host === 'string') { // since v0.10
    return {
      host: host,
      port: port,
      localAddress: localAddress
    };
  }
  return host; // for v0.11 or later
}

function mergeOptions(target) {
  for (var i = 1, len = arguments.length; i < len; ++i) {
    var overrides = arguments[i];
    if (typeof overrides === 'object') {
      var keys = Object.keys(overrides);
      for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
        var k = keys[j];
        if (overrides[k] !== undefined) {
          target[k] = overrides[k];
        }
      }
    }
  }
  return target;
}


var debug;
if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'string') {
      args[0] = 'TUNNEL: ' + args[0];
    } else {
      args.unshift('TUNNEL:');
    }
    console.error.apply(console, args);
  }
} else {
  debug = function() {};
}
exports.debug = debug; // for test


/***/ }),

/***/ 5347:
/***/ ((module) => {

module.exports = eval("require")("encoding");


/***/ }),

/***/ 9491:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 6113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 2361:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 7147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 3685:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 5687:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 1808:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 2037:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 1017:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 2781:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 4404:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 7310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 3837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 9796:
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ }),

/***/ 6490:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"swagger":"2.0","info":{"version":"2.6.0","title":"Netlify\'s API documentation","description":"Netlify is a hosting service for the programmable web. It understands your documents and provides an API to handle atomic deploys of websites, manage form submissions, inject JavaScript snippets, and much more. This is a REST-style API that uses JSON for serialization and OAuth 2 for authentication.\\n\\nThis document is an OpenAPI reference for the Netlify API that you can explore. For more detailed instructions for common uses, please visit the [online documentation](https://www.netlify.com/docs/api/). Visit our Community forum to join the conversation about [understanding and using Netlify???s API](https://community.netlify.com/t/common-issue-understanding-and-using-netlifys-api/160).\\n\\nAdditionally, we have two API clients for your convenience:\\n- [Go Client](https://github.com/netlify/open-api#go-client)\\n- [JS Client](https://github.com/netlify/js-client)","termsOfService":"https://www.netlify.com/legal/terms-of-use/","x-logo":{"url":"netlify-logo.png","href":"https://www.netlify.com/docs/","altText":"Netlify"}},"externalDocs":{"url":"https://www.netlify.com/docs/api/","description":"Online documentation"},"securityDefinitions":{"netlifyAuth":{"type":"oauth2","flow":"implicit","authorizationUrl":"https://app.netlify.com/authorize"}},"security":[{"netlifyAuth":[]}],"consumes":["application/json"],"produces":["application/json"],"schemes":["https"],"responses":{"error":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}},"host":"api.netlify.com","basePath":"/api/v1","paths":{"/sites":{"get":{"operationId":"listSites","tags":["site"],"parameters":[{"name":"name","in":"query","type":"string"},{"name":"filter","in":"query","type":"string","enum":["all","owner","guest"]},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSite","tags":["site"],"consumes":["application/json"],"parameters":[{"name":"site","in":"body","schema":{"allOf":[{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}},{"properties":{"repo":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}}}}]},"required":true},{"name":"configure_dns","type":"boolean","in":"query"}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSite","tags":["site"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"patch":{"operationId":"updateSite","tags":["site"],"consumes":["application/json"],"parameters":[{"name":"site","in":"body","schema":{"allOf":[{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}},{"properties":{"repo":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}}}}]},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteSite","tags":["site"],"responses":{"204":{"description":"Deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/ssl":{"post":{"operationId":"provisionSiteTLSCertificate","tags":["sniCertificate"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"certificate","type":"string","in":"query"},{"name":"key","type":"string","in":"query"},{"name":"ca_certificates","type":"string","in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"state":{"type":"string"},"domains":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"expires_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"get":{"operationId":"showSiteTLSCertificate","tags":["sniCertificate"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"state":{"type":"string"},"domains":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"expires_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/forms":{"get":{"operationId":"listSiteForms","tags":["form"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"paths":{"type":"array","items":{"type":"string"}},"submission_count":{"type":"integer","format":"int32"},"fields":{"type":"array","items":{"type":"object"}},"created_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/forms/{form_id}":{"delete":{"operationId":"deleteSiteForm","tags":["form"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"form_id","type":"string","in":"path","required":true}],"responses":{"204":{"description":"Deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/submissions":{"get":{"operationId":"listSiteSubmissions","tags":["submission"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"number":{"type":"integer","format":"int32"},"email":{"type":"string"},"name":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"company":{"type":"string"},"summary":{"type":"string"},"body":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"site_url":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/files":{"get":{"operationId":"listSiteFiles","tags":["file"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"path":{"type":"string"},"sha":{"type":"string"},"mime_type":{"type":"string"},"size":{"type":"integer","format":"int64"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/assets":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteAssets","tags":["asset"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSiteAsset","tags":["asset"],"parameters":[{"name":"name","type":"string","in":"query","required":true},{"name":"size","type":"integer","format":"int64","in":"query","required":true},{"name":"content_type","type":"string","in":"query","required":true},{"name":"visibility","type":"string","in":"query"}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"form":{"type":"object","properties":{"url":{"type":"string"},"fields":{"type":"object","additionalProperties":{"type":"string"}}}},"asset":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/assets/{asset_id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"asset_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteAssetInfo","tags":["asset"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateSiteAsset","tags":["asset"],"parameters":[{"name":"state","type":"string","in":"query","required":true}],"responses":{"200":{"description":"Updated","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteSiteAsset","tags":["asset"],"responses":{"204":{"description":"Deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/assets/{asset_id}/public_signature":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"asset_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteAssetPublicSignature","tags":["assetPublicSignature"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"url":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/files/{file_path}":{"get":{"operationId":"getSiteFileByPathName","tags":["file"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"file_path","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"path":{"type":"string"},"sha":{"type":"string"},"mime_type":{"type":"string"},"size":{"type":"integer","format":"int64"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/snippets":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteSnippets","tags":["snippet"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSiteSnippet","tags":["snippet"],"consumes":["application/json"],"parameters":[{"name":"snippet","in":"body","schema":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}},"required":true}],"responses":{"201":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/snippets/{snippet_id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"snippet_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteSnippet","tags":["snippet"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateSiteSnippet","tags":["snippet"],"consumes":["application/json"],"parameters":[{"name":"snippet","in":"body","schema":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}},"required":true}],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteSiteSnippet","tags":["snippet"],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/metadata":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteMetadata","tags":["metadata"],"responses":{"200":{"description":"OK","schema":{"type":"object"}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateSiteMetadata","tags":["metadata"],"parameters":[{"name":"metadata","in":"body","schema":{"type":"object"},"required":true}],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/build_hooks":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteBuildHooks","tags":["buildHook"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"title":{"type":"string"},"branch":{"type":"string"},"url":{"type":"string"},"site_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSiteBuildHook","tags":["buildHook"],"consumes":["application/json"],"parameters":[{"name":"buildHook","in":"body","schema":{"type":"object","properties":{"title":{"type":"string"},"branch":{"type":"string"}}},"required":true}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"title":{"type":"string"},"branch":{"type":"string"},"url":{"type":"string"},"site_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/build_hooks/{id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteBuildHook","tags":["buildHook"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"title":{"type":"string"},"branch":{"type":"string"},"url":{"type":"string"},"site_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateSiteBuildHook","tags":["buildHook"],"consumes":["application/json"],"parameters":[{"name":"buildHook","in":"body","schema":{"type":"object","properties":{"title":{"type":"string"},"branch":{"type":"string"}}},"required":true}],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteSiteBuildHook","tags":["buildHook"],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/deploys":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteDeploys","tags":["deploy"],"parameters":[{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSiteDeploy","tags":["deploy"],"parameters":[{"name":"title","type":"string","in":"query"},{"name":"deploy","in":"body","schema":{"type":"object","properties":{"files":{"type":"object"},"draft":{"type":"boolean"},"async":{"type":"boolean"},"functions":{"type":"object"},"branch":{"type":"string"},"framework":{"type":"string"}}},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/deploys/{deploy_id}":{"get":{"operationId":"getSiteDeploy","tags":["deploy"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateSiteDeploy","tags":["deploy"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"deploy_id","type":"string","in":"path","required":true},{"name":"deploy","in":"body","schema":{"type":"object","properties":{"files":{"type":"object"},"draft":{"type":"boolean"},"async":{"type":"boolean"},"functions":{"type":"object"},"branch":{"type":"string"},"framework":{"type":"string"}}},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/cancel":{"post":{"operationId":"cancelSiteDeploy","tags":["deploy"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"201":{"description":"Cancelled","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/deploys/{deploy_id}/restore":{"post":{"operationId":"restoreSiteDeploy","tags":["deploy"],"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/builds":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteBuilds","tags":["build"],"parameters":[{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"sha":{"type":"string"},"done":{"type":"boolean"},"error":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createSiteBuild","tags":["build"],"parameters":[{"name":"build","in":"body","schema":{"type":"object","properties":{"image":{"type":"string"}}},"required":false}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"sha":{"type":"string"},"done":{"type":"boolean"},"error":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/deployed-branches":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listSiteDeployedBranches","tags":["deployedBranch"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/unlink_repo":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"put":{"operationId":"unlinkSiteRepo","tags":["site"],"description":"[Beta] Unlinks the repo from the site.\\n\\nThis action will also:\\n- Delete associated deploy keys\\n- Delete outgoing webhooks for the repo\\n- Delete the site\'s build hooks","responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}},"404":{"description":"Site not found"}}}},"/builds/{build_id}":{"parameters":[{"name":"build_id","type":"string","in":"path","required":true}],"get":{"operationId":"getSiteBuild","tags":["build"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"sha":{"type":"string"},"done":{"type":"boolean"},"error":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/builds/{build_id}/log":{"parameters":[{"name":"build_id","type":"string","in":"path","required":true},{"name":"msg","in":"body","schema":{"type":"object","properties":{"message":{"type":"string"},"error":{"type":"boolean"}}},"required":true}],"post":{"operationId":"updateSiteBuildLog","tags":["buildLogMsg"],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/builds/{build_id}/start":{"parameters":[{"name":"build_id","type":"string","in":"path","required":true}],"post":{"operationId":"notifyBuildStart","tags":["build"],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/{account_id}/builds/status":{"parameters":[{"name":"account_id","type":"string","in":"path","required":true}],"get":{"operationId":"getAccountBuildStatus","tags":["build"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"active":{"type":"integer"},"pending_concurrency":{"type":"integer"},"enqueued":{"type":"integer"},"build_count":{"type":"integer"},"minutes":{"type":"object","properties":{"current":{"type":"integer"},"current_average_sec":{"type":"integer"},"previous":{"type":"integer"},"period_start_date":{"type":"string","format":"dateTime"},"period_end_date":{"type":"string","format":"dateTime"},"last_updated_at":{"type":"string","format":"dateTime"},"included_minutes":{"type":"string"},"included_minutes_with_packs":{"type":"string"}}}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/dns":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"getDNSForSite","tags":["dnsZone"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"configureDNSForSite","tags":["dnsZone"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/rollback":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"put":{"operationId":"rollbackSiteDeploy","tags":["deploy"],"responses":{"204":{"description":"No content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}":{"get":{"operationId":"getDeploy","tags":["deploy"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/lock":{"post":{"operationId":"lockDeploy","tags":["deploy"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/unlock":{"post":{"operationId":"unlockDeploy","tags":["deploy"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/files/{path}":{"put":{"operationId":"uploadDeployFile","tags":["file"],"consumes":["application/octet-stream"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true},{"name":"path","type":"string","in":"path","required":true},{"name":"size","type":"integer","in":"query"},{"name":"file_body","in":"body","schema":{"type":"string","format":"binary"},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"path":{"type":"string"},"sha":{"type":"string"},"mime_type":{"type":"string"},"size":{"type":"integer","format":"int64"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/functions/{name}":{"put":{"operationId":"uploadDeployFunction","tags":["function"],"consumes":["application/octet-stream"],"parameters":[{"name":"deploy_id","type":"string","in":"path","required":true},{"name":"name","type":"string","in":"path","required":true},{"name":"runtime","type":"string","in":"query"},{"name":"size","type":"integer","in":"query"},{"name":"file_body","in":"body","schema":{"type":"string","format":"binary"},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"sha":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/plugins/{package}":{"put":{"operationId":"updatePlugin","tags":["x-internal"],"description":"This is an internal-only endpoint.","parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"package","type":"string","in":"path","required":true},{"name":"plugin_params","in":"body","schema":{"type":"object","properties":{"pinned_version":{"type":"string"}}}}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"package":{"type":"string"},"pinned_version":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/plugin_runs/latest":{"get":{"operationId":"getLatestPluginRuns","tags":["x-internal"],"description":"This is an internal-only endpoint.","parameters":[{"name":"site_id","in":"path","type":"string","required":true},{"name":"packages","in":"query","type":"array","items":{"type":"string"},"required":true},{"name":"state","in":"query","type":"string"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"allOf":[{"type":"object","properties":{"package":{"type":"string"},"version":{"type":"string"},"state":{"type":"string"},"reporting_event":{"type":"string"},"title":{"type":"string"},"summary":{"type":"string"},"text":{"type":"string"}}},{"type":"object","properties":{"deploy_id":{"type":"string"}}}]}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploys/{deploy_id}/plugin_runs":{"post":{"operationId":"createPluginRun","tags":["x-internal"],"description":"This is an internal-only endpoint.","parameters":[{"name":"deploy_id","type":"string","in":"path","required":true},{"name":"plugin_run","in":"body","schema":{"type":"object","properties":{"package":{"type":"string"},"version":{"type":"string"},"state":{"type":"string"},"reporting_event":{"type":"string"},"title":{"type":"string"},"summary":{"type":"string"},"text":{"type":"string"}}}}],"responses":{"201":{"description":"CREATED","schema":{"allOf":[{"type":"object","properties":{"package":{"type":"string"},"version":{"type":"string"},"state":{"type":"string"},"reporting_event":{"type":"string"},"title":{"type":"string"},"summary":{"type":"string"},"text":{"type":"string"}}},{"type":"object","properties":{"deploy_id":{"type":"string"}}}]}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/forms/{form_id}/submissions":{"get":{"operationId":"listFormSubmissions","tags":["submission"],"parameters":[{"name":"form_id","type":"string","in":"path","required":true},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"number":{"type":"integer","format":"int32"},"email":{"type":"string"},"name":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"company":{"type":"string"},"summary":{"type":"string"},"body":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"site_url":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/hooks":{"get":{"operationId":"listHooksBySiteId","tags":["hook"],"parameters":[{"name":"site_id","in":"query","type":"string","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createHookBySiteId","tags":["hook"],"consumes":["application/json"],"parameters":[{"name":"site_id","type":"string","in":"query","required":true},{"name":"hook","in":"body","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}},"required":true}],"responses":{"201":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/hooks/{hook_id}":{"parameters":[{"name":"hook_id","type":"string","in":"path","required":true}],"get":{"operationId":"getHook","tags":["hook"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateHook","tags":["hook"],"parameters":[{"name":"hook","in":"body","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}},"required":true}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteHook","tags":["hook"],"responses":{"204":{"description":"No content"}}}},"/hooks/{hook_id}/enable":{"parameters":[{"name":"hook_id","type":"string","in":"path","required":true}],"post":{"operationId":"enableHook","tags":["hook"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/hooks/types":{"get":{"operationId":"listHookTypes","tags":["hookType"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"events":{"type":"array","items":{"type":"string"}},"fields":{"type":"array","items":{"type":"object"}}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/oauth/tickets":{"post":{"operationId":"createTicket","tags":["ticket"],"parameters":[{"name":"client_id","type":"string","in":"query","required":true}],"responses":{"201":{"description":"ok","schema":{"type":"object","properties":{"id":{"type":"string"},"client_id":{"type":"string"},"authorized":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/oauth/tickets/{ticket_id}":{"get":{"operationId":"showTicket","tags":["ticket"],"parameters":[{"name":"ticket_id","type":"string","in":"path","required":true}],"responses":{"200":{"description":"ok","schema":{"type":"object","properties":{"id":{"type":"string"},"client_id":{"type":"string"},"authorized":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/oauth/tickets/{ticket_id}/exchange":{"post":{"operationId":"exchangeTicket","tags":["accessToken"],"parameters":[{"name":"ticket_id","type":"string","in":"path","required":true}],"responses":{"201":{"description":"ok","schema":{"type":"object","properties":{"id":{"type":"string"},"access_token":{"type":"string"},"user_id":{"type":"string"},"user_email":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploy_keys":{"get":{"operationId":"listDeployKeys","tags":["deployKey"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"public_key":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createDeployKey","tags":["deployKey"],"consumes":["application/json"],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"public_key":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/deploy_keys/{key_id}":{"parameters":[{"name":"key_id","type":"string","in":"path","required":true}],"get":{"operationId":"getDeployKey","tags":["deployKey"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"public_key":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteDeployKey","tags":["deployKey"],"responses":{"204":{"description":"Not Content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/{account_slug}/sites":{"post":{"operationId":"createSiteInTeam","tags":["site"],"consumes":["application/json"],"parameters":[{"name":"site","in":"body","schema":{"allOf":[{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}},{"properties":{"repo":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}}}}]}},{"name":"configure_dns","type":"boolean","in":"query"},{"name":"account_slug","in":"path","type":"string","required":true}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"get":{"operationId":"listSitesForAccount","tags":["site"],"parameters":[{"name":"name","in":"query","type":"string"},{"name":"account_slug","in":"path","type":"string","required":true},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/{account_slug}/members":{"parameters":[{"name":"account_slug","in":"path","type":"string","required":true}],"get":{"operationId":"listMembersForAccount","tags":["member"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"avatar":{"type":"string"},"role":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"addMemberToAccount","tags":["member"],"parameters":[{"name":"role","in":"query","type":"string","enum":["Owner","Collaborator","Controller"]},{"name":"email","in":"query","type":"string","required":true}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"avatar":{"type":"string"},"role":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/billing/payment_methods":{"get":{"operationId":"listPaymentMethodsForUser","tags":["paymentMethod"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"method_name":{"type":"string"},"type":{"type":"string"},"state":{"type":"string"},"data":{"type":"object","properties":{"card_type":{"type":"string"},"last4":{"type":"string"},"email":{"type":"string"}}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/accounts/types":{"get":{"operationId":"listAccountTypesForUser","tags":["accountType"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"capabilities":{"type":"object"},"monthly_dollar_price":{"type":"integer"},"yearly_dollar_price":{"type":"integer"},"monthly_seats_addon_dollar_price":{"type":"integer"},"yearly_seats_addon_dollar_price":{"type":"integer"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/accounts":{"get":{"operationId":"listAccountsForUser","tags":["accountMembership"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"type":{"type":"string"},"capabilities":{"type":"object","properties":{"sites":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"collaborators":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}}}},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"},"billing_period":{"type":"string"},"payment_method_id":{"type":"string"},"type_name":{"type":"string"},"type_id":{"type":"string"},"owner_ids":{"type":"array","items":{"type":"string"}},"roles_allowed":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createAccount","tags":["accountMembership"],"parameters":[{"name":"accountSetup","in":"body","schema":{"type":"object","required":["name","type_id"],"properties":{"name":{"type":"string"},"type_id":{"type":"string"},"payment_method_id":{"type":"string"},"period":{"type":"string","enum":["monthly","yearly"]},"extra_seats_block":{"type":"integer"}}},"required":true}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"type":{"type":"string"},"capabilities":{"type":"object","properties":{"sites":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"collaborators":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}}}},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"},"billing_period":{"type":"string"},"payment_method_id":{"type":"string"},"type_name":{"type":"string"},"type_id":{"type":"string"},"owner_ids":{"type":"array","items":{"type":"string"}},"roles_allowed":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/accounts/{account_id}":{"parameters":[{"name":"account_id","type":"string","in":"path","required":true}],"get":{"operationId":"getAccount","tags":["accountMembership"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"type":{"type":"string"},"capabilities":{"type":"object","properties":{"sites":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"collaborators":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}}}},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"},"billing_period":{"type":"string"},"payment_method_id":{"type":"string"},"type_name":{"type":"string"},"type_id":{"type":"string"},"owner_ids":{"type":"array","items":{"type":"string"}},"roles_allowed":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateAccount","tags":["accountMembership"],"parameters":[{"name":"accountUpdateSetup","in":"body","schema":{"type":"object","properties":{"name":{"type":"string"},"slug":{"type":"string"},"type_id":{"type":"string"},"extra_seats_block":{"type":"integer"},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"}}}}],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"type":{"type":"string"},"capabilities":{"type":"object","properties":{"sites":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"collaborators":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}}}},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"},"billing_period":{"type":"string"},"payment_method_id":{"type":"string"},"type_name":{"type":"string"},"type_id":{"type":"string"},"owner_ids":{"type":"array","items":{"type":"string"}},"roles_allowed":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"cancelAccount","tags":["accountMembership"],"responses":{"204":{"description":"Not Content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/accounts/{account_id}/audit":{"parameters":[{"name":"account_id","type":"string","in":"path","required":true}],"get":{"operationId":"listAccountAuditEvents","tags":["auditLog"],"parameters":[{"name":"query","type":"string","in":"query"},{"name":"log_type","type":"string","in":"query"},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"account_id":{"type":"string"},"payload":{"type":"object","properties":{"actor_id":{"type":"string"},"actor_name":{"type":"string"},"actor_email":{"type":"string"},"action":{"type":"string"},"timestamp":{"type":"string","format":"dateTime"},"log_type":{"type":"string"}},"additionalProperties":{"type":"object"}}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/submissions/{submission_id}":{"parameters":[{"name":"submission_id","type":"string","in":"path","required":true}],"get":{"operationId":"listFormSubmission","tags":["submission"],"parameters":[{"name":"query","type":"string","in":"query"},{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"number":{"type":"integer","format":"int32"},"email":{"type":"string"},"name":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"company":{"type":"string"},"summary":{"type":"string"},"body":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"site_url":{"type":"string"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteSubmission","tags":["submission"],"responses":{"204":{"description":"Deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/service-instances":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"get":{"operationId":"listServiceInstancesForSite","tags":["serviceInstance"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"url":{"type":"string"},"config":{"type":"object"},"external_attributes":{"type":"object"},"service_slug":{"type":"string"},"service_path":{"type":"string"},"service_name":{"type":"string"},"env":{"type":"object"},"snippets":{"type":"array","items":{"type":"object"}},"auth_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/services/{addon}/instances":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"addon","type":"string","in":"path","required":true}],"post":{"operationId":"createServiceInstance","tags":["serviceInstance"],"consumes":["application/json"],"parameters":[{"name":"config","in":"body","required":true,"schema":{"type":"object"}}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"url":{"type":"string"},"config":{"type":"object"},"external_attributes":{"type":"object"},"service_slug":{"type":"string"},"service_path":{"type":"string"},"service_name":{"type":"string"},"env":{"type":"object"},"snippets":{"type":"array","items":{"type":"object"}},"auth_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/services/{addon}/instances/{instance_id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"addon","type":"string","in":"path","required":true},{"name":"instance_id","type":"string","in":"path","required":true}],"get":{"operationId":"showServiceInstance","tags":["serviceInstance"],"responses":{"200":{"description":"OK","schema":{"type":"object","properties":{"id":{"type":"string"},"url":{"type":"string"},"config":{"type":"object"},"external_attributes":{"type":"object"},"service_slug":{"type":"string"},"service_path":{"type":"string"},"service_name":{"type":"string"},"env":{"type":"object"},"snippets":{"type":"array","items":{"type":"object"}},"auth_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"put":{"operationId":"updateServiceInstance","tags":["serviceInstance"],"consumes":["application/json"],"parameters":[{"name":"config","in":"body","required":true,"schema":{"type":"object"}}],"responses":{"204":{"description":"No Content"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteServiceInstance","tags":["serviceInstance"],"responses":{"204":{"description":"Deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/services/":{"parameters":[{"name":"search","type":"string","in":"query"}],"get":{"operationId":"getServices","tags":["service"],"responses":{"200":{"description":"services","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"service_path":{"type":"string"},"long_description":{"type":"string"},"description":{"type":"string"},"events":{"type":"array","items":{"type":"object"}},"tags":{"type":"array","items":{"type":"string"}},"icon":{"type":"string"},"manifest_url":{"type":"string"},"environments":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/services/{addonName}":{"parameters":[{"name":"addonName","type":"string","in":"path","required":true}],"get":{"operationId":"showService","tags":["service"],"responses":{"200":{"description":"services","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"service_path":{"type":"string"},"long_description":{"type":"string"},"description":{"type":"string"},"events":{"type":"array","items":{"type":"object"}},"tags":{"type":"array","items":{"type":"string"}},"icon":{"type":"string"},"manifest_url":{"type":"string"},"environments":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/services/{addonName}/manifest":{"parameters":[{"name":"addonName","type":"string","in":"path","required":true}],"get":{"operationId":"showServiceManifest","tags":["service"],"responses":{"201":{"description":"retrieving from provider","schema":{"type":"object"}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/user":{"get":{"operationId":"getCurrentUser","tags":["user"],"responses":{"200":{"description":"OK","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"uid":{"type":"string"},"full_name":{"type":"string"},"avatar_url":{"type":"string"},"email":{"type":"string"},"affiliate_id":{"type":"string"},"site_count":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"last_login":{"type":"string","format":"dateTime"},"login_providers":{"type":"array","items":{"type":"string"}},"onboarding_progress":{"type":"object","properties":{"slides":{"type":"string"}}}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/traffic_splits":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true}],"post":{"operationId":"createSplitTest","tags":["splitTest"],"consumes":["application/json"],"parameters":[{"name":"branch_tests","in":"body","required":true,"schema":{"type":"object","properties":{"branch_tests":{"type":"object"}}}}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"get":{"operationId":"getSplitTests","tags":["splitTest"],"responses":{"200":{"description":"split_tests","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/traffic_splits/{split_test_id}":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"split_test_id","type":"string","in":"path","required":true}],"put":{"operationId":"updateSplitTest","tags":["splitTest"],"consumes":["application/json"],"parameters":[{"name":"branch_tests","in":"body","required":true,"schema":{"type":"object","properties":{"branch_tests":{"type":"object"}}}}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"get":{"operationId":"getSplitTest","tags":["splitTest"],"responses":{"200":{"description":"split_test","schema":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/traffic_splits/{split_test_id}/publish":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"split_test_id","type":"string","in":"path","required":true}],"post":{"operationId":"enableSplitTest","tags":["splitTest"],"responses":{"204":{"description":"enable"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/sites/{site_id}/traffic_splits/{split_test_id}/unpublish":{"parameters":[{"name":"site_id","type":"string","in":"path","required":true},{"name":"split_test_id","type":"string","in":"path","required":true}],"post":{"operationId":"disableSplitTest","tags":["splitTest"],"responses":{"204":{"description":"disabled"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/dns_zones":{"post":{"operationId":"createDnsZone","tags":["dnsZone"],"consumes":["application/json"],"parameters":[{"name":"DnsZoneParams","in":"body","required":true,"schema":{"type":"object","properties":{"account_slug":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"}}}}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"get":{"operationId":"getDnsZones","tags":["dnsZone"],"parameters":[{"name":"account_slug","in":"query","type":"string","required":false}],"responses":{"200":{"description":"get all DNS zones the user has access to","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/dns_zones/{zone_id}":{"parameters":[{"name":"zone_id","type":"string","in":"path","required":true}],"get":{"operationId":"getDnsZone","tags":["dnsZone"],"responses":{"200":{"description":"get a single DNS zone","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteDnsZone","tags":["dnsZone"],"responses":{"204":{"description":"delete a single DNS zone"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/dns_zones/{zone_id}/transfer":{"parameters":[{"name":"zone_id","type":"string","in":"path","required":true},{"name":"account_id","type":"string","in":"query","description":"the account of the dns zone","required":true},{"name":"transfer_account_id","type":"string","in":"query","description":"the account you want to transfer the dns zone to","required":true},{"name":"transfer_user_id","type":"string","in":"query","description":"the user you want to transfer the dns zone to","required":true}],"put":{"operationId":"transferDnsZone","tags":["dnsZone"],"responses":{"200":{"description":"transfer a DNS zone to another account","schema":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/dns_zones/{zone_id}/dns_records":{"parameters":[{"name":"zone_id","type":"string","in":"path","required":true}],"get":{"operationId":"getDnsRecords","tags":["dnsZone"],"responses":{"200":{"description":"get all DNS records for a single DNS zone","schema":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"post":{"operationId":"createDnsRecord","tags":["dnsZone"],"consumes":["application/json"],"parameters":[{"name":"dns_record","in":"body","required":true,"schema":{"type":"object","properties":{"type":{"type":"string"},"hostname":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"weight":{"type":"integer","format":"int64"},"port":{"type":"integer","format":"int64"},"flag":{"type":"integer","format":"int64"},"tag":{"type":"string"}}}}],"responses":{"201":{"description":"Created","schema":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}},"/dns_zones/{zone_id}/dns_records/{dns_record_id}":{"parameters":[{"name":"zone_id","type":"string","in":"path","required":true},{"name":"dns_record_id","type":"string","in":"path","required":true}],"get":{"operationId":"getIndividualDnsRecord","tags":["dnsZone"],"responses":{"200":{"description":"get a single DNS record","schema":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}},"delete":{"operationId":"deleteDnsRecord","tags":["dnsZone"],"responses":{"204":{"description":"record deleted"},"default":{"description":"error","schema":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}}}}}},"definitions":{"splitTestSetup":{"type":"object","properties":{"branch_tests":{"type":"object"}}},"splitTests":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}}},"splitTest":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"path":{"type":"string"},"branches":{"type":"array","items":{"type":"object"}},"active":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"unpublished_at":{"type":"string","format":"dateTime"}}},"serviceInstance":{"type":"object","properties":{"id":{"type":"string"},"url":{"type":"string"},"config":{"type":"object"},"external_attributes":{"type":"object"},"service_slug":{"type":"string"},"service_path":{"type":"string"},"service_name":{"type":"string"},"env":{"type":"object"},"snippets":{"type":"array","items":{"type":"object"}},"auth_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}},"service":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"service_path":{"type":"string"},"long_description":{"type":"string"},"description":{"type":"string"},"events":{"type":"array","items":{"type":"object"}},"tags":{"type":"array","items":{"type":"string"}},"icon":{"type":"string"},"manifest_url":{"type":"string"},"environments":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}},"site":{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}},"siteSetup":{"allOf":[{"type":"object","properties":{"id":{"type":"string"},"state":{"type":"string"},"plan":{"type":"string"},"name":{"type":"string"},"custom_domain":{"type":"string"},"domain_aliases":{"type":"array","items":{"type":"string"}},"password":{"type":"string"},"notification_email":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"screenshot_url":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"user_id":{"type":"string"},"session_id":{"type":"string"},"ssl":{"type":"boolean"},"force_ssl":{"type":"boolean"},"managed_dns":{"type":"boolean"},"deploy_url":{"type":"string"},"published_deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"account_name":{"type":"string"},"account_slug":{"type":"string"},"git_provider":{"type":"string"},"deploy_hook":{"type":"string"},"capabilities":{"type":"object","additionalProperties":{"type":"object"}},"processing_settings":{"type":"object","properties":{"skip":{"type":"boolean"},"css":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"js":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"images":{"type":"object","properties":{"optimize":{"type":"boolean"}}},"html":{"type":"object","properties":{"pretty_urls":{"type":"boolean"}}}}},"build_settings":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"id_domain":{"type":"string"},"default_hooks_data":{"type":"object","properties":{"access_token":{"type":"string"}}},"build_image":{"type":"string"},"prerender":{"type":"string"}}},{"properties":{"repo":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}}}}]},"repoInfo":{"type":"object","properties":{"id":{"type":"integer"},"provider":{"type":"string"},"deploy_key_id":{"type":"string"},"repo_path":{"type":"string"},"repo_branch":{"type":"string"},"dir":{"type":"string"},"functions_dir":{"type":"string"},"cmd":{"type":"string"},"allowed_branches":{"type":"array","items":{"type":"string"}},"public_repo":{"type":"boolean"},"private_logs":{"type":"boolean"},"repo_url":{"type":"string"},"env":{"type":"object","additionalProperties":{"type":"string"}},"installation_id":{"type":"integer"},"stop_builds":{"type":"boolean"}}},"submission":{"type":"object","properties":{"id":{"type":"string"},"number":{"type":"integer","format":"int32"},"email":{"type":"string"},"name":{"type":"string"},"first_name":{"type":"string"},"last_name":{"type":"string"},"company":{"type":"string"},"summary":{"type":"string"},"body":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"site_url":{"type":"string"}}},"form":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"},"paths":{"type":"array","items":{"type":"string"}},"submission_count":{"type":"integer","format":"int32"},"fields":{"type":"array","items":{"type":"object"}},"created_at":{"type":"string","format":"dateTime"}}},"hookType":{"type":"object","properties":{"name":{"type":"string"},"events":{"type":"array","items":{"type":"string"}},"fields":{"type":"array","items":{"type":"object"}}}},"hook":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"type":{"type":"string"},"event":{"type":"string"},"data":{"type":"object"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"disabled":{"type":"boolean"}}},"file":{"type":"object","properties":{"id":{"type":"string"},"path":{"type":"string"},"sha":{"type":"string"},"mime_type":{"type":"string"},"size":{"type":"integer","format":"int64"}}},"function":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"sha":{"type":"string"}}},"snippet":{"type":"object","properties":{"id":{"type":"integer","format":"int32"},"site_id":{"type":"string"},"title":{"type":"string"},"general":{"type":"string"},"general_position":{"type":"string"},"goal":{"type":"string"},"goal_position":{"type":"string"}}},"deploy":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"user_id":{"type":"string"},"build_id":{"type":"string"},"state":{"type":"string"},"name":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"},"admin_url":{"type":"string"},"deploy_url":{"type":"string"},"deploy_ssl_url":{"type":"string"},"screenshot_url":{"type":"string"},"review_id":{"type":"number"},"draft":{"type":"boolean"},"required":{"type":"array","items":{"type":"string"}},"required_functions":{"type":"array","items":{"type":"string"}},"error_message":{"type":"string"},"branch":{"type":"string"},"commit_ref":{"type":"string"},"commit_url":{"type":"string"},"skipped":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"published_at":{"type":"string","format":"dateTime"},"title":{"type":"string"},"context":{"type":"string"},"locked":{"type":"boolean"},"review_url":{"type":"string"},"site_capabilities":{"type":"object","properties":{"large_media_enabled":{"type":"boolean"}}},"framework":{"type":"string"}}},"deployFiles":{"type":"object","properties":{"files":{"type":"object"},"draft":{"type":"boolean"},"async":{"type":"boolean"},"functions":{"type":"object"},"branch":{"type":"string"},"framework":{"type":"string"}}},"pluginParams":{"type":"object","properties":{"pinned_version":{"type":"string"}}},"plugin":{"type":"object","properties":{"package":{"type":"string"},"pinned_version":{"type":"string"}}},"buildStatus":{"type":"object","properties":{"active":{"type":"integer"},"pending_concurrency":{"type":"integer"},"enqueued":{"type":"integer"},"build_count":{"type":"integer"},"minutes":{"type":"object","properties":{"current":{"type":"integer"},"current_average_sec":{"type":"integer"},"previous":{"type":"integer"},"period_start_date":{"type":"string","format":"dateTime"},"period_end_date":{"type":"string","format":"dateTime"},"last_updated_at":{"type":"string","format":"dateTime"},"included_minutes":{"type":"string"},"included_minutes_with_packs":{"type":"string"}}}}},"build":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"sha":{"type":"string"},"done":{"type":"boolean"},"error":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}},"buildLogMsg":{"type":"object","properties":{"message":{"type":"string"},"error":{"type":"boolean"}}},"pluginRunData":{"type":"object","properties":{"package":{"type":"string"},"version":{"type":"string"},"state":{"type":"string"},"reporting_event":{"type":"string"},"title":{"type":"string"},"summary":{"type":"string"},"text":{"type":"string"}}},"pluginRun":{"allOf":[{"type":"object","properties":{"package":{"type":"string"},"version":{"type":"string"},"state":{"type":"string"},"reporting_event":{"type":"string"},"title":{"type":"string"},"summary":{"type":"string"},"text":{"type":"string"}}},{"type":"object","properties":{"deploy_id":{"type":"string"}}}]},"metadata":{"type":"object"},"dnsZoneSetup":{"type":"object","properties":{"account_slug":{"type":"string"},"site_id":{"type":"string"},"name":{"type":"string"}}},"dnsZones":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}}},"dnsZone":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"errors":{"type":"array","items":{"type":"string"}},"supported_record_types":{"type":"array","items":{"type":"string"}},"user_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"records":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dns_servers":{"type":"array","items":{"type":"string"}},"account_id":{"type":"string"},"site_id":{"type":"string"},"account_slug":{"type":"string"},"account_name":{"type":"string"},"domain":{"type":"string"},"ipv6_enabled":{"type":"boolean"},"dedicated":{"type":"boolean"}}},"dnsRecordCreate":{"type":"object","properties":{"type":{"type":"string"},"hostname":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"weight":{"type":"integer","format":"int64"},"port":{"type":"integer","format":"int64"},"flag":{"type":"integer","format":"int64"},"tag":{"type":"string"}}},"dnsRecords":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}}},"dnsRecord":{"type":"object","properties":{"id":{"type":"string"},"hostname":{"type":"string"},"type":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer","format":"int64"},"priority":{"type":"integer","format":"int64"},"dns_zone_id":{"type":"string"},"site_id":{"type":"string"},"flag":{"type":"integer"},"tag":{"type":"string"},"managed":{"type":"boolean"}}},"sniCertificate":{"type":"object","properties":{"state":{"type":"string"},"domains":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"},"expires_at":{"type":"string","format":"dateTime"}}},"ticket":{"type":"object","properties":{"id":{"type":"string"},"client_id":{"type":"string"},"authorized":{"type":"boolean"},"created_at":{"type":"string","format":"dateTime"}}},"accessToken":{"type":"object","properties":{"id":{"type":"string"},"access_token":{"type":"string"},"user_id":{"type":"string"},"user_email":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}},"asset":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}},"assetForm":{"type":"object","properties":{"url":{"type":"string"},"fields":{"type":"object","additionalProperties":{"type":"string"}}}},"assetSignature":{"type":"object","properties":{"form":{"type":"object","properties":{"url":{"type":"string"},"fields":{"type":"object","additionalProperties":{"type":"string"}}}},"asset":{"type":"object","properties":{"id":{"type":"string"},"site_id":{"type":"string"},"creator_id":{"type":"string"},"name":{"type":"string"},"state":{"type":"string"},"content_type":{"type":"string"},"url":{"type":"string"},"key":{"type":"string"},"visibility":{"type":"string"},"size":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}}}},"assetPublicSignature":{"type":"object","properties":{"url":{"type":"string"}}},"deployKey":{"type":"object","properties":{"id":{"type":"string"},"public_key":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}},"member":{"type":"object","properties":{"id":{"type":"string"},"full_name":{"type":"string"},"email":{"type":"string"},"avatar":{"type":"string"},"role":{"type":"string"}}},"paymentMethod":{"type":"object","properties":{"id":{"type":"string"},"method_name":{"type":"string"},"type":{"type":"string"},"state":{"type":"string"},"data":{"type":"object","properties":{"card_type":{"type":"string"},"last4":{"type":"string"},"email":{"type":"string"}}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}},"accountType":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"description":{"type":"string"},"capabilities":{"type":"object"},"monthly_dollar_price":{"type":"integer"},"yearly_dollar_price":{"type":"integer"},"monthly_seats_addon_dollar_price":{"type":"integer"},"yearly_seats_addon_dollar_price":{"type":"integer"}}},"accountSetup":{"type":"object","required":["name","type_id"],"properties":{"name":{"type":"string"},"type_id":{"type":"string"},"payment_method_id":{"type":"string"},"period":{"type":"string","enum":["monthly","yearly"]},"extra_seats_block":{"type":"integer"}}},"accountUpdateSetup":{"type":"object","properties":{"name":{"type":"string"},"slug":{"type":"string"},"type_id":{"type":"string"},"extra_seats_block":{"type":"integer"},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"}}},"accountMembership":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"type":{"type":"string"},"capabilities":{"type":"object","properties":{"sites":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"collaborators":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}}}},"billing_name":{"type":"string"},"billing_email":{"type":"string"},"billing_details":{"type":"string"},"billing_period":{"type":"string"},"payment_method_id":{"type":"string"},"type_name":{"type":"string"},"type_id":{"type":"string"},"owner_ids":{"type":"array","items":{"type":"string"}},"roles_allowed":{"type":"array","items":{"type":"string"}},"created_at":{"type":"string","format":"dateTime"},"updated_at":{"type":"string","format":"dateTime"}}},"auditLog":{"type":"object","properties":{"id":{"type":"string"},"account_id":{"type":"string"},"payload":{"type":"object","properties":{"actor_id":{"type":"string"},"actor_name":{"type":"string"},"actor_email":{"type":"string"},"action":{"type":"string"},"timestamp":{"type":"string","format":"dateTime"},"log_type":{"type":"string"}},"additionalProperties":{"type":"object"}}}},"accountUsageCapability":{"type":"object","properties":{"included":{"type":"integer"},"used":{"type":"integer"}}},"minifyOptions":{"type":"object","properties":{"bundle":{"type":"boolean"},"minify":{"type":"boolean"}}},"buildSetup":{"type":"object","properties":{"image":{"type":"string"}}},"buildHookSetup":{"type":"object","properties":{"title":{"type":"string"},"branch":{"type":"string"}}},"buildHook":{"type":"object","properties":{"id":{"type":"string"},"title":{"type":"string"},"branch":{"type":"string"},"url":{"type":"string"},"site_id":{"type":"string"},"created_at":{"type":"string","format":"dateTime"}}},"deployedBranch":{"type":"object","properties":{"id":{"type":"string"},"deploy_id":{"type":"string"},"name":{"type":"string"},"slug":{"type":"string"},"url":{"type":"string"},"ssl_url":{"type":"string"}}},"user":{"type":"object","properties":{"id":{"type":"string"},"uid":{"type":"string"},"full_name":{"type":"string"},"avatar_url":{"type":"string"},"email":{"type":"string"},"affiliate_id":{"type":"string"},"site_count":{"type":"integer","format":"int64"},"created_at":{"type":"string","format":"dateTime"},"last_login":{"type":"string","format":"dateTime"},"login_providers":{"type":"array","items":{"type":"string"}},"onboarding_progress":{"type":"object","properties":{"slides":{"type":"string"}}}}},"error":{"type":"object","required":["message"],"properties":{"code":{"type":"integer","format":"int64"},"message":{"type":"string","x-nullable":false}}}},"parameters":{"page":{"type":"integer","format":"int32","name":"page","required":false,"in":"query"},"perPage":{"type":"integer","format":"int32","name":"per_page","required":false,"in":"query"}},"x-tagGroups":[{"name":"OAuth","tags":["ticket","accessToken"]},{"name":"User accounts","tags":["user","accountMembership","member","accountType","paymentMethod","auditLog"]},{"name":"Site","tags":["site","file","metadata","snippet"]},{"name":"Domain names","tags":["dnsZone","sniCertificate"]},{"name":"Deploys","tags":["deploy","deployedBranch","deployKey"]},{"name":"Builds","tags":["build","buildLogMsg"]},{"name":"Webhooks and notifications","tags":["hook","hookType","buildHook"]},{"name":"Services","tags":["service","serviceInstance"]},{"name":"Functions","tags":["function"]},{"name":"Forms","tags":["form","submission"]},{"name":"Split tests","tags":["splitTest"]},{"name":"Large media","tags":["asset","assetPublicSignature"]}],"tags":[{"name":"ticket","x-displayName":"Ticket"},{"name":"accessToken","x-displayName":"Access token"},{"name":"user","x-displayName":"User"},{"name":"accountMembership","x-displayName":"Accounts"},{"name":"member","x-displayName":"Member"},{"name":"accountType","x-displayName":"Access type"},{"name":"paymentMethod","x-displayName":"Payment method"},{"name":"auditLog","x-displayName":"Audit log"},{"name":"site","x-displayName":"Site"},{"name":"file","x-displayName":"File"},{"name":"metadata","x-displayName":"Metadata"},{"name":"snippet","x-displayName":"Snippet"},{"name":"dnsZone","x-displayName":"DNS zone"},{"name":"sniCertificate","x-displayName":"SNI certificate"},{"name":"deploy","x-displayName":"Deploy"},{"name":"deployedBranch","x-displayName":"Deployed branch"},{"name":"deployKey","x-displayName":"Deploy key"},{"name":"build","x-displayName":"Build"},{"name":"buildLogMsg","x-displayName":"Build log message"},{"name":"hook","x-displayName":"Hook"},{"name":"hookType","x-displayName":"Hook type"},{"name":"buildHook","x-displayName":"Build hook"},{"name":"service","x-displayName":"Service"},{"name":"serviceInstance","x-displayName":"Service instance"},{"name":"function","x-displayName":"Function"},{"name":"form","x-displayName":"Form"},{"name":"submission","x-displayName":"Form submission"},{"name":"splitTest","x-displayName":"Split test"},{"name":"asset","x-displayName":"Asset"},{"name":"assetPublicSignature","x-displayName":"Asset public signature"}]}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(6238);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;