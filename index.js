const { Project, SyntaxKind, SourceFile, JsxElement, Node, ts, JsxClosingElement, JsxSelfClosingElement, PropertyAccessExpression } = require("ts-morph")
const path = require("path")
const fs = require("fs")

const project = new Project({
    skipAddingFilesFromTsConfig: true,
})


/**
 * @param {SourceFile} source
 */
const getEveryJsxElementNodes = (source) => {
    const closing = source.getDescendantsOfKind(SyntaxKind.JsxElement)
    const selfClosing = source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    const everyJsx = closing.concat(selfClosing)
    return everyJsx
}


/**
 * @param {ts.JsxOpeningElement
 * | ts.JsxSelfClosingElement
 * | ts.JsxClosingElement} node 
 */
const extractTagNameFromJsxOpeningOrClosingNode = (node) => {
    if ("expression" in node.tagName) {
        const {expression, name} = node.tagName
        return `${expression.escapedText}.${name.escapedText}`
    } else {
        return node.tagName.escapedText
    }
}


/**
 * @param {JsxElement | JsxSelfClosingElement} elementNode
 * @returns {string}
 */
const mapJsxElementNodeToTag = (elementNode) => {
    let tagName = "";
    if ("openingElement" in elementNode.compilerNode) {
        tagName = extractTagNameFromJsxOpeningOrClosingNode(elementNode.compilerNode.openingElement)
    } else {
        tagName = extractTagNameFromJsxOpeningOrClosingNode(elementNode.compilerNode)
    }

    return tagName
}


/**
 * @param {SourceFile} source
 * @returns {boolean}
 */
const hasAnyJsxElementsInFile = (source) => {
    return getEveryJsxElementNodes(source).length !== 0
}


/**
 * @param {SourceFile} sourceFile
 */
 const getZuixAnalysis = (sourceFile) => {
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


const targetDirectory = path.resolve(__dirname, "../zigbang-client")
const sourceFiles = project.addSourceFilesAtPaths(path.resolve(targetDirectory, "./!(node_modules)**/**.(ts|tsx)"))
const result = sourceFiles
    .filter(hasAnyJsxElementsInFile)
    .map((sourceFile) => {
    return {
        filename: sourceFile.getFilePath().replace(targetDirectory, ""),
        ...getZuixAnalysis(sourceFile)
    }
})

const json = JSON.stringify(result)
fs.writeFileSync(path.resolve(__dirname, "./analysis.json"), json)