const assert = require('node:assert/strict');
const {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const ts = require('typescript');

// Run after building the package: node scripts/check-web-consumer-types.js
async function main() {
  const root = path.resolve(__dirname, '..');
  const packageJson = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  );
  const declaration = path.resolve(
    root,
    packageJson.exports['.'].browser.types
  );
  assert.ok(declaration.startsWith(path.join(root, 'lib') + path.sep));
  await readFile(declaration);

  const temporary = await mkdtemp(
    path.join(tmpdir(), 'platform-components-types-')
  );
  try {
    const modules = path.join(temporary, 'node_modules');
    await mkdir(modules);
    await symlink(root, path.join(modules, packageJson.name), 'junction');
    await symlink(
      path.dirname(require.resolve('react/package.json')),
      path.join(modules, 'react'),
      'junction'
    );
    await symlink(
      path.join(root, 'node_modules/@types'),
      path.join(modules, '@types'),
      'junction'
    );
    await writeFile(
      path.join(temporary, 'package.json'),
      JSON.stringify({ type: 'module' })
    );
    const consumer = path.join(temporary, 'consumer.tsx');
    await writeFile(
      consumer,
      await readFile(
        path.join(__dirname, 'fixtures/web-consumer-types.tsx.txt')
      )
    );

    for (const [name, module, moduleResolution] of [
      ['bundler', ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
      ['NodeNext', ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
    ]) {
      // Intentionally independent of the repo tsconfig: no source paths/aliases.
      const options = {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        esModuleInterop: true,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        customConditions: ['browser'],
        types: ['react', 'node'],
        module,
        moduleResolution,
      };
      const host = ts.createCompilerHost(options);
      const resolved = ts.resolveModuleName(
        packageJson.name,
        consumer,
        options,
        host,
        undefined,
        undefined,
        ts.ModuleKind.ESNext
      ).resolvedModule;
      assert.ok(resolved, `${name}: package did not resolve`);
      assert.equal(
        await realpath(resolved.resolvedFileName),
        await realpath(declaration),
        `${name}: the fixture must resolve the emitted browser declaration`
      );
      const program = ts.createProgram([consumer], options, host);
      const diagnostics = ts.getPreEmitDiagnostics(program);
      if (diagnostics.length) {
        process.stderr.write(
          ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCurrentDirectory: () => temporary,
            getCanonicalFileName: (filename) => filename,
            getNewLine: () => '\n',
          })
        );
        process.exitCode = 1;
      } else {
        console.log(`${name}: emitted browser props, adapters and refs passed`);
      }
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
