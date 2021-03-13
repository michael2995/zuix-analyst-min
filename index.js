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

const elements = {
    __meta: {
        total: 0,
        zuix: 0,
        zuixRatio: 0,
    }
}

/**
 * @param {string} tag 
 */
const countElement = (tag) => {
    elements[tag] = elements[tag] ? elements[tag] + 1 : 1
}

const result = sourceFiles
    .filter(hasAnyJsxElementsInFile)
    .map((sourceFile) => {
        const {elementTags, zuixElementTags, zuixRatio} = getZuixAnalysis(sourceFile)
        elementTags.forEach((tag) => {
            countElement(tag)
            elements.__meta.total += 1
        })
        zuixElementTags.forEach((tag) => {
            countElement(tag)
            elements.__meta.zuix += 1
        })
    return {
        filename: sourceFile.getFilePath().replace(targetDirectory, ""),
        elementTags,
        zuixElementTags,
        zuixRatio,
    }
})

elements.__meta.zuixRatio = elements.__meta.zuix / elements.__meta.total

const elementAnalysis = JSON.stringify(elements)
const fileAnalysis = JSON.stringify(result)

fs.writeFileSync(path.resolve(__dirname, "./element_analysis.json"), elementAnalysis)
fs.writeFileSync(path.resolve(__dirname, "./file_analysis.json"), fileAnalysis)