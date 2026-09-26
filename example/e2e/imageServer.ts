import { createServer } from 'node:http';
import { PNG } from 'pngjs';

export const imageColors = {
  blue: [34, 139, 230],
  orange: [234, 93, 46],
  green: [30, 190, 90],
  purple: [180, 40, 210],
} as const;

function solidImage(color: readonly number[]) {
  const image = new PNG({ width: 24, height: 24 });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data.set([...color, 255], index);
  }
  return PNG.sync.write(image);
}

const blue = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAJUlEQVR4nGNQ6n72n5aYYdSCUQtGLRi1YNSCUQtGLRi1YGhYAADpH8jMH5oZfAAAAABJRU5ErkJggg==',
  'base64'
);
const orange = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAJUlEQVR4nGN4Fav3n5aYYdSCUQtGLRi1YNSCUQtGLRi1YGhYAAArnoVMxz5kxQAAAABJRU5ErkJggg==',
  'base64'
);

/** Local only: observes the requests actually made by the native image loaders. */
export async function startImageServer() {
  const requests: { authorization?: string; method?: string; body: string }[] =
    [];
  const menuRequests: { path: string; authorization?: string }[] = [];
  let releaseFirstMenuImage = () => {};
  const server = createServer((request, response) => {
    if (request.url?.startsWith('/menu/')) {
      const authorization = request.headers.authorization;
      menuRequests.push({ path: request.url, authorization });
      const send = (color: readonly number[], noStore = false) => {
        response.writeHead(200, {
          'Content-Type': 'image/png',
          ...(noStore ? { 'Cache-Control': 'no-store' } : {}),
        });
        response.end(solidImage(color));
      };
      if (request.url === '/menu/reload') send(imageColors.blue);
      else if (request.url === '/menu/no-store') send(imageColors.orange, true);
      else if (authorization === 'Bearer first') {
        // The test releases this older response only after replacing the icon.
        releaseFirstMenuImage = () => send(imageColors.purple);
      } else send(imageColors.green);
      return;
    }
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      const authorization = request.headers.authorization;
      requests.push({ authorization, method: request.method, body });
      if (
        request.url !== '/icon' ||
        request.method !== 'POST' ||
        body !== 'size=small' ||
        !['Bearer first', 'Bearer second'].includes(authorization ?? '')
      ) {
        response.writeHead(403).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': 'image/png' });
      response.end(authorization === 'Bearer first' ? blue : orange);
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(18763, resolve);
  });
  return {
    requests,
    menuRequests,
    releaseFirstMenuImage: () => releaseFirstMenuImage(),
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
