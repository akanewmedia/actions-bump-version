"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterJsonFiles = exports.verifyJsonFiles = void 0;
const lodash_1 = require("lodash");
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
/**
 * Iterates throw the files and asttempts to JSON.parse them to check for validity
 *
 * @param { jsonFiles: string[] } { jsonFiles } json files to check
 */
function verifyJsonFiles(jsonFiles) {
    (0, lodash_1.forEach)(jsonFiles, fileName => {
        const contents = fs.readFileSync(fileName, 'utf8');
        try {
            JSON.parse(contents);
        }
        catch (e) {
            // if error print file name a set step to failed
            const result = e.message;
            core.setFailed(`File ${fileName} is invalid: ${result}`);
        }
    });
}
exports.verifyJsonFiles = verifyJsonFiles;
/**
 *
 *
 * @export
 * @param {string[]} files
 * @param {RegExp} jsonRegex
 * @return {*}  {string[]}
 */
function filterJsonFiles(files, jsonRegex) {
    return files.filter(o => jsonRegex.test(o) &&
        !o.includes('e2e') &&
        !o.includes('tsconfig') &&
        !o.includes('ng-package') &&
        !o.includes('lint') &&
        !o.includes('package-lock'));
}
exports.filterJsonFiles = filterJsonFiles;
