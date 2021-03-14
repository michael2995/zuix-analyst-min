import {Command, flags} from '@oclif/command'
import {getZuixAnalysisForDir} from "./analyze"
import {reportToServer} from "./report"
import fs from "fs"
import path from "path"
class ZuixAnalyze extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // path to analyze
    path: flags.string({char: "p", required: true}),
    // optional. path for output files
    output: flags.string({char: "o"}),
    // optional. url for server endpoint
    server: flags.string({char: "s"}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {flags} = this.parse(ZuixAnalyze)
    const {path: relativePath, output, server} = flags
    const targetPath = path.resolve(process.cwd(), relativePath)
    console.log(`Analyzing ${targetPath} for zuis-usage`)

    if (!output && server === undefined) {
      throw new Error("ZUIX_ANALYSIS_ENDPOINT is not provided")
    }
    
    const zuixAnalysis = getZuixAnalysisForDir(targetPath)
    
    if (output !== undefined) {
      const writePath = path.resolve(process.cwd(), output)
      const pathEndsWithJson = writePath.match(/\.json$/)
      fs.writeFileSync(
        path.resolve(pathEndsWithJson ? writePath : `${writePath}.json`),
        JSON.stringify(zuixAnalysis),
      )
    } else {
      reportToServer({
        report: zuixAnalysis,
        server
      })
    }
  }
}

export = ZuixAnalyze
