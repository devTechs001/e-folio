#!/bin/bash
for file in models/*.js; do
    if grep -q "module.exports = mongoose.model(" "$file"; then
        # Extract model name and replace with conditional export
        sed -i "s/module\.exports = mongoose\.model('\([^']*\)',/module.exports = mongoose.models.\1 || mongoose.model('\1',/g" "$file"
    fi
done
