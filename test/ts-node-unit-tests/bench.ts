import type { BenchResults, BenchmarkResult, BenchmarkDetails } from './benchmark.d.ts';

import { readdirSync, existsSync } from 'node:fs';
import { readdir, mkdir, writeFile, rm, lstat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import { argv, exit } from 'node:process';

import yargs from 'yargs';
import * as swc from '@swc/core';

import { starting, finished, success, warn } from '../../tools/libs/log.js';

function getStandardDeviation (array: number[]) {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

const BENCH_PATH = join(__dirname, './benchmarks');
const CODE_PATH = resolve(__dirname, '../../code');

const OUTPUT_PATH = join(__dirname, '../../tmp/benchmarks');

const TEST_TIMEOUT_SECONDS = 100;

const errors = [];
let testCounter: number = 0;

async function transpileFile(path: string) {
    try {
        const output = await swc.transformFile(path);
        const outputPath = path.replace('.ts', '.tmp.mjs');

        await writeFile(outputPath, output.code);
        return outputPath;
    } catch (error) {
        const err = new Error('Failed to transpile file: ' + path);
        (err as any).cause = error; // Error type does not have the new neat thing :/
        throw err;
    }
}


/**
 * Grab file extensions
 */

const getDirRecursive = async (dir: string): Promise<Array<string>> => {
    try {
        const items = await readdir(dir);
        let files = [];
        for (const item of items) {
            if ((await lstat(`${dir}/${item}`)).isDirectory())
                files = [
                    ...files,
                    ...(await getDirRecursive(`${dir}/${item}`))
                ];
            else files.push(`${dir}/${item}`);
        }
        return files;
    } catch (e) {
        return e;
    }
};

async function runTestInWorker(testFile: string, size: number): Promise<BenchmarkResult | undefined> {
    const worker = new Worker( await transpileFile(join(__dirname, 'bench-worker.ts')), {
        resourceLimits: {
            stackSizeMb: 20
        },
        stdout: false // pipe to main,

        },
    );

    const promise = new Promise((resolve, reject) =>{
        worker.on('message', value =>{
            if (value.error){
                worker.terminate();
                reject(value.error);
            }

            if (value.result){
                worker.terminate();
                resolve(value.result);
            }
        });

        setTimeout(()=>{
            worker.terminate();
            reject(new Error(`Test ${testFile} timed out after ${TEST_TIMEOUT_SECONDS} seconds`));
        }, TEST_TIMEOUT_SECONDS * 1000);
    });

    worker.postMessage({ testFile, size, CODE_PATH });

    const result = await promise
        .catch(error =>{
            console.error(error);
            return undefined;
        });

    return result as BenchmarkResult | undefined;
}

const ITERATIONS = 15;

function quartile (arr: number[], q:number) {
    // Avoid mutating the original array
    const sorted = Array.from(arr).sort((a, b) => a - b);

    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }

    return sorted[base];
};

async function runRest(testFile: string) : Promise<BenchResults>{
    const { config } = await import(testFile);

    const results = [];
    await mkdir(join(__dirname, 'test-data'), { recursive: true });

    for (const size of config.sizes) {
        const details: BenchmarkDetails = {
            test: testFile,
            sampleSize: size,
            min: Number.MAX_SAFE_INTEGER,
            max: 0,
            Q1: 0,
            Q3: 0,
            results: [],
            avg: 0,
            stdDev: 0
        };

        console.log(`Running ${details.test} with samplesize ${size}`);

        let i = 0;
        while (i < ITERATIONS) {
            i++;

            const result = await runTestInWorker(testFile, size) ?? 0;
            details.results.push(result);

            if (result > details.max) {
                details.max = result;
            }

            if (result < details.min) {
                details.min = result;
            }
        }

        details.Q1 = quartile(details.results, 0.25);
        details.Q3 = quartile(details.results, 0.75);

        details.avg = details.results.reduce((acc, result) => acc + result, 0) / ITERATIONS;
        details.stdDev = getStandardDeviation(details.results);

        results.push(details);

        console.log('Done');
    }

    await rm(join(__dirname, 'test-data'), { force: true, recursive: true });

    return results;
}


async function benchmark(){
    starting('Benchmarks');

    const { pattern, context } = await yargs(argv).argv;

    if (!existsSync(CODE_PATH)) {
        warn('Code has not been compiled. Run npx gulp scripts first');
        process.exit();
    }

    const reportDir = join(OUTPUT_PATH, typeof context === 'string' ? context : 'actual');

    if (existsSync(BENCH_PATH)) {
        const result = await getDirRecursive(BENCH_PATH);

        const testFiles = result.filter(file => {
            if (pattern && typeof pattern === 'string') {
                return new RegExp(pattern).test(file);
            }

            return file.includes('.bench.ts');
        });

        for (const testFile of testFiles) {
            const testdir = testFile.replace(/[^/]*$/, '').replace(BENCH_PATH, '');
            const dirPath = reportDir + testdir;

            console.time(`Benchmark ${relative(__dirname, testFile)} took`);

            const data = await runRest(testFile);

            console.timeEnd(`Benchmark ${relative(__dirname, testFile)} took`);

            if (!existsSync(dirPath)){
                await mkdir(dirPath, { recursive: true });
            }

            await writeFile(
                reportDir + testFile.replace(BENCH_PATH, '').replace('.bench.ts', '.json'),
                JSON.stringify(data, undefined, 2)
            );

            testCounter++;
        };
    }

    if (errors.length) {
        throw new Error(`Failed ${errors.length}/${testCounter} tests`);
    }

    success(`Ran ${testCounter} successful benches`);
    finished('Benchmarks');
    exit(0);
}

benchmark().catch(console.error);
