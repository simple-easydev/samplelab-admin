/**
 * Figma API Client
 * Uses Figma REST API to fetch design data
 * Documentation: https://www.figma.com/developers/api
 */

// Types for Figma API responses
export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  backgroundColor?: RGBA;
  fills?: Fill[];
  strokes?: Stroke[];
  effects?: Effect[];
  absoluteBoundingBox?: Rect;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: "FILL" | "TEXT" | "EFFECT" | "GRID";
  description: string;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Fill {
  type: string;
  color?: RGBA;
}

export interface Stroke {
  type: string;
  color?: RGBA;
}

export interface Effect {
  type: string;
  color?: RGBA;
  offset?: { x: number; y: number };
  radius?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract file key from Figma URL
 * Example: https://www.figma.com/file/ABC123/Design-Name -> ABC123
 */
export function extractFileKey(figmaUrl: string): string | null {
  const match = figmaUrl.match(/\/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Fetch Figma file data
 */
export async function getFigmaFile(fileKey: string): Promise<FigmaFile | null> {
  const token = process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    console.error("FIGMA_ACCESS_TOKEN not set in environment variables");
    return null;
  }

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        "X-Figma-Token": token,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Figma file:", error);
    return null;
  }
}

/**
 * Get image URLs from Figma
 */
export async function getFigmaImages(
  fileKey: string,
  nodeIds: string[]
): Promise<Record<string, string> | null> {
  const token = process.env.FIGMA_ACCESS_TOKEN;

  if (!token) {
    console.error("FIGMA_ACCESS_TOKEN not set in environment variables");
    return null;
  }

  try {
    const ids = nodeIds.join(",");
    const response = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=2`,
      {
        headers: {
          "X-Figma-Token": token,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images;
  } catch (error) {
    console.error("Error fetching Figma images:", error);
    return null;
  }
}

/**
 * Extract color palette from Figma file
 */
export function extractColors(figmaFile: FigmaFile): string[] {
  const colors = new Set<string>();

  function traverseNode(node: FigmaNode) {
    // Extract fill colors
    if (node.fills) {
      node.fills.forEach((fill) => {
        if (fill.color) {
          colors.add(rgbaToHex(fill.color));
        }
      });
    }

    // Extract stroke colors
    if (node.strokes) {
      node.strokes.forEach((stroke) => {
        if (stroke.color) {
          colors.add(rgbaToHex(stroke.color));
        }
      });
    }

    // Recurse through children
    if (node.children) {
      node.children.forEach(traverseNode);
    }
  }

  traverseNode(figmaFile.document);
  return Array.from(colors);
}

/**
 * Convert RGBA to hex color
 */
export function rgbaToHex(rgba: RGBA): string {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Generate Tailwind config from Figma styles
 */
export function generateTailwindColors(colors: string[]): Record<string, string> {
  const colorConfig: Record<string, string> = {};

  colors.forEach((color, index) => {
    colorConfig[`figma-${index + 1}`] = color;
  });

  return colorConfig;
}

/**
 * Get Figma embed URL for prototypes
 */
export function getFigmaEmbedUrl(figmaUrl: string): string {
  const fileKey = extractFileKey(figmaUrl);
  if (!fileKey) return "";

  return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl)}`;
}
