/* *
 *
 *  Creating API options documentation from TypeScript sources.
 *
 *  (c) Highsoft AS
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */


/* *
 *
 *  Imports
 *
 * */


import FS from 'node:fs';

import FSLib from '../libs/fs.js';

import GitLib from '../libs/git.js';

import LogLib from '../libs/log.js';

import TreeLib from '../libs/tree.js';

import TSLib from '../libs/TS';

import Utilities from './utilities';

import Yargs from 'yargs';


/* *
 *
 *  Declarations
 *
 * */


interface Args {
    debug?: boolean;
    root?: string;
    products?: string;
    source?: string;
}


/* *
 *
 *  Constants
 *
 * */


const DEFAULT_SOURCE = FSLib.path('ts/');


const STACK: Array<TSLib.CodeInfo> = [];


const TREE: TreeLib.Options = {};


/* *
 *
 *  Functions
 *
 * */


function addDefaultOptions(
    sourceInfo: TSLib.SourceInfo,
    debug?: boolean
): void {
    const rootNode = getTreeNode('');

    for (const _info of sourceInfo.code) {
        switch (_info.kind) {

            case 'Class':
                for (const _member of _info.members) {
                    if (
                        _member.kind === 'Property' &&
                        _member.name === 'defaultOptions'
                    ) {
                        addTreeNode(sourceInfo, rootNode, _member, debug);
                    }
                }
                break;

            case 'Doclet':
                if (_info.tags.apioption) {
                    addTreeNode(sourceInfo, rootNode, _info, debug);
                }
                break;

            case 'Export':
                if (
                    sourceInfo.path.endsWith('Defaults.ts') &&
                    typeof _info.value === 'object'
                ) {
                    addTreeNode(sourceInfo, rootNode, _info.value, debug);
                }
                break;

            case 'Namespace':
                for (const _member of _info.members) {
                    if (_member.kind === 'Class') {
                        for (const _mm of _member.members) {
                            if (
                                _mm.kind === 'Property' &&
                                _mm.name === 'defaultOptions'
                            ) {
                                addTreeNode(sourceInfo, rootNode, _mm, debug);
                            }
                        }
                    } else if (
                        _member.kind === 'Variable' &&
                        _member.name === 'defaultOptions'
                    ) {
                        addTreeNode(sourceInfo, rootNode, _member, debug);
                    }
                }
                break;

            case 'Variable':
                if (_info.name === 'defaultOptions') {
                    addTreeNode(sourceInfo, rootNode, _info, debug);
                }
                break;

        }
    }

}


