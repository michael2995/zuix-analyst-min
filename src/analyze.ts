import { Project, SyntaxKind, SourceFile, JsxElement, ts, JsxSelfClosingElement } from "ts-morph"
import path from "path"

const project = new Project({
    skipAddingFilesFromTsConfig: true,
})

export const getZuixAnalysisForDir = (dirPath: string) => {
    const meta = {
        total: 0,
        zuix: 0,
        zuixRatio: 0,
    }
    const elements: {[index: string]: number} = {}
    const paths = path.resolve(dirPath, "./!(node_modules)**/**.(ts|tsx)")
    const sourceFiles = project.addSourceFilesAtPaths(paths)
    
    const countElement = (tag: string) => {
        elements[tag] = elements[tag] ? elements[tag] + 1 : 1
    }
    
    const files = sourceFiles
        .filter(hasAnyJsxElementsInFile)
        .map((sourceFile) => {
            const {elementTags, zuixElementTags, zuixRatio} = getZuixAnalysis(sourceFile)
            elementTags.forEach((tag) => {
                countElement(tag)
                meta.total += 1
            })
            zuixElementTags.forEach((tag) => {
                countElement(tag)
                meta.zuix += 1
            })
        return {
            filename: sourceFile.getFilePath().replace(dirPath, ""),
            elementTags,
            zuixElementTags,
            zuixRatio,
        }
    })
    
    meta.zuixRatio = meta.zuix / meta.total
    
    const mergedReport = setupReport({
        element_analysis: elements,
        file_analysis: files,
        meta: meta,
    })

    return mergedReport
}

const setupReport = (report: ZuixAnalysisReport) => report

const getZuixAnalysis = (sourceFile: SourceFile) => {
    const elementNodes = getEveryJsxElementNodes(sourceFile)
    const elementTags = elementNodes.map(mapJsxElementNodeToTag)
    const zuixElementTags = elementTags.filter((tag) => tag.match(/[zZ]uix/))
    const zuixRatio = zuixElementTags.length / elementTags.length
    return {
        elementTags,
        zuixElementTags,
        zuixRatio,
    }
}

const hasAnyJsxElementsInFile = (source: SourceFile) => {
    return getEveryJsxElementNodes(source).length !== 0
}


const mapJsxElementNodeToTag = (elementNode: JsxElement | JsxSelfClosingElement) => {
    let tagName = "";
    if ("openingElement" in elementNode.compilerNode) {
        tagName = extractTagNameFromJsxOpeningOrClosingNode(elementNode.compilerNode.openingElement)
    } else {
        tagName = extractTagNameFromJsxOpeningOrClosingNode(elementNode.compilerNode)
    }

    return tagName
}


const extractTagNameFromJsxOpeningOrClosingNode = (node: ts.JsxOpeningElement | ts.JsxSelfClosingElement | ts.JsxClosingElement) => {
    if ("expression" in node.tagName) {
        const {expression, name} = node.tagName
        return `${expression.getText()}.${name.escapedText}`
    } else {
        return node.tagName.getText()
    }
}

const getEveryJsxElementNodes = (source: SourceFile) => {
    const closing = source.getDescendantsOfKind(SyntaxKind.JsxElement)
    const selfClosing = source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    return [...closing, ...selfClosing]
}


type MetaAnalysis = {
    total: number
    zuix: number
    zuixRatio: number
}

type ElementAnalysis = {
    [index: string]: number
}

type FileAnalysis = {
    filename: string
    elementTags: string[]
    zuixElementTags: string[]
    zuixRatio: number
}

export type ZuixAnalysisReport = {
    element_analysis: ElementAnalysis
    file_analysis: FileAnalysis[]
    meta: MetaAnalysis
}