import { TypeEntry, TypeFlags, TypesDocument } from './types';

/**
 * Parses a types.xml file content into a structured TypesDocument
 * @param xmlContent - Raw XML content as string
 * @returns Parsed TypesDocument with all type entries
 * @throws Error if XML parsing fails
 */
export function parseTypesXml(xmlContent: string): TypesDocument {
    const types: TypeEntry[] = [];

    try {
        // Remove XML declaration and comments
        let content = xmlContent.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');

        // Extract all <type> elements
        const typeRegex = /<type name="([^"]+)">([\s\S]*?)<\/type>/g;
        let match;

        while ((match = typeRegex.exec(content)) !== null) {
            const name = match[1];
            const typeContent = match[2];

            const type: TypeEntry = {
                name,
                nominal: extractNumberValue(typeContent, 'nominal'),
                lifetime: extractNumberValue(typeContent, 'lifetime'),
                restock: extractNumberValue(typeContent, 'restock'),
                min: extractNumberValue(typeContent, 'min'),
                quantmin: extractNumberValue(typeContent, 'quantmin'),
                quantmax: extractNumberValue(typeContent, 'quantmax'),
                cost: extractNumberValue(typeContent, 'cost'),
                flags: extractFlags(typeContent),
                category: extractStringValue(typeContent, 'category'),
                tags: extractMultipleValues(typeContent, 'tag'),
                usages: extractMultipleValues(typeContent, 'usage'),
                values: extractMultipleValues(typeContent, 'value')
            };

            types.push(type);
        }

        return { types };
    } catch (error) {
        throw new Error(`Failed to parse types.xml: ${error}`);
    }
}

/**
 * Serializes a TypesDocument back to XML format
 * @param document - The TypesDocument to serialize
 * @returns XML string representation
 */
export function serializeTypesXml(document: TypesDocument): string {
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<types>\n';

    for (const type of document.types) {
        xml += `    <type name="${escapeXml(type.name)}">\n`;
        xml += `        <nominal>${type.nominal}</nominal>\n`;
        xml += `        <lifetime>${type.lifetime}</lifetime>\n`;
        xml += `        <restock>${type.restock}</restock>\n`;
        xml += `        <min>${type.min}</min>\n`;
        xml += `        <quantmin>${type.quantmin}</quantmin>\n`;
        xml += `        <quantmax>${type.quantmax}</quantmax>\n`;
        xml += `        <cost>${type.cost}</cost>\n`;
        xml += `        <flags count_in_cargo="${type.flags.count_in_cargo}" count_in_hoarder="${type.flags.count_in_hoarder}" count_in_map="${type.flags.count_in_map}" count_in_player="${type.flags.count_in_player}" crafted="${type.flags.crafted}" deloot="${type.flags.deloot}"/>\n`;

        if (type.category) {
            xml += `        <category name="${escapeXml(type.category)}"/>\n`;
        }

        for (const tag of type.tags) {
            xml += `        <tag name="${escapeXml(tag)}"/>\n`;
        }

        for (const usage of type.usages) {
            xml += `        <usage name="${escapeXml(usage)}"/>\n`;
        }

        for (const value of type.values) {
            xml += `        <value name="${escapeXml(value)}"/>\n`;
        }

        xml += `    </type>\n`;
    }

    xml += '</types>\n';
    return xml;
}

/**
 * Extracts a numeric value from an XML element
 * @param content - XML content to search
 * @param tagName - Name of the tag to extract
 * @returns Numeric value or 0 if not found
 */
function extractNumberValue(content: string, tagName: string): number {
    const regex = new RegExp(`<${tagName}>([^<]+)<\/${tagName}>`, 'i');
    const match = content.match(regex);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts a string value from an XML element attribute
 * @param content - XML content to search
 * @param tagName - Name of the tag to extract
 * @returns String value or empty string if not found
 */
function extractStringValue(content: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}\\s+name="([^"]+)"`, 'i');
    const match = content.match(regex);
    return match ? match[1] : '';
}

/**
 * Extracts multiple values from repeating XML elements
 * @param content - XML content to search
 * @param tagName - Name of the tag to extract
 * @returns Array of string values
 */
function extractMultipleValues(content: string, tagName: string): string[] {
    const values: string[] = [];
    const regex = new RegExp(`<${tagName}\\s+name="([^"]+)"`, 'gi');
    let match;

    while ((match = regex.exec(content)) !== null) {
        values.push(match[1]);
    }

    return values;
}

/**
 * Extracts flag configuration from XML
 * @param content - XML content to search
 * @returns TypeFlags object with all flag values
 */
function extractFlags(content: string): TypeFlags {
    const flagsRegex = /<flags\s+([^>]+)>/i;
    const match = content.match(flagsRegex);

    const defaultFlags: TypeFlags = {
        count_in_cargo: '0',
        count_in_hoarder: '0',
        count_in_map: '1',
        count_in_player: '0',
        crafted: '0',
        deloot: '0'
    };

    if (!match) {
        return defaultFlags;
    }

    const flagsStr = match[1];
    const flags: TypeFlags = { ...defaultFlags };

    const extractFlag = (name: keyof TypeFlags): '0' | '1' => {
        const regex = new RegExp(`${name}="([01])"`, 'i');
        const m = flagsStr.match(regex);
        return m ? (m[1] as '0' | '1') : defaultFlags[name];
    };

    flags.count_in_cargo = extractFlag('count_in_cargo');
    flags.count_in_hoarder = extractFlag('count_in_hoarder');
    flags.count_in_map = extractFlag('count_in_map');
    flags.count_in_player = extractFlag('count_in_player');
    flags.crafted = extractFlag('crafted');
    flags.deloot = extractFlag('deloot');

    return flags;
}

/**
 * Escapes special XML characters in a string
 * @param str - String to escape
 * @returns Escaped string safe for XML
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Creates a new empty TypeEntry with default values
 * @param name - Name for the new type entry
 * @returns New TypeEntry with sensible defaults
 */
export function createDefaultTypeEntry(name: string): TypeEntry {
    return {
        name,
        nominal: 10,
        lifetime: 14400,
        restock: 1800,
        min: 5,
        quantmin: -1,
        quantmax: -1,
        cost: 100,
        flags: {
            count_in_cargo: '0',
            count_in_hoarder: '0',
            count_in_map: '1',
            count_in_player: '0',
            crafted: '0',
            deloot: '0'
        },
        category: '',
        tags: [],
        usages: [],
        values: []
    };
}

/**
 * Validates a TypeEntry for common issues
 * @param entry - The type entry to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateTypeEntry(entry: TypeEntry): string[] {
    const errors: string[] = [];

    if (!entry.name || entry.name.trim() === '') {
        errors.push('Name is required');
    }

    if (entry.nominal < 0) {
        errors.push('Nominal must be non-negative');
    }

    if (entry.min < 0) {
        errors.push('Min must be non-negative');
    }

    if (entry.min > entry.nominal) {
        errors.push('Min cannot be greater than nominal');
    }

    if (entry.lifetime < 0) {
        errors.push('Lifetime must be non-negative');
    }

    if (entry.restock < 0) {
        errors.push('Restock must be non-negative');
    }

    return errors;
}
