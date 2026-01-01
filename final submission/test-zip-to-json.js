/**
 * Test script for zip-to-json utility
 */

const { convertZipToJson } = require('./zip-to-json');
const path = require('path');

async function test() {
    const zipPath = path.join(__dirname, 'Arjun_Task1-main (2).zip');

    console.log('=== ZIP to JSON Structure Converter Test ===\n');

    try {
        const result = await convertZipToJson(zipPath);

        // Count nodes
        let folderCount = 0;
        let fileCount = 0;

        function count(nodes) {
            for (const node of nodes) {
                if (node.type === 'folder') {
                    folderCount++;
                    if (node.children) count(node.children);
                } else {
                    fileCount++;
                }
            }
        }
        count(result);

        console.log(`✓ Successfully parsed ZIP file`);
        console.log(`  - Folders: ${folderCount}`);
        console.log(`  - Files: ${fileCount}`);
        console.log(`\n=== Sample Output (first 3 levels) ===\n`);

        // Print truncated tree for display
        function printTree(nodes, depth = 0, maxDepth = 3) {
            if (depth >= maxDepth) return;
            for (const node of nodes) {
                const indent = '  '.repeat(depth);
                const icon = node.type === 'folder' ? '📁' : '📄';
                console.log(`${indent}${icon} ${node.name} (id: ${node.id})`);
                if (node.children) {
                    printTree(node.children, depth + 1, maxDepth);
                }
            }
        }
        printTree(result);

        console.log('\n=== Full JSON Output ===\n');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error(`✗ Error: ${error.message}`);
        process.exit(1);
    }
}

test();
