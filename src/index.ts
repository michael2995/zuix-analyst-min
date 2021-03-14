import {Command, flags} from '@oclif/command'
import {getZuixAnalysisForDir} from "./analyze"
import {reportToServer} from "./report"

class ZuixAnalyze extends Command {
  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // path to analyze
    path: flags.string({char: "p", required: true}),
    // optional. path for output files
    // output: flags.string({char: "o"})
  }

  static args = [{name: 'file'}]

  async run() {
    const {flags} = this.parse(ZuixAnalyze)
    const {path} = flags
    const zuixAnalysis = getZuixAnalysisForDir(path)
    reportToServer({
      report: zuixAnalysis,
      server: process.env.ZUIX_ANALYSIS_ENDPOINT
    })
  }
}

export = ZuixAnalyze
