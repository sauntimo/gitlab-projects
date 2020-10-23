#!/usr/bin/env node
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var chalk_1 = __importDefault(require("chalk"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var path_1 = __importDefault(require("path"));
var shelljs_1 = __importDefault(require("shelljs"));
// get env vars from .env file into process.env
dotenv_1.default.config({ path: path_1.default.join(__dirname + '/../.env') });
var numProjects = Math.min(parseInt((_a = process.env.GITLAB_NUM_PROJECTS) !== null && _a !== void 0 ? _a : "100", 10), 100);
/**
 * Get a list of gitlab projects which the user has access to
 */
var getProjects = function (page) {
    if (page === void 0) { page = 1; }
    return __awaiter(void 0, void 0, void 0, function () {
        var endpoint, queryData, query, response, data, safeHeader, totalResults, currentPage, totalPages, nextPage, fetchedResults, nextPageData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    endpoint = '/v4/projects';
                    queryData = {
                        archived: 'no',
                        last_activity_after: '2020-01-01T00:00:00Z',
                        order_by: 'name',
                        sort: 'asc',
                        per_page: "" + numProjects,
                        page: page.toString(),
                    };
                    query = '?' + new URLSearchParams(queryData).toString();
                    return [4 /*yield*/, node_fetch_1.default(process.env.GITLAB_BASE_URL + endpoint + query, {
                            headers: {
                                'Content-Type': 'application/json',
                                'PRIVATE-TOKEN': process.env.GITLAB_API_KEY,
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        logMessage('red', "Failed to get projects from Gitlab");
                        process.exit(1);
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    safeHeader = function (name) { var _a; return parseInt((_a = response.headers.get(name)) !== null && _a !== void 0 ? _a : "0", 10); };
                    totalResults = safeHeader('x-total');
                    currentPage = safeHeader('x-page');
                    totalPages = safeHeader('x-total-pages');
                    nextPage = safeHeader('x-next-page');
                    fetchedResults = (page * numProjects) < totalResults
                        ? (page * numProjects)
                        : totalResults;
                    logMessage('white', "Fetched " + fetchedResults + "/" + totalResults + " projects...");
                    if (!(currentPage < totalPages)) return [3 /*break*/, 4];
                    return [4 /*yield*/, getProjects(nextPage)];
                case 3:
                    nextPageData = _a.sent();
                    data = data.concat(nextPageData);
                    _a.label = 4;
                case 4: return [2 /*return*/, data];
            }
        });
    });
};
/**
 * Process gitlab projects
 */
var processResult = function (data) {
    var projects = {};
    var names = data.map(function (project) {
        var newDir = process.env.GITLAB_BASE_DIR + project.path_with_namespace;
        logMessage("blue", "Processing " + project.name + "...");
        if (!shelljs_1.default.test('-e', newDir)) {
            logMessage("orange", "New project - creating folder and cloning.");
            shelljs_1.default.mkdir('-p', newDir);
            if (shelljs_1.default.exec("git clone " + project.ssh_url_to_repo + " " + newDir + " -q").code !== 0) {
                shelljs_1.default.echo("Error: Git clone failed for project " + project.name);
                shelljs_1.default.exit(1);
            }
        }
        else {
            logMessage("green", "Project already cloned; switching to default branch and pulling.");
            if (shelljs_1.default.exec("(cd " + newDir + " && git checkout " + project.default_branch + " -q && git pull -q)").code !== 0) {
                shelljs_1.default.echo("Error: Git pull failed for project " + project.name);
                shelljs_1.default.exit(1);
            }
        }
    });
};
/**
 * Display feedback
 * @param colour colour of message text
 * @param text message to print
 */
var logMessage = function (colour, text) {
    console.log(chalk_1.default.bgCyan.white.bold('gitlab_projects'), chalk_1.default.keyword(colour)(text));
};
/**
 * Wrapper function for async error handling
 */
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var missingVariables, data, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!shelljs_1.default.which('git')) {
                    logMessage("red", "Sorry, this script requires git");
                    process.exit(1);
                }
                missingVariables = ['GITLAB_BASE_URL', 'GITLAB_API_KEY', 'GITLAB_BASE_DIR']
                    .filter(function (key) { return typeof process.env[key] === 'undefined'; });
                if (missingVariables.length) {
                    logMessage("red", "Please ensure .env contains " + missingVariables.join(', '));
                    process.exit(1);
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, getProjects()];
            case 2:
                data = _a.sent();
                processResult(data);
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.log(chalk_1.default.bgCyan.white.bold('gitlab_projects'), chalk_1.default.red(err_1));
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
main();
