interface INodeConfig {
    width: number;
    height: number;
    color: string;
}

import { DatasMgr, EStorageKey } from "store";

export default class Library {
    readonly name: string;
    readonly nodesConfig: { [type: string]: INodeConfig };
    private datasMgr: DatasMgr;

    constructor(name: string) {
        this.name = name;
        this.datasMgr = new DatasMgr();
        this.nodesConfig = this.datasMgr.load(EStorageKey.library + "." + name);
    }

    public set(type: string, config: INodeConfig) {
        this.nodesConfig[type] = config;
        this.datasMgr.save(EStorageKey.library + "." + this.name, this.nodesConfig);
    }

    public getNodeConfig(type: string): INodeConfig {
        return this.nodesConfig[type];
    }

    // permettre d'avoir une liste des configurations chargés pour switcher de l'une à l'autre quand on change
    // Voir si besoin d'un save
    // Voir si besoin d'éditer tous les nodes en même temps ...
}
