import objectPath = require('object-path');

export type Filter = (input: any) => any;

export interface TemplateOptions {
  match: string | RegExp,
  split: string | RegExp,
  data: {
    [key: string]: any,
  },
  filters: {
    [key: string]: Filter,
  },
}

export const defaultFilters: {
  [key: string]: Filter,
} = {
  clean: (input: any) => String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'),
  encode: (input: any) => encodeURIComponent(input),
  date: (input: any) => new Date(input),
  number: (input: any) => Number(input),
  boolean: (input: any) => Boolean(input),
  json: (input: any) => JSON.stringify(input),
};

export function parseTemplate(input: string, options: TemplateOptions): string {
  return input.replace(options.match, (m, str) => {
    let [key, ...filterList] = String(str || '').split(options.split);
    let value = objectPath.get(options.data, key);
    for (let filterName of filterList) {
      if (options.filters[filterName]) {
        value = options.filters[filterName](value);
      }
    }
    return value == null ? '' : value;
  });
}
