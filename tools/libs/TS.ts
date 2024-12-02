/* *
 *
 *  Handles TypeScript API and provides a simplified AST for doclet-relevant
 *  source nodes.
 *
 *  (c) Highsoft AS
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */


/* eslint-disable
   func-style,
   jsdoc/require-param-description, jsdoc/require-description,
   no-console, no-undef, no-underscore-dangle, no-unused-expressions,
   no-use-before-define */


/* *
 *
 *  Imports
 *
 * */


import * as FS from 'node:fs';

import * as Path from 'node:path';

import * as TS from 'typescript';


/* *
 *
 *  Declarations
 *
 * */


export interface ArrayInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    kind: 'Array';
    meta: Meta;
    node?: TS.ArrayLiteralExpression;
    value: Array<Value>;
}


export interface ClassInfo {
    doclet?: DocletInfo;
    extends?: string;
    flags?: Array<InfoFlag>;
    generics?: Array<TypeAliasInfo>;
    implements?: Array<string>;
    kind: 'Class';
    members: Array<MemberInfo>;
    meta: Meta;
    name: string;
    node?: TS.ClassDeclaration;
}


export type CodeInfo = (
    ArrayInfo|ClassInfo|DeconstructInfo|DocletInfo|ExportInfo|FunctionCallInfo|
    FunctionInfo|ImportInfo|InterfaceInfo|NamespaceInfo|ObjectInfo|PropertyInfo|
    ReferenceInfo|TypeAliasInfo|VariableInfo
);


export interface DeconstructInfo {
    deconstructs: Record<string,string>;
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    from?: (FunctionCallInfo|ReferenceInfo)
    kind: 'Deconstruct';
    meta: Meta;
    node?: (TS.ParameterDeclaration|TS.VariableDeclaration);
    type?: Array<string>;
}


export interface DocletInfo {
    kind: 'Doclet';
    meta: Meta;
    node?: TS.JSDoc;
    tags: Record<string,Array<string>>;
}


export interface DocletTag {
    isOptional?: boolean;
    name?: string;
    tag: string;
    text?: string;
    type?: Array<string>;
    value?: string;
}


export interface ExportInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    kind: 'Export';
    meta: Meta;
    node?: TS.ExportAssignment;
    value?: Value;
}


export interface FunctionCallInfo {
    arguments?: Array<Value>;
    doclet?: DocletInfo;
    genericArguments?: Array<string>;
    kind: 'FunctionCall';
    meta: Meta;
    name: string;
    node?: TS.CallExpression;
}


export interface FunctionInfo {
    body?: Array<DocletInfo>;
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    generics?: Array<TypeAliasInfo>;
    inherited?: boolean;
    kind: 'Function';
    meta: Meta;
    name: string;
    node?: (TS.ConstructorDeclaration|TS.FunctionDeclaration|TS.MethodDeclaration);
    parameters?: Array<VariableInfo>;
    return?: Array<string>;
}


export interface ImportInfo {
    doclet?: DocletInfo;
    imports: Record<string,string>;
    kind: 'Import';
    meta: Meta;
    node?: TS.ImportDeclaration;
    from: string;
}


export type InfoFlag = (
    'async'|'abstract'|'assured'|'await'|'declare'|'default'|'export'|
    'optional'|'private'|'protected'|'rest'|'static'|'type'
);


export interface InterfaceInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    generics?: Array<TypeAliasInfo>;
    implements?: Array<string>;
    kind: 'Interface';
    members: Array<MemberInfo>;
    meta: Meta;
    name: string;
    node?: TS.InterfaceDeclaration;
}


export type MemberInfo = (DocletInfo|FunctionInfo|PropertyInfo);


export interface Meta {
    begin: number;
    end: number;
    file: string;
    merged?: boolean;
    overhead: number;
    scope?: string;
    syntax: number;
}


export interface NamespaceInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    kind: ('Module'|'Namespace');
    members: Array<CodeInfo>;
    meta: Meta;
    name: string;
    node?: TS.ModuleDeclaration;
}


export interface ObjectInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    kind: 'Object';
    members: Array<MemberInfo>;
    meta: Meta;
    node?: TS.ObjectLiteralExpression;
    type?: Array<string>;
}


export interface PropertyInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    inherited?: boolean;
    kind: 'Property';
    meta: Meta;
    name: string;
    node?: (
        | TS.PropertyAssignment
        | TS.PropertyDeclaration
        | TS.PropertySignature
        | TS.ShorthandPropertyAssignment
    );
    type?: Array<string>;
    value?: Value;
}


export interface ReferenceInfo {
    doclet?: DocletInfo;
    kind: 'Reference';
    meta: Meta;
    name: string;
    node: (TS.Identifier|TS.ParameterDeclaration|TS.PropertyAccessExpression);
}


export interface SourceInfo {
    code: Array<CodeInfo>;
    kind: 'Source';
    node?: TS.SourceFile;
    path: string;
}


export interface TypeAliasInfo {
    doclet?: DocletInfo;
    kind: 'TypeAlias';
    generics?: Array<TypeAliasInfo>;
    meta: Meta;
    name: string;
    node?: (TS.TypeAliasDeclaration|TS.TypeParameterDeclaration);
    value?: Array<string>;
}


export type Value = (
    boolean|null|number|string|ArrayInfo|FunctionCallInfo|FunctionInfo|
    ObjectInfo|ReferenceInfo
);


export interface VariableInfo {
    doclet?: DocletInfo;
    flags?: Array<InfoFlag>;
    kind: 'Variable';
    meta: Meta;
    name: string;
    node?: (TS.ParameterDeclaration|TS.TypeParameterDeclaration|TS.VariableDeclaration);
    type?: Array<string>;
    value?: Value;
}


/* *
 *
 *  Constants
 *
 * */


const DOCLET = /\/\*\*.*?\*\//gsu;


const DOCLET_TAG_INSET = /^\s*\{([^}]+)\}/su;


