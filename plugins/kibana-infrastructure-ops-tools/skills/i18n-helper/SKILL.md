# i18n Helper

## Purpose
Internationalization (i18n) helper for Kibana - find hardcoded strings, generate translations, and validate i18n implementation.

## Capabilities
- Find hardcoded strings in UI code
- Generate i18n.translate() calls with proper namespacing
- Check for missing translations
- Validate i18n JSON files
- Generate translation templates for new languages
- Check for untranslated strings in PRs

## Triggers
- "add i18n"
- "find hardcoded strings"
- "internationalization"
- "translate this component"
- "check translations"

## Implementation

### 1. Kibana i18n Overview
Kibana uses `@kbn/i18n` for internationalization:

```typescript
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

// Simple translation
const label = i18n.translate('myPlugin.myFeature.label', {
  defaultMessage: 'My Label',
});

// Translation with values
const message = i18n.translate('myPlugin.myFeature.greeting', {
  defaultMessage: 'Hello, {name}!',
  values: { name: userName },
});

// JSX translation (preferred for React components)
<FormattedMessage
  id="myPlugin.myFeature.title"
  defaultMessage="Welcome to {feature}"
  values={{ feature: 'My Feature' }}
/>

// Pluralization
const count = 5;
const message = i18n.translate('myPlugin.myFeature.itemCount', {
  defaultMessage: '{count, plural, one {# item} other {# items}}',
  values: { count },
});
```

### 2. Find Hardcoded Strings
```bash
#!/bin/bash
# find_hardcoded_strings.sh - Find untranslated strings in React components

file="$1"

if [ ! -f "$file" ]; then
  echo "Usage: $0 <file.tsx>"
  exit 1
fi

echo "Scanning $file for hardcoded strings..."
echo ""

# Pattern 1: String literals in JSX text content
# Example: <EuiTitle>Hardcoded Title</EuiTitle>
grep -n ">.*[A-Z].*<" "$file" | \
  grep -v "FormattedMessage" | \
  grep -v "i18n.translate" | \
  grep -v "//.*>" | \
  while read -r line; do
    echo "⚠️  Possible hardcoded text: $line"
  done

# Pattern 2: String literals in props
# Example: <EuiButton>Click Me</EuiButton>
grep -n ">\w*[A-Z]\w*<" "$file" | \
  grep -v "FormattedMessage" | \
  while read -r line; do
    echo "⚠️  Possible hardcoded button/link text: $line"
  done

# Pattern 3: String literals in component props
# Example: <EuiFieldText placeholder="Enter value" />
grep -n 'placeholder="[^"]*"' "$file" | \
  grep -v "i18n.translate" | \
  while read -r line; do
    echo "⚠️  Hardcoded placeholder: $line"
  done

grep -n "aria-label=\"[^\"]*\"" "$file" | \
  grep -v "i18n.translate" | \
  while read -r line; do
    echo "⚠️  Hardcoded aria-label: $line"
  done

# Pattern 4: Error messages
grep -n "throw new Error\|console.error" "$file" | \
  grep -v "i18n.translate" | \
  while read -r line; do
    echo "⚠️  Hardcoded error message: $line"
  done

echo ""
echo "Run 'i18n-helper convert' to generate i18n calls"
```

**Example output:**
```
⚠️  Possible hardcoded text: 45:  <EuiTitle>Settings</EuiTitle>
⚠️  Hardcoded placeholder: 67:  <EuiFieldText placeholder="Enter email" />
⚠️  Hardcoded aria-label: 89:  <EuiButton aria-label="Delete item">
```

### 3. Generate i18n Translations
```bash
#!/bin/bash
# generate_i18n.sh - Convert hardcoded strings to i18n calls

file="$1"
plugin_id="myPlugin"  # Extract from kibana.jsonc
feature_name="myFeature"  # Extract from path or ask user

# Helper: Generate i18n ID
generate_id() {
  local text="$1"
  local suffix=$(echo "$text" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -cd '[:alnum:]_')
  echo "${plugin_id}.${feature_name}.${suffix}"
}

# Pattern 1: Simple JSX text
# Before: <EuiTitle>Settings</EuiTitle>
# After:  <EuiTitle><FormattedMessage id="..." defaultMessage="Settings" /></EuiTitle>

sed -i.bak -E 's|<(EuiTitle[^>]*)>([A-Z][^<]+)</\1>|<\1><FormattedMessage id="'$(generate_id "title")'" defaultMessage="\2" /></\1>|g' "$file"

# Pattern 2: Placeholder attribute
# Before: placeholder="Enter email"
# After:  placeholder={i18n.translate('...', { defaultMessage: 'Enter email' })}

# This requires more complex replacement - better to do manually or with AST parser

echo "Generated i18n calls. Review $file and remove $file.bak if satisfied."
```

