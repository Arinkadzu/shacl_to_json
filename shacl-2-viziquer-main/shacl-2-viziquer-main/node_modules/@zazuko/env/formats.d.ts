export interface RdfFormat {
    'n-triples': 'application/n-triples';
    'json-ld': 'application/ld+json';
    'n-quads': 'application/n-quads';
    'n3': 'text/n3';
    'turtle': 'text/turtle';
    'trig': 'application/trig';
    'rdf/xml': 'application/rdf+xml';
}
export type MediaType = RdfFormat[keyof RdfFormat];
//# sourceMappingURL=formats.d.ts.map