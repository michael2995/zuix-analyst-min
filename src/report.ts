import fetch from "node-fetch"
import { ZuixAnalysisReport } from "./analyze"

type ReportParams = {
    server?: string,
    report: ZuixAnalysisReport,
    // This is commit hash
    commit?: string
    contributor?: string
}

export const reportToServer = (params: ReportParams) => {
    if (params.server === undefined) {
        throw Error("ZUIX_SERVER_ENDPOINT is not provided")
    }

    fetch(params.server, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            commithash: params.commit,
            contributor: params.contributor,
            data: params.report
        })
    })
        .then((res) => res.text())
        .then((txt) => console.log(`Server responded with ${txt}`))
        .catch((err) => console.error(err))
}