import { $ } from 'bun';
import { watch } from 'node:fs';
import { join } from 'node:path';
import { HttpServer } from './http';
import { SocketServer } from './socket';

const cwd = process.cwd();

export const paths = {
  SHADER: join(cwd, 'src', 'shader.frag'),
  SHADER_MIN: join(cwd, 'src', 'shader.min.frag'),
  MINIFIER: join(cwd, 'shader_minifier.exe'),
  TEMPLATE: join(cwd, 'dev', 'index.html'),
  FAVICON: join(cwd, 'dev', 'favicon.ico'),
  WS_DEBUG: join(cwd, 'dev', 'ws-debug.js'),
};

const tokens = {
  SHADER: '// ----- SHADER ----- //',
  MINIFIED_LENGTH: '<!-- MINIFIED_LENGTH -->',
};

export const minifyShader = async () => {
  console.time('minifying shader');
  const output =
    await $`mono ${paths.MINIFIER} --format text -o ${paths.SHADER_MIN} ${paths.SHADER}`;
  console.timeEnd('minifying shader');

  if (output.exitCode !== 0) {
    throw new Error(output.stderr.toString());
  }
};

export const getPage = async (minify: boolean = false) => {
  await minifyShader();
  const sourceShader = await Bun.file(paths.SHADER).text();
  const minifiedShader = await Bun.file(paths.SHADER_MIN).text();

  const shader = minify ? minifiedShader : sourceShader;

  const html = await Bun.file(paths.TEMPLATE).text();

  return html
    .replace(tokens.SHADER, shader)
    .replace(tokens.MINIFIED_LENGTH, minifiedShader.length.toString());
};

export const serve = () => {
  new HttpServer({ port: 1234 });
  const socket = new SocketServer({ port: 4321 });

  watch(paths.SHADER, (eventType, filename) => {
    if (eventType === 'change') {
      socket.broadcast('shader_updated');
    }
  });
};