**Better approach: Interactive conversion**
```typescript
// i18n-converter.ts - Use TypeScript AST to convert strings
import * as ts from 'typescript';
import * as fs from 'fs';

function convertToI18n(sourceFile: ts.SourceFile, pluginId: string): string {
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    return (rootNode) => {
      function visit(node: ts.Node): ts.Node {
        // Find JSX text nodes
        if (ts.isJsxText(node) && node.text.trim()) {
          const text = node.text.trim();
          const id = `${pluginId}.${generateId(text)}`;

          // Replace with <FormattedMessage />
          return ts.factory.createJsxElement(
            ts.factory.createJsxOpeningElement(
              ts.factory.createIdentifier('FormattedMessage'),
              undefined,
              ts.factory.createJsxAttributes([
                ts.factory.createJsxAttribute(
                  ts.factory.createIdentifier('id'),
                  ts.factory.createStringLiteral(id)
                ),
                ts.factory.createJsxAttribute(
                  ts.factory.createIdentifier('defaultMessage'),
                  ts.factory.createStringLiteral(text)
                ),
              ])
            ),
            [],
            ts.factory.createJsxClosingElement(
              ts.factory.createIdentifier('FormattedMessage')
            )
          );
        }

        return ts.visitEachChild(node, visit, context);
      }

      return ts.visitNode(rootNode, visit);
    };
  };

  const result = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter();
  return printer.printFile(result.transformed[0]);
}
```

### 4. Validate i18n Keys
```bash
# Check for duplicate i18n keys
find . -name "*.tsx" -o -name "*.ts" | \
  xargs grep -oh "i18n.translate('[^']*'" | \
  sort | uniq -d

# Check for missing defaultMessage
grep -rn "i18n.translate" --include="*.ts" --include="*.tsx" | \
  grep -v "defaultMessage"

# Check for inconsistent namespacing
# All keys should start with plugin ID
grep -rn "i18n.translate('[^']*'" --include="*.ts" | \
  grep -v "i18n.translate('${plugin_id}\\."

# Validate i18n JSON files (if they exist)
for json in translations/*.json; do
  echo "Validating $json..."
  if ! jq empty "$json" 2>/dev/null; then
    echo "❌ Invalid JSON: $json"
  fi
done
```

### 5. Extract Translations for Translation Teams
```bash
# Kibana has built-in i18n extraction
node scripts/i18n_extract --path <plugin-path>

# Example output: translations/en.json
{
  "myPlugin.myFeature.title": "My Feature",
  "myPlugin.myFeature.description": "This is my feature",
  "myPlugin.myFeature.button.save": "Save",
  "myPlugin.myFeature.button.cancel": "Cancel"
}

# Validate extracted translations
node scripts/i18n_check --path <plugin-path>
```

### 6. Check PR for Untranslated Strings
```bash
#!/bin/bash
# check_pr_i18n.sh - Verify PR adds i18n for new strings

# Get changed files in PR
changed_files=$(git diff --name-only main...HEAD | grep -E "\.(tsx|ts)$")

violations=0

for file in $changed_files; do
  # Get added lines
  added_lines=$(git diff main...HEAD -- "$file" | grep "^+" | grep -v "^+++")

  # Check for hardcoded strings in added lines
  if echo "$added_lines" | grep -E ">[A-Z][^<]+<|placeholder=\"[^\"]+\"|aria-label=\"[^\"]+\"" | \
     grep -v "i18n.translate\|FormattedMessage" > /dev/null; then

    echo "⚠️  $file has untranslated strings in new code"
    violations=$((violations + 1))
  fi
done

if [ $violations -gt 0 ]; then
  echo ""
  echo "❌ Found $violations file(s) with untranslated strings"
  echo "Run: i18n-helper scan <file> to find them"
  exit 1
else
  echo "✅ All new strings are translated"
fi
```

### 7. Best Practices Checklist