const DOCLET_TAG_NAME = /^(?:\[([a-z][\w\.='"]+)\]|([a-z][\w\.='"]*))/su;


const JSX = /\.j(sx?)$/su;


const GENERIC = /^[\w\.]*<[\s\w\.\[\],|()]+>$/su;


const NATIVE_HELPER = new RegExp(
    '^(?:' + [
        'Array', 'Extract', 'Omit', 'Partial', 'Promise', 'Readonly',
        'ReadonlyArray', 'Record', 'Require'
    ].join('|') + ')(?:<|$)',
    'gsu'
);


const NATIVE_TYPES = [
    'Array',
    'Function',
    'NaN',
    'Number',
    'Object',
    'String',
    'Symbol'
];


/**
 * Array of product IDs to extract. If empty, everything is included.
 */
export const PRODUCTS: Array<string> = [];


const SANITIZE_TEXT = /^(['"`]?)(.*)\1$/gsu;


const SANITIZE_TYPE = /\(\s*(.*)\s*\)/gsu;


/**
 * Dictionary of cached source information. The key starts with the path.
 * Separated with a colon character (`:`) follows a boolean value indicating the
 * inclusion of native TypeScript nodes.
 */
export const SOURCE_CACHE: Record<string,SourceInfo> = {};


const SOURCE_EXTENSION = /(?:\.d)?\.[jt]sx?$/gsu;


/* *
 *
 *  Functions
 *
 * */


/**
 * Add child informations and doclets.
 *
 * @param infos
 * Array of code information to add to.
 *
 * @param nodes
 * Child nodes to extract from.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 */
function addChildInfos (
    infos: Array<CodeInfo>,
    nodes: Array<TS.Node>,
    includeNodes?: boolean
): void {
    let _child: (CodeInfo|undefined);
    let _children: (Array<CodeInfo>|undefined);
    let _doclet: DocletInfo;
    let _doclets: Array<DocletInfo>;
    let _previousNode = nodes[0];

    for (const node of nodes) {

        if (node.kind === TS.SyntaxKind.EndOfFileToken) {
            break;
        }

        if (TS.isVariableStatement(node)) {
            _children = getChildInfos(
                getNodesChildren(node.declarationList),
                includeNodes
            );
            if (_children.length) {
                // Take the first one out to attach leading doclet
                _child = _children.shift();
            }
        } else {
            _child = (
                getVariableInfo(node, includeNodes) ||
                getTypeAliasInfo(node, includeNodes) ||
                getPropertyInfo(node, includeNodes) ||
                getObjectInfo(node, includeNodes) ||
                getNamespaceInfo(node, includeNodes) ||
                getInterfaceInfo(node, includeNodes) ||
                getImportInfo(node, includeNodes) ||
                getFunctionInfo(node, includeNodes) ||
                getFunctionCallInfo(node, includeNodes) ||
                getExportInfo(node, includeNodes) ||
                getDeconstructInfos(node, includeNodes) ||
                getClassInfo(node, includeNodes) ||
                getArrayInfo(node, includeNodes)
            );
        }

        // Retrieve leading doclets

        _doclets = getDocletInfosBetween(_previousNode, node, includeNodes);

        // Deal with floating doclets before leading child doclet

        if (_doclets.length) {

            _doclet = _doclets[_doclets.length - 1];

            // Add trailing doclet to child information

            if (
                _child &&
                _child.kind !== 'Doclet' &&
                _child.kind !== 'Export' &&
                _child.kind !== 'Import' &&
                !_doclet.tags.apioption
            ) {
                _child.doclet = _doclets.pop();
            }

            // Add floating doclets

            for (_doclet of _doclets) {
                if (isProductRelated(_doclet)) {
                    infos.push(_doclet);
                }
            }

        }

        // Finally add child(ren)

        if (_child) {
            if (isProductRelated(_child.kind === 'Doclet' ? _child : _child.doclet)) {
                infos.push(_child);
            }
            _child = void 0;
        }

        if (_children) {
            infos.push(..._children);
            _children = void 0;
        }

        _previousNode = node;
    }

}


/**
 * Adds info flags from the given node.
 *
 * @param info
 * Information to add to.
 *
 * @param node
 * Node to retrieve from.
 */
function addInfoFlags (
    info: CodeInfo,
    node: TS.Node
): void {

    switch (info.kind) {
        case 'Doclet':
        case 'FunctionCall':
        case 'Import':
        case 'Reference':
        case 'TypeAlias':
            return;
    }

    const _flags: Array<InfoFlag> = [];

    if (!TS.canHaveModifiers(node)) {
        return;
    }

    for (const _modifier of (TS.getModifiers(node) || [])) {
        if (!TS.isDecorator(_modifier)) {
            _flags.push(_modifier.getText() as InfoFlag);
        }
    }

    if (
        (
            TS.isBindingElement(node) ||
            TS.isParameterPropertyDeclaration(node, node.parent) ||
            TS.isTupleTypeNode(node)
        ) &&
        node.dotDotDotToken
    ) {
        _flags.push('rest');
    }

    if (
        TS.isArrayLiteralExpression(node) ||
        TS.isConstructorDeclaration(node) ||
        TS.isFunctionDeclaration(node) ||
        TS.isGetAccessorDeclaration(node) ||
        TS.isMethodDeclaration(node) ||
        TS.isPropertyDeclaration(node) ||
        TS.isSetAccessorDeclaration(node) ||
        TS.isVariableDeclaration(node)
    ) {
        if (node.exclamationToken) {
            _flags.push('assured');
        }
        if (node.questionToken) {
            _flags.push('optional');
        }
    }

    if (TS.isExportAssignment(node)) {
        _flags.push('default');
    }

    if (
        TS.isImportDeclaration(node) &&
        node.importClause &&
        node.importClause.isTypeOnly
    ) {
        _flags.push('type');
    }

    if (_flags.length) {
        info.flags = _flags;
    }

}


/**
 * Retrieves meta information for a given node.
 *
 * @param info
 * Information to add to.
 *
 * @param node
 * Node to return meta information for.
 */
function addInfoMeta (
    info: CodeInfo,
    node: TS.Node
): void {
    info.meta = {
        begin: node.getStart(),
        end: node.getEnd(),
        file: node.getSourceFile().fileName,
        overhead: node.getLeadingTriviaWidth(),
        syntax: node.kind
    };
}


/**
 * Adds the scope path to code informations.
 *
 * @param parentInfo
 * Code information with scope path to add.
 *
 * @param targetInfos
 * Code information to add to.
 */
function addInfoScopes (
    parentInfo: (CodeInfo|SourceInfo),
    targetInfos: Array<CodeInfo|Value>
): void {
    const _scopePath = extractInfoScopePath(parentInfo);

    for (const _info of targetInfos) {

        if (
            !_info ||
            typeof _info !== 'object' ||
            _info.kind === 'Doclet' ||
            _info.kind === 'Export' ||
            _info.kind === 'Import'
        ) {
            continue;
        }

        if (_scopePath) {
            _info.meta.scope = _scopePath;
        }

        switch (_info.kind) {

            case 'Array':
                if (_info.value) {
                    addInfoScopes(_info, _info.value);
                }
                break;

            case 'Class':
            case 'Interface':
                if (_info.generics) {
                    addInfoScopes(_info, _info.generics);
                }
                addInfoScopes(_info, _info.members);
                break;


            case 'Function':
                if (_info.generics) {
                    addInfoScopes(_info, _info.generics);
                }
                if (_info.parameters) {
                    addInfoScopes(_info, _info.parameters);
                }
                break;

            case 'FunctionCall':
                if (_info.arguments) {
                    addInfoScopes(_info, _info.arguments);
                }
                if (_info.genericArguments) {
                    addInfoScopes(_info, _info.genericArguments);
                }
                break;

            case 'Module':
            case 'Namespace':
            case 'Object':
                addInfoScopes(_info, _info.members);
                break;

            case 'Property':
            case 'Variable':
                if (typeof _info.value === 'object') {
                    addInfoScopes(_info, [_info.value]);
                }
                break;

            case 'TypeAlias':
                if (_info.generics) {
                    addInfoScopes(_info, _info.generics);
                }
                break;

            default:
                break;

        }

    }

}


/**
 * Adds a tag to a DocletInfo object.
 *
 * @param doclet
 * Doclet information to modify.
 *
 * @param tag
 * Tag to add to.
 *
 * @param text
 * Text to add.
 *
 * @return
 * DocletInfo object as reference.
 */
function addTag (
    doclet: DocletInfo,
    tag: string,
    text?: string
): DocletInfo {
    const tags = doclet.tags;

    tags[tag] = tags[tag] || [];

    if (text) {
        tags[tag].push(text);
    }

    return doclet;
}


/**
 * Complete cached source infos with external additions from DTS files.
 */
export function autoCompleteInfos (): void {
    let _modulePath: string;
    let _sourceInfo: SourceInfo;

    for (const _key of Object.keys(SOURCE_CACHE)) {

        _sourceInfo = SOURCE_CACHE[_key];

        if (!_sourceInfo) {
            continue;
        }

        for (const _info of _sourceInfo.code) {
            if (
                _info.kind === 'Module' &&
                _info.flags?.includes('declare') &&
                _sourceInfo.path.startsWith('.')
            ) {
                _modulePath = sanitizeSourcePath(
                    Path
                        .join(_sourceInfo.path, _info.name)
                        .replace(/\\/gu, '/')
                );

                const _sourceInfoToMerge =
                    getSourceInfo(`${_modulePath}.d.ts`, void 0, !!_info.node);

                if (_sourceInfoToMerge) {
                    mergeCodeInfos(_sourceInfoToMerge, _info);
                }
            }
        }

    }

}


/**
 * Extends ClassInfo and InterfaceInfo with additional inherited members.
 *
 * @param infoToExtend
 * Class or interface information to extend.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Extended class or interface information.
 */
export function autoExtendInfo<T extends (ClassInfo|InterfaceInfo)> (
    infoToExtend: T,
    includeNodes: boolean = false
): T {
    const _extendsToDo: Array<string> = [];

    if (infoToExtend.implements) {
        const _extendsTypes = (
            typeof infoToExtend.implements === 'string' ?
                [infoToExtend.implements] :
                infoToExtend.implements
        );

        for (const _extendsType of _extendsTypes) {
            for (const _extractedType of extractTypes(_extendsType)) {
                if (!_extendsToDo.includes(_extractedType)) {
                    _extendsToDo.push(_extractedType);
                }
            }
        }

    }

    let _resolvedInfo: (CodeInfo|undefined);

    for (const _extendType of _extendsToDo) {
        _resolvedInfo = resolveReference(
            getSourceInfo(infoToExtend.meta.file, void 0, includeNodes),
            _extendType
        );

        if (
            !_resolvedInfo ||
            (
                _resolvedInfo.kind !== 'Class' &&
                _resolvedInfo.kind !== 'Namespace' &&
                _resolvedInfo.kind !== 'Interface'
            )
        ) {
            continue;
        }

        // First complete the parent
        if (
            _resolvedInfo.kind === 'Class' ||
            _resolvedInfo.kind === 'Interface'
        ) {
            _resolvedInfo = autoExtendInfo(_resolvedInfo, includeNodes);
        }

        for (const _member of _resolvedInfo.members) {
            const _name = extractInfoName(_member);

            // Check if already defined in target
            if (
                !_name ||
                _member.kind !== 'Property' ||
                extractInfos(infoToExtend.members, _name)
            ) {
                continue;
            }

            const _newMember = newCodeInfo(_member);

            _newMember.meta.merged = true;

            infoToExtend.members.push(_newMember);

        }

    }

    return infoToExtend;
}


/**
 * Shifts ranges in the source code with replacements.
 *
 * @param sourceCode
 * Source code to change.
 *
 * @param replacements
 * Replacements to apply.
 *
 * @return
 * Changed source code.
 */
function changeSourceCode (
    sourceCode: string,
    replacements: Array<[number,number,string]>
): string {

    if (
        !replacements ||
        !replacements.length
    ) {
        return sourceCode;
    }

    for (const replacement of replacements.sort((a, b) => b[0] - a[0])) {
        sourceCode = (
            sourceCode.substring(0, replacement[0]) +
            replacement[2] +
            sourceCode.substring(replacement[1])
        );
    }

    return sourceCode;
}


/**
 * [TS] Shifts ranges in the source node with replacements.
 *
 * @param sourceNode
 * Source file to change.
 *
 * @param replacements
 * Replacements to apply.
 *
 * @return
 * New source node with changes.
 */
export function changeSourceNode (
    sourceNode: TS.SourceFile,
    replacements: Array<[number,number,string]>
): TS.SourceFile {

    if (
        !replacements ||
        !replacements.length
    ) {
        return sourceNode;
    }

    return TS.createSourceFile(
        sourceNode.fileName,
        changeSourceCode(sourceNode.getFullText(), replacements),
        TS.ScriptTarget.ESNext,
        true
    );
}


/**
 * [TS] Logs debug information for a node and its children into the console.
 *
 * @param node
 * Node to debug.
 *
 * @param depth
 * Level of debug depth regarding children.
 *
 * @param indent
 * Internal parameter.
 */
export function debug (
    node: TS.Node,
    depth: number = 0,
    indent: string = ''
): void {

    if (!node) {
        console.info(indent + 0, 'undefined', '[-:-]');
        return;
    }

    console.info(
        indent + node.kind,
        TS.SyntaxKind[node.kind],
        `[${node.getFullStart()}:${node.getEnd()}]`
    );

    if (depth-- > 0) {
        indent += '  ';
        for (const child of getNodesChildren(node)) {
            debug(child, depth, indent);
        }
    }

}


/**
 * Extracts the arguments of the generic name or type.
 *
 * @param nameOrTypeString
 * Name or type to extract from.
 *
 * @return
 * Extracted generic arguments.
 */
export function extractGenericArguments (
    nameOrTypeString: string
): Array<string>|undefined {

    if (!nameOrTypeString.match(GENERIC)) {
        return void 0;
    }

    const types: Array<string> = [];

    let sublevel = 0;

    for (let part of nameOrTypeString.split(',')) {

        part = part.trim();

        if (sublevel) {
            types.push(`${types.pop()},${part}`);
        } else {
            types.push(part);
        }

        if (part.includes('<')) {
            ++sublevel;
        }
        if (part.includes('>')) {
            --sublevel;
        }

    }

    return types;
}


/**
 * Extracts the entity name from the given code information.
 *
 * @param codeInfo
 * Code information to extract from.
 *
 * @return
 * Extracted name or `undefined`.
 */
export function extractInfoName (
    codeInfo: (CodeInfo|SourceInfo)
): (string|undefined) {
    let _name: (string|undefined);

    switch (codeInfo.kind) {
        case 'Class':
        case 'Function':
        case 'Interface':
        case 'Module':
        case 'Namespace':
        case 'Property':
        case 'TypeAlias':
        case 'Variable':
            return codeInfo.name;
        case 'Doclet':
            _name = extractTagText(codeInfo, 'optionparent', true);
            if (typeof _name === 'string') {
                return _name;
            }
            return (
                extractTagText(codeInfo, 'apioption', true) ||
                extractTagText(codeInfo, 'function', true) ||
                extractTagText(codeInfo, 'name', true)
            );
        case 'Source':
            return codeInfo.path;
        default:
            return void 0;
    }
}


/**
 * Extracts information from an array of CodeInfo types.
 *
 * @param arr
 * Array of informations to extract from.
 *
 * @param name
 * Name of information to extract.
 *
 * @return
 * Extracted information or `undefined`.
 */
function extractInfos (
    arr: Array<CodeInfo>,
    name: string
): (Array<CodeInfo>|undefined) {

    if (typeof name !== 'string') {
        return void 0;
    }

    const extractions: Array<CodeInfo> = [];

    for (const info of arr) {
        switch (info.kind) {
            case 'Class':
            case 'Function':
            case 'Interface':
            case 'Module':
            case 'Namespace':
            case 'Property':
            case 'Variable':
                if (info.name === name) {
                    extractions.push(info);
                }
                continue;
            default:
                continue;
        }
    }

    return (
        extractions.length ?
            extractions :
            void 0
    );
}


/**
 * Extracts scope path for the given code information.
 *
 * @param info
 * Information to extract from.
 *
 * @return
 * Scope path or `undefined`.
 */
function extractInfoScopePath (
    info: (CodeInfo|SourceInfo)
): (string|undefined) {

    switch (info.kind) {

        case 'Array':
        case 'Deconstruct':
        case 'Object':
            return info.meta.scope;

        case 'Class':
        case 'Function':
        case 'FunctionCall':
        case 'Interface':
        case 'Namespace':
        case 'Property':
        case 'Reference':
        case 'TypeAlias':
        case 'Variable':
            return (
                info.meta.scope ?
                    `${info.meta.scope}.${info.name}` :
                    info.name
            );

        default:
            return void 0;

    }

}


/**
 * Retrieves the leading curly bracket inset from the given tag text.
 *
 * @param text
 * Tag text to get insets from.
 *
 * @return
 * Inset from curly bracket or `undefined`.
 */
export function extractTagInset (
    text: string
): string {
    return (text.match(DOCLET_TAG_INSET) || [])[1];
}


/**
 * Retrieves all information for the specified tag from a DocletInfo object.
 *
 * @param doclet
 * Doclet information to retrieve from.
 *
 * @param tag
 * Tag to retrieve.
 *
 * @return
 * Retrieved tag informations.
 */
export function extractTagObjects (
    doclet: DocletInfo,
    tag: string
): Array<DocletTag> {
    const _objects: Array<DocletTag> = [];

    let _inset: (string|undefined);
    let _match: (RegExpMatchArray|null);
    let _object: DocletTag;

    for (let _text of (doclet.tags[tag] || [])) {
        _object = { tag };
        _inset = extractTagInset(_text);

        if (_inset) {
            _object.type = [_inset];
            _text = _text
                .substring(_text.indexOf(`{${_inset}}` + _inset.length + 2))
                .trimStart();
        }

        switch (tag) {

            default:
                break;

            case 'param':
            case 'return':
            case 'returns':
                _match = _text.match(DOCLET_TAG_NAME);
                if (_match) {
                    if (_match[1]) {
                        _object.isOptional = true;
                        _object.name = _match[1];
                    } else {
                        _object.name = _match[2];
                    }
                    if (_object.name.includes('=')) {
                        _object.value = _object.name.split('=', 2)[1];
                        _object.name = _object.name.split('=', 2)[0];
                    }
                    _text = _text.substring(_match[0].length).trimStart();
                }
                break;

            case 'sample':
            case 'samples':
                _match = _text.match(/^\S+/gsu);
                if (_match) {
                    _object.name = _text.substring(_match[0].length).trim();
                    _object.value = _match[0];
                    _text = '';
                }
                break;

        }
        if (_text) {
            _object.text = _text;
        }
        _objects.push(_object);
    }

    if (
        !_objects.length &&
        doclet.tags[tag]
    ) {
        _objects.push({ tag });
    }

    return _objects;
}


/**
 * Retrieves the text of the specified tag from a DocletInfo object.
 *
 * @param doclet
 * Doclet information to retrieve from.
 *
 * @param tag
 * Tag to retrieve.
 *
 * @param allOrInset
 * * `false`: Extracts only text from the last tag occurance. (default)
 * * `true`: Extracts text from all tag occurances, separated by `\n\n`.
 * * `string`: Extracts only text with matching leading inset (e.g. product).
 *
 * @return
 * Retrieved text or `undefined`.
 */
export function extractTagText (
    doclet: DocletInfo,
    tag: string,
    allOrInset: (boolean|string) = false
): (string|undefined) {
    const _tagText = doclet.tags[tag];

    if (
        !_tagText ||
        !_tagText.length
    ) {
        return void 0;
    }

    if (allOrInset === false) {
        return _tagText[_tagText.length - 1];
    }

    if (allOrInset === true) {
        return _tagText.join('\n\n');
    }

    const _insetText: Array<string> = [];

    let _inset: (string|undefined);

    for (const _text of _tagText) {
        _inset = extractTagInset(_text);
        if (!_inset) {
            _insetText.push(_text);
        } else if (_inset === allOrInset) {
            _insetText.push(
                _text
                    .substring(_text.indexOf(`{${_inset}}` + _inset.length + 1))
                    .trimStart()
            );
        }
    }

    return _insetText.join('\n\n');
}


/**
 * Extracts all types of a type statement, including conditionals, generics,
 * intersects and unions.
 *
 * @param typeStrings
 * Type statements as strings to extract from.
 *
 * @param includeNativeTypes
 * Set `true` to include TypeScript's native types.
 *
 * @return
 * Array of extracted types.
 */
export function extractTypes (
    typeStrings: (string|Array<string>),
    includeNativeTypes?: boolean
): Array<string> {
    const _types: Array<string> = [];

    let _sublevel = 0;

    typeStrings = (
        typeof typeStrings === 'string' ?
            [typeStrings] :
            typeStrings
    );

    for (const _typeString of typeStrings) {
        for (let _part of _typeString.split('|')) {

            if (
                !includeNativeTypes &&
                isNativeType(_part)
            ) {
                if (_part.includes('<')) {
                    _types.push(
                        _part
                            .replace(NATIVE_HELPER, '')
                            .replace('>', '')
                    );
                }
                continue;
            }

            _part = _part.trim();

            if (_sublevel) {
                _types.push(`${_types.pop()}|${_part}`);
            } else {
                _types.push(_part);
            }

            if (_part.includes('<')) {
                ++_sublevel;
            }
            if (_part.includes('>')) {
                --_sublevel;
            }

        }
    }

    return _types;
}


/**
 * Retrieves array info from the given node.
 *
 * @param node
 * Node that might be an array.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Array information or `undefined`.
 */
function getArrayInfo (
    node: TS.Node,
    includeNodes?: boolean
): (ArrayInfo|undefined) {

    if (!TS.isArrayLiteralExpression(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Array'
    } as ArrayInfo;

    const _values: Array<Value> = _info.value = [];

    for (const _child of node.elements) {
        const _infoValue = getInfoValue(_child);

        if (_infoValue) {
            _values.push(_infoValue);
        }
    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieve child informations and doclets.
 *
 * @param nodes
 * Child nodes to extract from.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Retrieved child informations.
 */
function getChildInfos (
    nodes: Array<TS.Node>,
    includeNodes?: boolean
): Array<CodeInfo> {
    const _infos: Array<CodeInfo> = [];

    addChildInfos(_infos, nodes, includeNodes);

    return _infos;
}


/**
 * Retrieves class info from the given node.
 *
 * @param node
 * Node that might be a class.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Class information or `undefined`.
 */
function getClassInfo (
    node: TS.Node,
    includeNodes?: boolean
): (ClassInfo|undefined) {

    if (!TS.isClassDeclaration(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Class'
    } as ClassInfo;

    _info.name = ((node.name && node.name.getText()) || 'default');

    if (node.typeParameters) {
        addChildInfos(
            _info.generics = [],
            Array.from(node.typeParameters),
            includeNodes
        );
    }

    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            if (clause.token === TS.SyntaxKind.ExtendsKeyword) {
                _info.extends = clause.types[0]?.getText();
            } else {
                _info.implements = clause.types.map(t => t.getText());
            }
        }
    }

    addChildInfos(_info.members = [], Array.from(node.members), includeNodes);
    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves deconstruct information from the given node.
 *
 * @param node
 * Node that might be a deconstruct.
 *
 * @param includeNodes
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Deconstruct information or `undefined`.
 */
function getDeconstructInfos (
    node: TS.Node,
    includeNodes?: boolean
): (DeconstructInfo|undefined) {

    if (
        !TS.isParameter(node) &&
        !TS.isVariableDeclaration(node)
    ) {
        return void 0;
    }

    if (
        !TS.isArrayBindingPattern(node.name) &&
        !TS.isObjectBindingPattern(node.name)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'Deconstruct',
        deconstructs: {}
    } as DeconstructInfo;

    if (node.initializer) {
        const _from = getInfoValue(node.initializer);

        if (
            _from &&
            typeof _from === 'object' &&
            (
                _from.kind === 'FunctionCall' ||
                _from.kind === 'Reference'
            )
        ) {
            _info.from = _from;
        }
    }

    for (const element of node.name.elements) {
        if (TS.isOmittedExpression(element)) {
            continue;
        }
        _info.deconstructs[(element.propertyName || element.name).getText()] =
            element.name.getText();
    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieve doclet informations between two nodes.
 *
 * @param startNode
 * Node that comes before doclets.
 *
 * @param endNode
 * Node that comes after doclets.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Retrieved doclet informations.
 */
function getDocletInfosBetween (
    startNode: TS.Node,
    endNode: TS.Node,
    includeNodes?: boolean
): Array<DocletInfo> {
    const _toString = (tag: (TS.JSDoc|TS.JSDocComment|TS.JSDocTag)): (string|undefined) => {
        switch (tag.kind) {
            case TS.SyntaxKind.JSDoc:
                return (
                    tag.comment instanceof Array ?
                        tag.comment.map(_toString).join('') :
                        tag.comment
                );
            case TS.SyntaxKind.JSDocLink:
            case TS.SyntaxKind.JSDocLinkCode:
            case TS.SyntaxKind.JSDocLinkPlain:
                return (
                    '{@link ' +
                    ((tag as TS.JSDocLink).name?.getText() || '') +
                    tag.getText() +
                    '}'
                );
            case TS.SyntaxKind.JSDocText:
                return tag.getText();
            default:
                return tag
                    .getText()
                    .substring(tag.tagName.text.length + 1)
                    .replace(/\n +\* ?/gsu, '\n')
                    .trim();
        }
    };

    const _doclets: Array<DocletInfo> = [];

    let _doclet: DocletInfo;
    let _tagName: string;

    for (const doclet of getDocletsBetween(startNode, endNode)) {

        _doclet = newDocletInfo();

        for (const node of doclet) {
            if (TS.isJSDoc(node)) {

                if (node.comment) {
                    addTag(_doclet, 'description', _toString(node));
                }

                if (node.tags) {
                    for (const tag of node.tags) {
                        _tagName = tag.tagName.text;
                        addTag(_doclet, _tagName, _toString(tag));
                    }
                }

                addInfoMeta(_doclet, node);

                if (includeNodes) {
                    _doclet.node = node;
                }

            }
        }

        _doclets.push(_doclet);

    }

    return _doclets;
}


/**
 * Retrieves all doclet nodes between two nodes.
 *
 * @param startNode
 * Start node that comes before doclets.
 *
 * @param endNode
 * End node that comes after doclets.
 *
 * @return
 * Array of doclet nodes.
 */
function getDocletsBetween (
    startNode: TS.Node,
    endNode: TS.Node
): Array<ReturnType<typeof TS.getJSDocCommentsAndTags>> {
    const doclets: Array<ReturnType<typeof TS.getJSDocCommentsAndTags>> = [];
    const end = endNode.getStart();
    const start = (
        startNode === endNode ?
            startNode.getFullStart() :
            startNode.getEnd()
    );
    const sourceFile = startNode.getSourceFile();
    const snippets = Array.from(
        sourceFile
            .getFullText()
            .substring(start, end)
            .matchAll(DOCLET)
    );

    if (snippets.length) {
        // Restore original position range in snap
        let lastIndex = 0;
        let snap = ''.padEnd(start, ' ');

        for (const snippet of snippets) {
            snap += (
                '\n\'' + ''.padEnd(snippet.index - lastIndex - 5, '_') +
                '\';\n' + snippet
            );
            lastIndex = snippet.index;
        }

        let parts: ReturnType<typeof TS.getJSDocCommentsAndTags>;

        TS.forEachChild(
            TS.createSourceFile(
                sourceFile.fileName,
                snap + '\n\'\';\n',
                TS.ScriptTarget.Latest,
                true
            ),
            node => {
                parts = TS.getJSDocCommentsAndTags(node);
                if (parts.length) {
                    doclets.push(parts);
                }
            }
        );
    }

    return doclets;
}


/**
 * Retrieves export information from the given node.
 *
 * @param node
 * Node that might be an export.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Export information or `undefined`.
 */
function getExportInfo (
    node: TS.Node,
    includeNodes?: boolean
): (ExportInfo|undefined) {

    if (!TS.isExportAssignment(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Export',
        value: getInfoValue(node.expression, includeNodes)
    } as ExportInfo;

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves function call info from the given node.
 *
 * @param node
 * Node that might be a function call.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Function call information or `undefined`.
 */
function getFunctionCallInfo (
    node: TS.Node,
    includeNodes?: boolean
): (FunctionCallInfo|undefined) {

    if (!TS.isCallExpression(node)) {
        return void 0;
    }

    const _info = {
        kind: 'FunctionCall',
        name: ''
    } as FunctionCallInfo;

    if (TS.isIdentifier(node.expression)) {
        _info.name = node.expression.text;
    }

    if (node.arguments) {
        const _arguments: Array<Value> = _info.arguments = [];

        let _valueInfo: (Value|undefined);

        for (const _child of node.arguments) {
            _valueInfo = getInfoValue(_child);

            if (_valueInfo) {
                _arguments.push(_valueInfo);
            }
        }

        if (!_arguments.length) {
            delete _info.arguments;
        }
    }

    if (node.typeArguments) {
        const _genericArguments: Array<string> = _info.genericArguments = [];

        for (const _child of node.typeArguments) {
            _genericArguments.push(...(getInfoType(_child) || []));
        }

        if (!_genericArguments.length) {
            delete _info.genericArguments;
        }
    }

    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves function information from the given node.
 *
 * @param node
 * Node that might be an import.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Function information or `undefined`.
 */
function getFunctionInfo (
    node: TS.Node,
    includeNodes?: boolean
): (FunctionInfo|undefined) {

    if (
        !TS.isConstructorDeclaration(node) &&
        !TS.isFunctionDeclaration(node) &&
        !TS.isMethodDeclaration(node)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'Function',
        name: (
            TS.isConstructorDeclaration(node) ?
                'constructor' :
                (node.name?.getText() || '')
        )
    } as FunctionInfo;

    if (node.typeParameters) {
        const _generics: Array<TypeAliasInfo> = _info.generics = [];

        let _typeAlias: (TypeAliasInfo|undefined);

        for (const _typeParameter of node.typeParameters) {
            _typeAlias = getTypeAliasInfo(_typeParameter, includeNodes);

            if (_typeAlias) {
                _generics.push(_typeAlias);
            }
        }

        if (!_generics.length) {
            delete _info.generics;
        }
    }

    if (node.parameters) {
        const _parameters: Array<VariableInfo> = _info.parameters = [];

        let _variableInfo: (VariableInfo|undefined);

        for (const parameter of node.parameters) {
            _variableInfo = getVariableInfo(parameter, includeNodes);

            if (_variableInfo) {
                _parameters.push(_variableInfo);
            }
        }

        if (!_parameters.length) {
            delete _info.parameters;
        }
    }

    const _type = node.type || TS.getJSDocReturnType(node);

    if (_type) {
        _info.return = getInfoType(_type);
    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    const firstToken = node.body?.getFirstToken()

    if (firstToken) {
        const _bodyDoclets = getDocletInfosBetween(
            firstToken,
            node.body?.getLastToken() || firstToken
        );

        if (_bodyDoclets && _bodyDoclets.length) {
            _info.body = _bodyDoclets;
        }

    }

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves import information from the given node.
 *
 * @param node
 * Node that might be an import.
 *
 * @param includeNode
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Import information or `undefined`.
 */
function getImportInfo (
    node: TS.Node,
    includeNode?: boolean
): (ImportInfo|undefined) {

    if (!TS.isImportDeclaration(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Import'
    } as ImportInfo;

    _info.from = sanitizeText(node.moduleSpecifier.getText());

    if (node.importClause) {
        const _imports: Record<string, string> = _info.imports = {};

        let propertyName: string;

        for (const clause of getNodesChildren(node.importClause)) {
            if (TS.isIdentifier(clause)) {
                _imports.default = clause.text;
            }
            if (TS.isNamedImports(clause)) {
                for (const child of getNodesChildren(clause)) {
                    if (TS.isImportSpecifier(child)) {
                        propertyName = (
                            child.propertyName &&
                            child.propertyName.text ||
                            child.name.text
                        );
                        _imports[propertyName] = child.name.text;
                    }
                }
            }
        }

    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNode) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves type information for a given node.
 *
 * @param node
 * Node to return type information for.
 *
 * @return
 * Type information for the given node.
 */
function getInfoType (
    node: (TS.Expression|TS.TypeNode|undefined)
): (Array<string>|undefined) {
    let _infoType: Array<string> = [];

    if (node) {
        if (TS.isParenthesizedTypeNode(node)) {
            return getInfoType(node.type);
        }
        if (TS.isExpression(node)) {
            const _nodeValue = getInfoValue(node);
            if (!_nodeValue || typeof _nodeValue !== 'object') {
                _infoType.push(typeof _nodeValue);
            } else if (_nodeValue.kind === 'Reference') {
                _infoType.push(_nodeValue.name);
            } else {
                _infoType.push(
                    _nodeValue.kind.replace('FunctionCall', 'Function')
                );
            }
        } else if (TS.isUnionTypeNode(node)) {
            for (const _nodeType of node.types) {
                _infoType.push(...(getInfoType(_nodeType) || []));
            }
        } else {
            _infoType.push(sanitizeType(node.getText()));
        }
    }

    _infoType = _infoType.filter(_type => _type !== 'void');

    if (_infoType.length) {
        return _infoType;
    }

    return void 0;
}


/**
 * Retrieves value information for a given expression.
 *
 * @param node
 * Expression to return a value for.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Value or `undefined`.
 */
function getInfoValue (
    node: TS.Expression,
    includeNodes?: boolean
): (Value|undefined) {
    let _value: (Value|undefined) = (
        getArrayInfo(node, includeNodes) ||
        getFunctionCallInfo(node, includeNodes) ||
        getFunctionInfo(node, includeNodes) ||
        getReferenceInfo(node, includeNodes) ||
        getVariableInfo(node, includeNodes)?.value
    );

    if (typeof _value === 'undefined') {
        const _deconstructInfo = getDeconstructInfos(node, includeNodes);

        if (_deconstructInfo) {
            _value = _deconstructInfo.from;
        }
    }

    if (_value && typeof _value === 'object') {
        const _doclets = getDocletInfosBetween(node, node, includeNodes);

        if (_doclets.length) {
            _value.doclet = _doclets.pop();
        }

        return _value;
    }

    _value = node.getText();

    if (sanitizeText(_value) !== _value) {
        return sanitizeText(_value);
    }

    if (!isNaN(Number(_value))) {
        return Number(_value);
    }

    return {
        false: false,
        null: null,
        true: true
    }[_value] || _value;
}


/**
 * Retrieves interface information from the given node.
 *
 * @param node
 * Node that might be an interface.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Interface or `undefined`.
 */
function getInterfaceInfo (
    node: TS.Node,
    includeNodes?: boolean
): (InterfaceInfo|undefined) {

    if (!TS.isInterfaceDeclaration(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Interface'
    } as InterfaceInfo;

    _info.name = node.name.text;

    if (node.typeParameters) {
        addChildInfos(
            _info.generics = [],
            Array.from(node.typeParameters),
            includeNodes
        );
    }

    if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
            if (clause.token === TS.SyntaxKind.ExtendsKeyword) {
                _info.implements = clause.types.map(t => t.getText());
            } else {
                _info.implements = clause.types.map(t => t.getText());
            }
        }
    }

    addChildInfos(_info.members = [], Array.from(node.members), includeNodes);
    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves namespace and module information from the given node.
 *
 * @param node
 * Node that might be a namespace or module.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Namespace, module or `undefined`.
 */
function getNamespaceInfo (
    node: TS.Node,
    includeNodes?: boolean
): (NamespaceInfo|undefined) {

    if (!TS.isModuleDeclaration(node)) {
        return void 0;
    }

    const _info = {
        kind: (
            node
                .getChildren()
                .some(token => token.kind === TS.SyntaxKind.ModuleKeyword) ?
                'Module' :
                'Namespace'
        ),
        name: node.name.text
    } as NamespaceInfo;

    addChildInfos(
        _info.members = [],
        node.body && getNodesChildren(node.body) || [],
        includeNodes
    );
    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves all logical children and skips statement tokens.
 *
 * @param node
 * Node to retrieve logical children from.
 *
 * @return
 * Array of logical children.
 */
function getNodesChildren (
    node: TS.Node
): Array<TS.Node> {
    const children: Array<TS.Node> = [];

    TS.forEachChild(node, child => {
        children.push(child);
    });

    return children;
}


/**
 * [TS] Retrieve the first logical child of a node.
 *
 * @param node
 * Node to retrieve the first logical child from.
 *
 * @return
 * First logical child, if found.
 */
export function getNodesFirstChild (
    node: TS.Node
): (TS.Node|undefined) {
    return getNodesChildren(node).shift();
}


/**
 * [TS] Retrieve the last logical child of a node.
 *
 * @param node
 * Node to retrieve the last logical child from.
 *
 * @return
 * Last logical child, if found.
 */
export function getNodesLastChild (
    node: TS.Node
): (TS.Node|undefined) {
    return getNodesChildren(node).pop();
}


/**
 * Retrieves object information from the current node.
 *
 * @param node
 * Node that might be an object literal.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Object information or `undefined`.
 */
function getObjectInfo (
    node: TS.Node,
    includeNodes?: boolean
): (ObjectInfo|undefined) {
    let _type: (Array<string>|undefined);

    if (TS.isAsExpression(node)) {
        _type = getInfoType(node.type);
        node = node.expression;
    }

    if (!TS.isObjectLiteralExpression(node)) {
        return void 0;
    }

    const _info = {
        kind: 'Object'
    } as ObjectInfo;

    _type = (_type || getInfoType(TS.getJSDocType(node)));

    if (typeof _type !== 'object') {
        _info.type = _type;
    }

    addChildInfos(
        _info.members = [],
        Array.from(node.properties),
        includeNodes
    );
    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves property information from the current node.
 *
 * @param node
 * Node that might be a property.
 *
 * @param includeNode
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Property information or `undefined`.
 */
function getPropertyInfo (
    node: TS.Node,
    includeNode?: boolean
): (PropertyInfo|undefined) {

    if (
        !TS.isPropertyAssignment(node) &&
        !TS.isPropertyDeclaration(node) &&
        !TS.isPropertySignature(node) &&
        !TS.isShorthandPropertyAssignment(node)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'Property'
    } as PropertyInfo;

    _info.name = node.name.getText();

    if (
        !TS.isPropertyAssignment(node) &&
        !TS.isShorthandPropertyAssignment(node)
    ) {
        _info.type = (
            getInfoType(node.type) ||
            getInfoType(TS.getJSDocType(node))
        );
    }

    if (!TS.isPropertySignature(node)) {
        const _initializer = (
            TS.isShorthandPropertyAssignment(node) ?
                node.objectAssignmentInitializer :
                node.initializer
        );

        if (_initializer) {
            _info.value = getInfoValue(_initializer);
        }
    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNode) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves reference information from the current node.
 *
 * @param node
 * Node that might be a reference like an intendifier.
 *
 * @param includeNodes
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Reference information or `undefined`.
 */
function getReferenceInfo (
    node: TS.Node,
    includeNodes?: boolean
): (ReferenceInfo|undefined) {

    if (
        !TS.isIdentifier(node) &&
        !TS.isParameter(node) &&
        !TS.isPropertyAccessExpression(node)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'Reference',
        name: (
            TS.isParameter(node) ?
                node.name.getText() :
                node.getText()
        )
    } as ReferenceInfo;

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves source information from the given file source.
 *
 * @param filePath
 * Path to source file.
 *
 * @param sourceText
 * Text of source file.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Source information.
 */
export function getSourceInfo (
    filePath: string,
    sourceText?: string,
    includeNodes?: boolean
): SourceInfo {
    let _info = getSourceInfoFromCache(filePath, includeNodes);

    if (!sourceText) {
        if (_info) {
            return _info;
        }
        sourceText = FS.readFileSync(filePath, 'utf8');
    }

    const _cacheKey = `${filePath}:${!!includeNodes}`;
    const _sourceFile = TS.createSourceFile(
        filePath,
        sourceText,
        TS.ScriptTarget.Latest,
        true
    );

    _info = {
        kind: 'Source',
        path: filePath,
        code: []
    } as SourceInfo;

    addChildInfos(_info.code, getNodesChildren(_sourceFile), includeNodes);
    addInfoScopes(_info, _info.code);

    SOURCE_CACHE[_cacheKey] = _info;

    return _info;
}


/**
 * Retrieves source information from the source cache.
 *
 * @param filePath
 * Path to source file.
 *
 * @param includeNodes
 * Whether to include the TypeScript nodes in the information.
 *
 * @return
 * Source information.
 */
function getSourceInfoFromCache (
    filePath: string,
    includeNodes?: boolean
): (SourceInfo|undefined) {
    return SOURCE_CACHE[`${filePath}:${!!includeNodes}`];
}


/**
 * Retrieves type alias information from the given node.
 *
 * @param node
 * Node that might be a type alias.
 *
 * @param includeNodes
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Type alias information or `undefined`.
 */
function getTypeAliasInfo (
    node: TS.Node,
    includeNodes?: boolean
): (TypeAliasInfo|undefined) {

    if (
        !TS.isTypeAliasDeclaration(node) &&
        !TS.isTypeParameterDeclaration(node)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'TypeAlias',
        name: node.name.text
    } as TypeAliasInfo;

    if (TS.isTypeParameterDeclaration(node)) {
        if (node.constraint) {
            _info.value = getInfoType(node.constraint);
        }
        if (node.default) {
            _info.value = _info.value || [];
            _info.value = getInfoType(node.default);
        }
    } else {
        _info.value = (
            getInfoType(node.type) ||
            getInfoType(TS.getJSDocType(node))
        );
        if (node.typeParameters) {
            const _generics: Array<TypeAliasInfo> = [];

            let _typeAliasInfo: (TypeAliasInfo|undefined);

            for (const parameter of node.typeParameters) {
                _typeAliasInfo = getTypeAliasInfo(parameter);
                if (_typeAliasInfo) {
                    _generics.push(_typeAliasInfo);
                }
            }

            if (_generics.length) {
                _info.generics = _generics;
            }
        }

    }

    addInfoFlags(_info, node);
    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Retrieves variable information from the given node.
 *
 * @param node
 * Node that might be a variable or assignment.
 *
 * @param includeNodes
 * Whether to include the TypeScript node in the information.
 *
 * @return
 * Variable information or `undefined`.
 */
function getVariableInfo (
    node: TS.Node,
    includeNodes?: boolean
): (VariableInfo|undefined) {

    if (
        !TS.isVariableDeclaration(node) ||
        TS.isArrayBindingPattern(node.name) || // See getDeconstructInfo
        TS.isObjectBindingPattern(node.name)
    ) {
        return void 0;
    }

    const _info = {
        kind: 'Variable',
        name: node.name.text
    } as VariableInfo;

    _info.type = (
        getInfoType(node.type) ||
        getInfoType(TS.getJSDocType(node))
    );

    if (node.initializer) {
        _info.type = (
            _info.type ||
            getInfoType(node.initializer)
        );
        _info.value = getInfoValue(node.initializer, includeNodes);
    }

    if (TS.isVariableDeclarationList(node.parent)) {
        addInfoFlags(_info, node.parent.parent);
    } else {
        addInfoFlags(_info, node);
    }

    addInfoMeta(_info, node);

    if (includeNodes) {
        _info.node = node;
    }

    return _info;
}


/**
 * Tests if a text string starts with upper case.
 *
 * @param text
 * Text string to test.
 *
 * @return
 * `true`, if text string starts with upper case.
 */
function isCapitalCase (
    text: string
): boolean {
    const firstChar = `${text}`.charAt(0);

    return (firstChar === firstChar.toUpperCase());
}


/**
 * Tests if a type is integrated into TypeScript.
 *
 * @param typeString
 * Type to test.
 *
 * @return
 * `true`, if type is integrated into TypeScript.
 */
export function isNativeType (
    typeString: string
): boolean {
    return (
        typeString.length < 2 ||
        !isCapitalCase(typeString) ||
        NATIVE_TYPES.includes(typeString) ||
        !!typeString.match(NATIVE_HELPER) ||
        !!TS.SyntaxKind[typeString as keyof typeof TS.SyntaxKind]
    );
}


/**
 * Tests whether a doclet tag is related to one or more products. The test will
 * also succeed, if no product information was provided or could be found.
 *
 * @param docletOrTagLine
 * Doclet information or tag line to test.
 *
 * @param products
 * Products to test against.
 *
 * @return
 * `true` if related to one or more products, otherwise `false`.
 */
function isProductRelated (
    docletOrTagLine: (string|DocletInfo|undefined),
    products: Array<string> = PRODUCTS
): boolean {
    const productsToTest: Array<string> = [];

    if (
        !docletOrTagLine ||
        !products.length
    ) {
        return true;
    }

    /**
     * Adds any discovered product to the `productsToTest` array.
     *
     * @param tagLine
     * Line to extract product from.
     */
    function addProductsToTest (tagLine: string) {
        const inset = extractTagInset(tagLine);

        if (inset) {
            productsToTest.push(...inset.split(/[^\w\-]+/gu));
        }

    }

    if (typeof docletOrTagLine === 'string') {

        addProductsToTest(docletOrTagLine);

    } else {
        const productTagLine = extractTagText(docletOrTagLine, 'product', true);

        if (productTagLine) {
            return isProductRelated(`{${productTagLine}}`, products);
        }

        const tags = docletOrTagLine.tags;

        for (const tag of Object.keys(tags)) {

            if (
                tag === 'param' ||
                tag === 'type'
            ) {
                continue;
            }

            for (const tagLine of tags[tag]) {
                addProductsToTest(tagLine);
            }

        }

    }

    if (!productsToTest.length) {
        return true;
    }

    for (const product of productsToTest) {
        if (products.includes(product)) {
            return true;
        }
    }

    return false;
}


/**
 * Merge code information.
 *
 * @param targetInfo
 * Target information to merge into.
 *
 * @param sourceInfo
 * Source information to merge.
 *
 * @return
 * Target infos as reference.
 */
function mergeCodeInfos<T extends (CodeInfo|SourceInfo)> (
    targetInfo: T,
    sourceInfo: (CodeInfo|SourceInfo)
): T {
    let _sourceMembers: Array<CodeInfo>;
    let _targetMembers: Array<CodeInfo>;

    switch (targetInfo.kind) {
        default:
            return targetInfo;
        case 'Class':
        case 'Interface':
        case 'Namespace':
        case 'Object':
            _targetMembers = targetInfo.members;
            break;
        case 'Source':
            _targetMembers = targetInfo.code;
            break;
    }

    switch (sourceInfo.kind) {
        default:
            return targetInfo;
        case 'Class':
        case 'Interface':
        case 'Module':
        case 'Namespace':
        case 'Object':
            _sourceMembers = sourceInfo.members;
            break;
        case 'Source':
            _sourceMembers = sourceInfo.code;
            break;
    }

    if (
        targetInfo.kind !== sourceInfo.kind &&
        (
            targetInfo.kind !== 'Source' ||
            sourceInfo.kind !== 'Module'
        )
    ) {
        return targetInfo;
    }

    let _merged: boolean;
    let _mergedMember: CodeInfo;
    let _name: (string|undefined);

    for (const _sourceMember of _sourceMembers) {

        _merged = false;
        _name = extractInfoName(_sourceMember);

        if (!_name) {
            continue;
        }

        for (
            const _targetMember
            of (extractInfos(_targetMembers, _name) || [])
        ) {
            if (_targetMember.kind !== _sourceMember.kind) {
                continue;
            }
            switch (_sourceMember.kind) {
                default:
                    continue;
                case 'Class':
                case 'Interface':
                case 'Namespace':
                case 'Object':
                    mergeCodeInfos(_targetMember, _sourceMember);
                    break;
                case 'Doclet':
                    if (_targetMember.kind !== 'Doclet') {
                        continue;
                    }
                    mergeDocletInfos(
                        _targetMember,
                        _sourceMember
                    );
                    break;
                case 'Function':
                    _mergedMember = newCodeInfo(_sourceMember);
                    _mergedMember.meta.merged = true;
                    _targetMembers.push(_mergedMember);
                    addInfoScopes(_targetMember, [_mergedMember]);
                    break;
                case 'Property':
                    if (_targetMember.kind !== 'Property') {
                        continue;
                    }
                    if (_sourceMember.doclet) {
                        if (_targetMember.doclet) {
                            mergeDocletInfos(
                                _targetMember.doclet,
                                _sourceMember.doclet
                            );
                        } else {
                            _mergedMember =
                                newDocletInfo(_sourceMember.doclet);
                            _mergedMember.meta.merged = true;
                            _targetMember.doclet = _mergedMember;
                        }
                    }
                    if (
                        _targetMember.type ||
                        _sourceMember.type
                    ) {
                        _targetMember.type = Array.from(new Set([
                            ...(_targetMember.type || []),
                            ...(_sourceMember.type || [])
                        ]));
                    }
                    if (
                        _targetMember.value &&
                        typeof _targetMember.value === 'object' &&
                        _sourceMember.value &&
                        typeof _sourceMember.value === 'object'
                    ) {
                        mergeCodeInfos(
                            _targetMember,
                            _sourceMember
                        );
                    }
                    break;
            }
            _merged = true;
        }

        if (!_merged) {
            _mergedMember = newCodeInfo(_sourceMember as Partial<ArrayInfo>);
            _mergedMember.meta.merged = true;
            _targetMembers.push(_mergedMember);
            addInfoScopes(targetInfo, [_mergedMember]);
        }

    }

    return targetInfo;
}


/**
 * Merge multiple DocletInfo objects into the first.
 *
 * @param targetDoclet
 * Doclet information to add to.
 *
 * @param sourceDoclets
 * Doclet informations to add.
 *
 * @return
 * First DocletObject as reference.
 */
function mergeDocletInfos (
    targetDoclet?: DocletInfo,
    ...sourceDoclets: Array<DocletInfo>
): DocletInfo {
    targetDoclet = targetDoclet || newDocletInfo();

    const targetTags = targetDoclet.tags;

    let productTagLine: (string|undefined);
    let sourceTags: Record<string,Array<string>>;
    let targetTag: Array<string>;

    for (const sourceDoclet of sourceDoclets) {
        productTagLine = extractTagText(sourceDoclet, 'product', true);

        if (
            productTagLine &&
            !isProductRelated(`{${productTagLine}}`)
        ) {
            continue;
        }

        sourceTags = sourceDoclet.tags;

        for (const tag of Object.keys(sourceTags)) {
            targetTag = targetTags[tag] = targetTags[tag] || [];
            for (const value of sourceTags[tag]) {
                if (
                    !targetTag.includes(value) &&
                    isProductRelated(value)
                ) {
                    targetTag.push(value);
                }
            }
        }
    }

    targetDoclet.meta.merged = true;

    return targetDoclet;
}


/**
 * Creates a new code or source information object.
 *
 * @param template
 * Information to apply.
 *
 * @return
 * New information.
 */
function newCodeInfo<T> (
    template?: Partial<T>
): T {
    const clone = {
        kind: 'Object',
        meta: newMeta(),
        ...structuredClone({
            ...template,
            node: void 0 // Avoid clone of native TSNode.
        })
    } as T;

    delete (clone as Record<string, unknown>).node; // Clean-up

    return clone;
}


/**
 * Creates a new DocletInfo object.
 *
 * @param template
 * Doclet information to apply.
 *
 * @return
 * The new doclet information.
 */
export function newDocletInfo (
    template: Partial<DocletInfo> = {}
): DocletInfo {
    const clone: DocletInfo = {
        kind: 'Doclet',
        tags: {},
        meta: newMeta(),
        ...structuredClone({
            ...template,
            node: void 0 // Avoid clone of native TSNode.
        })
    };

    delete clone.node; // Clean-up

    return clone;
}


/**
 * Creates a new Meta object.
 *
 * @param template
 * Meta to apply.
 *
 * @return
 * New meta.
 */
function newMeta (
    template: Partial<Meta> = {}
): Meta {
    return {
        begin: 0,
        end: 0,
        file: '',
        overhead: 0,
        syntax: 0,
        ...structuredClone(template)
    };
}


/**
 * Removes all doclets from source code.
 *
 * @param sourceCode
 * Source code to remove doclets from.
 *
 * @return
 * Source code without doclets.
 */
export function removeAllDoclets (
    sourceCode: string
): string {
    return sourceCode
        .replace(/\n *\/\*\*.*?\*\//gsu, '')
        .replace(/\n(\(?)''\1;[^\n]*/gsu, '')
        .replace(/\n\s+\n/gsu, '\n\n');
}


/**
 * Removes a tag from a DocletInfo object.
 *
 * @param doclet
 * Doclet information to modify.
 *
 * @param tag
 * Tag to remove.
 *
 * @return
 * Removed tag text.
 */
export function removeTag (
    doclet: DocletInfo,
    tag: string
): Array<string> {
    const tags = doclet.tags;

    if (tags) {
        const text = tags[tag];

        delete tags[tag];

        return text;
    }

    return [];
}


/**
 * Resets the products array and source cache for a new session.
 */
export function reset (): void {

    PRODUCTS.length = 0;

    for (const key of Object.keys(SOURCE_CACHE)) {
        delete SOURCE_CACHE[key];
    }

}


/**
 * Resolves a reference relative to the given information.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param reference
 * Reference name or information to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
export function resolveReference (
    scopeInfo: (CodeInfo|SourceInfo),
    reference: (string|ReferenceInfo)
): (CodeInfo|undefined) {
    const _sourceInfo = (
        scopeInfo.kind === 'Source' ?
            scopeInfo :
            getSourceInfo(scopeInfo.meta.file)
    );

    let _hasThis = false;
    let _referenceName = (
        typeof reference === 'string' ?
            reference :
            reference.name
    );

    const _referenceSplit = _referenceName.split(/\W+/gsu);

    if (_referenceSplit.indexOf('this') === 0) {
        _hasThis = true;
        _referenceName = _referenceName.substring(5);
        _referenceSplit.shift();
    }

    let _resolvedInfo: (CodeInfo|undefined);
    let _scopePath = extractInfoScopePath(scopeInfo);

    // First search in inner scopes.
    while (_scopePath) {

        _resolvedInfo = resolveReferenceInChildInfos(
            _sourceInfo,
            _sourceInfo.code,
            (
                _referenceName ?
                    `${_scopePath}.${_referenceName}` :
                    _scopePath
            )
        );

        if (_resolvedInfo) {
            return _resolvedInfo;
        }

        _scopePath = _scopePath.substring(0, _scopePath.lastIndexOf('.'));

    }

    // Did not found this in inner scopes.
    if (_hasThis) {
        return void 0;
    }

    // Search in source scope.
    return resolveReferenceInChildInfos(
        _sourceInfo,
        _sourceInfo.code,
        _referenceName
    );
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param childInfos
 * Child informations to use.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInChildInfos (
    scopeInfo: (NamespaceInfo|SourceInfo),
    childInfos: Array<CodeInfo>,
    referenceName: string
): (CodeInfo|undefined) {
    const _referenceSplit = referenceName.split(/\W+/gsu);
    const _referenceCurrent = _referenceSplit.shift();
    const _referenceNext = _referenceSplit.join('.');

    let _resolvedInfo: (CodeInfo|undefined);
    let _sourceInfo: (SourceInfo|undefined);

    for (const _childInfo of childInfos) {
        switch (_childInfo.kind) {

            case 'Class':
            case 'Interface':
            case 'Namespace':
                if (extractInfoName(_childInfo) === _referenceCurrent) {
                    if (_referenceNext) {
                        _resolvedInfo = resolveReferenceInChildInfos(
                            (
                                _childInfo.kind === 'Namespace' ?
                                    _childInfo :
                                    scopeInfo
                            ),
                            _childInfo.members,
                            _referenceNext
                        );
                        if (_resolvedInfo) {
                            return _resolvedInfo;
                        }
                    } else {
                        return _childInfo;
                    }
                }
                continue;

            case 'Deconstruct':
                _resolvedInfo = resolveReferenceInDeconstructInfo(
                    scopeInfo,
                    _childInfo,
                    referenceName
                );
                if (_resolvedInfo) {
                    return _resolvedInfo;
                }
                continue;

            case 'Export':
                _resolvedInfo = resolveReferenceInExportInfo(
                    scopeInfo,
                    _childInfo,
                    referenceName
                );
                if (_resolvedInfo) {
                    return _resolvedInfo;
                }
                continue;

            case 'Import':
                _resolvedInfo =
                    resolveReferenceInImportInfo(_childInfo, referenceName);
                if (_resolvedInfo) {
                    return _resolvedInfo;
                }
                continue;

            case 'Module':
                continue;

            case 'Property':
            case 'Variable':
                if (extractInfoName(_childInfo) === _referenceCurrent) {
                    if (!_referenceNext) {
                        return _childInfo;
                    }
                    if (_childInfo.value && typeof _childInfo.value === 'object') {
                        return resolveReferenceInChildInfos(
                            scopeInfo,
                            [_childInfo.value],
                            _referenceNext
                        );
                    }
                }
                continue;

            case 'Reference':
                if (scopeInfo.kind === 'Source') {
                    if (_childInfo.meta.file !== scopeInfo.path) {
                        // Search in original file
                        _sourceInfo = getSourceInfo(
                            _childInfo.meta.file,
                            void 0,
                            !!_childInfo.node
                        );
                        if (_sourceInfo) {
                            _resolvedInfo =
                                resolveReference(_sourceInfo, _childInfo.name);
                            if (_resolvedInfo) {
                                return _resolvedInfo;
                            }
                        }
                    }
                    // Search in source scope
                    if (scopeInfo.kind === 'Source') {
                        _resolvedInfo = resolveReference(scopeInfo, _childInfo);
                        if (_resolvedInfo) {
                            return _resolvedInfo;
                        }
                    }
                } else {
                    // Search in original file
                    if (_childInfo.meta.file !== scopeInfo.meta.file) {
                        _resolvedInfo = resolveReference(
                            getSourceInfo(
                                _childInfo.meta.file,
                                void 0,
                                !!_childInfo.node
                            ),
                            _childInfo.name
                        );
                        if (_resolvedInfo) {
                            return _resolvedInfo;
                        }
                    }
                    // Search in namespace
                    _resolvedInfo = resolveReferenceInChildInfos(
                        scopeInfo,
                        scopeInfo.members,
                        _childInfo.name
                    );
                    if (_resolvedInfo) {
                        return _resolvedInfo;
                    }
                    // Search in outer scope of namespace
                    _sourceInfo = getSourceInfo(
                        scopeInfo.meta.file,
                        void 0,
                        !!scopeInfo.node
                    );
                    if (_sourceInfo) {
                        _resolvedInfo = resolveReferenceInChildInfos(
                            _sourceInfo,
                            _sourceInfo.code,
                            _childInfo.name
                        );
                        if (_resolvedInfo) {
                            return _resolvedInfo;
                        }
                    }
                }
                continue;

            case 'Object':
                _resolvedInfo = resolveReferenceInObjectInfo(
                    scopeInfo,
                    _childInfo,
                    referenceName
                );
                if (_resolvedInfo) {
                    return _resolvedInfo;
                }
                continue;

            case 'TypeAlias':
                if (extractInfoName(_childInfo) === _referenceCurrent) {
                    _resolvedInfo = resolveReferenceInType(
                        scopeInfo,
                        (_childInfo.value || []),
                        _referenceNext
                    );
                    if (_resolvedInfo) {
                        return _resolvedInfo;
                    }
                }
                continue;

            default:
                if (extractInfoName(_childInfo) === referenceName) {
                    return _childInfo;
                }
                continue;

        }
    }

    return void 0;
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param deconstructInfo
 * Deconstruct information to use.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInDeconstructInfo (
    scopeInfo: (NamespaceInfo|SourceInfo),
    deconstructInfo: DeconstructInfo,
    referenceName: string
): (CodeInfo|undefined) {
    const _deconstructs = deconstructInfo.deconstructs;
    const _referenceSplit = referenceName.split(/\W+/gsu);
    const _referenceCurrent = _referenceSplit.shift();
    const _referenceNext = _referenceSplit.join('.');

    let _found: (string|undefined);

    for (const _original of Object.keys(_deconstructs || [])) {
        if (_deconstructs[_original] === _referenceCurrent) {
            _found = _original;
            break;
        }
    }

    if (_found) {

        if (_referenceNext) {
            return resolveReferenceInChildInfos(
                scopeInfo,
                (
                    scopeInfo.kind === 'Source' ?
                        scopeInfo.code :
                        scopeInfo.members
                ),
                (
                    deconstructInfo.from ?
                        `${_found}.${_referenceNext}` :
                        _found
                )
            );
        }

    }

    return void 0;
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param exportInfo
 * Export information to use.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInExportInfo (
    scopeInfo: (NamespaceInfo|SourceInfo),
    exportInfo: ExportInfo,
    referenceName: string
): (CodeInfo|undefined) {
    const _referenceSplit = referenceName.split(/\W+/gsu);
    const _referenceCurrent = _referenceSplit.shift();
    const _referenceNext = _referenceSplit.join('.');

    if (
        _referenceCurrent !== 'default' ||
        !exportInfo.flags ||
        !exportInfo.flags.includes('default')
    ) {
        return void 0;
    }

    const _exportValue = exportInfo.value;

    if (
        !_exportValue ||
        typeof _exportValue !== 'object'
    ) {
        return exportInfo;
    }

    if (_exportValue.kind === 'Reference') {
        return resolveReferenceInChildInfos(
            scopeInfo,
            (
                scopeInfo.kind === 'Source' ?
                    scopeInfo.code :
                    scopeInfo.members
            ),
            (
                _referenceNext ?
                    `${_exportValue.name}.${_referenceNext}` :
                    _exportValue.name
            )
        );
    }

    if (_referenceNext) {
        return resolveReferenceInChildInfos(
            scopeInfo,
            [_exportValue],
            _referenceNext
        );
    }

    return _exportValue;
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param importInfo
 * Import information to use.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInImportInfo (
    importInfo: ImportInfo,
    referenceName: string
): CodeInfo|undefined {
    const _referenceSplit = referenceName.split(/\W+/gsu);
    const _referenceCurrent = _referenceSplit.shift();
    const _referenceNext = _referenceSplit.join('.');

    let _found: (string|undefined);

    for (const _original of Object.keys(importInfo.imports || [])) {
        if (importInfo.imports[_original] === _referenceCurrent) {
            _found = _original;
            break;
        }
    }

    if (_found) {
        const _from = Path.join(
            Path.dirname(importInfo.meta.file),
            importInfo.from
        );

        let _sourceInfo: (SourceInfo|undefined);

        if (
            _from.match(SOURCE_EXTENSION) &&
            FS.existsSync(Path.join(_from.replace(JSX, '\.t$1'))) &&
            FS.lstatSync(Path.join(_from.replace(JSX, '\.t$1'))).isFile()
        ) {
            _sourceInfo = getSourceInfo(
                _from.replace(JSX, '\.t$1'),
                void 0,
                !!importInfo.node
            );
        } else if (
            FS.existsSync(Path.join(`${_from}.ts`)) &&
            FS.lstatSync(Path.join(`${_from}.ts`)).isFile()
        ) {
            _sourceInfo =
                getSourceInfo(`${_from}.ts`, void 0, !!importInfo.node);
        } else if (
            FS.existsSync(Path.join(`${_from}.d.ts`)) &&
            FS.lstatSync(Path.join(`${_from}.d.ts`)).isFile()
        ) {
            _sourceInfo =
                getSourceInfo(`${_from}.d.ts`, void 0, !!importInfo.node);
        } else {
            return importInfo;
        }

        return resolveReferenceInChildInfos(
            _sourceInfo,
            _sourceInfo.code,
            (_referenceNext ? `${_found}.${_referenceNext}` : _found)
        );
    }

    return void 0;
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param objectInfo
 * Object information to use.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInObjectInfo (
    scopeInfo: (NamespaceInfo|SourceInfo),
    objectInfo: ObjectInfo,
    referenceName: string
): (CodeInfo|undefined) {
    const _referenceSplit = referenceName.split(/\W+/gsu);
    const _nextReferenceName = _referenceSplit.shift();
    const _restReferenceName = _referenceSplit.join('.');

    for (const _member of objectInfo.members) {
        if (extractInfoName(_member) === _nextReferenceName) {
            if (!_restReferenceName) {
                return _member;
            }
            if (_member.kind === 'Property') {
                return resolveReferenceInChildInfos(
                    scopeInfo,
                    [_member],
                    _restReferenceName
                );
            }
        }
    }

    return void 0;
}


/**
 * Resolves a reference relative to the given informations.
 *
 * @param scopeInfo
 * Scope information to use.
 *
 * @param types
 * Type information to resolve.
 *
 * @param referenceName
 * Reference name to resolve.
 *
 * @return
 * Resolved information or `undefined`.
 */
function resolveReferenceInType (
    scopeInfo: (NamespaceInfo|SourceInfo),
    types: Array<string>,
    referenceName?: string
): (CodeInfo|undefined) {
    const _resolvedInfos: Array<CodeInfo> = [];

    let _resolvedInfo: (CodeInfo|undefined);

    for (const _type of extractTypes(types)) {

        _resolvedInfo = resolveReference(
            scopeInfo,
            (referenceName ? `${_type}.${referenceName}` : _type)
        );

        if (_resolvedInfo) {
            _resolvedInfos.push(_resolvedInfo);
        }

    }

    if (_resolvedInfos.length > 1) {
        return {
            kind: 'Array',
            meta: newMeta(scopeInfo.kind === 'Source' ? void 0 : scopeInfo.meta),
            value: _resolvedInfos.slice() as Array<Value>
        };
    }

    return _resolvedInfos[0];
}


/**
 * Sanitize source path from file extensions.
 *
 * @param sourcePath
 * Source path to sanitize.
 *
 * @return
 * Sanitized source path.
 */
function sanitizeSourcePath (
    sourcePath: string
): string {
    return sourcePath.replace(SOURCE_EXTENSION, '');
}


/**
 * Sanitize text from surrounding quote characters.
 *
 * @param text
 * Text to sanitize.
 *
 * @return
 * Sanitized text.
 */
function sanitizeText (
    text: string
): string {
    return ('' + text).replace(SANITIZE_TEXT, '$2');
}


/**
 * Sanitize type from surrounding paranthesis characters.
 *
 * @param type
 * Type to sanitize.
 *
 * @return
 * Sanitized type.
 */
function sanitizeType (
    type: string
): string {
    type = trimBetween(`${type}`, true);

    if (type.includes('=>')) {
        return type.trim();
    }

    return type.replace(new RegExp(SANITIZE_TYPE.source, 'gu'), '$1').trim();
}


/**
 * Removes all spaces in the given text.
 *
 * @param text
 * Text to trim.
 *
 * @param keepSeparate
 * Replaces spaces with a single space character.
 *
 * @return
 * Trimmed text.
 */
function trimBetween (
    text: string,
    keepSeparate?: boolean
): string {
    return text.replace(/\s+/gsu, (keepSeparate ? ' ' : ''));
}


/**
 * Compiles doclet information into a code string.
 *
 * @see changeSourceCode
 *
 * @param doclet
 * Doclet information to compile.
 *
 * @param indent
 * Indent styling.
 *
 * @return
 * Doclet string.
 */
export function toDocletString (
    doclet: DocletInfo,
    indent: (number|string) = 0
): string {

    if (typeof indent === 'number') {
        indent = ''.padEnd(indent, ' ');
    }

    if (indent[0] !== '\n') {
        indent = '\n' + indent;
    }

    const tags = doclet.tags;
    const tagKeys = Object.keys(tags);

    let compiled = indent + '/**';

    if (
        tags.description &&
        (
            tags.description.length <= 1 ||
            tags.description[1][0] !== '{'
        )
    ) {
        compiled += (
            indent + ' * ' +
            tags.description
                .join('\n\n')
                .trim()
                .split('\n')
                .join(indent + ' * ')
        );
        tagKeys.splice(tagKeys.indexOf('description'), 1);
    }

    for (const tag of tagKeys) {
        for (const text of tags[tag]) {
            compiled += (
                indent + ' *' +
                indent + ' * @' + tag + ' ' +
                text
                    .trim()
                    .split('\n')
                    .map(line => line.trim())
                    .join(indent + ' * ' + ''.padEnd(tag.length + 2, ' '))
            );
        }
    }

    compiled = compiled
        .split('\n')
        .map(line => {
            line = line.trimEnd();
            if (line.length > 80) {
                const br = line.substring(0, 80).lastIndexOf(' ');
                if (br >= 40) {
                    return (
                        line.substring(0, br) +
                        indent + ' * ' + line.substring(br)
                    );
                }
            }
            return line;
        })
        .join('\n');

    return compiled + indent + ' */\n';
}


/* *
 *
 *  Default Export
 *
 * */


export * as default from './TS';
