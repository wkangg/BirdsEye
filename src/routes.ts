import { readdir } from 'node:fs';

export const initRoutes = () => {
    for (const method of ['get', 'post']) {
        readdir(`src/api/${method}`, (err, fileNames) => {
            if (err) console.warn(err);
            for (const file of fileNames) {
                if (!file.endsWith('.ts')) {
                    console.warn(`File not ending with .ts found in src/api/${method} folder: ${file}`);
                    continue;
                }
                import(`./api/${method}/${file}`);
            }
            console.log(`API/${method.toUpperCase()} files found: ${fileNames.join(', ')}`);
        });
    }
};