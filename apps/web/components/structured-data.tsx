type StructuredDataValue = Record<string, unknown> | readonly Record<string, unknown>[];

export function StructuredData({ id, data }: { id: string; data: StructuredDataValue }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized and escapes HTML opening characters.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
