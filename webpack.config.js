import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename and __dirname in an ES module context.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production', // Change to 'production' for production builds.
  entry: './src/Main.ts', // Your client entry point.
  output: {
    filename: 'main.js', // The bundled file name.
    path: path.resolve(__dirname, 'public'), // Output directory.
  },
  target: 'web', // Bundle for browser use.
  resolve: {
    extensions: ['.ts', '.js'], // Resolve both TypeScript and JavaScript files.
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // All files with a .ts extension.
        use: 'ts-loader', // Use ts-loader to transpile them.
        exclude: /node_modules/,
      },
    ],
  },
  devtool: 'source-map', // Generate source maps.
};
