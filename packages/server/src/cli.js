#!/usr/bin/env node
import { program } from 'commander';
import { startServer } from './index.js';
import path from 'path';

program
  .name('flow-claw')
  .description('Workflow and wiki viewer for markdown-based agentic workflows')
  .version('0.1.0')
  .argument('[dir]', 'directory containing markdown workflow files', '.')
  .option('-p, --port <port>', 'port to run on', '3001')
  .option('--no-open', 'do not open browser automatically')
  .action(async (dir, options) => {
    const workflowDir = path.resolve(process.cwd(), dir);
    const port = parseInt(options.port, 10);

    console.log(`Flow-Claw starting...`);
    console.log(`Watching: ${workflowDir}`);
    console.log(`Server:   http://localhost:${port}`);

    await startServer({ workflowDir, port, openBrowser: options.open });
  });

program.parse();
