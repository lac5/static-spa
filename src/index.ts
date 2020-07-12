import path = require('path');
import fs = require('fs');
import findUp = require('find-up');
import { Request, Response, NextFunction } from 'express';

import { defaultFilters, Filter, TemplateOptions, parseTemplate } from './template';

export type Handler = (req: Request, res: Response, next?: NextFunction) => void;

export interface Options {
  dir: string,
  index?: string,
  template?: {
    index?: string,
    match?: string | RegExp,
    split?: string | RegExp,
    data?: {
      [key: string]: any,
    },
    filters?: {
      [key: string]: Filter,
    },
  },
}

export default function staticSpa(input: string | Options): Handler {
  const options = typeof input === 'string' ? { dir: input } as Options : input;
  const index = options.index ?? 'index.html';
  let template: TemplateOptions;
  let templateIndex: string;
  let indexes: [string, string];
  if (options.template) {
    templateIndex = options.template.index ?? index;
    if (templateIndex !== index) {
      indexes = [index, templateIndex];
    }
    template = {
      match: options.template.match ?? /\$([\w.|]*)\$/g,
      split: options.template.split ?? '|',
      data: options.template.data == null ? {} : Object(options.template.data),
      filters: options.template.filters == null ?
        defaultFilters :
        Object.assign({}, defaultFilters, options.template.filters),
    };
  }

  const findIndex: (directory: string) => Promise<string | symbol> =
    !indexes ?
    async (directory: string) => {
      if (path.relative(options.dir, directory).startsWith('..')) {
        return findUp.stop;
      }
      let indexFile = path.join(directory, index);
      let exists = await findUp.exists(indexFile);
      return exists && indexFile;
    } :
    async (directory: string) => {
      if (path.relative(options.dir, directory).startsWith('..')) {
        return findUp.stop;
      }
      let exists = await Promise.all(indexes.map(async index => {
        let indexFile = path.join(directory, index);
        return (await findUp.exists(indexFile)) && indexFile;
      }));
      return exists[0] || exists[1];
    };

  const sendFile: (req: Request, res: Response, file: string) => (Promise<void> | void) =
    !template ?
    (req, res, file) => {
      res.sendFile(file);
    } :
    async (req, res, file) => {
      if (path.basename(file) === templateIndex) {
        let content = String(await fs.promises.readFile(file));
        content = parseTemplate(content, template);
        res.type(file);
        res.send(content);
      } else {
        res.sendFile(file);
      }
    };

  return (req, res, next) => {
    let file = path.join(options.dir, req.path);
    fs.stat(file, async (err, stat) => {
      if (err && err.code !== 'ENOENT') {
        next(err);
        return;
      } 
      try {
        if (!err && stat && stat.isFile()) {
          await sendFile(req, res, file);
          return;
        }
        let indexFile = await findUp(findIndex as any, {
          cwd: err ? path.dirname(file) : file,
          type: 'file',
        });
        if (indexFile) {
          await sendFile(req, res, indexFile);
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    });
  };
}
