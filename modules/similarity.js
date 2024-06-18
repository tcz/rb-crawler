import { exec } from 'child_process';

async function checkSimilarity(imagePath1, imagePath2) {
    return new Promise((resolve, reject) => {
        exec(`../Tools/.venv/bin/python ../Tools/image-comparison.py ${imagePath1} ${imagePath2}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            let similarity = parseFloat(stdout);
            resolve(similarity);
        });
    });
}


export { checkSimilarity };
