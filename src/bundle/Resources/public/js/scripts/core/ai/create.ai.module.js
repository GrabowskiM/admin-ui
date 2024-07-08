import * as moduleList from './module.list';

export default (moduleName) => {
    if (!moduleList[moduleName]) {
        throw new Error(`No module found for identifier "${moduleName}"`);
    }

    return moduleList[moduleName];
};
