import { forEach } from 'lodash'
import * as core from '@actions/core'
import * as fs from 'fs'

/**
 * Iterates throw the files and asttempts to JSON.parse them to check for validity
 *
 * @param { jsonFiles: string[] } { jsonFiles } json files to check
 */
export function verifyJsonFiles(jsonFiles: string[]): void {
  forEach(jsonFiles, fileName => {
    const contents = fs.readFileSync(fileName, 'utf8')

    try {
      JSON.parse(contents)
    } catch (e) {
      // if error print file name a set step to failed
      const result = (e as Error).message
      core.setFailed(`File ${fileName} is invalid: ${result}`)
    }
  })
}

/**
 *
 *
 * @export
 * @param {string[]} files
 * @param {RegExp} jsonRegex
 * @return {*}  {string[]}
 */
export function filterJsonFiles(files: string[], jsonRegex: RegExp): string[] {
  return files.filter(
    o =>
      jsonRegex.test(o) &&
      !o.includes('e2e') &&
      !o.includes('tsconfig') &&
      !o.includes('ng-package') &&
      !o.includes('lint') &&
      !o.includes('package-lock')
  )
}