```typescript
// ✅ DO: Use FormattedMessage for JSX
<EuiTitle>
  <FormattedMessage
    id="myPlugin.settings.title"
    defaultMessage="Settings"
  />
</EuiTitle>

// ✅ DO: Use i18n.translate for strings in JS
const placeholder = i18n.translate('myPlugin.settings.emailPlaceholder', {
  defaultMessage: 'Enter your email',
});

// ✅ DO: Use namespace that includes plugin ID and feature
// Format: pluginId.featureName.componentName.elementName
// Example: securitySolution.alerts.table.columnTitle

// ✅ DO: Include helpful description comments
const label = i18n.translate('myPlugin.advanced.timeout', {
  defaultMessage: 'Timeout (seconds)',
  description: 'Label for timeout configuration in advanced settings',
});

// ✅ DO: Use ICU message format for plurals
i18n.translate('myPlugin.items.count', {
  defaultMessage: '{count, plural, one {# item} other {# items}}',
  values: { count },
});

// ✅ DO: Use ICU message format for gender
i18n.translate('myPlugin.greeting', {
  defaultMessage: '{gender, select, male {He} female {She} other {They}} joined',
  values: { gender },
});

// ❌ DON'T: Concatenate translations
// Bad: i18n.translate('x') + ' ' + i18n.translate('y')
// Good: i18n.translate('xy', { defaultMessage: '{x} {y}', values: { x, y }})

// ❌ DON'T: Use variables in translation IDs
// Bad: i18n.translate(`myPlugin.${feature}.title`, ...)
// Good: i18n.translate('myPlugin.feature.title', ...)

// ❌ DON'T: Translate technical terms or code
// Bad: i18n.translate('error.api', { defaultMessage: 'API error' })
// Good: API error (leave as-is)

// ❌ DON'T: Split sentences across multiple translations
// Bad: <>{i18n.translate('x')} <a>{i18n.translate('y')}</a></>
// Good: <FormattedMessage id="x" defaultMessage="Click {link}" values={{link: <a>here</a>}} />
```

### 8. Generate Translation Template
```bash
#!/bin/bash
# generate_translation_template.sh - Create template for new language

plugin_path="$1"
target_lang="$2"  # e.g., "fr", "de", "ja"

if [ -z "$plugin_path" ] || [ -z "$target_lang" ]; then
  echo "Usage: $0 <plugin-path> <target-lang>"
  exit 1
fi

# Extract English translations
node scripts/i18n_extract --path "$plugin_path"

# Copy English as template
en_file="$plugin_path/translations/en.json"
target_file="$plugin_path/translations/${target_lang}.json"

if [ ! -f "$en_file" ]; then
  echo "❌ English translation file not found: $en_file"
  exit 1
fi

# Create target file with all English values (to be translated)
cp "$en_file" "$target_file"

echo "✅ Created translation template: $target_file"
echo ""
echo "Next steps:"
echo "1. Send $target_file to translation team"
echo "2. Replace English values with translations"
echo "3. Validate: node scripts/i18n_check --path $plugin_path"
```

## Example Workflow

### User: "add i18n to this component"

**Step 1: Scan for hardcoded strings**
```bash
bash find_hardcoded_strings.sh src/plugins/my_plugin/public/components/settings.tsx
```

**Output:**
```
⚠️  Possible hardcoded text: 45:  <EuiTitle>Settings</EuiTitle>
⚠️  Hardcoded placeholder: 67:  <EuiFieldText placeholder="Enter email" />
⚠️  Hardcoded aria-label: 89:  <EuiButton aria-label="Delete item">
```

**Step 2: Convert to i18n**
```typescript
// Before
<EuiTitle>Settings</EuiTitle>
<EuiFieldText placeholder="Enter email" />
<EuiButton aria-label="Delete item" />

// After
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

<EuiTitle>
  <FormattedMessage
    id="myPlugin.settings.title"
    defaultMessage="Settings"
  />
</EuiTitle>

<EuiFieldText
  placeholder={i18n.translate('myPlugin.settings.emailPlaceholder', {
    defaultMessage: 'Enter email',
  })}
/>

<EuiButton
  aria-label={i18n.translate('myPlugin.settings.deleteButton', {
    defaultMessage: 'Delete item',
  })}
/>
```

**Step 3: Extract translations**
```bash
node scripts/i18n_extract --path src/plugins/my_plugin
# Creates: src/plugins/my_plugin/translations/en.json
```

**Step 4: Validate**
```bash
node scripts/i18n_check --path src/plugins/my_plugin
# Output: ✅ All translations are valid
```

**Step 5: Update type checks and tests**
```bash
yarn test:type_check --project src/plugins/my_plugin/tsconfig.json
yarn test:jest src/plugins/my_plugin
```

## Integration with Other Skills
- **pr-optimizer**: Check PR for untranslated strings before merge
- **spike-builder**: Add i18n from the start in implementation phase
- **accessibility-auditor**: Ensure translated text maintains a11y (e.g., alt text)

## Quality Principles
- All user-facing text must be translatable
- Use semantic IDs (plugin.feature.element) not auto-generated hashes
- Keep translation units atomic (full sentences, not fragments)
- Provide context via description parameter
- Test with pseudo-localization (long strings) to catch layout issues
- Never translate: URLs, technical terms, code, brand names

## References
- Kibana i18n guide: https://www.elastic.co/guide/en/kibana/current/i18n-guide.html
- @kbn/i18n package: packages/kbn-i18n/README.md
- ICU Message Format: https://unicode-org.github.io/icu/userguide/format_parse/messages/
- i18n extraction script: scripts/i18n_extract.js
