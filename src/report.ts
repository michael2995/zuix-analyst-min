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

    try {
        fetch(params.server, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                commitHash: params.commit,
                contributor: params.contributor,
                data: params.report
            })
        })
    } catch (e) {
        throw Error(e)
    } finally {
        console.log("Closing Report")
    }
}