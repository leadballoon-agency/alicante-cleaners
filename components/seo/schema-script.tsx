/**
 * Schema Script Component
 *
 * Renders JSON-LD structured data in the page head.
 * Use this component to add schema markup to any page.
 */

interface SchemaScriptProps {
  schema: object | object[]
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  const schemas = Array.isArray(schema) ? schema : [schema]

  return (
    <>
      {schemas.filter(Boolean).map((s, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  )
}
