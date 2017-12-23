export const enum EStorageKey {
    prefs = "prefs",
    library = "library",
}

export class DatasMgr {
    public save<T>(key: string, datas: T): void {
        // Mettre en place la possibilité de sauvegarder le fichier via file et blob cf truc save
        localStorage.setItem(key, JSON.stringify(datas));
    }

    public load<T>(key: string): T {
        const datas = localStorage.getItem(key) || "{}";
        return JSON.parse(datas);
    }

    // créer une fonction d'export e une d'import ou save load vers le disque et changer celle là en set et get
}