function addTreeNode(
    sourceInfo: TSLib.SourceInfo,
    parentNode: TreeLib.Option,
    info: TSLib.CodeInfo,
    debug?: boolean
): void {
    const _infoDoclet = (
        info.kind === 'Doclet' ?
            info :
            info.doclet || TSLib.newDocletInfo()
    );
    const _parentName = parentNode.meta.fullname; /* (
        _parentNode.meta.fullname === 'plotOptions' ?
            'plotOptions.series' :
            _parentNode.meta.fullname
    ); */

    let _fullname: (string|undefined) = TSLib.extractInfoName(info);

    if (typeof _fullname === 'undefined') {
        return;
    }

    _fullname = Utilities.getOptionName(_fullname);

    if (_fullname.startsWith('_')) {
        return;
    }

    let _moreInfos: Array<TSLib.CodeInfo> = [];
    let _resolved: TSLib.CodeInfo;
    let _value: TSLib.Value;

    switch (info.kind) {

        default:
            break;

        case 'Interface':
            if (
                !info.doclet ||
                !info.name.endsWith('Options')
            ) {
                return;
            }
            for (const _member of info.members) {
                addTreeNode(sourceInfo, parentNode, _member, debug);
            }
            break;

        case 'Object':
            if (
                !info.doclet ||
                !info.doclet.tags.optionparent
            ) {
                return;
            }
            for (const _member of info.members) {
                addTreeNode(sourceInfo, parentNode, _member, debug);
            }
            break;

        case 'Property':
        case 'Variable':
            if (
                info.kind === 'Property' &&
                _parentName
            ) {
                _fullname = `${_parentName}.${_fullname}`;
            }
            if (info.type) {
                for (const _type of info.type) {
                    if (!_type.endsWith('Options')) {
                        continue;
                    }
                    _resolved = TSLib.resolveReference(sourceInfo, _type);
                    if (
                        _resolved &&
                        _resolved.kind === 'Interface'
                    ) {
                        _moreInfos.push(_resolved);
                    }
                }
            }
            if (
                !_infoDoclet.tags.type &&
                info.type
            ) {
                _infoDoclet.tags.type = info.type.slice();
            }
            _value = info.value;
            if (
                !_infoDoclet.tags.default &&
                !_infoDoclet.tags.defaultvalue &&
                _value
            ) {
                _infoDoclet.tags.default = [];
                if (typeof _value === 'object') {
                    switch (_value.kind) {

                        default:
                            break;

                        case 'Array':
                            _infoDoclet.tags.default
                                .push(`[${_value.value.join(',')}]`);
                            break;

                        case 'Object':
                            _infoDoclet.tags.default.push(
                                '{' + Object
                                    .entries(_value.members)
                                    .map(_entry => `${_entry[0]}:${_entry[1]}`)
                                    .join(',') + '}'
                            );
                            break;

                    }
                } else {
                   _infoDoclet.tags.default.push(`${_value}`);
                }
            }
            if (typeof _value !== 'object') {
                break;
            }
            if (_value.kind === 'FunctionCall') {
                if (
                    _value.name !== 'merge' ||
                    !_value.arguments
                ) {
                    return;
                }
                for (const _argument of _value.arguments) {
                    if (typeof _argument !== 'object') {
                        continue;
                    }
                    if (_argument.kind === 'Object') {
                        if (
                            _argument.doclet &&
                            _argument.doclet.tags.optionparent
                        ) {
                            addTreeNode(
                                sourceInfo,
                                parentNode,
                                _argument,
                                debug
                            );
                        }
                        continue;
                    }
                    if (_argument.kind === 'Reference') {
                        _resolved =
                            TSLib.resolveReference(sourceInfo, _argument);
                        if (_resolved) {
                            _moreInfos.push(_resolved);
                        }
                    }
                }
                break;
            }
            if (_value.kind === 'Object') {
                _moreInfos.push(..._value.members);
                for (const _type of (_value.type || [])) {
                    if (!_type.endsWith('Options')) {
                        continue;
                    }
                    _resolved = TSLib.resolveReference(sourceInfo, _type);
                    if (
                        _resolved &&
                        _resolved.kind !== 'Doclet'
                    ) {
                        _moreInfos.push(_resolved);
                    }
                }
                break;
            }
            break;

        case 'Reference':
            _resolved = TSLib.resolveReference(sourceInfo, info);
            if (_resolved) {
                addTreeNode(sourceInfo, parentNode, _resolved, debug);
            }
            break;

    }

    const _treeNode = getTreeNode(_fullname);
    const _nodeDoclet = _treeNode.doclet;
    const _nodeMeta = _treeNode.meta;

    let _array: Array<Record<string, (string|Array<string>)>>;
    let _split: Array<string>;

    // TODO: Use TSLib.extractTagObjects
    for (const _tag of Object.keys(_infoDoclet.tags)) {
        switch (_tag) {

            default:
                if (_infoDoclet.tags[_tag].length > 1) {
                    _nodeDoclet[_tag] =
                        _infoDoclet.tags[_tag].slice();
                } else {
                    _nodeDoclet[_tag] = _infoDoclet.tags[_tag][0];
                }
                break;

            case 'default':
            case 'defaultvalue':
                let _value: (boolean|number|string|undefined) =
                    TSLib.extractTagText(_infoDoclet, _tag, true);

                if (typeof _value !== 'undefined') {
                    if (!isNaN(Number(_value))) {
                        _value = Number(_value);
                    } else {
                        _value = {
                            false: false,
                            null: null,
                            true: true
                        }[_value] || _value;
                    }

                    _nodeDoclet.defaultvalue = _value;
                    _nodeMeta.default = _value;
                }
                break;

            case 'description':
                _nodeDoclet[_tag] =
                    TSLib.extractTagText(_infoDoclet, _tag, true);
                break;

            case 'extends':
                _nodeDoclet[_tag] =
                    TSLib.extractTagText(_infoDoclet, _tag);
                break;

            case 'productdesc':
                _array = _nodeDoclet.productdescs = [];
                for (
                    const _object
                    of TSLib.extractTagObjects(_infoDoclet, 'productdesc')
                ) {
                    if (_object.type) {
                        _array.push({
                            products: _object.type,
                            value: _object.text
                        });
                    }
                }
                break;

            case 'requires':
            case 'see':
                _nodeDoclet[_tag] = _infoDoclet.tags[_tag].slice();
                break;

            case 'sample':
                _array = _nodeDoclet[`${_tag}s`] = [];
                for (
                    const _object
                    of TSLib.extractTagObjects(_infoDoclet, 'sample')
                ) {
                    const _sample: TreeLib.OptionDocletSample = {
                        name: _object.name || _object.text,
                        value: _object.value || ''
                    };
                    if (_object.type) {
                        _sample.products = _object.type.slice();
                    }
                    _array.push(_sample);
                }
                break;

            case 'type':
                _split = TSLib.extractTypes(
                    _infoDoclet.tags.type
                        .map(_type => TSLib.extractTagInset(_type))
                        .join('|'),
                    true
                );
                if (_split) {
                    _nodeDoclet.type = {
                        names: _split.map(_type => _type
                            .replace(
                                /[\w\.]+/gsu,
                                substring => (
                                    TSLib.isNativeType(substring) ?
                                        substring :
                                        substring.startsWith('Highcharts.') ?
                                            substring :
                                            `Highcharts.${substring}`
                                )
                            )
                            .replace(
                                /^(?:Highcharts.DeepPartial|Partial)<(.*)>$/gsu,
                                '$1'
                            )
                            .replace(
                                /\bHighcharts.AnyRecord\b/gsu,
                                'Highcharts.Dictionary<*>'
                            )
                            .replace(/\bany\b/gsu, '*')
                        )
                    };
                }
                break;

        }
    }

    for (const _moreInfo of _moreInfos) {

        if (STACK.includes(_moreInfo)) { // Break recursive option trees
            continue;
        }

        STACK.push(_moreInfo);

        addTreeNode(
            TSLib.getSourceInfo(_moreInfo.meta.file, void 0, debug),
            _treeNode,
            _moreInfo
        );

        STACK.pop();

    }

}


