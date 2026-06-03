const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Monitorar a raiz do monorepo para mudanças
config.watchFolders = [workspaceRoot];

// 2. Tentar resolver dependências primeiro localmente, depois na raiz do monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Habilitar suporte a symlinks
config.resolver.unstable_enableSymlinks = true;

// 4. Adicionar suporte a .mjs e .cjs (essencial para generator-function e outros)
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// 5. Resolvedor Universal de Monorepo: Intercepta e garante que pacotes da raiz sejam encontrados
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Fallback: Tenta encontrar o pacote no node_modules da raiz
    try {
      const resolvedPath = require.resolve(moduleName, { paths: [workspaceRoot] });
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    } catch {
      // Se nem na raiz existir, relança o erro original
      throw error;
    }
  }
};

module.exports = config;
