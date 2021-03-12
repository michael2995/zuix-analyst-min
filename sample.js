const { Project, SyntaxKind, SourceFile, JsxElement, Node, ts, JsxSelfClosingElement } = require("ts-morph")
const path = require("path")
const fs = require("fs")


const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, "./tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
})

// const sourceFiles = project.addSourceFilesAtPaths(path.resolve(__dirname, "../zigbang-client/!(node_modules)**/**.(ts|tsx)"))
const sourceFile = project.addSourceFileAtPath(path.resolve(__dirname, "./sourceFile.tsx"))
// const zuixSyntax = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
//     .filter((ele) => ele.compilerNode.getFullText().match(/Zuix/))
//     .map((ele) => ele.compilerNode.getText())


/**
 * @param {ts.JsxOpeningElement | ts.JsxSelfClosingElement | ts.JsxClosingElement} node 
 */
const extractTagNameFromJsxOpeningOrClosingNode = (node) => {
    if ("expression" in node.tagName) {
        const {expression, name} = node.tagName
        return `${expression.escapedText}.${name.escapedText}`
    } else {
        return node.tagName.escapedText
    }
}

const closing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement)
const selfClosing = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
const everyJsx = closing.concat(selfClosing)
const tagNames = everyJsx.map((node) => {
    if ("openingElement" in node.compilerNode) {
        return extractTagNameFromJsxOpeningOrClosingNode(node.compilerNode.openingElement)
    } else {
        return extractTagNameFromJsxOpeningOrClosingNode(node.compilerNode)
    }
})

console.log(tagNames)
// console.log(zuixSyntax)
// const ratio = zuixSyntax.length/everyJsx.length
// console.log(ratio)