function getTreeNode(
    fullname: string
): TreeLib.Option {
    let _currentNode: TreeLib.Option = {
        doclet: {},
        meta: {
            fullname: '',
            name: ''
        },
        children: TREE
    };

    let _fullname: string;

    for (const _name of fullname.split('.')) {

        if (!_name) {
            continue;
        }

        _fullname = (
            _currentNode.meta.fullname ?
                `${_currentNode.meta.fullname}.${_name}` :
                _name
        );

        if (!_currentNode.children) {
            _currentNode.children = {};
        }

        if (!_currentNode.children[_name]) {
            _currentNode.children[_name] = {
                doclet: {},
                meta: {
                    fullname: _fullname,
                    name: _name
                },
                children: {}
            };
        }

        _currentNode = _currentNode.children[_name];

    }

    return _currentNode;
}


async function main() {
    const args = Yargs.parseSync(process.argv) as Args;
    const debug = !!args.debug;
    const products = args.products;
    const source = args.source as (string|undefined) || DEFAULT_SOURCE;

    if (products) {
        TSLib.PRODUCTS.push(...products.split(','));
    }

    let timer: number;

    const _paths = (
        FSLib.isFile(source) ?
            [source] :
            FSLib.getFilePaths(source, true)
    );

    timer = LogLib.starting(`Loading ${source}`);
    for (const _path of _paths) {
        TSLib.getSourceInfo(_path, void 0, debug);
    }
    TSLib.autoCompleteInfos();
    LogLib.finished(`Loading ${source}`, timer);

    timer = LogLib.starting(`Building tree from ${source}`);
    for (const _path of Object.keys(TSLib.SOURCE_CACHE)) {
        addDefaultOptions(TSLib.SOURCE_CACHE[_path], debug);
    }
    LogLib.finished(`Building tree from ${source}`, timer);

    LogLib.message(`Found ${Object.keys(TREE).length} root options:`);
    LogLib.message(Object.keys(TREE).sort().join(', '));

    LogLib.warn('Saving JSON ...');
    await saveJSON();
    LogLib.success('Done');

}


async function saveJSON() {
    const save = (filePath, obj) => {
        FS.writeFileSync(
            filePath,
            TreeLib.toJSONString(TreeLib.sortJSONTree(obj), 4),
            'utf8'
        );
        LogLib.message('Saved', filePath, '.');
    };

    TREE._meta = {
        branch: await GitLib.getBranch(),
        commit: await GitLib.getLatestCommitShaSync(),
        version: JSON.parse(FS.readFileSync('package.json', 'utf8')).version
    } as any;

    save('tree-cache.json', TSLib.SOURCE_CACHE);
    // save('tree-v2.json', TREE);
    save('tree-v2.json', {
        _meta: TREE._meta,
        plotOptions: TREE.plotOptions || {
            doclet: {},
            meta: {},
            children: {}
        },
        series: TREE.series || {
            doclet: {},
            meta: {},
            children: {}
        }
    });
}


/* *
 *
 *  Runtime
 *
 * */


main();
