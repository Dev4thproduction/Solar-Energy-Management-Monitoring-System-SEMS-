/**
 * ZIP to JSON Structure Converter
 * 
 * A Node.js utility that reads a ZIP file in memory and converts its
 * folder/file structure into a recursive JSON representation.
 * 
 * @module zip-to-json
 * @author Senior Backend Engineer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

/** @constant {string} ID_PREFIX - Prefix for all generated IDs */
const ID_PREFIX = 'weathermeter-';

/**
 * @typedef {Object} FileNode
 * @property {string} id - Unique identifier prefixed with "weathermeter-"
 * @property {string} name - Name of the file or folder
 * @property {'file'|'folder'} type - Type of the node
 * @property {FileNode[]} [children] - Child nodes (only for folders)
 */

/**
 * Generates a sanitized, unique ID from a file path
 * @param {string} filePath - The file path to generate ID from
 * @returns {string} Sanitized ID with prefix
 */
function generateId(filePath) {
  const sanitized = filePath
    .replace(/[\/\\]/g, '-')  // Replace path separators with dashes
    .replace(/[^a-zA-Z0-9\-_.]/g, '') // Remove special characters
    .replace(/-+/g, '-')      // Collapse multiple dashes
    .replace(/^-|-$/g, '')    // Remove leading/trailing dashes
    .toLowerCase();
  
  return `${ID_PREFIX}${sanitized}`;
}

/**
 * Parses ZIP entries into a nested tree structure
 * @param {import('adm-zip').IZipEntry[]} entries - Array of ZIP entries
 * @returns {FileNode[]} Root-level nodes of the file tree
 */
function buildFileTree(entries) {
  /** @type {Map<string, FileNode>} */
  const nodeMap = new Map();
  
  /** @type {Set<string>} */
  const allPaths = new Set();
  
  // First pass: collect all paths and ensure parent directories exist
  for (const entry of entries) {
    const entryPath = entry.entryName.replace(/\/$/, ''); // Remove trailing slash
    if (!entryPath) continue;
    
    allPaths.add(entryPath);
    
    // Add all parent directories
    const parts = entryPath.split(/[\/\\]/);
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/');
      allPaths.add(parentPath);
    }
  }
  
  // Second pass: create nodes for all paths
  for (const entryPath of allPaths) {
    const entry = entries.find(e => e.entryName.replace(/\/$/, '') === entryPath);
    const isDirectory = entry ? entry.isDirectory : true; // Implicit directories are folders
    const name = path.basename(entryPath);
    
    /** @type {FileNode} */
    const node = {
      id: generateId(entryPath),
      name: name,
      type: isDirectory ? 'folder' : 'file',
    };
    
    if (isDirectory) {
      node.children = [];
    }
    
    nodeMap.set(entryPath, node);
  }
  
  // Third pass: build parent-child relationships
  /** @type {FileNode[]} */
  const roots = [];
  
  for (const [entryPath, node] of nodeMap) {
    const parentPath = path.dirname(entryPath).replace(/\\/g, '/');
    
    if (parentPath === '.' || parentPath === '') {
      roots.push(node);
    } else {
      const parentNode = nodeMap.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        // Orphan node - add to roots
        roots.push(node);
      }
    }
  }
  
  // Sort children alphabetically (folders first, then files)
  function sortChildren(nodes) {
    nodes.sort((a, b) => {
      // Folders come before files
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    });
    
    for (const node of nodes) {
      if (node.children) {
        sortChildren(node.children);
      }
    }
  }
  
  sortChildren(roots);
  
  return roots;
}

/**
 * Reads a ZIP file from disk and converts its structure to JSON
 * @param {string} zipFilePath - Path to the ZIP file
 * @returns {Promise<FileNode[]>} Promise resolving to the file tree
 * @throws {Error} If file doesn't exist or is not a valid ZIP
 */
async function convertZipToJson(zipFilePath) {
  // Validate file exists
  if (!fs.existsSync(zipFilePath)) {
    throw new Error(`File not found: ${zipFilePath}`);
  }
  
  // Read file into memory buffer (no disk writes)
  const zipBuffer = fs.readFileSync(zipFilePath);
  
  // Parse ZIP from buffer
  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (error) {
    throw new Error(`Invalid ZIP file: ${error.message}`);
  }
  
  // Get all entries
  const entries = zip.getEntries();
  
  if (entries.length === 0) {
    return [];
  }
  
  // Build and return the file tree
  return buildFileTree(entries);
}

/**
 * Reads a ZIP file from a Buffer and converts its structure to JSON
 * @param {Buffer} zipBuffer - Buffer containing ZIP data
 * @returns {FileNode[]} The file tree
 * @throws {Error} If buffer is not a valid ZIP
 */
function convertZipBufferToJson(zipBuffer) {
  if (!Buffer.isBuffer(zipBuffer)) {
    throw new Error('Input must be a Buffer');
  }
  
  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (error) {
    throw new Error(`Invalid ZIP data: ${error.message}`);
  }
  
  const entries = zip.getEntries();
  
  if (entries.length === 0) {
    return [];
  }
  
  return buildFileTree(entries);
}

/**
 * Main execution function
 * @param {string} [zipPath] - Optional path to ZIP file (defaults to WeatherMeter.zip)
 */
async function main(zipPath) {
  const targetZip = zipPath || path.join(process.cwd(), 'WeatherMeter.zip');
  
  console.log(`Processing ZIP file: ${targetZip}`);
  console.log('---');
  
  try {
    const result = await convertZipToJson(targetZip);
    const output = JSON.stringify(result, null, 2);
    
    console.log(output);
    
    return result;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for module usage
module.exports = {
  convertZipToJson,
  convertZipBufferToJson,
  generateId,
  buildFileTree,
  ID_PREFIX,
};

// Run if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const zipPath = args[0] || undefined;
  main(zipPath);
}
