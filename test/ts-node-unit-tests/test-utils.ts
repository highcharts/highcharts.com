import type { AssertionError } from 'assert';
import { message, failure, warn } from '../../tools/gulptasks/lib/log.js';

const { argv } = process;

/**
 * Logs the output if `argv.verbose` is given
 * @param text
 */
export function describe(...text: string[]): void {
    if (argv.includes('--verbose')) {
        message(text);
    }
}

/**
 * Handles logging a failed test to the console.
 * @param error
 * The error object
 */
export function reportError(error: (AssertionError & Error)): void {
    const { actual, expected, code, message: errorMessage, stack } = error;

    const printArrayOrString = (array: string | []) =>
        (Array.isArray(array) ? JSON.stringify(array, undefined, 4) : array);

    failure(`${code} ${errorMessage}
        ${stack?.split('\n')[1]}

Got: ${printArrayOrString(actual as any)}

Expected: ${printArrayOrString(expected as any)}
`);
}

export function setupDOM( customBody = '' ){
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(
      customBody ??
    '<!doctype html><body></body>');
  const win = dom.window;
  const doc = win.document;

  global.Node = win.Node; // Workaround for issue #1
  win.Date = Date;

  // DispatchEvent workaround
  const originalDispatchEvent = win.dispatchEvent;
  win.dispatchEvent = function (e: Record<string, any>){
      const event = new win.Event(e.type, e);
      return originalDispatchEvent.call(this, event);
  };
  // Do some modifications to the jsdom document in order to get the SVG bounding
  // boxes right.
  let el = doc.createElement('div');
  doc.body.appendChild(el);

  return {
    win,
    doc,
    el
  }

}

export function loadHCWithModules(hc = 'highcharts', modules: string[] = []){
    const { doc, win } = setupDOM();
    const Highcharts = require(`../../code/${hc}.src.js`);
    Highcharts.doc = doc;
    Highcharts.win = win;

    if(modules.length){
        global.window = win; // needed to load modules as of Node 20+
        modules.forEach(module => {
            require(`../../code/${module}.src.js`)(Highcharts);
        });
    }

    return Highcharts;
}
